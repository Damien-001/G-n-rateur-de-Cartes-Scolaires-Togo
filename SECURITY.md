# Security Policy - Générateur de Cartes Scolaires Togo

## 🔒 Corrections de Sécurité Implémentées

Ce document liste toutes les corrections de sécurité appliquées suite à l'audit de sécurité complet.

### ✅ CRITIQUE - Corrections Implémentées

#### 1. Gestion des Secrets
- ✅ Suppression de GEMINI_API_KEY du bundle client (`vite.config.ts`)
- ✅ `.env` ajouté à `.gitignore` (déjà présent)
- ⚠️ **ACTION REQUISE**: Nettoyer l'historique Git des secrets exposés
- ⚠️ **ACTION REQUISE**: Régénérer toutes les clés API exposées

#### 2. Validation Côté Serveur
- ✅ Installation de Zod pour la validation
- ✅ Création de `src/lib/validation.ts` avec schémas de validation
- ✅ Intégration de la validation dans `src/lib/db.ts` (upsertStudent)
- ✅ Validation des fichiers uploadés (taille, type MIME, extension)
- ✅ Sanitization HTML et noms de fichiers

### ✅ HAUTE - Corrections Implémentées

#### 3. Headers de Sécurité HTTP
- ✅ Création de `public/_headers` avec:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy
  - Content-Security-Policy
  - Strict-Transport-Security (HSTS)

#### 4. Journalisation et Audit Trail
- ✅ Création de `src/lib/logger.ts` avec logging sécurisé
- ✅ Logs différenciés par environnement (dev/prod)
- ✅ Sanitization automatique des données sensibles
- ✅ Fonction `logAuditTrail()` pour les actions sensibles
- ✅ Intégration dans `src/lib/auth.ts` (login/register)
- ✅ Intégration dans `src/lib/db.ts` (CRUD élèves)

#### 5. Messages d'Erreur Uniformes
- ✅ Anti-énumération dans `src/lib/auth.ts`
- ✅ Messages génériques pour login/register échoués
- ✅ Pas de révélation d'informations sensibles

### ⚠️ HAUTE - Corrections Partielles (Nécessitent Actions Manuelles)

#### 6. Conformité RGPD
- ⚠️ **TODO**: Créer page de politique de confidentialité
- ⚠️ **TODO**: Implémenter mécanisme de suppression de compte
- ⚠️ **TODO**: Implémenter mécanisme d'export des données
- ⚠️ **TODO**: Ajouter bannière de consentement aux cookies

#### 7. URLs Storage Pré-signées
- ⚠️ **TODO**: Migrer vers URLs pré-signées Supabase Storage
- ⚠️ **TODO**: Implémenter expiration des URLs

#### 8. Rate Limiting Applicatif
- ⚠️ **TODO**: Implémenter rate limiting via middleware ou Edge Functions

#### 9. Confirmation Forte Actions Destructrices
- ⚠️ **TODO**: Remplacer `confirm()` par modal avec saisie de texte
- ⚠️ **TODO**: Implémenter re-authentification pour actions critiques

#### 10. Migration Photos Base64 → Storage
- ⚠️ **TODO**: Migrer stockage photos de base64 vers Supabase Storage
- ⚠️ **TODO**: Script de migration des photos existantes

#### 11. Pipeline CI/CD
- ⚠️ **TODO**: Configurer GitHub Actions / GitLab CI
- ⚠️ **TODO**: Ajouter `npm audit` automatique
- ⚠️ **TODO**: Intégrer SAST (ex: Snyk, SonarQube)

#### 12. Subresource Integrity (SRI)
- ⚠️ **TODO**: Ajouter attributs `integrity` pour CDN externes

### 📋 Actions Immédiates Requises

1. **Nettoyer l'historique Git**:
   ```bash
   # Utiliser BFG Repo-Cleaner ou git-filter-repo
   git filter-repo --path .env --invert-paths
   ```

2. **Régénérer les clés API**:
   - Nouvelle clé GEMINI_API_KEY
   - Nouvelle clé anon Supabase (si possible)
   - Mettre à jour les variables d'environnement de déploiement

3. **Configurer les variables d'environnement de production**:
   - Vercel/Netlify: Dashboard > Environment Variables
   - Ne jamais commiter de secrets

4. **Tester les corrections**:
   ```bash
   npm run build
   npm run preview
   ```

5. **Audit des dépendances**:
   ```bash
   npm audit
   npm audit fix
   ```

### 🔐 Bonnes Pratiques de Sécurité

#### Développement
- Ne jamais commiter de fichiers `.env`
- Utiliser `.env.example` pour documenter les variables requises
- Valider toutes les entrées utilisateur côté serveur
- Logger les actions sensibles pour l'audit trail

#### Déploiement
- Utiliser HTTPS uniquement
- Configurer les headers de sécurité HTTP
- Activer HSTS
- Monitorer les logs et alertes

#### Maintenance
- Exécuter `npm audit` régulièrement
- Mettre à jour les dépendances
- Revoir les politiques RLS Supabase
- Tester les mécanismes de sécurité

### 📞 Reporting de Vulnérabilités

Si vous découvrez une vulnérabilité de sécurité, veuillez:
1. **NE PAS** créer d'issue publique
2. Contacter l'équipe de sécurité directement
3. Fournir des détails sur la vulnérabilité
4. Attendre la correction avant divulgation publique

### 📚 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [RGPD - Guide CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)

---

**Dernière mise à jour**: 2025-01-30
**Version**: 1.0.0
