# 🚨 CORRECTION RAPIDE - Erreur RLS

## ❌ Erreur que tu vois :
```
Erreur lors de l'ajout
new row violates row-level security policy for table "students"
```

## ✅ Solution en 5 étapes (2 minutes)

### 1️⃣ Ouvre Supabase Dashboard
Va sur : **https://supabase.com/dashboard**

### 2️⃣ Sélectionne ton projet
Clique sur ton projet dans la liste

### 3️⃣ Ouvre SQL Editor
Dans le menu de gauche, clique sur **"SQL Editor"**

### 4️⃣ Crée une nouvelle requête
Clique sur le bouton **"New Query"**

### 5️⃣ Copie et exécute ce script

**Ouvre le fichier `fix-rls-policies.sql`** et copie TOUT son contenu, puis :

1. Colle dans l'éditeur SQL de Supabase
2. Clique sur **"Run"** (ou appuie sur **Ctrl+Enter**)
3. Tu devrais voir : `✅ Policies créées avec succès`

### 6️⃣ Retourne sur l'application
1. Recharge la page (F5)
2. Essaie d'ajouter un étudiant
3. ✅ **Ça devrait fonctionner !**

---

## 🔍 Que fait ce script ?

Le script :
- ✅ Supprime les anciennes politiques de sécurité
- ✅ Crée de nouvelles politiques correctes
- ✅ Vérifie que tu es bien connecté
- ✅ Affiche ton User ID

---

## ⚠️ Si ça ne marche toujours pas

### Vérifie dans la console (F12) :

Tu devrais voir ces logs :
```
🔍 [upsertStudent] Debug info: {
  isNew: true,
  userId: "abc123-def456-..."  ← Doit être un UUID
  ...
}
```

**Si `userId` est vide** → Problème d'authentification :
1. Déconnecte-toi
2. Reconnecte-toi
3. Réessaie

**Si `userId` est présent** → Exécute à nouveau le script SQL

---

## 🆘 Solution d'urgence (développement uniquement)

**⚠️ À utiliser UNIQUEMENT si rien d'autre ne fonctionne !**

Dans Supabase SQL Editor, exécute :

```sql
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
```

Cela désactive complètement la sécurité. **Ne fais JAMAIS ça en production !**

---

## 📞 Besoin d'aide ?

Si le problème persiste :
1. Fais une capture d'écran de la console (F12)
2. Fais une capture d'écran du résultat du script SQL
3. Vérifie que ton fichier `.env` contient bien :
   ```
   VITE_SUPABASE_URL=https://[ton-projet].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## ✅ Après la correction

Une fois que ça fonctionne :
1. Les étudiants s'ajoutent normalement
2. Chaque utilisateur voit uniquement SES étudiants
3. La sécurité est maintenue

C'est tout ! 🎉
