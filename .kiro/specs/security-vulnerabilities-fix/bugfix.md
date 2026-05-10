# Bugfix Requirements Document - Correction des Vulnérabilités de Sécurité

## Introduction

Suite à un audit de sécurité complet de l'application "Générateur de Cartes Scolaires Togo", plusieurs vulnérabilités critiques, hautes et moyennes ont été identifiées. Ces vulnérabilités exposent l'application à des risques de sécurité majeurs incluant l'exposition de secrets, l'injection de données malformées, l'accès non autorisé aux ressources, et la non-conformité RGPD.

**Stack technique concerné:**
- Frontend: React 19 + TypeScript + Vite 6.2.0
- Base de données: Supabase (PostgreSQL avec RLS)
- Authentification: Supabase Auth
- Storage: Supabase Storage

**Impact global:** Les vulnérabilités identifiées permettent à un attaquant de compromettre la sécurité de l'application, d'accéder frauduleusement aux ressources, d'injecter des données malveillantes, et exposent l'application à des risques légaux de non-conformité RGPD.

---

## Bug Analysis

### Current Behavior (Defect)

#### 1. Gestion des Secrets et Clés API

1.1 WHEN le fichier `.env` contient des secrets réels (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY) THEN le système commit ces secrets dans le dépôt Git

1.2 WHEN la clé GEMINI_API_KEY est définie dans `vite.config.ts:8` via `define` THEN le système expose cette clé dans le bundle JavaScript côté client

1.3 WHEN un attaquant accède au dépôt Git ou inspecte le bundle JavaScript THEN le système permet l'extraction et l'utilisation frauduleuse des clés API

#### 2. Validation des Données

1.4 WHEN un utilisateur soumet des données via les formulaires React THEN le système valide uniquement avec les attributs HTML `required` côté client

1.5 WHEN un attaquant contourne l'interface React et envoie des requêtes directement à l'API Supabase THEN le système accepte des données malformées sans validation serveur (schéma Zod, Joi, Yup)

1.6 WHEN des données JSON sont stockées dans le champ `card_colors` (JSONB) THEN le système n'applique aucune validation de schéma JSON

1.7 WHEN un utilisateur upload un fichier via `StudentForm.tsx` THEN le système valide uniquement le type MIME côté client sans validation serveur ni scan antivirus

1.8 WHEN un fichier malveilleux est uploadé THEN le système l'accepte et le stocke dans Supabase Storage

#### 3. Headers de Sécurité HTTP

1.9 WHEN l'application est servie au client THEN le système n'envoie aucun header de sécurité (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

1.10 WHEN un attaquant tente une attaque de clickjacking ou MIME sniffing THEN le système ne dispose d'aucune protection au niveau HTTP

#### 4. Journalisation et Audit Trail

1.11 WHEN une tentative d'authentification échoue dans `src/lib/auth.ts` THEN le système ne journalise pas l'événement

1.12 WHEN une action sensible (suppression, modification d'élève) est effectuée dans `src/lib/db.ts` THEN le système ne crée aucun audit trail

1.13 WHEN un incident de sécurité se produit THEN le système ne permet pas de détecter ou investiguer l'incident par manque de logs

#### 5. Conformité RGPD

1.14 WHEN un utilisateur s'inscrit ou utilise l'application THEN le système n'affiche aucune politique de confidentialité

1.15 WHEN un utilisateur souhaite supprimer son compte THEN le système ne fournit aucun mécanisme de suppression

1.16 WHEN un utilisateur souhaite exporter ses données personnelles THEN le système ne fournit aucun mécanisme d'export

1.17 WHEN l'application utilise des cookies THEN le système n'affiche aucune bannière de consentement

#### 6. Gestion des URLs Storage

1.18 WHEN une image est uploadée dans Supabase Storage via `src/lib/db.ts:165` THEN le système génère une URL publique permanente sans contrôle d'accès

1.19 WHEN un attaquant devine ou énumère les URLs Storage THEN le système permet l'accès non contrôlé aux fichiers uploadés

#### 7. Rate Limiting et Protection contre les Abus

1.20 WHEN un utilisateur effectue des requêtes répétées sur les endpoints applicatifs (hors authentification) THEN le système ne limite pas le taux de requêtes

1.21 WHEN un attaquant effectue un spam ou une attaque DoS THEN le système ne dispose d'aucune protection applicative

#### 8. Confirmation d'Actions Destructrices

1.22 WHEN un utilisateur supprime un élève dans `src/App.tsx:186, 197` THEN le système demande uniquement une confirmation via `confirm()` JavaScript

1.23 WHEN une action destructrice est effectuée THEN le système ne demande pas de re-authentification forte

#### 9. Logs et Messages d'Erreur en Production

1.24 WHEN l'application s'exécute en production THEN le système affiche des logs console abondants dans `src/lib/db.ts:51, 67, 103, 127`

1.25 WHEN une erreur Supabase se produit dans `src/lib/db.ts` ou `src/lib/auth.ts` THEN le système logue l'erreur complète en console

1.26 WHEN un attaquant inspecte la console du navigateur THEN le système révèle des informations sur la structure interne de la base de données

#### 10. Énumération d'Utilisateurs

1.27 WHEN un utilisateur tente de s'inscrire avec un email déjà utilisé dans `src/lib/auth.ts:48-50` THEN le système affiche "Un compte avec cet email existe déjà"

1.28 WHEN un utilisateur tente de se connecter avec des identifiants incorrects THEN le système affiche "Email ou mot de passe incorrect"

1.29 WHEN un attaquant teste différents emails THEN le système permet d'énumérer les emails enregistrés via les messages d'erreur différents

#### 11. Protection Clickjacking

1.30 WHEN l'application est chargée dans un navigateur THEN le système n'envoie pas de header X-Frame-Options ou CSP frame-ancestors

1.31 WHEN un attaquant intègre l'application dans une iframe malveillante THEN le système permet l'attaque de clickjacking

#### 12. Stockage des Photos

1.32 WHEN une photo est capturée ou uploadée dans `src/components/StudentForm.tsx` THEN le système stocke la photo en base64 dans une data URL

1.33 WHEN la photo est transmise THEN le système n'applique pas de chiffrement optimal et génère une taille excessive

#### 13. Politique de Rétention et Alertes

1.34 WHEN des logs sont générés THEN le système ne définit aucune politique de rétention

1.35 WHEN un comportement anormal se produit THEN le système ne génère aucune alerte

#### 14. Audit des Dépendances

1.36 WHEN le projet est construit ou déployé THEN le système n'exécute aucun audit de sécurité des dépendances npm

1.37 WHEN des vulnérabilités existent dans les dépendances THEN le système ne les détecte pas avant le déploiement

#### 15. Mode Debug et Protection CSRF

1.38 WHEN l'application s'exécute en production THEN le système ne désactive pas explicitement le mode debug

1.39 WHEN une action côté client est effectuée THEN le système ne dispose d'aucune protection CSRF applicative (uniquement gérée par Supabase)

#### 16. Subresource Integrity (SRI)

1.40 WHEN des ressources externes sont chargées THEN le système n'utilise pas de hash d'intégrité (SRI)

1.41 WHEN une ressource externe est compromise (attaque supply chain) THEN le système charge la ressource malveillante sans détection

#### 17. Pipeline CI/CD

1.42 WHEN le code est poussé vers le dépôt THEN le système ne déclenche aucune vérification de sécurité automatique (npm audit, SAST)

1.43 WHEN des vulnérabilités sont introduites THEN le système ne les détecte pas avant le déploiement

---

### Expected Behavior (Correct)

#### 1. Gestion des Secrets et Clés API

2.1 WHEN le fichier `.env` contient des secrets THEN le système SHALL garantir que `.env` est dans `.gitignore` et ne jamais commiter les secrets réels

2.2 WHEN une clé API backend est nécessaire (GEMINI_API_KEY) THEN le système SHALL utiliser une fonction serverless/edge function et ne jamais exposer la clé côté client

2.3 WHEN un attaquant tente d'accéder aux secrets THEN le système SHALL empêcher l'extraction des clés via le dépôt Git ou le bundle JavaScript

#### 2. Validation des Données

2.4 WHEN un utilisateur soumet des données THEN le système SHALL valider les données côté serveur avec un schéma de validation (Zod, Joi, Yup)

2.5 WHEN des données sont envoyées à l'API Supabase THEN le système SHALL rejeter les données malformées avec des messages d'erreur appropriés

2.6 WHEN des données JSON sont stockées dans `card_colors` THEN le système SHALL valider le schéma JSON avant insertion

2.7 WHEN un utilisateur upload un fichier THEN le système SHALL valider le type MIME côté serveur, vérifier la taille, et idéalement scanner avec un antivirus

2.8 WHEN un fichier malveilleux est uploadé THEN le système SHALL rejeter le fichier avec un message d'erreur approprié

#### 3. Headers de Sécurité HTTP

2.9 WHEN l'application est servie au client THEN le système SHALL envoyer les headers de sécurité (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

2.10 WHEN un attaquant tente une attaque de clickjacking ou MIME sniffing THEN le système SHALL bloquer l'attaque via les headers HTTP

#### 4. Journalisation et Audit Trail

2.11 WHEN une tentative d'authentification échoue THEN le système SHALL journaliser l'événement avec timestamp, IP, et email tenté

2.12 WHEN une action sensible est effectuée THEN le système SHALL créer un audit trail avec user_id, action, timestamp, et détails

2.13 WHEN un incident de sécurité se produit THEN le système SHALL permettre la détection et l'investigation via les logs et audit trails

#### 5. Conformité RGPD

2.14 WHEN un utilisateur accède à l'application THEN le système SHALL afficher une politique de confidentialité conforme RGPD

2.15 WHEN un utilisateur souhaite supprimer son compte THEN le système SHALL fournir un mécanisme de suppression avec confirmation

2.16 WHEN un utilisateur souhaite exporter ses données THEN le système SHALL fournir un mécanisme d'export au format JSON/CSV

2.17 WHEN l'application utilise des cookies THEN le système SHALL afficher une bannière de consentement conforme RGPD

#### 6. Gestion des URLs Storage

2.18 WHEN une image est uploadée dans Supabase Storage THEN le système SHALL générer des URLs pré-signées avec expiration

2.19 WHEN un attaquant tente d'accéder à un fichier THEN le système SHALL vérifier les permissions via RLS et URLs pré-signées

#### 7. Rate Limiting et Protection contre les Abus

2.20 WHEN un utilisateur effectue des requêtes répétées THEN le système SHALL limiter le taux de requêtes au niveau applicatif

2.21 WHEN un attaquant tente un spam ou DoS THEN le système SHALL bloquer ou ralentir les requêtes excessives

#### 8. Confirmation d'Actions Destructrices

2.22 WHEN un utilisateur supprime un élève THEN le système SHALL demander une confirmation forte (modal avec saisie de texte ou re-authentification)

2.23 WHEN une action destructrice critique est effectuée THEN le système SHALL demander une re-authentification

#### 9. Logs et Messages d'Erreur en Production

2.24 WHEN l'application s'exécute en production THEN le système SHALL désactiver ou minimiser les logs console

2.25 WHEN une erreur Supabase se produit THEN le système SHALL logger uniquement des messages génériques côté client et détaillés côté serveur

2.26 WHEN un attaquant inspecte la console THEN le système SHALL ne révéler aucune information sensible sur la structure interne

#### 10. Énumération d'Utilisateurs

2.27 WHEN un utilisateur tente de s'inscrire avec un email déjà utilisé THEN le système SHALL afficher un message générique identique à celui de connexion échouée

2.28 WHEN un utilisateur tente de se connecter avec des identifiants incorrects THEN le système SHALL afficher le même message générique

2.29 WHEN un attaquant teste différents emails THEN le système SHALL empêcher l'énumération via des messages d'erreur uniformes

#### 11. Protection Clickjacking

2.30 WHEN l'application est chargée THEN le système SHALL envoyer X-Frame-Options: DENY ou CSP frame-ancestors 'none'

2.31 WHEN un attaquant tente d'intégrer l'application dans une iframe THEN le système SHALL bloquer le chargement

#### 12. Stockage des Photos

2.32 WHEN une photo est capturée ou uploadée THEN le système SHALL uploader la photo vers Supabase Storage au lieu de la stocker en base64

2.33 WHEN la photo est transmise THEN le système SHALL utiliser une URL Storage avec chiffrement HTTPS et taille optimisée

#### 13. Politique de Rétention et Alertes

2.34 WHEN des logs sont générés THEN le système SHALL définir une politique de rétention conforme RGPD (ex: 90 jours)

2.35 WHEN un comportement anormal se produit THEN le système SHALL générer des alertes (tentatives de connexion échouées répétées, uploads suspects)

#### 14. Audit des Dépendances

2.36 WHEN le projet est construit THEN le système SHALL exécuter `npm audit` automatiquement

2.37 WHEN des vulnérabilités critiques existent THEN le système SHALL bloquer le build et alerter les développeurs

#### 15. Mode Debug et Protection CSRF

2.38 WHEN l'application s'exécute en production THEN le système SHALL désactiver explicitement le mode debug

2.39 WHEN une action côté client est effectuée THEN le système SHALL implémenter une protection CSRF applicative (tokens CSRF)

#### 16. Subresource Integrity (SRI)

2.40 WHEN des ressources externes sont chargées THEN le système SHALL utiliser des attributs `integrity` avec hash SRI

2.41 WHEN une ressource externe est compromise THEN le système SHALL refuser de charger la ressource si le hash ne correspond pas

#### 17. Pipeline CI/CD

2.42 WHEN le code est poussé vers le dépôt THEN le système SHALL déclencher des vérifications de sécurité automatiques (npm audit, SAST, linting)

2.43 WHEN des vulnérabilités sont détectées THEN le système SHALL bloquer le merge/déploiement et notifier les développeurs

---

### Unchanged Behavior (Regression Prevention)

#### Fonctionnalités Existantes à Préserver

3.1 WHEN un utilisateur s'authentifie avec des identifiants valides THEN le système SHALL CONTINUE TO permettre la connexion réussie

3.2 WHEN un utilisateur ajoute un élève avec des données valides THEN le système SHALL CONTINUE TO créer l'élève dans la base de données

3.3 WHEN un utilisateur modifie un élève existant THEN le système SHALL CONTINUE TO mettre à jour les données de l'élève

3.4 WHEN un utilisateur supprime un élève THEN le système SHALL CONTINUE TO supprimer l'élève de la base de données (avec confirmation renforcée)

3.5 WHEN un utilisateur upload une photo valide THEN le système SHALL CONTINUE TO accepter et stocker la photo

3.6 WHEN un utilisateur importe un CSV d'élèves valide THEN le système SHALL CONTINUE TO créer les élèves en masse

3.7 WHEN un utilisateur exporte des cartes en PDF THEN le système SHALL CONTINUE TO générer le PDF correctement

3.8 WHEN un utilisateur configure les informations de l'école THEN le système SHALL CONTINUE TO sauvegarder les paramètres

3.9 WHEN un utilisateur capture une photo via caméra THEN le système SHALL CONTINUE TO capturer et compresser la photo

3.10 WHEN un utilisateur se déconnecte THEN le système SHALL CONTINUE TO terminer la session correctement

#### Performance et UX à Préserver

3.11 WHEN l'application charge les données THEN le système SHALL CONTINUE TO maintenir des temps de chargement acceptables (<3s)

3.12 WHEN un utilisateur interagit avec l'interface THEN le système SHALL CONTINUE TO fournir une expérience fluide et réactive

3.13 WHEN l'application est utilisée sur mobile THEN le système SHALL CONTINUE TO être responsive et utilisable

3.14 WHEN un utilisateur visualise une prévisualisation de carte THEN le système SHALL CONTINUE TO afficher la prévisualisation en temps réel

#### Compatibilité Supabase à Préserver

3.15 WHEN l'application communique avec Supabase Auth THEN le système SHALL CONTINUE TO utiliser les méthodes d'authentification Supabase

3.16 WHEN l'application communique avec Supabase Database THEN le système SHALL CONTINUE TO respecter les politiques RLS existantes

3.17 WHEN l'application communique avec Supabase Storage THEN le système SHALL CONTINUE TO utiliser le bucket `school-assets`

3.18 WHEN les données sont stockées en base THEN le système SHALL CONTINUE TO utiliser le schéma de base de données existant (students, school_info)

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isSecurityVulnerability(X)
  INPUT: X of type ApplicationState
  OUTPUT: boolean
  
  // Returns true when any security vulnerability condition is met
  RETURN (
    // Secrets exposed
    X.envFileCommitted = true OR
    X.geminiKeyInClientBundle = true OR
    
    // Missing validation
    X.serverSideValidation = false OR
    X.jsonSchemaValidation = false OR
    X.fileUploadValidation = "client-only" OR
    
    // Missing security headers
    X.securityHeaders = [] OR
    
    // Missing audit trail
    X.authenticationLogging = false OR
    X.actionAuditTrail = false OR
    
    // GDPR non-compliance
    X.privacyPolicy = null OR
    X.accountDeletionMechanism = false OR
    X.dataExportMechanism = false OR
    X.cookieConsent = false OR
    
    // Storage URLs public
    X.storageUrlType = "public-permanent" OR
    
    // Missing rate limiting
    X.applicationRateLimiting = false OR
    
    // Weak confirmation
    X.destructiveActionConfirmation = "simple-confirm" OR
    
    // Production logs
    X.productionConsoleLogs = true OR
    X.detailedErrorMessages = true OR
    
    // User enumeration
    X.differentErrorMessages = true OR
    
    // Missing clickjacking protection
    X.xFrameOptions = null OR
    
    // Base64 photo storage
    X.photoStorageMethod = "base64-dataurl" OR
    
    // Missing retention policy
    X.logRetentionPolicy = null OR
    
    // Missing dependency audit
    X.dependencyAudit = false OR
    
    // Debug mode in production
    X.debugModeInProduction = true OR
    
    // Missing CSRF protection
    X.csrfProtection = "supabase-only" OR
    
    // Missing SRI
    X.subresourceIntegrity = false OR
    
    // Missing CI/CD security checks
    X.cicdSecurityChecks = false
  )
END FUNCTION
```

### Property Specification - Fix Checking

```pascal
// Property: Security Vulnerabilities Fixed
FOR ALL X WHERE isSecurityVulnerability(X) DO
  result ← applySecurityFixes(X)
  
  ASSERT result.envFileCommitted = false
  ASSERT result.geminiKeyInClientBundle = false
  ASSERT result.serverSideValidation = true
  ASSERT result.jsonSchemaValidation = true
  ASSERT result.fileUploadValidation = "server-side"
  ASSERT result.securityHeaders.length > 0
  ASSERT result.authenticationLogging = true
  ASSERT result.actionAuditTrail = true
  ASSERT result.privacyPolicy ≠ null
  ASSERT result.accountDeletionMechanism = true
  ASSERT result.dataExportMechanism = true
  ASSERT result.cookieConsent = true
  ASSERT result.storageUrlType = "pre-signed"
  ASSERT result.applicationRateLimiting = true
  ASSERT result.destructiveActionConfirmation = "strong"
  ASSERT result.productionConsoleLogs = false
  ASSERT result.detailedErrorMessages = false
  ASSERT result.differentErrorMessages = false
  ASSERT result.xFrameOptions ≠ null
  ASSERT result.photoStorageMethod = "storage-url"
  ASSERT result.logRetentionPolicy ≠ null
  ASSERT result.dependencyAudit = true
  ASSERT result.debugModeInProduction = false
  ASSERT result.csrfProtection = "application-level"
  ASSERT result.subresourceIntegrity = true
  ASSERT result.cicdSecurityChecks = true
  
  // No security vulnerabilities remain
  ASSERT isSecurityVulnerability(result) = false
END FOR
```

### Preservation Goal - Preservation Checking

```pascal
// Property: Existing Functionality Preserved
FOR ALL X WHERE NOT isSecurityVulnerability(X) DO
  // F = original application, F' = fixed application
  ASSERT F'(X).authentication = F(X).authentication
  ASSERT F'(X).studentCRUD = F(X).studentCRUD
  ASSERT F'(X).photoUpload = F(X).photoUpload
  ASSERT F'(X).csvImport = F(X).csvImport
  ASSERT F'(X).pdfExport = F(X).pdfExport
  ASSERT F'(X).schoolSettings = F(X).schoolSettings
  ASSERT F'(X).cameraCapture = F(X).cameraCapture
  ASSERT F'(X).performance ≈ F(X).performance (within 10% tolerance)
  ASSERT F'(X).userExperience = F(X).userExperience
  ASSERT F'(X).supabaseCompatibility = F(X).supabaseCompatibility
END FOR
```

---

## Counterexamples

### Exemple 1: Secrets Exposés dans Git

**Input:**
```typescript
// .env (commité dans Git)
GEMINI_API_KEY="AIzaSyC_REAL_KEY_HERE"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Current Behavior (Bug):**
- Les secrets sont visibles dans l'historique Git
- Un attaquant peut cloner le dépôt et extraire les clés
- Les clés peuvent être utilisées frauduleusement

**Expected Behavior (Fixed):**
- `.env` est dans `.gitignore` et jamais commité
- Les secrets réels sont stockés dans des variables d'environnement sécurisées
- L'historique Git est nettoyé des secrets exposés

### Exemple 2: Validation Serveur Absente

**Input:**
```typescript
// Requête directe à Supabase contournant React
const maliciousData = {
  first_name: "<script>alert('XSS')</script>",
  last_name: "'; DROP TABLE students; --",
  matricule: "A".repeat(10000), // Taille excessive
  birth_date: "invalid-date-format"
};

await supabase.from('students').insert(maliciousData);
```

**Current Behavior (Bug):**
- Les données malformées sont acceptées
- Risque d'injection SQL (atténué par Supabase mais pas éliminé)
- Risque de XSS lors de l'affichage
- Données corrompues dans la base

**Expected Behavior (Fixed):**
- Validation Zod côté serveur rejette les données invalides
- Sanitization des entrées HTML
- Limites de taille appliquées
- Messages d'erreur appropriés retournés

### Exemple 3: GEMINI_API_KEY Exposée Côté Client

**Input:**
```typescript
// vite.config.ts
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
}
```

**Current Behavior (Bug):**
- La clé est injectée dans le bundle JavaScript
- Un attaquant peut extraire la clé via DevTools ou en inspectant le bundle
- La clé peut être utilisée pour consommer le quota Gemini

**Expected Behavior (Fixed):**
- La clé n'est jamais exposée côté client
- Une fonction serverless/edge function gère les appels Gemini
- Le client appelle la fonction serverless qui utilise la clé en backend

### Exemple 4: Headers de Sécurité Manquants

**Input:**
```http
GET / HTTP/1.1
Host: app.example.com
```

**Current Behavior (Bug):**
```http
HTTP/1.1 200 OK
Content-Type: text/html
(aucun header de sécurité)
```

**Expected Behavior (Fixed):**
```http
HTTP/1.1 200 OK
Content-Type: text/html
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Exemple 5: Énumération d'Utilisateurs

**Input:**
```typescript
// Test 1: Email existant
await register("existing@example.com", "password123");
// Réponse: "Un compte avec cet email existe déjà."

// Test 2: Email non existant
await login("nonexistent@example.com", "password123");
// Réponse: "Email ou mot de passe incorrect."
```

**Current Behavior (Bug):**
- Messages différents permettent de déterminer si un email est enregistré
- Un attaquant peut énumérer les emails valides

**Expected Behavior (Fixed):**
- Message uniforme pour inscription et connexion échouées
- Impossible de distinguer si un email existe ou non
- Exemple: "Identifiants incorrects ou compte inexistant"

---

## Summary

Ce document identifie **43 conditions de bug** réparties en **17 catégories de vulnérabilités** de sécurité. La correction de ces vulnérabilités nécessite une approche systématique couvrant:

1. **Gestion des secrets** (3 bugs)
2. **Validation des données** (5 bugs)
3. **Headers de sécurité HTTP** (2 bugs)
4. **Journalisation et audit trail** (3 bugs)
5. **Conformité RGPD** (4 bugs)
6. **Gestion des URLs Storage** (2 bugs)
7. **Rate limiting** (2 bugs)
8. **Confirmation d'actions destructrices** (2 bugs)
9. **Logs en production** (3 bugs)
10. **Énumération d'utilisateurs** (3 bugs)
11. **Protection clickjacking** (2 bugs)
12. **Stockage des photos** (2 bugs)
13. **Politique de rétention et alertes** (2 bugs)
14. **Audit des dépendances** (2 bugs)
15. **Mode debug et CSRF** (2 bugs)
16. **Subresource Integrity** (2 bugs)
17. **Pipeline CI/CD** (2 bugs)

La méthodologie bug condition garantit que:
- **Fix Checking**: Toutes les vulnérabilités sont corrigées pour les inputs concernés
- **Preservation Checking**: Les fonctionnalités existantes restent intactes pour les inputs non concernés
