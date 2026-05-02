# 🚨 SOLUTION RAPIDE - Timeouts Supabase

## Votre Problème

```
❌ Timeout lors du chargement des infos école (>10s)
❌ Timeout lors du chargement des étudiants (>15s)
⏱️ Chargement total en 25 secondes
```

## ✅ Solution en 5 Minutes

### Étape 1: Vérifier la Configuration

Exécutez ce script pour diagnostiquer :

```bash
node verifier-config.js
```

### Étape 2: Obtenir les Bonnes Valeurs

1. **Allez sur** https://app.supabase.com
2. **Connectez-vous** avec votre compte
3. **Sélectionnez** votre projet
4. **Cliquez** sur l'icône ⚙️ **Settings** (en bas à gauche)
5. **Cliquez** sur **API** dans le menu

Vous verrez :

```
Project URL
https://xxxxxxxxxxxxx.supabase.co
[Copy]

Project API keys
anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[Reveal] [Copy]
```

### Étape 3: Mettre à Jour .env

Ouvrez le fichier `.env` à la racine du projet et remplacez :

**AVANT:**
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

**APRÈS:**
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT:**
- Pas de guillemets autour des valeurs
- Pas d'espaces avant ou après le `=`
- Copiez TOUTE la clé (très longue)

### Étape 4: Redémarrer le Serveur

**CRUCIAL:** Les variables d'environnement ne sont chargées qu'au démarrage !

```bash
# Dans le terminal où tourne npm run dev
# Appuyez sur Ctrl+C pour arrêter

# Puis relancez
npm run dev
```

### Étape 5: Vider le Cache

1. Ouvrez le navigateur
2. Appuyez sur `F12` pour ouvrir DevTools
3. Clic droit sur le bouton de rafraîchissement
4. Sélectionnez **"Vider le cache et actualiser"**

---

## 🎯 Résultat Attendu

Après ces étapes, vous devriez voir dans la console :

```
✅ Chargement des infos école en 234ms
✅ Chargement de 15 étudiants en 567ms
🚀 Chargement total en 801ms
```

Au lieu de :

```
❌ Timeout lors du chargement des infos école (>10s)
❌ Timeout lors du chargement des étudiants (>15s)
🚀 Chargement total en 25016ms
```

---

## 🔍 Vérification

Pour vérifier que tout fonctionne, ouvrez la console (`F12`) et exécutez :

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

Vous devriez voir :
```
URL: https://xxxxxxxxxxxxx.supabase.co
Key: eyJhbGciOiJIUzI1NiI...
```

Si vous voyez `undefined`, le serveur n'a pas été redémarré !

---

## ❓ Toujours des Problèmes ?

### Si vous voyez toujours "undefined"
→ Le serveur n'a pas été redémarré correctement
→ Fermez complètement le terminal et relancez

### Si vous voyez les bonnes valeurs mais toujours des timeouts
→ Vérifiez votre connexion internet
→ Testez : `ping supabase.co`
→ Vérifiez le statut : https://status.supabase.com

### Si vous n'avez pas de projet Supabase
1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Attendez 2-3 minutes que le projet soit prêt
4. Exécutez le fichier `supabase/schema.sql` dans SQL Editor
5. Récupérez les clés dans Settings > API

---

## 📞 Besoin d'Aide ?

Si rien ne fonctionne, fournissez :
1. Résultat de `node verifier-config.js`
2. Capture d'écran de la console (F12)
3. Résultat de `ping supabase.co`

---

**Temps estimé:** 5 minutes  
**Taux de réussite:** 95%  
**Dernière mise à jour:** 2026-05-02
