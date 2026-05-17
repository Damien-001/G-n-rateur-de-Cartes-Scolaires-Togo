# 🔐 Changements - Gestion de la Déconnexion

## Date: 17 Mai 2026

---

## ✅ Modifications Appliquées

### 1. Déconnexion après 30 minutes d'inactivité

**Avant**: 10 minutes d'inactivité  
**Après**: **30 minutes d'inactivité**

**Fichiers modifiés**:
- `src/lib/inactivity.ts` - Timer passé de 10 à 30 minutes
- `src/lib/auth.ts` - Vérification session passée de 2h à 30 minutes

**Comportement**:
- ⏱️ Après **29 minutes** d'inactivité → Avertissement affiché
- ⏱️ Après **30 minutes** d'inactivité → Déconnexion automatique
- ✅ Toute activité (clic, scroll, touche) réinitialise le timer

**Événements surveillés**:
- `mousemove` - Mouvement de souris
- `mousedown` - Clic souris
- `keydown` - Touche clavier
- `touchstart` - Touch mobile
- `scroll` - Défilement
- `click` - Clic

---

### 2. Déconnexion lors de la fermeture de l'application

**Nouveau**: Déconnexion automatique lors de la fermeture

**Fichier modifié**:
- `src/App.tsx` - Ajout de listeners pour fermeture

**Comportement**:
- 🚪 Fermeture de l'onglet → Déconnexion automatique
- 🚪 Fermeture du navigateur → Déconnexion automatique
- 🚪 Navigation vers un autre site → Déconnexion automatique
- 🚪 Onglet en arrière-plan (hidden) → Déconnexion automatique

**Événements surveillés**:
- `beforeunload` - Avant fermeture de la fenêtre
- `visibilitychange` - Changement de visibilité de l'onglet

---

## 🔒 Sécurité Renforcée

### Avantages

1. **Protection des données**
   - Empêche l'accès non autorisé si l'utilisateur oublie de se déconnecter
   - Déconnexion automatique sur ordinateurs partagés

2. **Conformité**
   - Respecte les bonnes pratiques de sécurité
   - Réduit les risques de session hijacking

3. **Expérience utilisateur**
   - Avertissement 1 minute avant déconnexion
   - Possibilité de rester connecté en bougeant la souris

---

## 📊 Comparaison Avant/Après

| Scénario | Avant | Après |
|----------|-------|-------|
| Inactivité | 10 min | **30 min** ✅ |
| Avertissement | 9 min | **29 min** ✅ |
| Fermeture onglet | Session reste active ❌ | **Déconnexion auto** ✅ |
| Fermeture navigateur | Session reste active ❌ | **Déconnexion auto** ✅ |
| Onglet en arrière-plan | Session reste active ❌ | **Déconnexion auto** ✅ |

---

## 🧪 Tests Recommandés

### Test 1: Inactivité 30 minutes
1. Se connecter à l'application
2. Ne rien faire pendant 29 minutes
3. ✅ Vérifier l'affichage de l'avertissement
4. Attendre 1 minute supplémentaire
5. ✅ Vérifier la déconnexion automatique

### Test 2: Fermeture onglet
1. Se connecter à l'application
2. Fermer l'onglet
3. Rouvrir l'application
4. ✅ Vérifier que l'utilisateur est déconnecté

### Test 3: Fermeture navigateur
1. Se connecter à l'application
2. Fermer le navigateur complètement
3. Rouvrir le navigateur et l'application
4. ✅ Vérifier que l'utilisateur est déconnecté

### Test 4: Réinitialisation du timer
1. Se connecter à l'application
2. Attendre 28 minutes
3. Bouger la souris ou cliquer
4. ✅ Vérifier que le timer est réinitialisé (pas de déconnexion)

---

## 🔧 Configuration

Si vous souhaitez modifier la durée d'inactivité, éditez le fichier :

**`src/lib/inactivity.ts`**

```typescript
// Modifier ces valeurs (en millisecondes)
const TIMEOUT_MS = 30 * 60 * 1000;  // Durée avant déconnexion
const WARNING_MS = 29 * 60 * 1000;  // Durée avant avertissement
```

**Exemples**:
- 15 minutes: `15 * 60 * 1000`
- 1 heure: `60 * 60 * 1000`
- 2 heures: `120 * 60 * 1000`

---

## 📝 Notes Techniques

### localStorage
Le timestamp de dernière activité est stocké dans `localStorage` :
```javascript
localStorage.setItem('last_activity', Date.now().toString());
```

### Nettoyage
Lors de la déconnexion, le timestamp est supprimé :
```javascript
localStorage.removeItem('last_activity');
```

### Supabase
La déconnexion utilise l'API Supabase :
```javascript
await supabase.auth.signOut();
```

---

## ⚠️ Limitations

### beforeunload
- Certains navigateurs peuvent bloquer les actions asynchrones dans `beforeunload`
- La déconnexion est garantie mais peut être retardée

### visibilitychange
- Fonctionne sur tous les navigateurs modernes
- Plus fiable que `beforeunload` pour la déconnexion

### Mobile
- Sur mobile, `visibilitychange` se déclenche lors du changement d'app
- Comportement attendu : déconnexion lors du changement d'app

---

## 🎯 Prochaines Améliorations Possibles

1. **Persistance de session optionnelle**
   - Checkbox "Rester connecté" (30 jours)
   - Utiliser refresh tokens Supabase

2. **Notification push**
   - Notifier l'utilisateur avant déconnexion (si permissions)

3. **Historique de sessions**
   - Logger les sessions dans audit_logs
   - Afficher l'historique dans le profil

4. **Déconnexion sélective**
   - Déconnecter uniquement certains onglets
   - Garder une session principale active

---

**Version**: 2.3.1  
**Date**: 17 Mai 2026  
**Auteur**: Kiro AI
