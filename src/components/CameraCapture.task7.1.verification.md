# Vérification Tâche 7.1 : Add camera switching functionality

## Date
2024

## Statut
❌ **INCOMPLET - Nécessite correction**

## Critères de la Tâche

### Objectif
Permettre aux utilisateurs mobiles de basculer entre la caméra avant et la caméra arrière.

### Requirements Associés
- 9.4: Bouton pour basculer entre caméras avant/arrière sur mobile

## Vérification de l'Implémentation

### 1. Créer la méthode `switchCamera()`
**Localisation:** `src/components/CameraCapture.tsx`, lignes 237-247

```typescript
const switchCamera = () => {
  stopCamera();
  setState(prev => ({
    ...prev,
    facingMode: prev.facingMode === 'user' ? 'environment' : 'user'
  }));
  // Re-initialize with new facing mode
  setTimeout(() => {
    initializeCamera();
  }, 100);
};
```

✅ **Vérifié:** La méthode existe et suit la structure attendue.

### 2. Arrêter le stream actuel
**Localisation:** Ligne 238

```typescript
stopCamera();
```

✅ **Vérifié:** Le stream actuel est correctement arrêté avant de demander un nouveau stream.

### 3. Demander un nouveau stream avec `facingMode` opposé
**Localisation:** Lignes 75-81 (dans `initializeCamera()`)

```typescript
const constraints: MediaStreamConstraints = {
  video: {
    facingMode: state.facingMode,  // ❌ PROBLÈME ICI
    width: { ideal: 1280 },
    height: { ideal: 1280 }
  },
  audio: false
};
```

❌ **PROBLÈME IDENTIFIÉ:** 

La méthode `initializeCamera()` utilise `state.facingMode` pour construire les contraintes, mais à cause de la nature asynchrone de `setState`, le state n'est pas encore mis à jour au moment où `initializeCamera()` est appelé dans le `setTimeout`.

**Séquence actuelle (incorrecte):**
1. `switchCamera()` est appelé
2. `stopCamera()` arrête le stream
3. `setState()` est appelé pour changer `facingMode` (asynchrone)
4. `setTimeout()` planifie l'appel à `initializeCamera()` dans 100ms
5. `initializeCamera()` est appelé **avant** que le state soit mis à jour
6. Les contraintes utilisent l'**ancien** `facingMode`
7. La même caméra est réinitialisée au lieu de basculer

### 4. Mettre à jour l'état `facingMode`
**Localisation:** Lignes 239-242

```typescript
setState(prev => ({
  ...prev,
  facingMode: prev.facingMode === 'user' ? 'environment' : 'user'
}));
```

✅ **Vérifié:** Le state est mis à jour correctement, mais pas utilisé correctement par `initializeCamera()`.

## Conformité aux Requirements

### Requirement 9.4
> THE Camera_Capture_Component SHALL provide a button to switch between front and rear cameras on mobile

⚠️ **Partiellement conforme:** Le bouton existe (lignes 297-305), mais la fonctionnalité de basculement ne fonctionne pas correctement à cause du problème de synchronisation du state.

## Analyse du Problème

### Problème de Race Condition

Le problème est un **race condition** classique avec React state updates :

```typescript
// État actuel: facingMode = 'user'

switchCamera();
  ↓
stopCamera();  // ✅ OK
  ↓
setState({ facingMode: 'environment' });  // ⏳ Asynchrone, pas encore appliqué
  ↓
setTimeout(() => {
  initializeCamera();  // ❌ Utilise state.facingMode = 'user' (ancien)
}, 100);
```

### Pourquoi le setTimeout ne résout pas le problème

Le `setTimeout` de 100ms ne garantit pas que le state sera mis à jour, car :
1. Les mises à jour de state React sont batchées
2. Le timing de 100ms est arbitraire et ne correspond pas au cycle de mise à jour de React
3. React peut retarder les mises à jour de state pour des raisons de performance

## Solutions Proposées

### Solution 1 : Passer le facingMode en paramètre (Recommandée)

Modifier `initializeCamera()` pour accepter un paramètre optionnel :

```typescript
const initializeCamera = async (newFacingMode?: 'user' | 'environment') => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setState(prev => ({ ...prev, error: 'not-supported' }));
    return;
  }

  const targetFacingMode = newFacingMode || state.facingMode;

  setState(prev => ({ ...prev, isInitializing: true, error: null }));

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: targetFacingMode,  // ✅ Utilise le paramètre
        width: { ideal: 1280 },
        height: { ideal: 1280 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    setState(prev => ({
      ...prev,
      stream,
      isInitializing: false,
      isCameraActive: true,
      error: null,
      facingMode: targetFacingMode  // ✅ Met à jour le state avec la valeur utilisée
    }));
  } catch (error) {
    console.error('Camera error:', error);
    handleCameraError(error as Error);
  }
};

const switchCamera = () => {
  stopCamera();
  const newFacingMode = state.facingMode === 'user' ? 'environment' : 'user';
  setTimeout(() => {
    initializeCamera(newFacingMode);  // ✅ Passe le nouveau facingMode
  }, 100);
};
```

**Avantages:**
- ✅ Résout le problème de race condition
- ✅ Code plus explicite et prévisible
- ✅ Pas de dépendance sur le timing de React state updates
- ✅ Facile à tester

### Solution 2 : Utiliser useEffect avec dépendance

Utiliser un effet pour réagir aux changements de `facingMode` :

```typescript
const [shouldReinitialize, setShouldReinitialize] = useState(false);

useEffect(() => {
  if (shouldReinitialize) {
    initializeCamera();
    setShouldReinitialize(false);
  }
}, [state.facingMode, shouldReinitialize]);

const switchCamera = () => {
  stopCamera();
  setState(prev => ({
    ...prev,
    facingMode: prev.facingMode === 'user' ? 'environment' : 'user'
  }));
  setShouldReinitialize(true);
};
```

**Inconvénients:**
- ❌ Plus complexe
- ❌ Ajoute un state supplémentaire
- ❌ Peut causer des effets de bord non désirés

### Solution 3 : Utiliser setState callback (Déprécié en React 18+)

```typescript
// ❌ Ne fonctionne plus avec les hooks modernes
setState(
  prev => ({ ...prev, facingMode: newFacingMode }),
  () => initializeCamera()  // Callback après mise à jour
);
```

**Note:** Cette approche ne fonctionne pas avec `useState` hooks.

## Recommandation

**Implémenter la Solution 1** car elle est :
- Simple et directe
- Facile à comprendre et maintenir
- Testable
- Sans effets de bord
- Compatible avec tous les navigateurs

## Tests Recommandés

### Tests Manuels (Après correction)

1. **Test basculement front → rear:**
   - Ouvrir l'application sur mobile
   - Activer le mode caméra (caméra avant par défaut)
   - Cliquer sur le bouton de basculement
   - Vérifier que la caméra arrière s'active

2. **Test basculement rear → front:**
   - Avec la caméra arrière active
   - Cliquer sur le bouton de basculement
   - Vérifier que la caméra avant s'active

3. **Test basculements multiples:**
   - Basculer plusieurs fois entre les caméras
   - Vérifier qu'il n'y a pas de fuite mémoire
   - Vérifier que chaque basculement fonctionne

4. **Test capture après basculement:**
   - Basculer vers la caméra arrière
   - Capturer une photo
   - Vérifier que la photo est correctement capturée

### Tests Unitaires (Recommandés)

```typescript
describe('CameraCapture - Camera Switching', () => {
  it('should switch from user to environment camera', async () => {
    // Render component with user camera
    // Click switch button
    // Verify getUserMedia is called with facingMode: 'environment'
    // Verify state.facingMode is updated to 'environment'
  });

  it('should switch from environment to user camera', async () => {
    // Render component with environment camera
    // Click switch button
    // Verify getUserMedia is called with facingMode: 'user'
    // Verify state.facingMode is updated to 'user'
  });

  it('should stop current stream before switching', async () => {
    // Start camera
    // Click switch button
    // Verify all tracks are stopped before new stream is requested
  });

  it('should handle errors during camera switch', async () => {
    // Mock getUserMedia to fail on second call
    // Click switch button
    // Verify error is displayed
    // Verify fallback is offered
  });
});
```

## Conclusion

La tâche 7.1 est **incomplète** et nécessite une correction pour fonctionner correctement :

- ✅ La méthode `switchCamera()` existe
- ✅ Le stream actuel est arrêté
- ❌ **Le nouveau stream n'utilise pas le bon `facingMode`** (race condition)
- ⚠️ Le state `facingMode` est mis à jour mais pas utilisé correctement

**Action requise:** Implémenter la Solution 1 (passer `facingMode` en paramètre à `initializeCamera()`) pour résoudre le problème de race condition.

Une fois corrigé, la fonctionnalité sera complète et conforme au requirement 9.4.
