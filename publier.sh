#!/bin/bash

# Script de publication sur GitHub
# Usage: ./publier.sh

echo "🚀 Publication sur GitHub - Cartes Scolaires Togo"
echo "=================================================="
echo ""

# Vérifier que Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé"
    echo "📥 Installez Git: https://git-scm.com"
    exit 1
fi

echo "✅ Git est installé"
echo ""

# Vérifier que nous sommes dans un dépôt Git
if [ ! -d .git ]; then
    echo "📦 Initialisation du dépôt Git..."
    git init
    echo "✅ Dépôt Git initialisé"
else
    echo "✅ Dépôt Git déjà initialisé"
fi
echo ""

# Vérifier la configuration Git
if [ -z "$(git config user.name)" ]; then
    echo "⚠️  Configuration Git manquante"
    read -p "Votre nom: " username
    git config --global user.name "$username"
fi

if [ -z "$(git config user.email)" ]; then
    read -p "Votre email: " useremail
    git config --global user.email "$useremail"
fi

echo "✅ Configuration Git:"
echo "   Nom: $(git config user.name)"
echo "   Email: $(git config user.email)"
echo ""

# Vérifier que .env n'est pas tracké
if git ls-files --error-unmatch .env &> /dev/null; then
    echo "❌ ATTENTION: Le fichier .env est tracké par Git!"
    echo "🔒 Suppression du tracking..."
    git rm --cached .env
    echo "✅ .env retiré du tracking"
fi
echo ""

# Afficher les fichiers qui seront ajoutés
echo "📋 Fichiers à ajouter:"
git status --short
echo ""

# Demander confirmation
read -p "❓ Voulez-vous continuer? (o/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "❌ Publication annulée"
    exit 1
fi

# Ajouter tous les fichiers
echo "📦 Ajout des fichiers..."
git add .
echo "✅ Fichiers ajoutés"
echo ""

# Créer le commit
read -p "💬 Message du commit (ou Entrée pour 'Initial commit'): " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Initial commit: Générateur de Cartes Scolaires Togo"
fi

git commit -m "$commit_message"
echo "✅ Commit créé"
echo ""

# Vérifier si un remote existe
if git remote | grep -q origin; then
    echo "✅ Remote 'origin' déjà configuré"
    remote_url=$(git remote get-url origin)
    echo "   URL: $remote_url"
else
    echo "🔗 Configuration du remote GitHub..."
    read -p "URL du dépôt GitHub (ex: https://github.com/username/repo.git): " repo_url
    git remote add origin "$repo_url"
    echo "✅ Remote configuré"
fi
echo ""

# Renommer la branche en main si nécessaire
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "🔄 Renommage de la branche en 'main'..."
    git branch -M main
    echo "✅ Branche renommée"
fi
echo ""

# Pousser vers GitHub
echo "📤 Publication sur GitHub..."
if git push -u origin main; then
    echo ""
    echo "🎉 ================================"
    echo "🎉 Publication réussie!"
    echo "🎉 ================================"
    echo ""
    echo "🌐 Votre projet est maintenant sur GitHub!"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Allez sur GitHub et vérifiez votre dépôt"
    echo "   2. Ajoutez une description et des topics"
    echo "   3. Invitez des collaborateurs si nécessaire"
    echo "   4. Partagez votre projet!"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de la publication"
    echo ""
    echo "💡 Solutions possibles:"
    echo "   1. Vérifiez l'URL du dépôt"
    echo "   2. Vérifiez vos identifiants GitHub"
    echo "   3. Créez d'abord le dépôt sur GitHub"
    echo ""
    echo "📖 Consultez PUBLIER_SUR_GITHUB.md pour plus d'aide"
    exit 1
fi
