-- ============================================================
-- Schéma Cloudflare D1 (SQLite) — Sukupass Togo / CardSchool
-- Base de données : cartes-scolaires-db
-- Database ID : b7ee819f-2fc9-4342-bd70-bc92a9e84927
-- ============================================================

-- 1. TABLE : users (Comptes d'authentification)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  school_name TEXT NOT NULL DEFAULT '',
  school_type TEXT NOT NULL DEFAULT 'Lycée',
  location TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'school', -- 'school' ou 'admin'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index pour recherche rapide d'utilisateur par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. TABLE : sessions (Sessions actives)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 3. TABLE : school_info (Profil & Configuration de l'établissement)
CREATE TABLE IF NOT EXISTS school_info (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'ÉCOLE NATIONALE DU TOGO',
  logo_url TEXT,
  signature_url TEXT,
  stamp_url TEXT,
  card_colors TEXT NOT NULL DEFAULT '{"headerBg":"#047857","headerText":"#ffffff","footerBar":"#059669","matriculeText":"#065f46"}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_school_info_user_id ON school_info(user_id);

-- 4. TABLE : students (Élèves & Cartes Scolaires)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  gender TEXT,
  matricule TEXT NOT NULL DEFAULT '',
  class_name TEXT NOT NULL DEFAULT '',
  school_year TEXT NOT NULL DEFAULT '',
  birth_date TEXT,
  birth_place TEXT,
  exam_center TEXT,
  expiration_date TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(user_id, class_name);
CREATE INDEX IF NOT EXISTS idx_students_matricule ON students(user_id, matricule);

-- 5. TABLE : platform_settings (Configuration SaaS & Coordonnées Globales)
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  tmoney_number TEXT DEFAULT '+228 90 00 00 00',
  tmoney_holder TEXT DEFAULT 'CardSchool SAS (Togo)',
  flooz_number TEXT DEFAULT '+228 99 00 00 00',
  flooz_holder TEXT DEFAULT 'CardSchool SAS (Togo)',
  annual_price_cfa INTEGER DEFAULT 30000,
  support_email TEXT DEFAULT 'contact@cardschool.tg',
  support_phone TEXT DEFAULT '+228 90 00 00 00',
  whatsapp_number TEXT DEFAULT '+228 90 00 00 00',
  maintenance_mode INTEGER DEFAULT 0,
  broadcast_message TEXT DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insertion de la configuration initiale si non existante
INSERT OR IGNORE INTO platform_settings (id, tmoney_number, flooz_number, annual_price_cfa)
VALUES ('global_config', '+228 91 30 21 38', '+228 99 00 00 00', 30000);
