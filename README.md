# 🇹🇬 SukuPass Togo — Générateur & Gestionnaire de Cartes Scolaires

**SukuPass Togo** est une solution SaaS complète et moderne conçue pour les établissements scolaires togolais (Lycées, Collèges, Complexes Scolaires, Écoles Primaires). Elle permet la gestion, la génération instantanée de badges scolaires officiels recto-verso avec codes-barres 128 et QR codes scannables, ainsi que la gestion des abonnements et règlements (Mobile Money & passerelle en ligne).

---

## 🚀 Fonctionnalités Principales

- **Conformité Officielle Togo** : Cartes aux normes standardisées (avec bande tricolore togolaise, en-tête officiel MEPST-TG, cachet et signature de direction).
- **Codes 100% Scannables** : Code-barres standard Code 128 et QR Code lisibles par n'importe quel smartphone ou douchette optique.
- **Impression A4 Optimisée** : Agencement automatique de **10 cartes par feuille A4** sans dépassement ni décalage de marge.
- **Import / Export CSV Intelligent** : Importation en masse des listes d'élèves avec détection automatique des colonnes (Nom, Prénoms, Sexe, Date de naissance, Lieu, Classe, Centre d'examen).
- **Console d'Administration Complète** : Supervision des établissements partenaires, modération des reçus, validation des licences PRO, statistiques de fréquentation et journal d'audit.
- **Paiements Multi-Forfaits & Webhooks** :
  - Transfert direct **T-Money** et **Moov Flooz**.
  - Liens de paiement individuels par formule tarifaire (ex: 15 000 FCFA, 30 000 FCFA).
  - Webhook universel (`/api/payment-webhook`) compatible avec PayGate Global, FedaPay, CinetPay, Wave et Stripe pour une activation PRO automatisée.

---

## 🛠️ Stack Technique

- **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Build Tool** : Vite
- **Rendu & Impression** : `qrcode`, `jsbarcode`, `jspdf`, `html2canvas`
- **Backend & Données** : Supabase (PostgreSQL, Authentification, Stockage d'images)
- **API Serverless** : Vercel Serverless Functions (`/api/payment-webhook.js`)

---

## ⚙️ Installation & Démarrage Local

### 1. Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- Compte Supabase avec le schéma configuré

### 2. Cloner le dépôt et installer les dépendances
```bash
git clone https://github.com/Damien-001/G-n-rateur-de-Cartes-Scolaires-Togo.git
cd Cartes-Scolaires-Togo
npm install
```

### 3. Variables d'environnement
Créez un fichier `.env` à la racine en vous basant sur `.env.example` :
```env
VITE_SUPABASE_URL="https://votre-projet.supabase.co"
VITE_SUPABASE_ANON_KEY="votre-cle-anon-publique"
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```

### 5. Compiler pour la production
```bash
npm run build
```

---

## 🔐 Configuration Supabase & Base de Données

Exécutez le script SQL présent dans `supabase/schema.sql` depuis l'éditeur SQL de votre projet Supabase. Ce script initialise :
- `school_info` : Informations de l'école (nom, logo, signature, cachet, statut d'abonnement).
- `students` : Base des élèves avec matricules, classes et informations d'état civil.
- `platform_settings` : Configuration SaaS (numéros Mobile Money, tarifs, webhook secret).
- `admin_logs` : Historique des activations de forfaits et actions d'administration.
- `chat_messages` : Messagerie d'assistance et transmission des reçus de paiement.

---

## 💳 Configuration du Webhook de Paiement

1. Rendez-vous dans votre tableau de bord Administrateur SukuPass > **Paramètres & Contacts**.
2. Copiez l'**URL Webhook** : `https://votre-domaine.com/api/payment-webhook`.
3. Collez cette URL dans l'espace développeur de votre agrégateur (PayGate, FedaPay, etc.).
4. Dans l'onglet **Tarifs Vitrine**, définissez le lien de paiement propre à chaque forfait.

---

## 🛡️ Sécurité & Confidentialité

- Aucun mot de passe ni clé secrète n'est commité dans le code source.
- Les fichiers `.env` sont ignorés par Git.
- Les données sensibles dans les journaux d'erreurs sont assainies via `src/lib/logger.ts`.

---

## 📄 Licence

Propriété de l'établissement et de l'éditeur de SukuPass Togo. Tous droits réservés.
