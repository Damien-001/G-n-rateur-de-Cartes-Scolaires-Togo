// ============================================================
// Cloudflare Worker API : Auth & CRUD Sukupass Togo
// ============================================================
import { hashPassword, verifyPassword, generateSessionToken, generateId } from './crypto';

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function badRequest(message: string) {
  return json({ error: message, success: false }, 400);
}

function unauthorized(message = 'Non autorisé') {
  return json({ error: message, success: false }, 401);
}

/**
 * Récupère l'utilisateur associé au Bearer token
 */
async function authenticateUser(req: Request, env: Env) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const sessionRow = await env.DB.prepare(
    `SELECT s.user_id, s.expires_at, u.id, u.email, u.full_name, u.school_name, u.school_type, u.location, u.phone, u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`
  ).bind(token).first();

  return sessionRow as any;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Gérer les requêtes CORS pre-flight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // ─── 1. AUTH : /api/auth/register ─────────────────────────────
      if (url.pathname === '/api/auth/register' && req.method === 'POST') {
        const body: any = await req.json();
        const { email, password, fullName, schoolName, schoolType, location, phone } = body;

        if (!email || !password) {
          return badRequest('Email et mot de passe requis.');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normalizedEmail).first();
        if (existing) {
          return badRequest('Un compte avec cet email existe déjà.');
        }

        const userId = generateId();
        const passwordHash = await hashPassword(password);
        const cleanFullName = (fullName || normalizedEmail).trim();
        const cleanSchoolName = (schoolName || cleanFullName).trim().toUpperCase();

        // 1. Créer l'utilisateur
        await env.DB.prepare(
          `INSERT INTO users (id, email, password_hash, full_name, school_name, school_type, location, phone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          userId,
          normalizedEmail,
          passwordHash,
          cleanFullName,
          cleanSchoolName,
          schoolType || 'Lycée',
          location || '',
          phone || ''
        ).run();

        // 2. Créer le profil initial de l'établissement
        const schoolId = generateId();
        const defaultCardColors = JSON.stringify({
          headerBg: '#047857',
          headerText: '#ffffff',
          footerBar: '#059669',
          matriculeText: '#065f46',
          schoolType: schoolType || 'Lycée',
          location: location || '',
          phone: phone || '',
          subscriptionPlan: 'free',
          subscriptionExpiresAt: '',
          trialExpiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
          region: 'Grand Lomé',
          customQuota: 15,
        });

        await env.DB.prepare(
          `INSERT INTO school_info (id, user_id, name, card_colors)
           VALUES (?, ?, ?, ?)`
        ).bind(schoolId, userId, cleanSchoolName, defaultCardColors).run();

        // 3. Générer un token de session (30 jours)
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        await env.DB.prepare(
          `INSERT INTO sessions (id, user_id, token, expires_at)
           VALUES (?, ?, ?, ?)`
        ).bind(generateId(), userId, sessionToken, expiresAt).run();

        return json({
          success: true,
          token: sessionToken,
          session: {
            userId,
            email: normalizedEmail,
            fullName: cleanFullName,
            schoolName: cleanSchoolName,
            schoolType: schoolType || 'Lycée',
            location: location || '',
            phone: phone || '',
          },
        });
      }

      // ─── 2. AUTH : /api/auth/login ────────────────────────────────
      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const body: any = await req.json();
        const { email, password } = body;

        if (!email || !password) {
          return badRequest('Email et mot de passe requis.');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user: any = await env.DB.prepare(
          'SELECT * FROM users WHERE email = ?'
        ).bind(normalizedEmail).first();

        // Si l'utilisateur n'existe pas encore dans Cloudflare D1 (ex: ancien compte Supabase),
        // on crée son compte D1 à la volée avec le mot de passe fourni !
        if (!user) {
          const userId = generateId();
          const passwordHash = await hashPassword(password);
          const cleanEmail = normalizedEmail;
          const cleanFullName = cleanEmail.split('@')[0].toUpperCase();
          const cleanSchoolName = cleanFullName;

          await env.DB.prepare(
            `INSERT INTO users (id, email, password_hash, full_name, school_name, school_type, location, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(userId, cleanEmail, passwordHash, cleanFullName, cleanSchoolName, 'Collège', 'Lomé', '').run();

          const sessionToken = generateSessionToken();
          const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
          await env.DB.prepare(
            `INSERT INTO sessions (id, user_id, token, expires_at)
             VALUES (?, ?, ?, ?)`
          ).bind(generateId(), userId, sessionToken, expiresAt).run();

          return json({
            success: true,
            token: sessionToken,
            session: {
              userId,
              email: cleanEmail,
              fullName: cleanFullName,
              schoolName: cleanSchoolName,
              schoolType: 'Collège',
              location: 'Lomé',
              phone: '',
              role: 'school',
            },
          });
        }

        if (!user.password_hash) {
          return unauthorized('Email ou mot de passe incorrect.');
        }

        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
          return unauthorized('Email ou mot de passe incorrect.');
        }

        // Créer session (30 jours) + charger immédiatement school_info & students en 1 seul aller-retour
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

        const [, schoolInfoRow, studentsRes] = await Promise.all([
          env.DB.prepare(
            `INSERT INTO sessions (id, user_id, token, expires_at)
             VALUES (?, ?, ?, ?)`
          ).bind(generateId(), user.id, sessionToken, expiresAt).run(),
          env.DB.prepare('SELECT * FROM school_info WHERE user_id = ?').bind(user.id).first(),
          env.DB.prepare('SELECT * FROM students WHERE user_id = ? ORDER BY created_at ASC').bind(user.id).all(),
        ]);

        let parsedSchoolInfo: any = null;
        if (schoolInfoRow) {
          let parsedColors = {};
          try {
            parsedColors = typeof (schoolInfoRow as any).card_colors === 'string'
              ? JSON.parse((schoolInfoRow as any).card_colors)
              : (schoolInfoRow as any).card_colors;
          } catch { }
          parsedSchoolInfo = {
            ...(schoolInfoRow as any),
            card_colors: parsedColors,
          };
        }

        return json({
          success: true,
          token: sessionToken,
          session: {
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            schoolName: user.school_name,
            schoolType: user.school_type,
            location: user.location,
            phone: user.phone,
            role: user.role,
          },
          schoolInfo: parsedSchoolInfo,
          students: studentsRes?.results || [],
        });
      }

      // ─── 3. AUTH : /api/auth/me ───────────────────────────────────
      if (url.pathname === '/api/auth/me' && req.method === 'GET') {
        const user = await authenticateUser(req, env);
        if (!user) return unauthorized();

        return json({
          success: true,
          session: {
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            schoolName: user.school_name,
            schoolType: user.school_type,
            location: user.location,
            phone: user.phone,
            role: user.role,
          },
        });
      }

      // ─── 4. AUTH : /api/auth/logout ───────────────────────────────
      if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7).trim();
          await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
        }
        return json({ success: true });
      }

      // ─── 5. SCHOOL_INFO : GET & PUT ───────────────────────────────
      if (url.pathname.startsWith('/api/school-info')) {
        const targetUserId = url.searchParams.get('userId');

        if (req.method === 'GET') {
          if (!targetUserId) return badRequest('userId manquant.');
          const row: any = await env.DB.prepare(
            'SELECT * FROM school_info WHERE user_id = ?'
          ).bind(targetUserId).first();

          if (!row) return json({ data: null });

          let parsedColors = {};
          try {
            parsedColors = typeof row.card_colors === 'string' ? JSON.parse(row.card_colors) : row.card_colors;
          } catch { }

          return json({
            data: {
              ...row,
              card_colors: parsedColors,
            },
          });
        }

        if (req.method === 'PUT' || req.method === 'POST') {
          const body: any = await req.json();
          const { user_id, name, logo_url, signature_url, stamp_url, card_colors } = body;
          const uId = user_id || targetUserId;
          if (!uId) return badRequest('user_id manquant.');

          const colorsStr = typeof card_colors === 'object' ? JSON.stringify(card_colors) : card_colors;

          await env.DB.prepare(
            `INSERT INTO school_info (id, user_id, name, logo_url, signature_url, stamp_url, card_colors, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(user_id) DO UPDATE SET
               name = excluded.name,
               logo_url = excluded.logo_url,
               signature_url = excluded.signature_url,
               stamp_url = excluded.stamp_url,
               card_colors = excluded.card_colors,
               updated_at = datetime('now')`
          ).bind(
            body.id || generateId(),
            uId,
            name || '',
            logo_url || null,
            signature_url || null,
            stamp_url || null,
            colorsStr || '{}'
          ).run();

          return json({ success: true });
        }
      }

      // ─── 6. STUDENTS : CRUD & BULK ────────────────────────────────
      if (url.pathname.startsWith('/api/students')) {
        const targetUserId = url.searchParams.get('userId');

        // Récupérer la liste des élèves
        if (req.method === 'GET') {
          if (!targetUserId) return badRequest('userId manquant.');
          const { results } = await env.DB.prepare(
            `SELECT * FROM students WHERE user_id = ? ORDER BY created_at ASC`
          ).bind(targetUserId).all();

          return json({ data: results || [] });
        }

        // Insertion unitaire ou Upsert
        if (req.method === 'POST' && !url.pathname.includes('/bulk')) {
          const student: any = await req.json();
          const uId = student.user_id || targetUserId;
          if (!uId) return badRequest('user_id manquant.');

          const studentId = student.id && student.id.length > 10 ? student.id : generateId();

          await env.DB.prepare(
            `INSERT INTO students (id, user_id, first_name, last_name, matricule, class_name, school_year, birth_date, birth_place, exam_center, photo_url, expiration_date, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(id) DO UPDATE SET
               first_name = excluded.first_name,
               last_name = excluded.last_name,
               matricule = excluded.matricule,
               class_name = excluded.class_name,
               school_year = excluded.school_year,
               birth_date = excluded.birth_date,
               birth_place = excluded.birth_place,
               exam_center = excluded.exam_center,
               photo_url = excluded.photo_url,
               expiration_date = excluded.expiration_date,
               updated_at = datetime('now')`
          ).bind(
            studentId,
            uId,
            student.first_name || student.firstName || '',
            student.last_name || student.lastName || '',
            student.matricule || '',
            student.class_name || student.className || '',
            student.school_year || student.schoolYear || '',
            student.birth_date || student.birthDate || null,
            student.birth_place || student.birthPlace || null,
            student.exam_center || student.examCenter || null,
            student.photo_url || student.photoUrl || null,
            student.expiration_date || student.expirationDate || null
          ).run();

          return json({ success: true, id: studentId });
        }

        // Import en Masse (Smart Bulk Insert)
        if (req.method === 'POST' && url.pathname.includes('/bulk')) {
          const body: any = await req.json();
          const list: any[] = Array.isArray(body) ? body : body.students;
          const uId = body.userId || targetUserId;
          if (!uId || !list || !Array.isArray(list)) return badRequest('Données invalides.');

          const statements = list.map(student => {
            const studentId = student.id && student.id.length > 10 && !student.id.startsWith('local_')
              ? student.id
              : generateId();

            return env.DB.prepare(
              `INSERT INTO students (id, user_id, first_name, last_name, matricule, class_name, school_year, birth_date, birth_place, exam_center, photo_url, expiration_date, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            ).bind(
              studentId,
              uId,
              student.first_name || student.firstName || '',
              student.last_name || student.lastName || '',
              student.matricule || '',
              student.class_name || student.className || '',
              student.school_year || student.schoolYear || '',
              student.birth_date || student.birthDate || null,
              student.birth_place || student.birthPlace || null,
              student.exam_center || student.examCenter || null,
              student.photo_url || student.photoUrl || null,
              student.expiration_date || student.expirationDate || null
            );
          });

          await env.DB.batch(statements);
          return json({ success: true, count: list.length });
        }

        // Suppression d'un ou plusieurs élèves
        if (req.method === 'DELETE') {
          const body: any = await req.json().catch(() => ({}));
          const studentId = url.searchParams.get('id') || body.id;
          const studentIds: string[] = body.ids || (studentId ? [studentId] : []);

          if (studentIds.length === 0) return badRequest('id manquant.');

          const placeholders = studentIds.map(() => '?').join(',');
          await env.DB.prepare(`DELETE FROM students WHERE id IN (${placeholders})`).bind(...studentIds).run();

          return json({ success: true });
        }
      }

      // ─── 7. ADMIN / GLOBAL SAAS STATS ────────────────────────────
      if (url.pathname === '/api/admin/overview' && req.method === 'GET') {
        const [totalSchools, totalStudents, settings, schoolsList] = await Promise.all([
          env.DB.prepare("SELECT count(*) as count FROM school_info WHERE user_id NOT LIKE '00000000-%'").first(),
          env.DB.prepare('SELECT count(*) as count FROM students').first(),
          env.DB.prepare('SELECT * FROM platform_settings WHERE id = "global_config"').first(),
          env.DB.prepare(
            `SELECT s.*,
                    u.email as manager_email,
                    u.full_name as manager_name,
                    (SELECT count(*) FROM students st WHERE st.user_id = s.user_id) as student_count
             FROM school_info s
             LEFT JOIN users u ON u.id = s.user_id
             WHERE s.user_id NOT LIKE '00000000-%'
             ORDER BY s.updated_at DESC`
          ).all(),
        ]);

        return json({
          success: true,
          totalSchools: (totalSchools as any)?.count || 0,
          totalStudents: (totalStudents as any)?.count || 0,
          platformSettings: settings,
          schools: schoolsList?.results || [],
        });
      }

      // ─── 8. ADMIN : SUPPRESSION D'UNE ÉCOLE ──────────────────────
      if (url.pathname === '/api/admin/school' && req.method === 'DELETE') {
        const body: any = await req.json().catch(() => ({}));
        const targetUserId = url.searchParams.get('userId') || body.userId;
        if (!targetUserId) return badRequest('userId manquant.');

        await env.DB.batch([
          env.DB.prepare('DELETE FROM students WHERE user_id = ?').bind(targetUserId),
          env.DB.prepare('DELETE FROM school_info WHERE user_id = ?').bind(targetUserId),
          env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(targetUserId),
          env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetUserId),
        ]);

        return json({ success: true });
      }

      // ─── 9. PLATFORM SETTINGS : GET & POST ───────────────────────
      if (url.pathname === '/api/platform-settings') {
        if (req.method === 'GET') {
          const [settingsRow, sysRow] = await Promise.all([
            env.DB.prepare('SELECT * FROM platform_settings WHERE id = "global_config"').first(),
            env.DB.prepare('SELECT card_colors, updated_at FROM school_info WHERE user_id = "00000000-0000-0000-0000-000000000001"').first(),
          ]);

          let extraConfig = {};
          if (sysRow && (sysRow as any).card_colors) {
            try {
              extraConfig = typeof (sysRow as any).card_colors === 'string'
                ? JSON.parse((sysRow as any).card_colors)
                : (sysRow as any).card_colors;
            } catch { }
          }

          return json({
            success: true,
            data: settingsRow ? { ...(settingsRow as any), ...extraConfig } : extraConfig,
          });
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          const body: any = await req.json();
          const sysColorsStr = JSON.stringify(body);

          await env.DB.batch([
            env.DB.prepare(
              `INSERT INTO platform_settings (id, tmoney_number, tmoney_holder, flooz_number, flooz_holder, annual_price_cfa, support_email, support_phone, whatsapp_number, updated_at)
               VALUES ('global_config', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(id) DO UPDATE SET
                 tmoney_number = excluded.tmoney_number,
                 tmoney_holder = excluded.tmoney_holder,
                 flooz_number = excluded.flooz_number,
                 flooz_holder = excluded.flooz_holder,
                 annual_price_cfa = excluded.annual_price_cfa,
                 support_email = excluded.support_email,
                 support_phone = excluded.support_phone,
                 whatsapp_number = excluded.whatsapp_number,
                 updated_at = datetime('now')`
            ).bind(
              body.tmoneyNumber || body.tmoney_number || '+228 91 30 21 38',
              body.tmoneyHolder || body.tmoney_holder || 'SukuPass Togo',
              body.floozNumber || body.flooz_number || '+228 99 00 00 00',
              body.floozHolder || body.flooz_holder || 'SukuPass Togo',
              body.annualPriceCFA || body.annual_price_cfa || 25000,
              body.supportEmail || body.support_email || 'contact@sukupass.tg',
              body.supportPhone || body.support_phone || '+228 91 30 21 38',
              body.whatsappNumber || body.whatsapp_number || '+228 91 30 21 38'
            ),
            env.DB.prepare(
              `INSERT INTO school_info (id, user_id, name, card_colors, updated_at)
               VALUES ('sys_platform_settings', '00000000-0000-0000-0000-000000000001', 'SYSTEM_PLATFORM_SETTINGS', ?, datetime('now'))
               ON CONFLICT(user_id) DO UPDATE SET
                 card_colors = excluded.card_colors,
                 updated_at = datetime('now')`
            ).bind(sysColorsStr),
          ]);

          return json({ success: true });
        }
      }

      return json({ error: 'Endpoint introuvable' }, 404);
    } catch (err: any) {
      console.error('Erreur Worker:', err);
      return json({ error: err.message || 'Erreur interne du serveur' }, 500);
    }
  },
};
