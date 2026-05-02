# 🎓 Générateur de Cartes Scolaires - Togo

Application web moderne pour générer et imprimer des cartes d'identité scolaires au format A4, optimisée pour les établissements scolaires togolais.

![Version](https://img.shields.io/badge/version-2.3-blue)
![React](https://img.shields.io/badge/React-19.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-2.0-3ecf8e)

## ✨ Fonctionnalités

### 🎨 Gestion des Cartes
- ✅ Création et édition de cartes d'identité scolaires
- ✅ Personnalisation des couleurs (8 thèmes prédéfinis)
- ✅ Upload de logo, signature et cachet de l'établissement
- ✅ QR Code automatique pour chaque élève
- ✅ Date d'expiration configurable
- ✅ Aperçu en temps réel

### 📋 Gestion des Élèves
- ✅ Ajout/modification/suppression d'élèves
- ✅ Import/export CSV pour gestion en masse
- ✅ Recherche et filtrage
- ✅ Sélection multiple pour impression
- ✅ Photos des élèves

### 🖨️ Impression
- ✅ Mise en page A4 optimisée (10 cartes par page)
- ✅ Marques de découpe automatiques
- ✅ Export PDF
- ✅ Aperçu avant impression

### 🔐 Sécurité
- ✅ Authentification Supabase
- ✅ Données isolées par utilisateur
- ✅ Déconnexion automatique après inactivité
- ✅ Gestion sécurisée des sessions

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ et npm
- Compte Supabase (gratuit)

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/cartes-scolaires-togo.git
cd cartes-scolaires-togo
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer Supabase**

Créez un fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

Pour obtenir ces valeurs :
- Allez sur [Supabase Dashboard](https://app.supabase.com)
- Créez un nouveau projet
- Allez dans **Settings** > **API**
- Copiez **Project URL** et **anon public**

4. **Initialiser la base de données**

Dans Supabase Dashboard > SQL Editor, exécutez :
```sql
-- Fichier: supabase/schema.sql
-- Copiez et exécutez le contenu complet
```

5. **Lancer l'application**
```bash
npm run dev
```

Ouvrez http://localhost:3000

## 📁 Structure du Projet

```
cartes-scolaires-togo/
├── src/
│   ├── components/          # Composants React
│   │   ├── AuthPage.tsx     # Page de connexion
│   │   ├── StudentForm.tsx  # Formulaire élève
│   │   ├── IDCard.tsx       # Carte d'identité
│   │   ├── PrintLayout.tsx  # Mise en page impression
│   │   └── ...
│   ├── lib/                 # Utilitaires
│   │   ├── auth.ts          # Authentification
│   │   ├── db.ts            # Requêtes base de données
│   │   └── supabase.ts      # Client Supabase
│   ├── App.tsx              # Composant principal
│   └── main.tsx             # Point d'entrée
├── supabase/                # Migrations SQL
│   ├── schema.sql           # Schéma complet
│   └── migration_*.sql      # Migrations
├── public/                  # Fichiers statiques
└── docs/                    # Documentation
```

## 🛠️ Technologies

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Build:** Vite
- **Impression:** QRCode.react, HTML2Canvas
- **Import/Export:** PapaParse (CSV)

## 📖 Documentation

- [Guide de Démarrage](./LIRE_EN_PREMIER.md)
- [Solution Rapide](./SOLUTION_RAPIDE.md) - Résolution des problèmes courants
- [Diagnostic Connexion](./DIAGNOSTIC_CONNEXION.md) - Problèmes de connexion
- [Analyse Performance](./ANALYSE_PERFORMANCE.md) - Optimisations
- [Dépannage](./DEPANNAGE_RAPIDE.md) - Guide de dépannage

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev              # Lancer le serveur de dev

# Production
npm run build            # Compiler pour production
npm run preview          # Prévisualiser le build

# Utilitaires
npm run check-config     # Vérifier la configuration Supabase
npm run lint             # Vérifier le code TypeScript
```

## 🎨 Personnalisation

### Couleurs des Cartes

8 thèmes prédéfinis disponibles :
- Vert (défaut)
- Bleu
- Rouge
- Violet
- Orange
- Ardoise
- Rose
- Cyan

Personnalisation complète via l'interface.

### Format des Cartes

- **Dimensions:** 350px × 198px (85.6mm × 53.98mm)
- **Format papier:** A4 (210mm × 297mm)
- **Cartes par page:** 10 (2 colonnes × 5 lignes)
- **Marges:** Automatiques avec marques de découpe

## 🐛 Résolution de Problèmes

### Chargement Lent (>15 secondes)

**Cause:** Images base64 lourdes stockées dans la base de données

**Solution:** Consultez [ANALYSE_PERFORMANCE.md](./ANALYSE_PERFORMANCE.md) pour migrer vers Supabase Storage

### Erreur de Connexion

**Vérification rapide:**
```bash
npm run check-config
```

Consultez [DIAGNOSTIC_CONNEXION.md](./DIAGNOSTIC_CONNEXION.md) pour plus de détails.

### Problèmes d'Impression

1. Utilisez Chrome ou Edge (meilleure compatibilité)
2. Paramètres d'impression :
   - Format : A4
   - Orientation : Portrait
   - Marges : Aucune ou Par défaut
   - Échelle : 100%
   - Graphiques d'arrière-plan : Activés

## 📊 Performance

### Métriques Cibles

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Temps de chargement | <3s | Varie* |
| Taille des données | <1MB | Varie* |
| Cartes par page | 10 | ✅ |
| Temps d'impression | <5s | ✅ |

*Dépend du nombre d'étudiants et de la taille des images

### Outil de Mesure

Ouvrez `mesurer-performance.html` dans votre navigateur pour mesurer les performances de votre installation.

## 🔐 Sécurité

- ✅ Authentification requise pour toutes les opérations
- ✅ Row Level Security (RLS) activé sur Supabase
- ✅ Données isolées par utilisateur
- ✅ Variables d'environnement pour les secrets
- ✅ Déconnexion automatique après 10 minutes d'inactivité

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrez une Pull Request

## 📝 Changelog

### Version 2.3 (2026-05-02)
- ✅ Ajout date d'expiration des cartes
- ✅ Optimisations de performance (React.memo, useCallback, useMemo)
- ✅ Timeouts configurables pour connexions lentes
- ✅ Amélioration des messages d'erreur
- ✅ Documentation complète

### Version 2.2
- ✅ Upload de cachet et signature
- ✅ Personnalisation des couleurs
- ✅ Export PDF

### Version 2.1
- ✅ Import/Export CSV
- ✅ Sélection multiple
- ✅ Recherche et filtrage

### Version 2.0
- ✅ Migration vers Supabase
- ✅ Authentification
- ✅ Gestion multi-utilisateurs

## 📄 Licence

MIT License - Voir [LICENSE](./LICENSE) pour plus de détails

## 👥 Auteurs

- **Développeur Principal** - [Votre Nom](https://github.com/votre-username)

## 🙏 Remerciements

- [Supabase](https://supabase.com) - Backend as a Service
- [React](https://react.dev) - Framework UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS
- [Vite](https://vitejs.dev) - Build tool

## 📞 Support

- 📧 Email: votre-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/votre-username/cartes-scolaires-togo/issues)
- 📖 Documentation: [Wiki](https://github.com/votre-username/cartes-scolaires-togo/wiki)

## 🌟 Étoiles

Si ce projet vous a été utile, n'hésitez pas à lui donner une étoile ⭐ !

---

**Fait avec ❤️ pour les établissements scolaires du Togo**
