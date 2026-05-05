# Requirements Document - Capture Photo par Caméra

## Introduction

Cette fonctionnalité permet aux utilisateurs de capturer des photos d'élèves directement via la caméra de leur appareil (mobile ou desktop) dans l'application React de génération de cartes scolaires. La fonctionnalité s'intègre au composant StudentForm existant et offre une alternative à l'upload de fichiers, optimisée pour les appareils mobiles (Safari iOS, Chrome Android) et les navigateurs desktop.

## Glossary

- **Camera_Capture_Component**: Le composant React responsable de l'accès à la caméra, de l'affichage du flux vidéo et de la capture d'images
- **Media_Stream**: Le flux vidéo en direct provenant de la caméra de l'appareil via l'API navigator.mediaDevices.getUserMedia()
- **Captured_Photo**: L'image capturée depuis le flux vidéo, convertie en format base64 pour le stockage
- **StudentForm**: Le composant React existant (src/components/StudentForm.tsx) qui gère l'ajout et la modification des élèves
- **Photo_Input_Mode**: Le mode de saisie de photo sélectionné par l'utilisateur (upload de fichier ou capture par caméra)
- **Camera_Permission**: L'autorisation accordée par le navigateur pour accéder à la caméra de l'appareil
- **Image_Compressor**: Le module existant qui optimise la taille des images capturées (ratio 3:4, 300x400px, JPEG 85%)
- **Video_Preview**: L'élément HTML vidéo affichant le flux en direct de la caméra
- **Canvas_Element**: L'élément HTML canvas utilisé pour capturer une frame du flux vidéo
- **Error_Handler**: Le gestionnaire d'erreurs pour les cas d'échec d'accès caméra ou de capture

## Requirements

### Requirement 1: Sélection du Mode de Capture

**User Story:** En tant qu'utilisateur, je veux choisir entre l'upload de fichier et la capture par caméra, afin de pouvoir utiliser la méthode la plus pratique selon mon contexte.

#### Acceptance Criteria

1. THE Camera_Capture_Component SHALL display two distinct options: "Télécharger une photo" and "Prendre une photo"
2. WHEN the user selects "Prendre une photo", THE Camera_Capture_Component SHALL display the camera interface
3. WHEN the user selects "Télécharger une photo", THE Camera_Capture_Component SHALL display the file input interface
4. THE Camera_Capture_Component SHALL allow switching between modes without losing other form data
5. THE Camera_Capture_Component SHALL indicate the currently selected mode with visual feedback

### Requirement 2: Accès à la Caméra

**User Story:** En tant qu'utilisateur, je veux que l'application accède à ma caméra de manière sécurisée, afin de pouvoir capturer des photos directement.

#### Acceptance Criteria

1. WHEN the user activates camera mode, THE Camera_Capture_Component SHALL request camera access using navigator.mediaDevices.getUserMedia()
2. THE Camera_Capture_Component SHALL request video-only access with constraints {video: {facingMode: 'user', width: {ideal: 1280}, height: {ideal: 1280}}}
3. IF Camera_Permission is denied, THEN THE Error_Handler SHALL display a clear message explaining how to enable camera access
4. IF the camera is unavailable, THEN THE Error_Handler SHALL display a fallback message and offer the file upload option
5. THE Camera_Capture_Component SHALL support Safari iOS, Chrome Android, Chrome Desktop, Firefox Desktop, and Edge Desktop

### Requirement 3: Affichage du Flux Vidéo

**User Story:** En tant qu'utilisateur, je veux voir un aperçu en direct de ma caméra, afin de pouvoir cadrer correctement la photo avant de la capturer.

#### Acceptance Criteria

1. WHEN Camera_Permission is granted, THE Video_Preview SHALL display the live camera stream
2. THE Video_Preview SHALL maintain a 3:4 portrait aspect ratio matching the final photo dimensions
3. THE Video_Preview SHALL display at a minimum size of 300x400 pixels on desktop and adapt to screen width on mobile
4. THE Video_Preview SHALL include visual guides (frame overlay) to help users position the subject
5. WHILE the camera is active, THE Video_Preview SHALL update in real-time without lag or freezing

### Requirement 4: Capture de la Photo

**User Story:** En tant qu'utilisateur, je veux capturer une photo via un bouton clairement identifié, afin d'enregistrer l'image au moment optimal.

#### Acceptance Criteria

1. WHILE the Video_Preview is active, THE Camera_Capture_Component SHALL display a "Capturer" button
2. WHEN the user clicks the "Capturer" button, THE Canvas_Element SHALL capture the current video frame
3. THE Canvas_Element SHALL extract the image at 300x400 pixels resolution with 3:4 aspect ratio
4. THE Canvas_Element SHALL convert the captured frame to base64 JPEG format with 85% quality
5. WHEN capture is complete, THE Camera_Capture_Component SHALL stop the Media_Stream and display the Captured_Photo

### Requirement 5: Prévisualisation et Validation

**User Story:** En tant qu'utilisateur, je veux voir la photo capturée avant de la valider, afin de pouvoir la reprendre si elle ne me convient pas.

#### Acceptance Criteria

1. WHEN a photo is captured, THE Camera_Capture_Component SHALL display the Captured_Photo in a preview area
2. THE Camera_Capture_Component SHALL display two action buttons: "Reprendre" and "Valider"
3. WHEN the user clicks "Reprendre", THE Camera_Capture_Component SHALL discard the Captured_Photo and restart the Media_Stream
4. WHEN the user clicks "Valider", THE Camera_Capture_Component SHALL set the Captured_Photo as the student's photoUrl
5. THE Captured_Photo SHALL appear in the live preview card on the right side of StudentForm

### Requirement 6: Compression et Optimisation

**User Story:** En tant qu'utilisateur, je veux que les photos capturées soient automatiquement optimisées, afin de réduire l'espace de stockage et améliorer les performances.

#### Acceptance Criteria

1. WHEN a photo is captured, THE Image_Compressor SHALL resize the image to exactly 300x400 pixels
2. THE Image_Compressor SHALL crop the image to maintain 3:4 aspect ratio, centering the subject
3. THE Image_Compressor SHALL convert the image to JPEG format with 85% quality compression
4. THE Image_Compressor SHALL produce a base64 data URL compatible with Supabase storage
5. THE Captured_Photo SHALL have the same data format as uploaded photos for consistent processing

### Requirement 7: Gestion des Erreurs

**User Story:** En tant qu'utilisateur, je veux recevoir des messages d'erreur clairs en cas de problème, afin de comprendre ce qui ne fonctionne pas et comment le résoudre.

#### Acceptance Criteria

1. IF navigator.mediaDevices.getUserMedia() is not supported, THEN THE Error_Handler SHALL display "Votre navigateur ne supporte pas l'accès à la caméra"
2. IF Camera_Permission is denied, THEN THE Error_Handler SHALL display "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur"
3. IF the camera is in use by another application, THEN THE Error_Handler SHALL display "La caméra est déjà utilisée par une autre application"
4. IF capture fails, THEN THE Error_Handler SHALL display "Erreur lors de la capture. Veuillez réessayer"
5. WHEN an error occurs, THE Error_Handler SHALL automatically offer the file upload option as fallback

### Requirement 8: Libération des Ressources

**User Story:** En tant qu'utilisateur, je veux que la caméra s'arrête automatiquement après utilisation, afin de préserver la batterie et la confidentialité.

#### Acceptance Criteria

1. WHEN the user validates a Captured_Photo, THE Camera_Capture_Component SHALL stop all Media_Stream tracks
2. WHEN the user cancels the StudentForm, THE Camera_Capture_Component SHALL stop all Media_Stream tracks
3. WHEN the user switches from camera mode to file upload mode, THE Camera_Capture_Component SHALL stop all Media_Stream tracks
4. WHEN the component unmounts, THE Camera_Capture_Component SHALL stop all Media_Stream tracks
5. THE Camera_Capture_Component SHALL verify that all tracks are stopped by checking track.readyState equals "ended"

### Requirement 9: Compatibilité Mobile

**User Story:** En tant qu'utilisateur mobile, je veux que la capture photo fonctionne de manière fluide sur mon smartphone, afin d'avoir une expérience optimale sur iOS et Android.

#### Acceptance Criteria

1. THE Camera_Capture_Component SHALL support Safari iOS version 14.5 and above
2. THE Camera_Capture_Component SHALL support Chrome Android version 90 and above
3. ON mobile devices, THE Camera_Capture_Component SHALL default to the front-facing camera (facingMode: 'user')
4. THE Camera_Capture_Component SHALL provide a button to switch between front and rear cameras on mobile
5. THE Video_Preview SHALL adapt to mobile screen sizes using responsive design (full width with max-width constraints)

### Requirement 10: Intégration avec StudentForm

**User Story:** En tant qu'utilisateur, je veux que la capture photo s'intègre naturellement dans le formulaire existant, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. THE Camera_Capture_Component SHALL be integrated into the existing photo upload section of StudentForm
2. THE Captured_Photo SHALL populate the formData.photoUrl field identically to uploaded photos
3. THE Captured_Photo SHALL appear in the real-time preview card (IDCard component) on the right side
4. THE Camera_Capture_Component SHALL maintain the existing photo deletion functionality (X button)
5. THE Camera_Capture_Component SHALL preserve all existing form validation and submission logic

### Requirement 11: Interface Utilisateur

**User Story:** En tant qu'utilisateur, je veux une interface intuitive et visuellement cohérente avec le reste de l'application, afin de comprendre facilement comment utiliser la fonctionnalité.

#### Acceptance Criteria

1. THE Camera_Capture_Component SHALL use Tailwind CSS classes consistent with the existing StudentForm styling
2. THE Camera_Capture_Component SHALL use Lucide React icons consistent with the existing icon set (Camera, X, RotateCw)
3. THE Camera_Capture_Component SHALL display loading states during camera initialization with a spinner
4. THE Camera_Capture_Component SHALL use emerald color scheme (emerald-600, emerald-700) for primary actions
5. THE Camera_Capture_Component SHALL provide clear visual feedback for all interactive elements (hover states, focus rings)

### Requirement 12: Performance

**User Story:** En tant qu'utilisateur, je veux que la capture photo soit rapide et réactive, afin de ne pas perdre de temps lors de l'ajout d'élèves.

#### Acceptance Criteria

1. WHEN camera mode is activated, THE Camera_Capture_Component SHALL initialize the Media_Stream within 2 seconds on desktop
2. WHEN camera mode is activated, THE Camera_Capture_Component SHALL initialize the Media_Stream within 3 seconds on mobile
3. WHEN the "Capturer" button is clicked, THE Canvas_Element SHALL capture and process the image within 500 milliseconds
4. THE Image_Compressor SHALL complete compression within 1 second for images up to 5MB
5. THE Camera_Capture_Component SHALL not block the main UI thread during image processing

## Notes Techniques

### API MediaDevices
- Utilisation de `navigator.mediaDevices.getUserMedia()` pour l'accès caméra
- Gestion des contraintes vidéo pour optimiser la qualité et la performance
- Support des événements de changement de périphérique

### Compression d'Image
- Réutilisation du module `compressImage` existant dans StudentForm.tsx
- Format cible: 300x400px, ratio 3:4, JPEG 85%
- Conversion en base64 data URL pour compatibilité Supabase

### Compatibilité Navigateurs
- Safari iOS 14.5+: Support complet de getUserMedia
- Chrome Android 90+: Support complet avec sélection caméra avant/arrière
- Chrome/Firefox/Edge Desktop: Support complet

### Sécurité
- Accès caméra uniquement sur HTTPS (ou localhost en développement)
- Permissions explicites demandées à l'utilisateur
- Libération automatique des ressources caméra
