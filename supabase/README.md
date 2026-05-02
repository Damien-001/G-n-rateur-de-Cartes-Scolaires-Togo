# 📁 Dossier Supabase

Ce dossier contient tous les fichiers nécessaires pour configurer la base de données Supabase.

## 📄 Fichiers

### `schema.sql` ⭐ FICHIER PRINCIPAL

**Description :** Schéma SQL complet pour créer toute la base de données.

**Contenu :**
- ✅ 2 tables (`school_info`, `students`)
- ✅ Index pour les performances
- ✅ Row Level Security (RLS) avec policies
- ✅ Storage bucket pour les images
- ✅ Vérifications automatiques

**Utilisation :**
1. Ouvrez Supabase Dashboard > SQL Editor
2. Créez une nouvelle requête
3. Copiez-collez tout le contenu de `schema.sql`
4. Exécutez (Run)

**Quand l'utiliser :**
- ✅ Nouvelle installation
- ✅ Réinitialisation complète de la base
- ✅ Migration vers un nouveau projet Supabase

### `INSTALLATION.md` 📖 GUIDE D'INSTALLATION

**Description :** Guide complet pas à pas pour installer la base de données.

**Contenu :**
- Instructions détaillées
- Captures d'écran recommandées
- Vérifications à effectuer
- Dépannage des erreurs courantes

**Pour qui :**
- Débutants avec Supabase
- Première installation
- Besoin d'aide détaillée

## 🗂️ Structure de la Base de Données

```
Supabase Project
│
├── Tables (Database)
│   ├── school_info (Infos école)
│   │   ├── id (UUID)
│   │   ├── user_id (UUID) → auth.users
│   │   ├── name (TEXT)
│   │   ├── logo_url (TEXT)
│   │   ├── signature_url (TEXT)
│   │   ├── stamp_url (TEXT)
│   │   ├── card_colors (JSONB)
│   │   └── updated_at (TIMESTAMPTZ)
│   │
│   └── students (Étudiants)
│       ├── id (UUID)
│       ├── user_id (UUID) → auth.users
│       ├── first_name (TEXT)
│       ├── last_name (TEXT)
│       ├── matricule (TEXT)
│       ├── class_name (TEXT)
│       ├── school_year (TEXT)
│       ├── birth_date (TEXT)
│       ├── birth_place (TEXT)
│       ├── exam_center (TEXT)
│       ├── expiration_date (TEXT)
│       ├── photo_url (TEXT)
│       ├── qr_code_data (TEXT)
│       ├── created_at (TIMESTAMPTZ)
│       └── updated_at (TIMESTAMPTZ)
│
└── Storage
    └── school-assets (Bucket public)
        └── {user_id}/
            ├── logos/
            ├── signatures/
            ├── stamps/
            └── photos/
```

## 🔐 Sécurité (Row Level Security)

Toutes les données sont protégées par RLS :

### Policies school_info
- ✅ `Users can view own school_info` (SELECT)
- ✅ `Users can insert own school_info` (INSERT)
- ✅ `Users can update own school_info` (UPDATE)
- ✅ `Users can delete own school_info` (DELETE)

### Policies students
- ✅ `Users can view own students` (SELECT)
- ✅ `Users can insert own students` (INSERT)
- ✅ `Users can update own students` (UPDATE)
- ✅ `Users can delete own students` (DELETE)

### Policies storage.objects
- ✅ `Users can upload own assets` (INSERT)
- ✅ `Users can update own assets` (UPDATE)
- ✅ `Users can delete own assets` (DELETE)
- ✅ `Public can view assets` (SELECT)

**Principe :** Chaque utilisateur ne peut accéder qu'à ses propres données.

## 🚀 Installation Rapide

```bash
# 1. Créer un projet sur https://supabase.com

# 2. Exécuter le schéma SQL
# → Copier le contenu de schema.sql
# → Coller dans SQL Editor
# → Run

# 3. Récupérer les clés API
# → Settings > API
# → Copier Project URL et anon key

# 4. Configurer .env
VITE_SUPABASE_URL="https://votre-projet.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."

# 5. Lancer l'app
npm run dev
```

## 📊 Données de Test (Optionnel)

Pour tester rapidement l'application, vous pouvez insérer des données de test :

```sql
-- Insérer une école de test (remplacez USER_ID par votre ID)
INSERT INTO public.school_info (user_id, name)
VALUES ('USER_ID', 'École Primaire de Lomé');

-- Insérer un étudiant de test
INSERT INTO public.students (
  user_id, first_name, last_name, matricule, 
  class_name, school_year, birth_date, birth_place
)
VALUES (
  'USER_ID', 'Kofi', 'MENSAH', 'ETU-2024-001',
  'CM2', '2024-2025', '15/03/2012', 'Lomé'
);
```

**Note :** Remplacez `USER_ID` par votre ID utilisateur (visible dans Authentication > Users).

## 🔄 Mises à Jour Futures

Si des modifications sont apportées au schéma :

1. **Nouvelle installation :** Utilisez toujours `schema.sql` (version complète)
2. **Base existante :** Des fichiers de migration seront fournis si nécessaire

## 🆘 Problèmes Courants

### "relation does not exist"
→ Les tables n'ont pas été créées. Réexécutez `schema.sql`.

### "permission denied"
→ RLS est activé mais les policies manquent. Réexécutez la section RLS de `schema.sql`.

### "bucket not found"
→ Le bucket storage n'existe pas. Réexécutez la section STORAGE de `schema.sql`.

### "authentication failed"
→ Vérifiez vos clés dans `.env` et redémarrez le serveur.

## 📚 Documentation

- [Guide d'installation complet](./INSTALLATION.md)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide RLS](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Checklist

Avant de commencer à utiliser l'application :

- [ ] Projet Supabase créé
- [ ] `schema.sql` exécuté avec succès
- [ ] Tables visibles dans Table Editor
- [ ] Bucket `school-assets` créé
- [ ] Clés API récupérées
- [ ] `.env` configuré
- [ ] Application testée

---

**Version :** 2.3.0  
**Dernière mise à jour :** 2026-05-02
