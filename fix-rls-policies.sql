-- ============================================================
-- FIX: Politiques RLS pour la table students
-- ============================================================
-- Ce script corrige les politiques de sécurité pour permettre
-- l'insertion de nouveaux étudiants
-- ============================================================

-- 1. Désactiver temporairement RLS pour diagnostic
-- ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

-- 3. Réactiver RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. Créer de nouvelles policies plus permissives pour le diagnostic
CREATE POLICY "Users can view own students"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own students"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own students"
  ON public.students FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own students"
  ON public.students FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Vérifier que auth.uid() fonctionne
SELECT 
  'Current user ID:' as info,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ PAS CONNECTÉ'
    ELSE '✅ CONNECTÉ'
  END as status;

-- 6. Vérifier les policies existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'students';

-- ============================================================
-- INSTRUCTIONS:
-- ============================================================
-- 1. Copiez ce script
-- 2. Allez sur Supabase Dashboard > SQL Editor
-- 3. Collez et exécutez le script
-- 4. Vérifiez que les 4 policies sont créées
-- 5. Testez à nouveau l'ajout d'un étudiant
-- ============================================================
