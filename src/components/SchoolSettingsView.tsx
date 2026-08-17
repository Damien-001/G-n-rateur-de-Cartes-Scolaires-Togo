import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Smartphone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  Settings,
  Sparkles,
  PhoneCall,
  Key,
  Mail,
  Phone,
  MessageCircle,
  Info,
  Zap,
  Lock,
  ShieldCheck,
  CheckCheck,
  Loader2,
  X
} from 'lucide-react';
import { SchoolInfo, PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '../types';
import { Session } from '../lib/auth';
import { redeemLicenseKey, fetchPlatformSettings, processFedaPaySuccessfulPayment, getLocalFedaKey } from '../lib/db';

async function ensureFedaPayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as any).FedaPay) return true;
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="fedapay.com/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(!!(window as any).FedaPay));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(!!(window as any).FedaPay), 2500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.fedapay.com/checkout.js?v=1.1.7';
    script.async = true;
    script.onload = () => resolve(!!(window as any).FedaPay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
    setTimeout(() => resolve(!!(window as any).FedaPay), 3500);
  });
}

interface SchoolSettingsViewProps {
  session: Session;
  schoolInfo: SchoolInfo;
  studentsCount: number;
  onSaveSchoolInfo: (info: SchoolInfo) => Promise<void>;
  onBack: () => void;
  mode?: 'profile' | 'billing';
  onOpenChat?: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  session,
  schoolInfo,
  studentsCount,
  onSaveSchoolInfo,
  onBack,
  mode = 'profile',
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>(mode);
  const [name, setName] = useState(schoolInfo.name || '');
  const [schoolType, setSchoolType] = useState(schoolInfo.schoolType || 'Lycée');
  const [region, setRegion] = useState(schoolInfo.region || 'Maritime');
  const [location, setLocation] = useState(schoolInfo.location || '');
  const [phone, setPhone] = useState(schoolInfo.phone || '');
  const [logoUrl, setLogoUrl] = useState(schoolInfo.logoUrl || '');
  const [signatureUrl, setSignatureUrl] = useState(schoolInfo.signatureUrl || '');
  const [stampUrl, setStampUrl] = useState(schoolInfo.stampUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  useEffect(() => {
    const refreshSettings = () => {
      fetchPlatformSettings().then(setPlatformSettings);
    };

    refreshSettings();

    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setPlatformSettings(e.detail);
      } else {
        refreshSettings();
      }
    };

    window.addEventListener('cardschool_platform_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', refreshSettings);
    window.addEventListener('focus', refreshSettings);

    return () => {
      window.removeEventListener('cardschool_platform_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', refreshSettings);
      window.removeEventListener('focus', refreshSettings);
    };
  }, []);

  // Simulation parameters for SaaS
  const isPlanExpired = schoolInfo.subscriptionPlan === 'pro' && !!schoolInfo.subscriptionExpiresAt && new Date(schoolInfo.subscriptionExpiresAt).getTime() < Date.now();
  const isEffectivePro = schoolInfo.subscriptionPlan === 'pro' && !isPlanExpired;
  const currentPlan = schoolInfo.subscriptionPlan || 'free';
  const maxFreeStudents = schoolInfo.customQuota || 15;
  const usagePercentage = Math.min(100, Math.round((studentsCount / maxFreeStudents) * 100));

  // FedaPay Instant Payment States & Handler
  const [isLaunchingFedaPay, setIsLaunchingFedaPay] = useState(false);
  const [fedaPayError, setFedaPayError] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    transactionId: string | number;
    expiresAt: string;
    amount: number;
  } | null>(null);

  const handleOpenFedaPay = async () => {
    setFedaPayError(null);
    setIsLaunchingFedaPay(true);

    const isLoaded = await ensureFedaPayScript();
    if (!isLoaded || !(window as any).FedaPay) {
      setIsLaunchingFedaPay(false);
      setFedaPayError("Le service FedaPay n'a pas pu être chargé. Vérifiez votre connexion internet ou utilisez les numéros T-Money / Flooz ci-dessous.");
      return;
    }

    // Refresh freshest platform settings directly
    let activeSettings = platformSettings;
    try {
      const fresh = await fetchPlatformSettings();
      if (fresh) {
        setPlatformSettings(fresh);
        activeSettings = fresh;
      }
    } catch {}

    const pubKey = (activeSettings.fedapayPublicKey || '').trim() || getLocalFedaKey();
    const environment = activeSettings.fedapayEnvironment || 'sandbox';
    const amount = activeSettings.annualPriceCFA || 30000;

    if (!pubKey) {
      setIsLaunchingFedaPay(false);
      setFedaPayError("Le guichet de paiement direct est momentanément indisponible (clé FedaPay non configurée). Veuillez effectuer votre transfert via les numéros T-Money / Flooz ci-dessous.");
      return;
    }

    try {
      console.log('[FedaPay] Initializing checkout with key:', pubKey.substring(0, 12) + '...', 'env:', environment, 'amount:', amount);
      const widget = (window as any).FedaPay.init({
        public_key: pubKey,
        environment: environment,
        transaction: {
          amount: amount,
          description: `Abonnement PRO 1 An — ${schoolInfo.name || 'Établissement'}`
        },
        customer: {
          email: schoolInfo.phone ? `ecole_${schoolInfo.phone.replace(/[^0-9]/g, '')}@cardschool.tg` : 'contact@cardschool.tg',
          lastname: schoolInfo.name || 'Établissement',
          firstname: 'Directeur',
          phone_number: {
            number: schoolInfo.phone?.replace(/[^0-9]/g, '') || '90000000',
            country: 'tg'
          }
        },
        onComplete: async (response: any) => {
          setIsLaunchingFedaPay(false);
          console.log('[FedaPay] onComplete callback:', response);
          if (
            response?.reason === 'CHECKOUT_COMPLETE' || 
            (response?.transaction && (response.transaction.status === 'approved' || response.transaction.status === 'transferred' || response.transaction.status === 'pending'))
          ) {
            const txId = response.transaction?.id || Date.now();
            const res = await processFedaPaySuccessfulPayment(
              session.userId,
              schoolInfo.name || 'Établissement',
              txId,
              amount
            );
            if (res.success) {
              await onSaveSchoolInfo({
                ...schoolInfo,
                subscriptionPlan: 'pro',
                subscriptionExpiresAt: res.expiresAt
              });
              setPaymentSuccessData({
                transactionId: txId,
                expiresAt: res.expiresAt,
                amount: amount
              });
            }
          }
        },
        onDismiss: () => {
          setIsLaunchingFedaPay(false);
          console.log('[FedaPay] Modal closed by user');
        }
      });

      if (widget && typeof widget.open === 'function') {
        widget.open();
      } else if (widget && typeof widget.show === 'function') {
        widget.show();
      }
      setIsLaunchingFedaPay(false);
    } catch (err: any) {
      console.error('[FedaPay] checkout error:', err);
      setIsLaunchingFedaPay(false);
      setFedaPayError(`Erreur FedaPay : ${err?.message || "Impossible d'ouvrir le guichet de paiement. Vérifiez votre clé sur FedaPay."}`);
    }
  };

  const handleSimulateTestPayment = async () => {
    setIsLaunchingFedaPay(true);
    setFedaPayError(null);
    try {
      const amount = platformSettings.annualPriceCFA || 30000;
      const txId = 'SIMU_FEDAPAY_' + Math.floor(100000 + Math.random() * 900000);
      const res = await processFedaPaySuccessfulPayment(
        session.userId,
        schoolInfo.name || 'Établissement',
        txId,
        amount
      );
      if (res.success) {
        await onSaveSchoolInfo({
          ...schoolInfo,
          subscriptionPlan: 'pro',
          subscriptionExpiresAt: res.expiresAt
        });
        setPaymentSuccessData({
          transactionId: txId,
          expiresAt: res.expiresAt,
          amount: amount
        });
      }
    } catch (err: any) {
      setFedaPayError("Erreur simulation: " + err?.message);
    } finally {
      setIsLaunchingFedaPay(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const updatedInfo: SchoolInfo = {
        ...schoolInfo,
        name: name.trim(),
        schoolType: schoolType,
        location: location.trim(),
        phone: phone.trim(),
        logoUrl: logoUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        stampUrl: stampUrl || undefined,
        // Keep subscription fields
        subscriptionPlan: currentPlan,
        subscriptionExpiresAt: schoolInfo.subscriptionExpiresAt,
      };
      await onSaveSchoolInfo(updatedInfo);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-16 font-sans">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              {mode === 'billing' ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    Mon Plan & Abonnement
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Suivez votre statut d'abonnement SaaS, votre volume de cartes et activez vos licences.</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    Paramètres de l'Établissement
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Mettez à jour les coordonnées officielles, logo, signature et cachet de l'école.</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onBack}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la gestion des élèves
          </button>
        </div>

        {/* Global Suspended Warning if applicable */}
        {schoolInfo.subscriptionPlan === 'suspended' && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-between text-red-800 animate-pulse-once">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Compte Actuellement Suspendu</h4>
                <p className="text-xs text-red-700 font-medium">
                  Votre accès à la création et l'impression de cartes est temporairement restreint. Envoyez votre preuve de paiement dans le chat pour réactivation immédiate.
                </p>
              </div>
            </div>
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow cursor-pointer transition-all shrink-0"
              >
                Ouvrir le Chat
              </button>
            )}
          </div>
        )}



        {/* Body Content */}
        {mode === 'billing' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Plan Overview Card */}
            <div className="lg:col-span-6 double-bezel-outer">
              <div className="double-bezel-inner p-6 sm:p-8 space-y-6 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Formule Actuelle</span>
                    <h2 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
                      {isEffectivePro 
                        ? 'Plan PRO Illimité' 
                        : isPlanExpired
                        ? 'Plan PRO Expiré'
                        : (schoolInfo.subscriptionPlan === 'suspended' ? 'Compte Suspendu' : 'Plan Découverte')}
                      {isEffectivePro && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">Actif</span>
                      )}
                      {isPlanExpired && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">À renouveler</span>
                      )}
                    </h2>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isEffectivePro ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>Cartes Générées :</span>
                    <span className="text-gray-900">{studentsCount} / {isEffectivePro ? 'Illimité' : `${maxFreeStudents} max`}</span>
                  </div>

                  {!isEffectivePro && (
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercentage >= 90 ? 'bg-red-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  )}

                  {isEffectivePro ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-2">
                      <p className="text-xs text-emerald-900 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Abonnement annuel actif
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold leading-relaxed">
                        Votre école bénéficie de l'impression illimitée de cartes, des exports PDF HD, du support prioritaire et du QR-code officiel.
                        {schoolInfo.subscriptionExpiresAt && (
                          <span className="block mt-1 font-bold">Expire le : {new Date(schoolInfo.subscriptionExpiresAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  ) : isPlanExpired ? (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                      <p className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        Abonnement annuel arrivé à échéance
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                        Votre abonnement PRO pour la session précédente est arrivé à terme le {new Date(schoolInfo.subscriptionExpiresAt!).toLocaleDateString()}. Veuillez renouveler votre licence pour la nouvelle rentrée scolaire afin de réactiver l'impression illimitée.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                      <p className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        Limite du Plan Gratuit
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                        Le plan découverte est limité à {maxFreeStudents} cartes scolaires. Passez au Plan PRO pour imprimer toutes les cartes de l'établissement sans restriction.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Money Payment Info Card */}
            <div className="lg:col-span-6 space-y-6">
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-5 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      Paiement Mobile Money & Activation Immédiate
                    </h2>
                    {platformSettings.fedapayEnabled && (
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        Paiement Instantané
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Tarif annuel PRO : <strong className="text-emerald-800 font-extrabold">{(platformSettings.annualPriceCFA || 30000).toLocaleString()} FCFA / an</strong> (cartes illimitées pendant 365 jours).
                    </p>

                    {/* FedaPay Primary Instant CTA */}
                    {platformSettings.fedapayEnabled && (
                      <div className="p-4 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl text-white space-y-3.5 shadow-lg shadow-emerald-900/10 border border-emerald-700/50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 fill-amber-300" /> Recommandé
                              </span>
                              {platformSettings.fedapayEnvironment === 'sandbox' && (
                                <span className="text-[9px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30 px-1.5 py-0.5 rounded">
                                  🧪 Mode Test (Sandbox)
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-black text-white mt-0.5">
                              Payer directement par T-Money ou Moov Flooz
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-emerald-200">
                              {(platformSettings.annualPriceCFA || 30000).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-emerald-300/80 font-bold block">FCFA / an</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-emerald-100/90 leading-relaxed font-medium">
                          Saisissez votre numéro de téléphone. Vous recevrez une invitation USSD sécurisée sur votre mobile pour valider avec votre code secret. Votre compte PRO sera débloqué immédiatement.
                        </p>

                        {fedaPayError && (
                          <div className="p-3 bg-red-500/20 border border-red-400/40 rounded-xl text-[11px] text-red-200 font-semibold space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
                              <span>{fedaPayError}</span>
                            </div>
                            {platformSettings.fedapayEnvironment === 'sandbox' && (
                              <button
                                type="button"
                                onClick={handleSimulateTestPayment}
                                className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                              >
                                🧪 Simuler un paiement de test immédiat (Sandbox)
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleOpenFedaPay}
                          disabled={isLaunchingFedaPay}
                          className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {isLaunchingFedaPay ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              <span>Ouverture du guichet sécurisé...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 fill-slate-950" />
                              <span>Payer {(platformSettings.annualPriceCFA || 30000).toLocaleString()} FCFA avec FedaPay</span>
                              <Lock className="w-3.5 h-3.5 ml-1 opacity-70" />
                            </>
                          )}
                        </button>
                        
                        <div className="flex items-center justify-center gap-3 text-[10px] text-emerald-200/70 font-semibold pt-0.5">
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Prélèvement officiel T-Money & Flooz</span>
                          <span>•</span>
                          <span>Sans attente (24h/24)</span>
                        </div>
                      </div>
                    )}

                    {/* Alternative: Manual Transfer */}
                    <div className="pt-2">
                      <div className="relative flex items-center justify-center mb-3">
                        <div className="border-t border-slate-200 w-full"></div>
                        <span className="bg-white px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider absolute">
                          {platformSettings.fedapayEnabled ? 'Ou par transfert manuel classique' : 'Coordonnées de transfert'}
                        </span>
                      </div>

                      {platformSettings.paymentInstructions && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-950 font-medium leading-relaxed flex items-start gap-2 mb-3">
                          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{platformSettings.paymentInstructions}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">T-Money (Togo)</p>
                            <p className="text-sm font-extrabold text-gray-900">{platformSettings.tmoneyNumber || '+228 90 00 00 00'}</p>
                          </div>
                          <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded">
                            {platformSettings.tmoneyHolder || 'CardSchool SAS'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Flooz / Moov Money</p>
                            <p className="text-sm font-extrabold text-gray-900">{platformSettings.floozNumber || '+228 95 00 00 00'}</p>
                          </div>
                          <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded">
                            {platformSettings.floozHolder || 'CardSchool SAS'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5 mt-3">
                        {onOpenChat && (
                          <button
                            type="button"
                            onClick={onOpenChat}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all"
                          >
                            💬 Envoyer le reçu dans le Chat
                          </button>
                        )}
                        {platformSettings.whatsappNumber && (
                          <a 
                            href={`https://wa.me/${platformSettings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Bonjour,%20je%20souhaite%20activer%20le%20plan%20PRO%20pour%20l'%C3%A9tablissement%20${encodeURIComponent(schoolInfo.name || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <PhoneCall className="w-4 h-4 text-emerald-600" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support & Assistance Card */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-3 bg-white">
                  <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Assistance & Contacts Officiels
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Besoin d'aide ou d'une facture proforma ? Contactez notre équipe d'assistance :
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                    <a 
                      href={`mailto:${platformSettings.supportEmail}`}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl flex items-center gap-2 text-slate-800 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{platformSettings.supportEmail}</span>
                    </a>
                    <a 
                      href={`tel:${platformSettings.supportPhone}`}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl flex items-center gap-2 text-slate-800 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{platformSettings.supportPhone}</span>
                    </a>
                  </div>
                  {platformSettings.supportNotice && (
                    <p className="text-[11px] text-slate-400 font-medium italic pt-1">
                      ℹ️ {platformSettings.supportNotice}
                    </p>
                  )}
                </div>
              </div>

              {/* License Key Redemption Card */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-4 bg-white">
                  <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-600" />
                    Activer une Clé de Licence PRO
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Vous avez reçu une clé de licence PRO de la part de l'administration ? Saisissez-la ci-dessous pour débloquer immédiatement votre compte.
                  </p>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const input = target.querySelector('input') as HTMLInputElement;
                      const code = input?.value || '';
                      if (!code.trim()) return;

                      const res = await redeemLicenseKey(code.trim(), session.userId, schoolInfo.name);
                      alert(res.message);
                      if (res.success) {
                        window.location.reload();
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ex: TOGO-PRO-2026-X89A"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 uppercase font-mono font-bold text-xs outline-none focus-brand bg-white"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      Activer la Clé
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full double-bezel-outer">
            <div className="double-bezel-inner p-6 sm:p-8 space-y-6 bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-4 border-b border-gray-100">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Profil de l'École
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nom de l'établissement</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Type de structure</label>
                    <select 
                      value={schoolType} 
                      onChange={e => setSchoolType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm bg-white cursor-pointer font-semibold"
                    >
                      <option value="Lycée">Lycée (Second cycle)</option>
                      <option value="Collège">Collège (Premier cycle)</option>
                      <option value="Complexe Scolaire">Complexe Scolaire (Primaire & Sec.)</option>
                      <option value="Primaire">Primaire / Maternelle</option>
                      <option value="Université / Institut">Université / Institut Sup.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ville / Localité</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)}
                      required
                      placeholder="Lomé, Togo"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Téléphone WhatsApp (Paiement/Alerte)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      required
                      placeholder="+228 90 12 34 56"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Logo, Signature & Cachet uploads */}
                <div className="pt-6 border-t border-gray-100 space-y-5">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Documents officiels (Cartes)</h3>
                  
                  {/* Logo de l'école */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Logo de l'école</label>
                    <div className="flex items-center gap-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                      <div className="relative w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {logoUrl ? (
                          <>
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => setLogoUrl('')}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                              title="Supprimer le logo"
                            >
                              <span style={{ fontSize: 9, lineHeight: 1 }}>✕</span>
                            </button>
                          </>
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setLogoUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Signature & Cachet side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Signature */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Signature</label>
                      <div className="flex flex-col gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="relative w-full h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                          {signatureUrl ? (
                            <>
                              <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setSignatureUrl('')}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                                title="Supprimer la signature"
                              >
                                <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold italic">Aucune signature</span>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setSignatureUrl(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Cachet */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cachet</label>
                      <div className="flex flex-col gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="relative w-10 h-10 mx-auto bg-white border border-slate-200 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                          {stampUrl ? (
                            <>
                              <img src={stampUrl} alt="Cachet" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setStampUrl('')}
                                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                                title="Supprimer le cachet"
                              >
                                <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                              </button>
                            </>
                          ) : (
                            <div className="w-3.5 h-3.5 border border-slate-200 rounded-full border-dashed" />
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setStampUrl(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200/80 gap-4">
                  {saveStatus === 'success' && (
                    <span className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profil mis à jour !
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-xs text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                      Erreur lors de la sauvegarde.
                    </span>
                  )}
                  {saveStatus === 'idle' && <div />}

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary px-6 py-3 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Sauvegarder le profil'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* FedaPay Success Celebration Modal */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-emerald-100 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-100 rounded-full blur-2xl pointer-events-none opacity-60"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-100 rounded-full blur-2xl pointer-events-none opacity-60"></div>

            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                Paiement FedaPay Validé
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Félicitations ! Votre Plan PRO est Actif 🎉
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Votre transaction de <strong>{paymentSuccessData.amount.toLocaleString()} FCFA</strong> a été confirmée avec succès. Vous bénéficiez désormais de l'impression illimitée de cartes scolaires pour 365 jours.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Établissement</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{schoolInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Formule</span>
                <span className="font-extrabold text-emerald-700">PRO Annuel (Cartes Illimitées)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Valable jusqu'au</span>
                <span className="font-black text-slate-900">{paymentSuccessData.expiresAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Réf. Transaction</span>
                <span className="font-mono text-[11px] text-slate-600 font-bold">#{paymentSuccessData.transactionId}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPaymentSuccessData(null);
                onBack();
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Générer mes cartes scolaires dès maintenant</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
