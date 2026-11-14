// Webhook Universel de Paiement pour SukuPass Togo
// Compatible : PayGate Global, FedaPay, CinetPay, Wave, Stripe, etc.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // Accepter uniquement les requêtes POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée. Utilisez POST.' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ ok: false, error: 'Supabase credentials missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload = req.body || {};
    const headers = req.headers || {};

    // 1. Récupérer la configuration globale pour vérifier la clé secrète
    const { data: config } = await supabase
      .from('platform_settings')
      .select('payment_webhook_secret')
      .eq('id', 'global_config')
      .maybeSingle();

    const expectedSecret = config?.payment_webhook_secret;

    // Si une clé secrète est configurée dans l'admin, on vérifie l'en-tête ou le query param
    if (expectedSecret && expectedSecret.trim() !== '') {
      const receivedToken = 
        headers['x-webhook-secret'] || 
        headers['x-fedapay-signature'] || 
        headers['authorization'] || 
        req.query?.secret ||
        payload.secret;

      if (!receivedToken || !receivedToken.includes(expectedSecret.trim())) {
        console.warn('⚠️ Webhook reçu avec un token secret invalide ou absent.');
        return res.status(401).json({ ok: false, error: 'Signature ou secret webhook invalide' });
      }
    }

    // 2. Extraire l'identifiant de l'école (compatible avec plusieurs formats d'agrégateurs)
    // - Paramètre d'URL (query) : ?school_id=...
    // - Custom metadata FedaPay / PayGate / CinetPay : payload.custom_data, payload.metadata, payload.data.custom_metadata
    // - Champ direct : payload.school_id ou payload.client_id ou payload.customer.email
    const querySchoolId = req.query?.school_id;
    const metadata = payload.metadata || payload.custom_data || payload.data?.metadata || payload.data?.custom_metadata || {};
    
    const schoolId = 
      querySchoolId ||
      metadata.school_id || 
      metadata.schoolId || 
      metadata.userId ||
      payload.school_id || 
      payload.userId ||
      payload.data?.school_id;

    const schoolEmail = 
      req.query?.email ||
      metadata.email || 
      payload.customer?.email || 
      payload.data?.customer?.email ||
      payload.email;

    // 3. Détecter si le statut du paiement est un succès
    // PayGate: status === 0 (ou status === 'approved')
    // FedaPay: status === 'approved' ou event === 'transaction.approved'
    // CinetPay: status === 'ACCEPTED'
    const status = (
      payload.status || 
      payload.data?.status || 
      payload.event || 
      payload.event_type ||
      ''
    ).toString().toLowerCase();

    const isSuccess = 
      status.includes('approved') || 
      status.includes('success') || 
      status.includes('accepted') || 
      status.includes('completed') ||
      status === '0' ||
      payload.code === 0 ||
      payload.event === 'transaction.approved';

    if (!isSuccess) {
      console.log(`ℹ️ Webhook notification reçue (statut non final ou en attente: ${status})`);
      return res.status(200).json({ ok: true, message: 'Notification reçue mais statut non validé' });
    }

    // 4. Identifier et activer l'école correspondante
    let targetSchoolUserId = schoolId;

    if (!targetSchoolUserId && schoolEmail) {
      // Rechercher par email si school_id n'a pas été transmis directement
      const { data: matched } = await supabase
        .from('school_info')
        .select('user_id')
        .ilike('card_colors->>managerEmail', schoolEmail.trim())
        .limit(1);

      if (matched && matched.length > 0) {
        targetSchoolUserId = matched[0].user_id;
      }
    }

    if (!targetSchoolUserId) {
      console.warn('⚠️ Paiement approuvé reçu mais impossible d’identifier l’école (school_id ou email manquant dans le payload)');
      return res.status(400).json({ 
        ok: false, 
        error: "Identifiant de l'école introuvable dans la notification webhook. Passez school_id dans l'URL ou les métadonnées." 
      });
    }

    // Calculer la date d'expiration (+365 jours = 1 an)
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // 5. Mettre à jour school_info dans Supabase (Passage en PRO)
    const { data: currentSchool } = await supabase
      .from('school_info')
      .select('card_colors, name')
      .eq('user_id', targetSchoolUserId)
      .maybeSingle();

    const updatedColors = {
      ...(currentSchool?.card_colors || {}),
      subscriptionPlan: 'pro',
      subscriptionExpiresAt: expiresAt,
    };

    const { error: updateError } = await supabase
      .from('school_info')
      .update({
        card_colors: updatedColors,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', targetSchoolUserId);

    if (updateError) {
      throw updateError;
    }

    // 6. Journaliser dans admin_logs
    await supabase.from('admin_logs').insert({
      action: 'PAYMENT_WEBHOOK_SUCCESS',
      user_id: targetSchoolUserId,
      details: JSON.stringify({
        schoolName: currentSchool?.name || 'Inconnue',
        expiresAt,
        providerPayload: payload,
        timestamp: new Date().toISOString()
      })
    });

    console.log(`✅ Webhook : École ${currentSchool?.name || targetSchoolUserId} activée en PRO 1 An jusqu'au ${expiresAt}`);

    return res.status(200).json({
      ok: true,
      message: 'Compte PRO activé avec succès pour 1 an',
      school_id: targetSchoolUserId,
      expires_at: expiresAt
    });

  } catch (err) {
    console.error('❌ Erreur traitement Webhook de paiement:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
