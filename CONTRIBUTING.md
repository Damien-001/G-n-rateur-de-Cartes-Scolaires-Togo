# Guide de Contribution

Merci de votre intérêt pour contribuer au Générateur de Cartes Scolaires Togo ! 🎉

## 🚀 Comment Contribuer

### 1. Fork et Clone

```bash
# Fork le projet sur GitHub
# Puis clonez votre fork
git clone https://github.com/votre-username/cartes-scolaires-togo.git
cd cartes-scolaires-togo
```

### 2. Créer une Branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

**Convention de nommage des branches :**
- `feature/` - Nouvelles fonctionnalités
- `fix/` - Corrections de bugs
- `docs/` - Documentation
- `refactor/` - Refactoring
- `test/` - Tests

### 3. Développer

```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Vérifier le code
npm run lint
```

### 4. Committer

**Convention de commit :**
```
type(scope): description courte

Description détaillée (optionnelle)

Fixes #123
```

**Types de commit :**
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation
- `style` - Formatage, point-virgules manquants, etc.
- `refactor` - Refactoring du code
- `test` - Ajout de tests
- `chore` - Maintenance

**Exemples :**
```bash
git commit -m "feat(cards): ajout date d'expiration"
git commit -m "fix(auth): correction timeout connexion"
git commit -m "docs(readme): mise à jour installation"
```

### 5. Push et Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

Puis créez une Pull Request sur GitHub avec :
- Titre clair et descriptif
- Description détaillée des changements
- Captures d'écran si pertinent
- Référence aux issues (#123)

## 📋 Checklist avant PR

- [ ] Le code compile sans erreur (`npm run build`)
- [ ] Le linter passe (`npm run lint`)
- [ ] Les fonctionnalités existantes fonctionnent toujours
- [ ] La documentation est à jour
- [ ] Les commits suivent la convention
- [ ] La branche est à jour avec `main`

## 🎨 Standards de Code

### TypeScript

```typescript
// ✅ Bon
interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export async function fetchStudents(userId: string): Promise<Student[]> {
  // ...
}

// ❌ Mauvais
function fetchStudents(userId) {
  // Pas de types
}
```

### React

```typescript
// ✅ Bon - Composant fonctionnel avec types
interface CardProps {
  student: Student;
  schoolInfo: SchoolInfo;
}

export const Card: React.FC<CardProps> = ({ student, schoolInfo }) => {
  // ...
};

// ✅ Bon - Hooks optimisés
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

const filteredData = useMemo(() => {
  // ...
}, [data]);

// ❌ Mauvais - Pas de mémoïsation
const handleClick = () => {
  // Recréé à chaque render
};
```

### CSS / Tailwind

```tsx
// ✅ Bon - Classes Tailwind organisées
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
  {/* ... */}
</div>

// ❌ Mauvais - Styles inline
<div style={{ display: 'flex', padding: '16px' }}>
  {/* ... */}
</div>
```

## 🐛 Signaler un Bug

Utilisez le [template d'issue](https://github.com/votre-username/cartes-scolaires-togo/issues/new) avec :

1. **Description** - Que se passe-t-il ?
2. **Reproduction** - Comment reproduire le bug ?
3. **Attendu** - Quel devrait être le comportement ?
4. **Environnement** - OS, navigateur, version
5. **Captures d'écran** - Si pertinent

## 💡 Proposer une Fonctionnalité

1. Vérifiez qu'elle n'existe pas déjà
2. Créez une issue avec le label `enhancement`
3. Décrivez :
   - Le problème que ça résout
   - La solution proposée
   - Des alternatives envisagées
   - Des maquettes/exemples si possible

## 📚 Documentation

La documentation est aussi importante que le code !

**Fichiers à mettre à jour :**
- `README.md` - Vue d'ensemble
- `CHANGELOG.md` - Historique des versions
- Commentaires dans le code
- Documentation technique si nécessaire

## 🧪 Tests

Bien que nous n'ayons pas encore de tests automatisés, testez manuellement :

1. **Fonctionnalités de base**
   - Connexion/déconnexion
   - Ajout/modification/suppression d'élève
   - Impression

2. **Cas limites**
   - Champs vides
   - Données invalides
   - Connexion lente

3. **Navigateurs**
   - Chrome
   - Firefox
   - Edge
   - Safari (si possible)

## 🔍 Revue de Code

Toutes les PR sont revues avant merge. Attendez-vous à :

- Questions de clarification
- Suggestions d'amélioration
- Demandes de changements
- Tests supplémentaires

C'est normal et constructif ! 😊

## 🎯 Priorités Actuelles

### Haute Priorité
- [ ] Migration vers Supabase Storage (images)
- [ ] Compression automatique des images
- [ ] Pagination de la liste d'étudiants

### Moyenne Priorité
- [ ] Tests automatisés
- [ ] Mode hors ligne
- [ ] Export Excel

### Basse Priorité
- [ ] Thèmes personnalisés avancés
- [ ] Statistiques
- [ ] Multi-langue

## 📞 Questions ?

- 💬 Discussions GitHub
- 📧 Email: votre-email@example.com
- 🐛 Issues pour les bugs

## 🙏 Merci !

Chaque contribution, petite ou grande, est appréciée ! 🎉

---

**Code de Conduite :** Soyez respectueux, constructif et bienveillant.
