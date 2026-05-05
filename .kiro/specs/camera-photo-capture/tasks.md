# Implementation Plan: Camera Photo Capture

## Overview

This implementation plan breaks down the camera photo capture feature into discrete coding tasks. The feature adds camera capture functionality to the StudentForm component, allowing users to take photos directly from their device camera as an alternative to file uploads. The implementation focuses on cross-platform compatibility (Safari iOS, Chrome Android, desktop browsers), proper resource management, and seamless integration with existing form workflows.

## Tasks

- [x] 1. Create CameraCapture component structure and basic UI
  - Create new file `src/components/CameraCapture.tsx`
  - Define TypeScript interfaces for props and state (`CameraCaptureProps`, `CameraCaptureState`, `CameraError`)
  - Implement basic component structure with mode selector UI
  - Add Lucide React icons (Camera, X, RotateCw, Upload)
  - Apply Tailwind CSS styling consistent with StudentForm
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1, 11.2, 11.5_

- [ ]* 1.1 Write unit tests for CameraCapture component structure
  - Test component renders without errors
  - Test props interface is correctly typed
  - Test basic UI elements are present
  - _Requirements: 1.1, 11.1_

- [ ] 2. Implement camera initialization and MediaStream management
  - [x] 2.1 Implement `initializeCamera()` method with getUserMedia API
    - Request camera access with constraints: `{video: {facingMode: 'user', width: {ideal: 1280}, height: {ideal: 1280}}, audio: false}`
    - Handle MediaStream initialization and state updates
    - Set `isCameraActive` and `stream` state on success
    - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2_
  
  - [x] 2.2 Implement VideoPreview sub-component
    - Create video element with `autoPlay`, `playsInline`, and `muted` attributes
    - Set video `srcObject` to MediaStream
    - Apply 3:4 aspect ratio styling (300x400px minimum on desktop)
    - Add visual frame overlay guide for photo positioning
    - Make responsive for mobile devices
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.5_
  
  - [x] 2.3 Implement `stopCamera()` method for resource cleanup
    - Stop all MediaStream tracks using `track.stop()`
    - Verify tracks are stopped by checking `track.readyState === 'ended'`
    - Clear stream state and reset camera active flag
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 2.4 Write unit tests for camera initialization
  - Test getUserMedia is called with correct constraints
  - Test stream state is updated on success
  - Test video element receives stream as srcObject
  - Test stopCamera cleans up all tracks
  - _Requirements: 2.1, 2.2, 8.5_

- [ ] 3. Implement photo capture functionality
  - [x] 3.1 Create Canvas element for frame capture
    - Create hidden canvas element (300x400px)
    - Implement `capturePhoto()` method to draw video frame to canvas
    - Extract image data from canvas as base64 JPEG (85% quality)
    - Update `capturedPhoto` state with data URL
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [x] 3.2 Add capture button UI
    - Display "Capturer" button while video preview is active
    - Trigger `capturePhoto()` on button click
    - Show loading state during capture processing
    - _Requirements: 4.1, 11.3, 11.4_
  
  - [x] 3.3 Integrate with existing image compression
    - Reuse `compressImage()` function from StudentForm.tsx
    - Ensure captured photo matches format: 300x400px, 3:4 ratio, JPEG 85%
    - Convert to base64 data URL compatible with Supabase
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 12.3, 12.4_

- [ ]* 3.4 Write unit tests for photo capture
  - Test canvas captures video frame correctly
  - Test image is compressed to correct dimensions
  - Test output format is base64 JPEG
  - Test capture completes within 500ms
  - _Requirements: 4.2, 4.3, 4.4, 6.1, 12.3_

- [ ] 4. Implement photo preview and validation UI
  - [x] 4.1 Create PhotoPreview sub-component
    - Display captured photo in preview area (same dimensions as video)
    - Add "Reprendre" button to discard and restart camera
    - Add "Valider" button to confirm photo selection
    - Apply consistent Tailwind styling with emerald color scheme
    - _Requirements: 5.1, 5.2, 11.1, 11.4_
  
  - [x] 4.2 Implement retake functionality
    - On "Reprendre" click, clear `capturedPhoto` state
    - Restart MediaStream by calling `initializeCamera()`
    - Return to video preview mode
    - _Requirements: 5.3_
  
  - [x] 4.3 Implement confirm functionality
    - On "Valider" click, call `onPhotoCapture` prop with captured photo data URL
    - Stop MediaStream by calling `stopCamera()`
    - Close camera interface
    - _Requirements: 5.4, 8.1_

- [ ]* 4.4 Write unit tests for photo preview
  - Test preview displays captured photo
  - Test retake button clears photo and restarts camera
  - Test confirm button calls onPhotoCapture callback
  - Test confirm button stops camera stream
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.1_

- [x] 5. Checkpoint - Ensure basic camera capture flow works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement comprehensive error handling
  - [x] 6.1 Create error state management
    - Define `CameraError` type with all error cases
    - Add error state to component
    - Create `handleCameraError()` method to process errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 6.2 Handle browser compatibility errors
    - Check if `navigator.mediaDevices.getUserMedia` exists
    - Display "Votre navigateur ne supporte pas l'accès à la caméra" if not supported
    - Automatically offer file upload fallback
    - _Requirements: 7.1, 7.5_
  
  - [x] 6.3 Handle permission errors
    - Catch `NotAllowedError` and `PermissionDeniedError`
    - Display "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur"
    - Provide fallback to file upload
    - _Requirements: 2.3, 7.2, 7.5_
  
  - [x] 6.4 Handle device errors
    - Catch `NotFoundError` for missing camera
    - Catch `NotReadableError` for camera in use
    - Display appropriate error messages
    - Provide fallback to file upload
    - _Requirements: 2.4, 7.3, 7.5_
  
  - [x] 6.5 Handle capture errors
    - Catch errors during canvas capture
    - Display "Erreur lors de la capture. Veuillez réessayer"
    - Allow user to retry capture
    - _Requirements: 7.4_

- [ ]* 6.6 Write unit tests for error handling
  - Test each error type displays correct message
  - Test fallback to upload mode on critical errors
  - Test retry functionality on transient errors
  - Test error logging to console
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7. Implement mobile-specific features
  - [x] 7.1 Add camera switching functionality
    - Create `switchCamera()` method to toggle between front/rear cameras
    - Stop current stream and request new stream with opposite `facingMode`
    - Update `facingMode` state ('user' or 'environment')
    - _Requirements: 9.4_
  
  - [x] 7.2 Add camera switch button UI
    - Display switch button only on mobile devices
    - Use RotateCw icon from Lucide React
    - Position button over video preview
    - Disable during camera initialization
    - _Requirements: 9.4, 11.2_
  
  - [x] 7.3 Optimize for mobile performance
    - Ensure video preview is responsive (full width with constraints)
    - Test camera initialization time on mobile (< 3 seconds)
    - Verify no UI blocking during image processing
    - _Requirements: 9.5, 12.2, 12.5_

- [ ]* 7.4 Write unit tests for mobile features
  - Test camera switching toggles facingMode
  - Test switch button only appears on mobile
  - Test camera restarts with new facingMode
  - _Requirements: 9.4_

- [ ] 8. Integrate CameraCapture into StudentForm
  - [x] 8.1 Modify StudentForm to add photo input mode state
    - Add `photoInputMode` state: `'upload' | 'camera'`
    - Add mode selector UI with "Télécharger" and "Prendre une photo" buttons
    - Apply conditional styling to indicate selected mode
    - _Requirements: 1.1, 1.2, 1.5, 10.1_
  
  - [x] 8.2 Conditionally render FileUpload or CameraCapture
    - Import CameraCapture component
    - Render FileUpload when `photoInputMode === 'upload'`
    - Render CameraCapture when `photoInputMode === 'camera'`
    - Pass `onPhotoCapture` callback to update `formData.photoUrl`
    - _Requirements: 1.3, 10.2_
  
  - [x] 8.3 Implement mode switching logic
    - Allow switching between modes without losing form data
    - Stop camera when switching from camera to upload mode
    - Preserve existing photo when switching modes
    - _Requirements: 1.4, 8.3_
  
  - [x] 8.4 Ensure camera cleanup on form lifecycle events
    - Stop camera on form cancel (onCancel callback)
    - Stop camera on form submit (handleSubmit)
    - Stop camera on component unmount (useEffect cleanup)
    - _Requirements: 8.1, 8.2, 8.4_

- [ ]* 8.5 Write integration tests for StudentForm
  - Test mode selector switches between upload and camera
  - Test captured photo populates formData.photoUrl
  - Test captured photo appears in IDCard preview
  - Test camera stops on form cancel
  - Test camera stops on form submit
  - _Requirements: 1.3, 1.4, 5.5, 10.2, 10.3, 8.1, 8.2_

- [x] 9. Checkpoint - Ensure full integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Add loading states and UI polish
  - [x] 10.1 Add loading spinner during camera initialization
    - Display spinner while `isInitializing === true`
    - Show "Initialisation de la caméra..." message
    - Use emerald color scheme for spinner
    - _Requirements: 11.3, 12.1, 12.2_
  
  - [x] 10.2 Add visual feedback for all interactions
    - Add hover states to all buttons
    - Add focus rings for keyboard navigation
    - Add disabled states during processing
    - _Requirements: 11.5_
  
  - [x] 10.3 Ensure consistent styling with StudentForm
    - Match button styles (rounded-lg, padding, colors)
    - Match input section spacing and layout
    - Use same emerald color palette (emerald-600, emerald-700)
    - _Requirements: 11.1, 11.4_

- [ ]* 10.4 Write unit tests for UI states
  - Test loading spinner appears during initialization
  - Test buttons have correct hover and focus styles
  - Test disabled states during processing
  - _Requirements: 11.3, 11.5_

- [ ] 11. Verify cross-browser compatibility
  - [x] 11.1 Test on desktop browsers
    - Verify Chrome desktop: camera access, capture, cleanup
    - Verify Firefox desktop: camera access, capture, cleanup
    - Verify Edge desktop: camera access, capture, cleanup
    - Verify Safari desktop: camera access, capture, cleanup
    - _Requirements: 2.5_
  
  - [x] 11.2 Test on mobile browsers
    - Verify Safari iOS 14.5+: front camera, capture, cleanup
    - Verify Safari iOS: camera switching (front/rear)
    - Verify Chrome Android 90+: front camera, capture, cleanup
    - Verify Chrome Android: camera switching (front/rear)
    - _Requirements: 2.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 12. Final validation and cleanup
  - [x] 12.1 Verify all requirements are met
    - Review each acceptance criterion in requirements document
    - Test complete user flows end-to-end
    - Verify error scenarios and fallbacks
    - _Requirements: All_
  
  - [x] 12.2 Verify performance benchmarks
    - Camera initialization < 2s on desktop, < 3s on mobile
    - Photo capture and processing < 500ms
    - Image compression < 1s for images up to 5MB
    - No UI blocking during processing
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 12.3 Verify resource cleanup
    - Test camera stops on all lifecycle events
    - Verify no memory leaks after multiple captures
    - Check all MediaStream tracks are properly stopped
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design document does not include Correctness Properties, so property-based tests are not included
- Unit tests and integration tests validate specific examples and edge cases
- Camera resource cleanup is critical to prevent memory leaks and battery drain
- Mobile compatibility (Safari iOS, Chrome Android) requires special attention to video element attributes and stream management
