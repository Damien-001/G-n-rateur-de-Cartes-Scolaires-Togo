# 🧪 Tests de Sécurité - Checklist

## ✅ Tests Automatiques

### 1. Vérifier les vulnérabilités npm
```bash
npm audit
```
**Résultat attendu** : `found 0 vulnerabilities`

### 2. Vérifier la compilation TypeScript
```bash
npm run lint
```
**Résultat attendu** : Aucune erreur TypeScript

---

## 🧪 Tests Manuels

### 3. Test de l'Audit Trail

#### a. Créer un étudiant
1. Lancez l'application : `npm run dev`
2. Connectez-vous
3. Créez un nouvel étudiant
4. Allez dans Supabase > Table Editor > `audit_logs`
5. **Vérifiez** : Une entrée `CREATE_STUDENT` doit apparaître

#### b. Modifier un étudiant
1. Modifiez un étudiant existant
2. Vérifiez dans `audit_logs`
3. **Vérifiez** : Une entrée `UPDATE_STUDENT` doit apparaître

#### c. Supprimer un étudiant
1. Supprimez un étudiant
2. Vérifiez dans `audit_logs`
3. **Vérifiez** : Une entrée `DELETE_STUDENT` doit apparaître

---

### 4. Test RGPD - Export des Données

1. Cliquez sur l'icône ⚙️ (Paramètres) dans le header
2. Cliquez sur "Exporter mes données"
3. **Vérifiez** : Un fichier JSON est téléchargé
4. Ouvrez le fichier JSON
5. **Vérifiez** : Il contient :
   - Vos informations utilisateur
   - La liste de vos élèves
   - Les informations de l'école
   - Les logs d'audit

---

### 5. Test RGPD - Politique de Confidentialité

1. Dans le modal "Mes Données", cliquez sur "Politique de confidentialité"
2. **Vérifiez** : La politique s'affiche correctement
3. **Vérifiez** : Les sections suivantes sont présentes :
   - Données collectées
   - Utilisation des données
   - Sécurité des données
   - Vos droits (RGPD)
   - Conservation des données
   - Contact

---

### 6. Test RGPD - Bannière Cookies

1. Ouvrez l'application en navigation privée
2. **Vérifiez** : La bannière de consentement cookies s'affiche en bas
3. Cliquez sur "Refuser"
4. **Vérifiez** : La bannière disparaît
5. Rechargez la page
6. **Vérifiez** : La bannière ne s'affiche plus

---

### 7. Test de Validation des Données

#### a. Validation du formulaire étudiant
1. Cliquez sur "Ajouter" un élève
2. Essayez de soumettre le formulaire vide
3. **Vérifiez** : Des messages d'erreur s'affichent
4. Entrez des données invalides (ex: date de naissance future)
5. **Vérifiez** : La validation Zod rejette les données

#### b. Validation de l'upload de photo
1. Essayez d'uploader un fichier non-image (ex: .txt)
2. **Vérifiez** : Le fichier est rejeté
3. Essayez d'uploader une image très lourde (>10MB)
4. **Vérifiez** : Le fichier est rejeté avec un message approprié

---

### 8. Test des Messages d'Erreur Uniformes

#### a. Test d'énumération d'utilisateurs
1. Déconnectez-vous
2. Essayez de vous connecter avec un email inexistant
3. **Vérifiez** : Message générique "Identifiants incorrects ou compte inexistant"
4. Essayez de vous inscrire avec un email déjà utilisé
5. **Vérifiez** : Message générique similaire (pas de révélation)

---

### 9. Test de Suppression de Compte (⚠️ ATTENTION)

**⚠️ NE PAS FAIRE SUR UN COMPTE RÉEL**

1. Créez un compte de test
2. Ajoutez quelques élèves de test
3. Allez dans "Mes Données"
4. Cliquez sur "Supprimer mon compte"
5. Tapez "SUPPRIMER MON COMPTE" dans le champ
6. Confirmez
7. **Vérifiez** : 
   - Le compte est supprimé
   - Vous êtes déconnecté
   - Les données sont supprimées de Supabase

---

### 10. Test des Headers de Sécurité (Après déploiement)

1. Déployez l'application
2. Allez sur https://securityheaders.com/
3. Entrez l'URL de votre application
4. **Vérifiez** : Les headers suivants sont présents :
   - ✅ Content-Security-Policy
   - ✅ X-Frame-Options: DENY
   - ✅ X-Content-Type-Options: nosniff
   - ✅ Referrer-Policy: strict-origin-when-cross-origin
   - ✅ Permissions-Policy

---

### 11. Test SSL/TLS (Après déploiement)

1. Allez sur https://www.ssllabs.com/ssltest/
2. Entrez l'URL de votre application
3. **Vérifiez** : Note A ou A+

---

### 12. Test de la Console (Logs en Production)

1. Déployez l'application en production
2. Ouvrez la console du navigateur (F12)
3. Effectuez quelques actions (créer, modifier, supprimer)
4. **Vérifiez** : 
   - ✅ Pas de logs détaillés en production
   - ✅ Pas de données sensibles affichées
   - ✅ Pas d'erreurs SQL visibles

---

## 📊 Résultats Attendus

### ✅ Tous les tests passent
**Score de sécurité : 85/100** - Votre application est bien sécurisée !

### ⚠️ Certains tests échouent
Consultez le fichier `GUIDE_SECURISATION_COMPLETE.md` pour les corrections.

### ❌ Beaucoup de tests échouent
Vérifiez que vous avez bien :
1. Créé la table `audit_logs` dans Supabase
2. Configuré les variables d'environnement
3. Installé toutes les dépendances (`npm install`)

---

## 🐛 Problèmes Courants

### La table audit_logs n'existe pas
**Solution** : Exécutez le script `supabase/audit-logs.sql` dans Supabase SQL Editor

### Les logs ne s'enregistrent pas
**Solution** : Vérifiez les politiques RLS dans Supabase

### L'export de données ne fonctionne pas
**Solution** : Vérifiez que la table `audit_logs` existe et que les permissions sont correctes

### La bannière cookies ne s'affiche pas
**Solution** : Videz le localStorage et rechargez la page en navigation privée

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez `GUIDE_SECURISATION_COMPLETE.md`
2. Vérifiez les logs dans la console du navigateur
3. Vérifiez les logs dans Supabase Dashboard > Logs

---

**Date de création** : ${new Date().toLocaleDateString('fr-FR')}  
**Version** : 1.0.0
