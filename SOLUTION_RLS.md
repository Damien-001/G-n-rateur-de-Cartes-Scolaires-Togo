# Solution : Erreur RLS "new row violates row-level security policy"

## 🔍 Diagnostic du problème

L'erreur `new row violates row-level security policy for table "students"` signifie que les politiques de sécurité (RLS) de Supabase bloquent l'insertion de nouvelles lignes dans la table `students`.

## ✅ Solution rapide

### Étape 1 : Vérifier la connexion

1. Ouvrez la console du navigateur (F12)
2. Vérifiez que vous voyez : `👤 Session userId: [un UUID]`
3. Si le userId est vide ou undefined, le problème vient de l'authentification

### Étape 2 : Réappliquer les politiques RLS

1. Allez sur **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier `fix-rls-policies.sql`
6. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier les résultats

Après l'exécution du script, vous devriez voir :

```
✅ 4 policies créées avec succès
✅ Current user ID: [votre UUID]
✅ Status: CONNECTÉ
```

### Étape 4 : Tester à nouveau

1. Retournez sur l'application
2. Essayez d'ajouter un nouvel étudiant
3. L'erreur devrait avoir disparu

## 🔧 Solution alternative (si le problème persiste)

Si le problème persiste après avoir réappliqué les politiques, il y a deux possibilités :

### Option A : Désactiver temporairement RLS (développement uniquement)

**⚠️ ATTENTION : Ne faites ceci QUE pour le développement local !**

```sql
-- Désactiver RLS temporairement
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
```

### Option B : Vérifier la configuration Supabase

1. Vérifiez que le fichier `.env` contient les bonnes valeurs :
   ```
   VITE_SUPABASE_URL=https://[votre-projet].supabase.co
   VITE_SUPABASE_ANON_KEY=[votre-clé-anon]
   ```

2. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

## 🐛 Debugging avancé

Si rien ne fonctionne, exécutez ce script de diagnostic dans Supabase SQL Editor :

```sql
-- Vérifier l'utilisateur actuel
SELECT 
  'User ID:' as info,
  auth.uid() as value
UNION ALL
SELECT 
  'User email:' as info,
  auth.email() as value;

-- Vérifier les policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE tablename = 'students';

-- Tester l'insertion manuelle
INSERT INTO public.students (
  user_id,
  first_name,
  last_name,
  matricule,
  class_name,
  school_year
) VALUES (
  auth.uid(),
  'Test',
  'Student',
  'TEST-001',
  '6ème',
  '2025-2026'
);
```

Si l'insertion manuelle fonctionne, le problème vient du code JavaScript.
Si l'insertion manuelle échoue, le problème vient des politiques RLS.

## 📞 Besoin d'aide ?

Si le problème persiste :
1. Copiez le message d'erreur complet de la console
2. Copiez le résultat du script de diagnostic
3. Vérifiez les logs Supabase dans Dashboard > Logs
