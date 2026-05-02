#!/usr/bin/env node

/**
 * Script de vérification de la configuration Supabase
 * Exécutez: node verifier-config.js
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Vérification de la configuration Supabase...\n');

// Vérifier si .env existe
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.error('❌ ERREUR: Le fichier .env n\'existe pas !');
  console.log('\n📝 Créez un fichier .env à la racine du projet avec :');
  console.log('VITE_SUPABASE_URL=https://votre-projet.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=votre-clé-anon\n');
  process.exit(1);
}

// Lire le fichier .env
const envContent = readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let supabaseUrl = null;
let supabaseKey = null;

// Parser le fichier .env
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('VITE_SUPABASE_URL')) {
    supabaseUrl = trimmed.split('=')[1]?.replace(/['"]/g, '').trim();
  }
  if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY')) {
    supabaseKey = trimmed.split('=')[1]?.replace(/['"]/g, '').trim();
  }
}

console.log('📋 Configuration trouvée:\n');

// Vérifier VITE_SUPABASE_URL
console.log('1️⃣  VITE_SUPABASE_URL:');
if (!supabaseUrl) {
  console.log('   ❌ NON DÉFINIE');
} else if (supabaseUrl === 'https://your-project.supabase.co') {
  console.log('   ❌ VALEUR PAR DÉFAUT (non configurée)');
  console.log('   📝 Remplacez par votre vraie URL Supabase');
} else if (!supabaseUrl.startsWith('https://')) {
  console.log('   ❌ FORMAT INVALIDE (doit commencer par https://)');
} else if (!supabaseUrl.endsWith('.supabase.co')) {
  console.log('   ❌ FORMAT INVALIDE (doit se terminer par .supabase.co)');
} else {
  console.log('   ✅ ' + supabaseUrl);
}

// Vérifier VITE_SUPABASE_ANON_KEY
console.log('\n2️⃣  VITE_SUPABASE_ANON_KEY:');
if (!supabaseKey) {
  console.log('   ❌ NON DÉFINIE');
} else if (supabaseKey === 'your-anon-key') {
  console.log('   ❌ VALEUR PAR DÉFAUT (non configurée)');
  console.log('   📝 Remplacez par votre vraie clé Supabase');
} else if (supabaseKey.length < 100) {
  console.log('   ❌ TROP COURTE (devrait faire >100 caractères)');
} else if (!supabaseKey.startsWith('eyJ')) {
  console.log('   ⚠️  FORMAT INHABITUEL (devrait commencer par eyJ)');
  console.log('   ✅ Longueur: ' + supabaseKey.length + ' caractères');
} else {
  console.log('   ✅ ' + supabaseKey.substring(0, 30) + '... (' + supabaseKey.length + ' caractères)');
}

// Résumé
console.log('\n' + '='.repeat(60));
const urlOk = supabaseUrl && 
              supabaseUrl !== 'https://your-project.supabase.co' && 
              supabaseUrl.startsWith('https://') && 
              supabaseUrl.endsWith('.supabase.co');

const keyOk = supabaseKey && 
              supabaseKey !== 'your-anon-key' && 
              supabaseKey.length > 100;

if (urlOk && keyOk) {
  console.log('✅ Configuration Supabase VALIDE');
  console.log('\n💡 Si vous avez toujours des problèmes de connexion:');
  console.log('   1. Redémarrez le serveur (Ctrl+C puis npm run dev)');
  console.log('   2. Videz le cache du navigateur');
  console.log('   3. Vérifiez votre connexion internet');
  console.log('   4. Vérifiez le statut: https://status.supabase.com');
} else {
  console.log('❌ Configuration Supabase INVALIDE');
  console.log('\n📝 Pour corriger:');
  console.log('   1. Allez sur https://app.supabase.com');
  console.log('   2. Sélectionnez votre projet');
  console.log('   3. Allez dans Settings > API');
  console.log('   4. Copiez "Project URL" et "anon public"');
  console.log('   5. Mettez à jour votre fichier .env');
  console.log('   6. Redémarrez le serveur (Ctrl+C puis npm run dev)');
}

console.log('='.repeat(60) + '\n');
