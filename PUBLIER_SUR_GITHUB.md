# 📤 Guide : Publier sur GitHub

Ce guide vous explique comment publier votre projet sur GitHub étape par étape.

## 🎯 Prérequis

- [ ] Compte GitHub (créez-en un sur [github.com](https://github.com))
- [ ] Git installé sur votre ordinateur
- [ ] Projet prêt à être publié

## 📋 Étapes

### 1. Vérifier que Git est Installé

```bash
git --version
```

Si Git n'est pas installé :
- **Windows:** Téléchargez sur [git-scm.com](https://git-scm.com)
- **Mac:** `brew install git`
- **Linux:** `sudo apt install git`

### 2. Configurer Git (Première Fois)

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@example.com"
```

### 3. Initialiser le Dépôt Local

```bash
# Dans le dossier du projet
git init
```

### 4. Vérifier les Fichiers à Ignorer

Le fichier `.gitignore` est déjà configuré pour exclure :
- ✅ `node_modules/` - Dépendances
- ✅ `.env` - Variables d'environnement (SENSIBLE)
- ✅ `dist/` - Build
- ✅ Fichiers de log

**⚠️ IMPORTANT:** Ne commitez JAMAIS le fichier `.env` !

### 5. Ajouter les Fichiers

```bash
# Ajouter tous les fichiers
git add .

# Vérifier ce qui sera commité
git status
```

Vous devriez voir :
```
✅ README.md
✅ package.json
✅ src/
✅ supabase/
❌ .env (ignoré)
❌ node_modules/ (ignoré)
```

### 6. Créer le Premier Commit

```bash
git commit -m "Initial commit: Générateur de Cartes Scolaires Togo"
```

### 7. Créer le Dépôt sur GitHub

1. Allez sur [github.com](https://github.com)
2. Cliquez sur le **+** en haut à droite
3. Sélectionnez **New repository**
4. Remplissez :
   - **Repository name:** `cartes-scolaires-togo`
   - **Description:** `Application web pour générer des cartes d'identité scolaires au format A4`
   - **Public** ou **Private** (votre choix)
   - ❌ Ne cochez PAS "Initialize with README" (on l'a déjà)
5. Cliquez sur **Create repository**

### 8. Lier le Dépôt Local à GitHub

GitHub vous donnera des commandes. Utilisez celles-ci :

```bash
# Ajouter le remote
git remote add origin https://github.com/votre-username/cartes-scolaires-togo.git

# Renommer la branche en main (si nécessaire)
git branch -M main

# Pousser le code
git push -u origin main
```

### 9. Vérifier sur GitHub

Allez sur `https://github.com/votre-username/cartes-scolaires-togo`

Vous devriez voir :
- ✅ Tous vos fichiers
- ✅ Le README.md affiché
- ✅ Pas de fichier .env
- ✅ Pas de node_modules/

## 🎨 Personnaliser le Dépôt

### Ajouter une Description

1. Allez sur votre dépôt GitHub
2. Cliquez sur ⚙️ à côté de "About"
3. Ajoutez :
   - **Description:** `Application web pour générer des cartes d'identité scolaires`
   - **Website:** URL de démo (si vous en avez une)
   - **Topics:** `react`, `typescript`, `supabase`, `education`, `togo`, `school-cards`

### Ajouter un Badge de Statut

Dans `README.md`, les badges sont déjà présents :
```markdown
![Version](https://img.shields.io/badge/version-2.3-blue)
![React](https://img.shields.io/badge/React-19.0-61dafb)
```

### Activer GitHub Pages (Optionnel)

Pour héberger la documentation :
1. Settings > Pages
2. Source: Deploy from a branch
3. Branch: main / docs
4. Save

## 🔄 Mises à Jour Futures

### Ajouter des Changements

```bash
# Voir les fichiers modifiés
git status

# Ajouter les changements
git add .

# Commiter
git commit -m "feat: ajout nouvelle fonctionnalité"

# Pousser
git push
```

### Créer une Nouvelle Version

```bash
# Créer un tag
git tag -a v2.3.0 -m "Version 2.3.0 - Ajout date d'expiration"

# Pousser le tag
git push origin v2.3.0
```

Sur GitHub, allez dans **Releases** > **Create a new release** pour publier officiellement.

## 🌟 Rendre le Projet Populaire

### 1. README Attractif
- ✅ Badges
- ✅ Captures d'écran
- ✅ Démo en ligne
- ✅ Documentation claire

### 2. Topics/Tags
Ajoutez des topics pertinents :
- `react`
- `typescript`
- `supabase`
- `education`
- `school-management`
- `togo`
- `africa`
- `id-cards`

### 3. Partager
- Twitter/X avec #ReactJS #Supabase
- Reddit (r/reactjs, r/webdev)
- Dev.to
- LinkedIn

### 4. Contribuer à la Communauté
- Répondre aux issues
- Accepter les pull requests
- Maintenir la documentation

## 🔒 Sécurité

### ⚠️ Vérifications Importantes

**Avant de pousser, vérifiez que vous n'avez PAS commité :**
- ❌ Fichier `.env`
- ❌ Clés API Supabase
- ❌ Mots de passe
- ❌ Tokens d'authentification

**Si vous avez accidentellement commité un secret :**

1. **Révoquez immédiatement** la clé sur Supabase
2. **Supprimez l'historique Git** :
```bash
# Supprimer le fichier de l'historique
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (ATTENTION: destructif)
git push origin --force --all
```

3. **Créez de nouvelles clés** sur Supabase

## 📊 Statistiques GitHub

Activez les insights pour voir :
- Nombre de visiteurs
- Clones
- Forks
- Stars

## 🎯 Checklist Finale

Avant de publier, vérifiez :

- [ ] `.gitignore` configuré correctement
- [ ] `.env` n'est PAS dans le dépôt
- [ ] `README.md` complet et à jour
- [ ] `LICENSE` présent
- [ ] `CONTRIBUTING.md` présent
- [ ] Code compilé sans erreur
- [ ] Documentation claire
- [ ] Captures d'écran ajoutées (optionnel)
- [ ] Topics/tags configurés
- [ ] Description du dépôt remplie

## 🆘 Problèmes Courants

### "Permission denied (publickey)"

**Solution:**
```bash
# Utiliser HTTPS au lieu de SSH
git remote set-url origin https://github.com/votre-username/cartes-scolaires-togo.git
```

### "Failed to push some refs"

**Solution:**
```bash
# Récupérer les changements distants
git pull origin main --rebase

# Puis pousser
git push
```

### "Large files detected"

**Solution:**
```bash
# Supprimer les gros fichiers
git rm --cached fichier-lourd.zip

# Ajouter au .gitignore
echo "fichier-lourd.zip" >> .gitignore

# Recommiter
git commit --amend
```

## 📚 Ressources

- [Documentation Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com)
- [Markdown Guide](https://www.markdownguide.org)
- [Conventional Commits](https://www.conventionalcommits.org)

## ✅ Commandes Récapitulatives

```bash
# Configuration initiale (une fois)
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@example.com"

# Initialisation du projet
git init
git add .
git commit -m "Initial commit"

# Lier à GitHub
git remote add origin https://github.com/votre-username/cartes-scolaires-togo.git
git branch -M main
git push -u origin main

# Mises à jour futures
git add .
git commit -m "description des changements"
git push
```

## 🎉 Félicitations !

Votre projet est maintenant sur GitHub ! 🚀

N'oubliez pas de :
- ⭐ Demander des stars
- 🐛 Gérer les issues
- 🔄 Accepter les contributions
- 📝 Maintenir la documentation

---

**Besoin d'aide ?** Consultez [GitHub Support](https://support.github.com)
