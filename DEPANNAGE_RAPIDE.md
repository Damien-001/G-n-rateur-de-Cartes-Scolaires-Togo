# 🚨 Dépannage Rapide - Chargement Lent

## Problème: "Le chargement prend plus de temps que prévu"

### ✅ Solutions Rapides (dans l'ordre)

#### 1. Recharger la Page
- Cliquez sur le bouton "Recharger la page" dans l'alerte
- Ou appuyez sur `Ctrl + R` (Windows) / `Cmd + R` (Mac)

#### 2. Vider le Cache
1. Ouvrez les DevTools (`F12`)
2. Clic droit sur le bouton de rafraîchissement
3. Sélectionnez "Vider le cache et actualiser"

#### 3. Vérifier la Configuration Supabase

**Fichier `.env` :**
```env
VITE_SUPABASE_URL="https://votre-projet.supabase.co"
VITE_SUPABASE_ANON_KEY="votre-clé-anon"
```

**Comment obtenir ces valeurs :**
1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

#### 4. Vérifier la Connexion Internet
```bash
# Dans le terminal
ping supabase.co
```

Si pas de réponse, vérifiez votre connexion.

#### 5. Exécuter les Migrations Supabase

**Important:** Exécutez ces migrations dans l'ordre :

1. **Migration de base** (`supabase/schema.sql`)
2. **Migration cachet** (`supabase/migration_add_stamp_url.sql`)
3. **Migration date expiration** (`supabase/migration_add_expiration_date.sql`)
4. **Migration nettoyage** (`supabase/migration_fix_duplicates.sql`)

**Comment exécuter :**
1. Supabase Dashboard > SQL Editor
2. Nouvelle requête
3. Copiez le contenu du fichier
4. Exécutez

---

## 🔍 Diagnostic Avancé

### Vérifier les Logs dans la Console

Ouvrez la console (`F12`) et cherchez :

#### ✅ Logs Normaux :
```
✅ Chargement des infos école en XXms
✅ Chargement de X étudiants en XXms
🚀 Chargement total en XXms
```

#### ❌ Logs d'Erreur :
```
⏱️ Timeout lors du chargement des étudiants
⏱️ Timeout lors du chargement des infos école
fetchStudents error: ...
fetchSchoolInfo error: ...
```

### Temps de Chargement Normaux

| Opération | Temps Normal | Temps Lent |
|-----------|--------------|------------|
| Infos école | < 500ms | > 2000ms |
| Étudiants (10) | < 1000ms | > 3000ms |
| Étudiants (50) | < 2000ms | > 5000ms |
| Total | < 2000ms | > 5000ms |

---

## 🛠️ Solutions par Type d'Erreur

### Erreur: "Timeout fetchSchoolInfo"

**Cause:** La requête school_info prend trop de temps

**Solutions:**
1. Exécutez `migration_fix_duplicates.sql`
2. Vérifiez qu'il n'y a qu'une seule ligne par user_id:
   ```sql
   SELECT user_id, COUNT(*) 
   FROM school_info 
   GROUP BY user_id 
   HAVING COUNT(*) > 1;
   ```
3. Supprimez les doublons manuellement si nécessaire

### Erreur: "Timeout fetchStudents"

**Cause:** Trop d'étudiants ou images trop lourdes

**Solutions:**
1. **Limiter le nombre d'étudiants** (déjà fait - max 100)
2. **Compresser les images:**
   - Utilisez des images < 500KB
   - Format JPEG avec qualité 80%
   - Résolution max: 800x1000px
3. **Utiliser Supabase Storage** au lieu de base64:
   ```typescript
   // Au lieu de stocker en base64
   const url = await uploadImage(file, userId, 'photos');
   ```

### Erreur: "Failed to load resource: 500"

**Cause:** Erreur serveur Supabase

**Solutions:**
1. Vérifiez le statut de Supabase: https://status.supabase.com
2. Vérifiez les logs Supabase Dashboard > Logs
3. Contactez le support Supabase si le problème persiste

---

## 🚀 Optimisations Appliquées

### Timeouts Ajoutés
- ✅ fetchSchoolInfo: 5 secondes
- ✅ fetchStudents: 8 secondes
- ✅ saveSchoolInfo: 5 secondes
- ✅ Alerte utilisateur: 5 secondes (au lieu de 10)

### Chargement Séquentiel
Au lieu de charger en parallèle (qui peut causer des timeouts), on charge:
1. D'abord school_info (plus rapide)
2. Puis students (plus lent)

### Limite d'Étudiants
- Maximum 100 étudiants au chargement initial
- Évite les timeouts avec de grandes bases

### Gestion d'Erreur Améliorée
- Les erreurs ne bloquent plus l'interface
- L'app continue même si une requête échoue
- Logs détaillés pour le débogage

---

## 📊 Monitoring

### Activer les Logs de Performance

Dans la console, vous verrez automatiquement:
```
✅ Chargement des infos école en 234ms
✅ Chargement de 15 étudiants en 567ms
🚀 Chargement total en 801ms
```

### Mesurer la Latence Réseau

1. Ouvrez DevTools (`F12`)
2. Onglet **Network**
3. Rechargez la page
4. Cherchez les requêtes vers Supabase
5. Vérifiez le temps de réponse

**Temps normaux:**
- < 200ms : Excellent
- 200-500ms : Bon
- 500-1000ms : Acceptable
- \> 1000ms : Problème

---

## ✅ Checklist de Vérification

Avant de demander de l'aide, vérifiez:

- [ ] Fichier `.env` correctement configuré
- [ ] Connexion internet fonctionnelle
- [ ] Migrations Supabase exécutées
- [ ] Pas de doublons dans school_info
- [ ] Images < 500KB
- [ ] Cache navigateur vidé
- [ ] Console ouverte pour voir les logs
- [ ] Statut Supabase vérifié

---

## 🆘 Besoin d'Aide ?

Si le problème persiste après avoir essayé toutes ces solutions:

1. **Copiez les logs de la console** (F12 > Console)
2. **Prenez une capture d'écran** de l'erreur
3. **Notez:**
   - Nombre d'étudiants dans la base
   - Taille approximative des images
   - Région Supabase utilisée
   - Temps de chargement observé

---

**Dernière mise à jour:** 2026-05-02  
**Version:** 2.2 - Optimisations de chargement
