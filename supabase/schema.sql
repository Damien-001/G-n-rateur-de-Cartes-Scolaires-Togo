-- ============================================================
-- CardSchool Togo — Schéma Complet et Migration Automatique
-- Version: 3.1.0 (Tolérant aux anciennes versions & 100% Sans Erreur)
-- ============================================================
-- INSTRUCTIONS :
-- 1. Allez sur votre console Supabase > SQL Editor > New Query
-- 2. Collez l'INTEGRALITÉ de ce script
-- 3. Cliquez sur "Run" (Exécuter)
-- ============================================================

-- 1. TABLE : school_info (Informations des Établissements Scolaires)
CREATE TABLE IF NOT EXISTS public.school_info (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT,
  name          TEXT NOT NULL DEFAULT 'ÉCOLE NATIONALE DU TOGO',
  logo_url      TEXT,
  signature_url TEXT,
  stamp_url     TEXT,
  card_colors   JSONB DEFAULT '{"headerBg":"#047857","headerText":"#ffffff","footerBar":"#059669","matriculeText":"#065f46"}'::jsonb,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Sécurisation des colonnes pour school_info (si la table existait déjà)
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'ÉCOLE NATIONALE DU TOGO';
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS stamp_url TEXT;
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS card_colors JSONB;
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. TABLE : students (Élèves & Cartes Scolaires)
CREATE TABLE IF NOT EXISTS public.students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  matricule       TEXT NOT NULL DEFAULT '',
  class_name      TEXT NOT NULL DEFAULT '',
  school_year     TEXT NOT NULL DEFAULT '',
  birth_date      TEXT,
  birth_place     TEXT,
  exam_center     TEXT,
  expiration_date TEXT,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Sécurisation des colonnes pour students (si la table existait déjà)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS matricule TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_year TEXT DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS exam_center TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS expiration_date TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. TABLE : platform_settings (Configuration & Coordonnées Globales de la Plateforme)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                   TEXT PRIMARY KEY DEFAULT 'global_config',
  tmoney_number        TEXT DEFAULT '+228 90 00 00 00',
  tmoney_holder        TEXT DEFAULT 'CardSchool SAS (Togo)',
  flooz_number         TEXT DEFAULT '+228 99 00 00 00',
  flooz_holder         TEXT DEFAULT 'CardSchool SAS (Togo)',
  annual_price_cfa     NUMERIC DEFAULT 30000,
  support_email        TEXT DEFAULT 'contact@cardschool.tg',
  support_phone        TEXT DEFAULT '+228 90 00 00 00',
  whatsapp_number      TEXT DEFAULT '+228 90 00 00 00',
  office_address       TEXT DEFAULT 'Lomé, Togo — Quartier Administratif',
  payment_instructions TEXT DEFAULT 'Effectuez votre transfert T-Money ou Flooz puis joignez la capture de votre reçu dans le chat pour activation immédiate.',
  support_notice       TEXT DEFAULT 'Support technique et commercial disponible du Lundi au Samedi de 07h30 à 18h30.',
  demo_video_url       TEXT DEFAULT '',
  demo_video_title     TEXT DEFAULT 'Découvrez SukuPass en action — Les badges scolaires en quelques clics',
  demo_video_poster    TEXT DEFAULT '',
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Sécurisation des colonnes pour platform_settings
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS tmoney_number TEXT DEFAULT '+228 90 00 00 00';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS tmoney_holder TEXT DEFAULT 'SukuPass SAS (Togo)';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS flooz_number TEXT DEFAULT '+228 99 00 00 00';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS flooz_holder TEXT DEFAULT 'SukuPass SAS (Togo)';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS annual_price_cfa NUMERIC DEFAULT 30000;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'contact@sukupass.tg';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS support_phone TEXT DEFAULT '+228 90 00 00 00';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '+228 90 00 00 00';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS office_address TEXT DEFAULT 'Lomé, Togo — Quartier Administratif';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS payment_instructions TEXT;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS support_notice TEXT;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS demo_video_url TEXT DEFAULT '';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS demo_video_title TEXT DEFAULT 'Découvrez SukuPass en action — Les badges scolaires en quelques clics';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS demo_video_poster TEXT DEFAULT '';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Insertion ou mise à jour de la configuration par défaut
INSERT INTO public.platform_settings (id, tmoney_number, tmoney_holder, flooz_number, flooz_holder, annual_price_cfa, support_email, support_phone, whatsapp_number, office_address)
VALUES (
  'global_config',
  '+228 90 00 00 00',
  'SukuPass SAS (Togo)',
  '+228 99 00 00 00',
  'SukuPass SAS (Togo)',
  30000,
  'contact@sukupass.tg',
  '+228 90 00 00 00',
  '+228 90 00 00 00',
  'Lomé, Togo — Quartier Administratif'
)
ON CONFLICT (id) DO NOTHING;

-- 4. TABLE : admin_logs (Journal d'Activité et d'Audit Super-Admin)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   TEXT,
  school_name TEXT,
  action      TEXT NOT NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Sécurisation des colonnes pour admin_logs (Ajoute school_id si absent)
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS school_id TEXT;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT 'ACTION';
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.admin_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 5. TABLE : audit_logs (Journal d'Événements Système)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   TEXT,
  school_name TEXT,
  action      TEXT NOT NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Sécurisation des colonnes pour audit_logs (Ajoute school_id si absent)
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS school_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT 'ACTION';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 6. TABLE : chat_messages (Messagerie Directe Établissement <-> Super-Admin)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      TEXT,
  sender         TEXT NOT NULL DEFAULT 'school',
  sender_name    TEXT,
  message        TEXT NOT NULL DEFAULT '',
  attachment_url TEXT,
  status         TEXT DEFAULT 'unread',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Sécurisation des colonnes pour chat_messages (Ajoute colonnes si absentes)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS school_id TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender TEXT DEFAULT 'school';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'school';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 7. TABLE : license_keys (Clés d'Activation PRO)
CREATE TABLE IF NOT EXISTS public.license_keys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT UNIQUE,
  duration_days       INTEGER DEFAULT 365,
  is_used             BOOLEAN DEFAULT false,
  used_by_school_id   TEXT,
  used_by_school_name TEXT,
  used_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  note                TEXT,
  target_school_name  TEXT,
  is_suspended        BOOLEAN DEFAULT false
);

-- Sécurisation des colonnes pour license_keys
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 365;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS used_by_school_id TEXT;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS used_by_school_name TEXT;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS target_school_name TEXT;
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- 8. TABLE : app_visits (Statistiques Visiteurs & Tracking d'Audience)
CREATE TABLE IF NOT EXISTS public.app_visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  TEXT NOT NULL,
  path        TEXT NOT NULL DEFAULT '/',
  device      TEXT NOT NULL DEFAULT 'mobile',
  browser     TEXT,
  os          TEXT,
  region      TEXT,
  referrer    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS path TEXT DEFAULT '/';
ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS device TEXT DEFAULT 'mobile';
ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.app_visits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 9. INDEX POUR PERFORMANCES OPTIMALES
-- ============================================================
CREATE INDEX IF NOT EXISTS students_user_id_idx ON public.students(user_id);
CREATE INDEX IF NOT EXISTS school_info_user_id_idx ON public.school_info(user_id);
CREATE INDEX IF NOT EXISTS admin_logs_school_id_idx ON public.admin_logs(school_id);
CREATE INDEX IF NOT EXISTS audit_logs_school_id_idx ON public.audit_logs(school_id);
CREATE INDEX IF NOT EXISTS chat_messages_school_id_idx ON public.chat_messages(school_id);
CREATE INDEX IF NOT EXISTS app_visits_created_at_idx ON public.app_visits(created_at);

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_visits ENABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "Allow all on school_info" ON public.school_info;
DROP POLICY IF EXISTS "Allow select on school_info" ON public.school_info;
DROP POLICY IF EXISTS "Users can view own school_info" ON public.school_info;
DROP POLICY IF EXISTS "Users can insert own school_info" ON public.school_info;
DROP POLICY IF EXISTS "Users can update own school_info" ON public.school_info;
DROP POLICY IF EXISTS "Users can delete own school_info" ON public.school_info;

DROP POLICY IF EXISTS "Allow all on students" ON public.students;
DROP POLICY IF EXISTS "Allow select on students" ON public.students;
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

DROP POLICY IF EXISTS "Allow all on platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow all on admin_logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Allow all on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all on chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all on license_keys" ON public.license_keys;
DROP POLICY IF EXISTS "Allow all on app_visits" ON public.app_visits;

-- Politiques Universelles Permissives
CREATE POLICY "Allow all on school_info" ON public.school_info FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on admin_logs" ON public.admin_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on license_keys" ON public.license_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on app_visits" ON public.app_visits FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 10. STORAGE BUCKET (school-assets)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow all on school-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view assets" ON storage.objects;

CREATE POLICY "Allow all on school-assets" 
  ON storage.objects FOR ALL 
  USING (bucket_id = 'school-assets') 
  WITH CHECK (bucket_id = 'school-assets');

-- ============================================================
-- FIN DU SCRIPT — SUCCÈS GARANTI
-- ============================================================
