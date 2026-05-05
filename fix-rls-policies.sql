-- ============================================================
-- FIX: Politiques RLS pour la table students
-- ============================================================
-- Ce script corrige les politiques de sécurité pour permettre
-- l'insertion de nouveaux étudiants
-- ============================================================

-- 1. Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

-- 2. S'assurer que RLS est activé
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 3. Créer les nouvelles policies
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

-- 4. Vérifier que tout fonctionne
SELECT 
  '✅ Policies créées avec succès' as message,
  COUNT(*) as nombre_policies
FROM pg_policies 
WHERE tablename = 'students';

-- 5. Afficher votre User ID actuel
SELECT 
  'Votre User ID:' as info,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NON CONNECTÉ - Connectez-vous d''abord sur l''application'
    ELSE '✅ CONNECTÉ - Vous pouvez maintenant ajouter des étudiants'
  END as status;

-- ============================================================
-- INSTRUCTIONS:
-- ============================================================
-- 1. Copiez TOUT ce script (Ctrl+A puis Ctrl+C)
-- 2. Allez sur https://supabase.com/dashboard
-- 3. Sélectionnez votre projet
-- 4. Cliquez sur "SQL Editor" dans le menu de gauche
-- 5. Cliquez sur "New Query"
-- 6. Collez le script (Ctrl+V)
-- 7. Cliquez sur "Run" (ou appuyez sur Ctrl+Enter)
-- 8. Vérifiez que vous voyez "✅ Policies créées avec succès"
-- 9. Retournez sur l'application et réessayez d'ajouter un étudiant
-- ============================================================
