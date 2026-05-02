-- ============================================================
-- Générateur de Cartes Scolaires Togo — Schéma Complet
-- Version: 2.3.0
-- Date: 2026-05-02
-- ============================================================
-- INSTRUCTIONS:
-- 1. Allez sur Supabase Dashboard > SQL Editor
-- 2. Cliquez sur "New Query"
-- 3. Copiez-collez ce script complet
-- 4. Cliquez sur "Run" pour exécuter
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Table: school_info (Informations de l'école)
CREATE TABLE IF NOT EXISTS public.school_info (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'ÉCOLE NATIONALE DU TOGO',
  logo_url      TEXT,
  signature_url TEXT,
  stamp_url     TEXT,
  card_colors   JSONB DEFAULT '{"headerBg":"#047857","headerText":"#ffffff","footerBar":"#059669","matriculeText":"#065f46"}'::jsonb,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Table: students (Étudiants)
CREATE TABLE IF NOT EXISTS public.students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  qr_code_data    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. INDEX (Pour améliorer les performances)
-- ============================================================

CREATE INDEX IF NOT EXISTS students_user_id_idx ON public.students(user_id);
CREATE INDEX IF NOT EXISTS school_info_user_id_idx ON public.school_info(user_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY (Sécurité des données)
-- ============================================================

-- Activer RLS
ALTER TABLE public.school_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own school_info" ON public.school_info;
DROP POLICY IF EXISTS "Users can insert own school_info" ON public.school_info;
DROP POLICY IF EXISTS "Users can update own school_info" ON public.school_info;
DROP POLICY IF EXISTS "Users can delete own school_info" ON public.school_info;

DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

-- Policies pour school_info
CREATE POLICY "Users can view own school_info"
  ON public.school_info FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own school_info"
  ON public.school_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own school_info"
  ON public.school_info FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own school_info"
  ON public.school_info FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour students
CREATE POLICY "Users can view own students"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own students"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own students"
  ON public.students FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own students"
  ON public.students FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. STORAGE BUCKET (Pour les images)
-- ============================================================

-- Créer le bucket pour les assets (logo, signature, cachet, photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes policies de storage
DROP POLICY IF EXISTS "Users can upload own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view assets" ON storage.objects;

-- Policies pour storage
CREATE POLICY "Users can upload own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'school-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'school-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-assets');

-- ============================================================
-- 5. VÉRIFICATION
-- ============================================================

-- Vérifier que les tables ont été créées
SELECT 
  'school_info' as table_name, 
  COUNT(*) as columns 
FROM information_schema.columns 
WHERE table_name = 'school_info'
UNION ALL
SELECT 
  'students' as table_name, 
  COUNT(*) as columns 
FROM information_schema.columns 
WHERE table_name = 'students';

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
-- ✅ Si vous voyez "Success. No rows returned", c'est normal !
-- ✅ Les tables et policies ont été créées avec succès
-- ✅ Vous pouvez maintenant utiliser l'application
-- ============================================================
