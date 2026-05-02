# 🚀 Installation de la Base de Données Supabase

## 📋 Prérequis

- Un compte Supabase (gratuit sur https://supabase.com)
- Un projet Supabase créé

## ⚡ Installation Rapide (5 minutes)

### Étape 1: Créer le Projet Supabase

1. Allez sur https://supabase.com
2. Cliquez sur **"New Project"**
3. Remplissez les informations :
   - **Name:** `Cartes Scolaires Togo`
   - **Database Password:** Choisissez un mot de passe fort
   - **Region:** Choisissez la région la plus proche (ex: Frankfurt)
4. Cliquez sur **"Create new project"**
5. Attendez 2-3 minutes que le projet soit créé

### Étape 2: Exécuter le Schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor** (menu de gauche)
2. Cliquez sur **"New Query"**
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. **Copiez tout le contenu** du fichier
5. **Collez-le** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)
7. Attendez quelques secondes

✅ **Résultat attendu :** Vous devriez voir "Success. No rows returned" ou un tableau avec 2 lignes

### Étape 3: Récupérer les Clés API

1. Allez dans **Settings** > **API** (menu de gauche)
2. Copiez les informations suivantes :
   - **Project URL** (commence par `https://`)
   - **anon public** key (commence par `eyJ...`)

### Étape 4: Configurer l'Application

1. Ouvrez le fichier `.env` à la racine du projet
2. Remplacez les valeurs par vos clés :

```env
VITE_SUPABASE_URL="https://VOTRE-PROJET.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

3. Sauvegardez le fichier

### Étape 5: Tester l'Application

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Lancer l'application
npm run dev
```

Ouvrez http://localhost:5173 dans votre navigateur.

## ✅ Vérification

### Vérifier les Tables

1. Dans Supabase, allez dans **Table Editor**
2. Vous devriez voir 2 tables :
   - ✅ `school_info` (8 colonnes)
   - ✅ `students` (13 colonnes)

### Vérifier le Storage

1. Dans Supabase, allez dans **Storage**
2. Vous devriez voir le bucket :
   - ✅ `school-assets` (public)

### Vérifier les Policies

1. Dans Supabase, allez dans **Authentication** > **Policies**
2. Vous devriez voir :
   - ✅ 4 policies pour `school_info`
   - ✅ 4 policies pour `students`
   - ✅ 4 policies pour `storage.objects`

## 🔧 Structure de la Base de Données

### Table: school_info

Stocke les informations de l'école (une ligne par utilisateur).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | ID de l'utilisateur (référence auth.users) |
| `name` | TEXT | Nom de l'école |
| `logo_url` | TEXT | URL du logo |
| `signature_url` | TEXT | URL de la signature |
| `stamp_url` | TEXT | URL du cachet |
| `card_colors` | JSONB | Couleurs de la carte |
| `updated_at` | TIMESTAMPTZ | Date de dernière modification |

### Table: students

Stocke les informations des étudiants.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | ID de l'utilisateur (référence auth.users) |
| `first_name` | TEXT | Prénom |
| `last_name` | TEXT | Nom |
| `matricule` | TEXT | Numéro matricule |
| `class_name` | TEXT | Classe |
| `school_year` | TEXT | Année scolaire |
| `birth_date` | TEXT | Date de naissance |
| `birth_place` | TEXT | Lieu de naissance |
| `exam_center` | TEXT | Centre d'examen |
| `expiration_date` | TEXT | Date d'expiration |
| `photo_url` | TEXT | URL de la photo |
| `qr_code_data` | TEXT | Données du QR code |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de modification |

### Bucket: school-assets

Stocke les fichiers (images) :
- Logos d'école
- Signatures
- Cachets
- Photos d'étudiants

**Structure des dossiers :**
```
school-assets/
  └── {user_id}/
      ├── logos/
      ├── signatures/
      ├── stamps/
      └── photos/
```

## 🔐 Sécurité (Row Level Security)

Toutes les tables utilisent RLS (Row Level Security) :
- ✅ Chaque utilisateur ne peut voir que ses propres données
- ✅ Impossible d'accéder aux données d'un autre utilisateur
- ✅ Les fichiers sont organisés par utilisateur

## 🆘 Dépannage

### Erreur: "relation does not exist"

**Cause :** Les tables n'ont pas été créées.

**Solution :**
1. Retournez dans SQL Editor
2. Réexécutez le script `schema.sql`

### Erreur: "permission denied"

**Cause :** Les policies RLS ne sont pas configurées.

**Solution :**
1. Vérifiez que RLS est activé sur les tables
2. Réexécutez la section "ROW LEVEL SECURITY" du script

### Erreur: "bucket not found"

**Cause :** Le bucket storage n'a pas été créé.

**Solution :**
1. Allez dans Storage
2. Créez manuellement le bucket `school-assets`
3. Cochez "Public bucket"
4. Réexécutez la section "STORAGE BUCKET" du script

### L'application ne se connecte pas

**Vérifications :**
1. ✅ Les clés dans `.env` sont correctes
2. ✅ Le fichier `.env` est à la racine du projet
3. ✅ Vous avez redémarré le serveur de développement après modification du `.env`
4. ✅ Les clés commencent bien par `https://` et `eyJ`

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Guide Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Guide Storage](https://supabase.com/docs/guides/storage)

## ✅ Checklist Complète

- [ ] Projet Supabase créé
- [ ] Script `schema.sql` exécuté avec succès
- [ ] Tables `school_info` et `students` visibles dans Table Editor
- [ ] Bucket `school-assets` visible dans Storage
- [ ] Clés API copiées
- [ ] Fichier `.env` configuré
- [ ] Application lancée avec `npm run dev`
- [ ] Connexion réussie à l'application

---

**🎉 Félicitations !** Votre base de données est prête à l'emploi !
