# 🔧 Correction de l'erreur RLS

## ❌ Erreur rencontrée

```
Erreur lors de l'ajout
new row violates row-level security policy for table "students"
```

## 📋 Étapes de correction

### 1️⃣ Ouvrir la console du navigateur

1. Appuyez sur **F12** (ou clic droit > Inspecter)
2. Allez dans l'onglet **Console**
3. Essayez d'ajouter un étudiant
4. Regardez les logs qui commencent par 🔍, 📝, ❌ ou ✅

### 2️⃣ Vérifier les informations de debug

Vous devriez voir quelque chose comme :

```
🔍 [upsertStudent] Debug info: {
  isNew: true,
  userId: "abc123-def456-...",  ← Doit être un UUID valide
  studentId: "",
  firstName: "Jean",
  lastName: "KOFFI"
}
```

**Si `userId` est vide ou `undefined`** → Problème d'authentification
**Si `userId` est un UUID valide** → Problème de politiques RLS

### 3️⃣ Appliquer le correctif RLS

1. Ouvrez **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Ouvrez le fichier `fix-rls-policies.sql` dans votre éditeur
6. Copiez tout le contenu
7. Collez dans Supabase SQL Editor
8. Cliquez sur **Run** (ou Ctrl+Enter)

### 4️⃣ Vérifier les résultats

Après l'exécution, vous devriez voir dans les résultats :

```
info                  | user_id              | status
---------------------|----------------------|-------------
Current user ID:     | abc123-def456-...    | ✅ CONNECTÉ
```

Et plus bas, 4 lignes pour les 4 policies créées.

### 5️⃣ Tester à nouveau

1. Retournez sur l'application
2. Rechargez la page (F5)
3. Essayez d'ajouter un nouvel étudiant
4. ✅ Ça devrait fonctionner !

## 🆘 Si le problème persiste

### Option A : Vérifier la configuration

Ouvrez le fichier `.env` à la racine du projet et vérifiez :

```env
VITE_SUPABASE_URL=https://[votre-projet].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Les valeurs doivent correspondre à celles de votre projet Supabase :
- Dashboard > Settings > API > Project URL
- Dashboard > Settings > API > Project API keys > anon public

### Option B : Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### Option C : Désactiver temporairement RLS (développement uniquement)

**⚠️ ATTENTION : À utiliser UNIQUEMENT pour le développement local !**

Dans Supabase SQL Editor, exécutez :

```sql
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
```

Cela désactive la sécurité et permet toutes les opérations. **Ne faites JAMAIS cela en production !**

## 📊 Logs de débogage détaillés

Avec la nouvelle version du code, vous verrez maintenant des logs détaillés :

```
🔍 [upsertStudent] Debug info: {...}
📝 [upsertStudent] Données à insérer: {...}
✅ [upsertStudent] Insertion réussie: {...}
```

Ou en cas d'erreur :

```
❌ [upsertStudent] Erreur Supabase: {
  message: "new row violates row-level security policy",
  details: "...",
  hint: "...",
  code: "42501"
}
```

Ces informations vous aideront à identifier précisément le problème.

## 📚 Documentation

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Debugging RLS Policies](https://supabase.com/docs/guides/database/postgres/row-level-security#debugging-policies)

## ✅ Résumé

1. Ouvrir la console (F12)
2. Vérifier les logs de debug
3. Exécuter `fix-rls-policies.sql` dans Supabase
4. Tester à nouveau
5. Si ça ne marche pas, vérifier `.env` et redémarrer

Bonne chance ! 🚀
