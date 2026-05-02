# 🔒 Résoudre l'Erreur 403 - Permission Denied

## ❌ Erreur Rencontrée

```
remote: Permission denied to lipsgallagher001-tech
fatal: unable to access 'https://github.com/Damien-001/...': 403
```

## 🔍 Cause

Git utilise les identifiants de `lipsgallagher001-tech` au lieu de `Damien-001` pour accéder au dépôt.

## ✅ Solutions

### Solution 1: Mettre à Jour les Identifiants Windows

**Windows Credential Manager:**

1. Appuyez sur `Windows + R`
2. Tapez `control /name Microsoft.CredentialManager`
3. Cliquez sur **Informations d'identification Windows**
4. Cherchez `git:https://github.com`
5. Cliquez sur **Modifier** ou **Supprimer**
6. Entrez vos identifiants `Damien-001`

**Ou via PowerShell:**
```powershell
# Supprimer les anciennes identifications
git credential-manager-core erase https://github.com

# Au prochain push, Git demandera vos identifiants
git push
```

### Solution 2: Utiliser un Token Personnel (Recommandé)

1. **Créer un Token sur GitHub:**
   - Allez sur https://github.com/settings/tokens
   - Cliquez sur **Generate new token** > **Generate new token (classic)**
   - Nom: `Cartes Scolaires Togo`
   - Cochez: `repo` (accès complet aux dépôts)
   - Cliquez sur **Generate token**
   - **COPIEZ LE TOKEN** (vous ne le reverrez plus !)

2. **Utiliser le Token:**
```bash
# Configurer l'URL avec le token
git remote set-url origin https://Damien-001:VOTRE_TOKEN@github.com/Damien-001/G-n-rateur-de-Cartes-Scolaires-Togo.git

# Pousser
git push
```

### Solution 3: Utiliser SSH (Plus Sécurisé)

1. **Générer une clé SSH:**
```bash
ssh-keygen -t ed25519 -C "votre-email@example.com"
# Appuyez sur Entrée pour accepter l'emplacement par défaut
# Entrez un mot de passe (optionnel)
```

2. **Ajouter la clé à GitHub:**
```bash
# Copier la clé publique
cat ~/.ssh/id_ed25519.pub
# Ou sur Windows:
type %USERPROFILE%\.ssh\id_ed25519.pub
```

3. Sur GitHub:
   - Allez sur https://github.com/settings/keys
   - Cliquez sur **New SSH key**
   - Collez votre clé publique
   - Cliquez sur **Add SSH key**

4. **Changer l'URL du remote:**
```bash
git remote set-url origin git@github.com:Damien-001/G-n-rateur-de-Cartes-Scolaires-Togo.git
git push
```

### Solution 4: Pousser avec Identifiants Explicites

```bash
# Pousser en spécifiant l'utilisateur
git push https://Damien-001@github.com/Damien-001/G-n-rateur-de-Cartes-Scolaires-Togo.git main

# Git demandera le mot de passe ou token
```

## 🎯 Solution Rapide (Recommandée)

**Utiliser un Token Personnel:**

```bash
# 1. Créer un token sur GitHub (voir ci-dessus)

# 2. Configurer Git avec le token
git remote set-url origin https://Damien-001:ghp_VOTRE_TOKEN_ICI@github.com/Damien-001/G-n-rateur-de-Cartes-Scolaires-Togo.git

# 3. Pousser
git push
```

⚠️ **IMPORTANT:** Ne partagez JAMAIS votre token !

## 🔐 Sécurité

### Stocker le Token de Manière Sécurisée

**Option 1: Git Credential Manager (Recommandé)**
```bash
# Installer Git Credential Manager
# Déjà inclus avec Git for Windows

# Configurer
git config --global credential.helper manager-core

# Au prochain push, Git stockera le token de manière sécurisée
git push
```

**Option 2: Fichier .netrc (Linux/Mac)**
```bash
# Créer le fichier
nano ~/.netrc

# Ajouter:
machine github.com
login Damien-001
password ghp_VOTRE_TOKEN
```

## 📝 Vérifier la Configuration

```bash
# Vérifier l'URL du remote
git remote -v

# Vérifier l'utilisateur Git
git config user.name
git config user.email

# Tester la connexion
git ls-remote origin
```

## ✅ Après Résolution

Une fois le problème résolu, poussez vos changements :

```bash
git push
```

Vous devriez voir :
```
Enumerating objects: 40, done.
Counting objects: 100% (40/40), done.
...
To https://github.com/Damien-001/G-n-rateur-de-Cartes-Scolaires-Togo.git
   abc1234..def5678  main -> main
```

## 🆘 Toujours Bloqué ?

### Vérifier les Permissions du Dépôt

1. Allez sur https://github.com/Damien-001/G-n-rateur-de-Cartes-Scolaires-Togo
2. Vérifiez que vous êtes bien connecté comme `Damien-001`
3. Vérifiez que vous avez les droits d'écriture

### Créer un Nouveau Dépôt

Si le dépôt appartient à quelqu'un d'autre :

1. **Fork le dépôt** sur votre compte
2. **Cloner votre fork:**
```bash
git remote set-url origin https://github.com/VOTRE-USERNAME/G-n-rateur-de-Cartes-Scolaires-Togo.git
git push
```

## 📞 Support

Si rien ne fonctionne :
1. Vérifiez que vous êtes connecté au bon compte GitHub
2. Vérifiez que le dépôt existe
3. Vérifiez vos permissions sur le dépôt
4. Contactez le propriétaire du dépôt si nécessaire

---

**Résumé:** Utilisez un Token Personnel GitHub et configurez-le dans l'URL du remote pour résoudre l'erreur 403.
