@echo off
REM Script de publication sur GitHub pour Windows
REM Usage: publier.bat

echo.
echo ========================================
echo Publication sur GitHub
echo Cartes Scolaires Togo
echo ========================================
echo.

REM Vérifier que Git est installé
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Git n'est pas installe
    echo.
    echo Installez Git depuis: https://git-scm.com
    pause
    exit /b 1
)

echo [OK] Git est installe
echo.

REM Vérifier que nous sommes dans un dépôt Git
if not exist .git (
    echo [INFO] Initialisation du depot Git...
    git init
    echo [OK] Depot Git initialise
) else (
    echo [OK] Depot Git deja initialise
)
echo.

REM Vérifier la configuration Git
for /f "delims=" %%i in ('git config user.name') do set gitname=%%i
if "%gitname%"=="" (
    echo [INFO] Configuration Git manquante
    set /p gitname="Votre nom: "
    git config --global user.name "%gitname%"
)

for /f "delims=" %%i in ('git config user.email') do set gitemail=%%i
if "%gitemail%"=="" (
    set /p gitemail="Votre email: "
    git config --global user.email "%gitemail%"
)

echo [OK] Configuration Git:
git config user.name
git config user.email
echo.

REM Vérifier que .env n'est pas tracké
git ls-files --error-unmatch .env >nul 2>&1
if not errorlevel 1 (
    echo [ATTENTION] Le fichier .env est tracke par Git!
    echo [INFO] Suppression du tracking...
    git rm --cached .env
    echo [OK] .env retire du tracking
)
echo.

REM Afficher les fichiers qui seront ajoutés
echo [INFO] Fichiers a ajouter:
git status --short
echo.

REM Demander confirmation
set /p confirm="Voulez-vous continuer? (o/n): "
if /i not "%confirm%"=="o" (
    echo [ANNULE] Publication annulee
    pause
    exit /b 0
)

REM Ajouter tous les fichiers
echo.
echo [INFO] Ajout des fichiers...
git add .
echo [OK] Fichiers ajoutes
echo.

REM Créer le commit
set /p commit_msg="Message du commit (ou Entree pour 'Initial commit'): "
if "%commit_msg%"=="" (
    set commit_msg=Initial commit: Generateur de Cartes Scolaires Togo
)

git commit -m "%commit_msg%"
echo [OK] Commit cree
echo.

REM Vérifier si un remote existe
git remote | findstr origin >nul 2>&1
if not errorlevel 1 (
    echo [OK] Remote 'origin' deja configure
    for /f "delims=" %%i in ('git remote get-url origin') do echo    URL: %%i
) else (
    echo [INFO] Configuration du remote GitHub...
    set /p repo_url="URL du depot GitHub (ex: https://github.com/username/repo.git): "
    git remote add origin "%repo_url%"
    echo [OK] Remote configure
)
echo.

REM Renommer la branche en main si nécessaire
for /f "delims=" %%i in ('git branch --show-current') do set current_branch=%%i
if not "%current_branch%"=="main" (
    echo [INFO] Renommage de la branche en 'main'...
    git branch -M main
    echo [OK] Branche renommee
)
echo.

REM Pousser vers GitHub
echo [INFO] Publication sur GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo [ERREUR] Erreur lors de la publication
    echo.
    echo Solutions possibles:
    echo   1. Verifiez l'URL du depot
    echo   2. Verifiez vos identifiants GitHub
    echo   3. Creez d'abord le depot sur GitHub
    echo.
    echo Consultez PUBLIER_SUR_GITHUB.md pour plus d'aide
    pause
    exit /b 1
)

echo.
echo ========================================
echo Publication reussie!
echo ========================================
echo.
echo Votre projet est maintenant sur GitHub!
echo.
echo Prochaines etapes:
echo   1. Allez sur GitHub et verifiez votre depot
echo   2. Ajoutez une description et des topics
echo   3. Invitez des collaborateurs si necessaire
echo   4. Partagez votre projet!
echo.
pause
