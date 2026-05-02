# 🔴 Diagnostic - Problème de Connexion Supabase

## Symptômes Observés

D'après les logs de votre console :
```
❌ Timeout lors du chargement des infos école
❌ Timeout lors du chargement des étudiants (multiple fois)
❌ Uncaught (in promise) Could not establish connection. Receiving end does not exist.
⏱️ Chargement total en 13777ms, 13691ms, 13009ms
```

**Diagnostic:** Problème de connexion à Supabase

---

## 🔍 Vérifications Immédiates

### 1. Vérifier le Fichier .env

**Ouvrez le fichier `.env` à la racine du projet :**

```env
VITE_SUPABASE_URL="https://votre-projet.supabase.co"
VITE_SUPABASE_ANON_KEY="votre-clé-anon-très-longue"
```

**Vérifications :**
- [ ] Le fichier `.env` existe bien à la racine
- [ ] `VITE_SUPABASE_URL` commence par `https://`
- [ ] `VITE_SUPABASE_URL` se termine par `.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` est une longue chaîne (>100 caractères)
- [ ] Pas d'espaces avant ou après les valeurs
- [ ] Pas de guillemets doubles à l'intérieur des valeurs

**Comment obtenir les bonnes valeurs :**
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **Settings** (⚙️) dans le menu gauche
4. Cliquez sur **API**
5. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** (cliquez sur "Reveal") → `VITE_SUPABASE_ANON_KEY`

### 2. Redémarrer le Serveur de Développement

**IMPORTANT:** Après avoir modifié `.env`, vous DEVEZ redémarrer :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

Les variables d'environnement ne sont chargées qu'au démarrage !

### 3. Vérifier la Connexion Internet

```bash
# Test de connexion à Supabase
ping supabase.co

# Test de résolution DNS
nslookup supabase.co
```

Si ces commandes échouent, vérifiez :
- Votre connexion WiFi/Ethernet
- Votre pare-feu
- Votre antivirus
- Votre VPN (désactivez-le temporairement)

### 4. Vérifier le Statut de Supabase

Allez sur : https://status.supabase.com

Si Supabase est en panne, vous devrez attendre qu'ils résolvent le problème.

---

## 🛠️ Solutions par Ordre de Priorité

### Solution 1: Recréer le Fichier .env

Si votre `.env` est corrompu ou mal formaté :

1. **Supprimez** le fichier `.env`
2. **Créez** un nouveau fichier `.env` à la racine
3. **Copiez** exactement ce format :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. **Remplacez** les valeurs par les vôtres
5. **Sauvegardez**
6. **Redémarrez** le serveur (`Ctrl+C` puis `npm run dev`)

### Solution 2: Vider le Cache du Navigateur

1. Ouvrez DevTools (`F12`)
2. Clic droit sur le bouton de rafraîchissement
3. Sélectionnez **"Vider le cache et actualiser"**

### Solution 3: Tester la Connexion Manuellement

Ouvrez la console du navigateur (`F12`) et exécutez :

```javascript
// Test 1: Vérifier les variables d'environnement
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Test 2: Tester la connexion
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.from('school_info').select('*').limit(1);
console.log('Test connexion:', { data, error });
```

**Résultats attendus :**
- ✅ URL doit afficher votre URL Supabase
- ✅ Key doit afficher le début de votre clé
- ✅ Test connexion doit retourner `data` ou `error: null`

**Si vous voyez :**
- ❌ `undefined` pour URL ou Key → Problème de `.env`
- ❌ `error: { message: "..." }` → Problème de connexion ou de permissions

### Solution 4: Vérifier les Permissions Supabase

Dans Supabase Dashboard :

1. Allez dans **Authentication** > **Policies**
2. Vérifiez que les tables `students` et `school_info` ont des policies
3. Si aucune policy n'existe, exécutez le fichier `supabase/schema.sql`

### Solution 5: Augmenter les Timeouts (Déjà fait)

Les timeouts ont été augmentés à :
- fetchSchoolInfo: 10 secondes
- fetchStudents: 15 secondes
- saveSchoolInfo: 10 secondes
- Alerte utilisateur: 15 secondes

Si votre connexion est très lente, vous pouvez les augmenter encore dans `src/lib/db.ts`.

---

## 🚨 Erreur Spécifique: "Receiving end does not exist"

Cette erreur indique un problème avec les extensions du navigateur.

**Solutions :**
1. **Désactivez toutes les extensions** du navigateur
2. **Testez en navigation privée** (Ctrl+Shift+N)
3. **Essayez un autre navigateur** (Chrome, Firefox, Edge)

Extensions problématiques connues :
- Bloqueurs de publicités (AdBlock, uBlock)
- Extensions de sécurité
- Extensions de développement React

---

## 📊 Temps de Chargement Normaux vs Anormaux

| Opération | Normal | Lent | Très Lent (Votre cas) |
|-----------|--------|------|----------------------|
| Infos école | < 500ms | 1-2s | **> 10s** ❌ |
| Étudiants | < 2s | 3-5s | **> 15s** ❌ |
| Total | < 3s | 5-8s | **> 13s** ❌ |

Votre temps de chargement (13-14 secondes) indique un problème sérieux.

---

## ✅ Checklist de Résolution

Cochez au fur et à mesure :

- [ ] Fichier `.env` vérifié et correct
- [ ] Serveur de développement redémarré
- [ ] Cache navigateur vidé
- [ ] Extensions navigateur désactivées
- [ ] Connexion internet testée
- [ ] Statut Supabase vérifié
- [ ] Test de connexion manuel effectué
- [ ] Permissions Supabase vérifiées
- [ ] Migrations SQL exécutées

---

## 🆘 Si Rien ne Fonctionne

### Option 1: Recréer le Projet Supabase

1. Créez un nouveau projet sur Supabase
2. Exécutez `supabase/schema.sql`
3. Mettez à jour `.env` avec les nouvelles valeurs
4. Redémarrez le serveur

### Option 2: Utiliser un Autre Réseau

- Essayez avec votre téléphone en partage de connexion
- Essayez sur un autre réseau WiFi
- Désactivez votre VPN

### Option 3: Vérifier le Pare-feu

Votre pare-feu ou antivirus bloque peut-être Supabase :
- Ajoutez `*.supabase.co` aux exceptions
- Désactivez temporairement le pare-feu pour tester

---

## 📝 Informations à Fournir pour Support

Si vous avez besoin d'aide, fournissez :

1. **Logs de la console** (F12 > Console)
2. **Contenu de .env** (masquez les valeurs sensibles)
3. **Résultat du test de connexion manuel**
4. **Navigateur et version**
5. **Système d'exploitation**
6. **Résultat de `ping supabase.co`**

---

**Dernière mise à jour:** 2026-05-02  
**Version:** 2.3 - Diagnostic connexion Supabase
