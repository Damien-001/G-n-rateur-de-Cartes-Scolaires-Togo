import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Camera, X, RotateCw, Upload } from 'lucide-react';

// TypeScript Interfaces
export interface CameraCaptureProps {
  onPhotoCapture: (photoDataUrl: string) => void;
  onCancel: () => void;
  existingPhotoUrl?: string;
}

export interface CameraCaptureRef {
  stopCamera: () => void;
}

export interface CameraCaptureState {
  stream: MediaStream | null;
  isInitializing: boolean;
  isCameraActive: boolean;
  isCapturing: boolean;
  capturedPhoto: string | null;
  error: CameraError | null;
  facingMode: 'user' | 'environment';
}

export type CameraError = 
  | 'permission-denied'
  | 'device-not-found'
  | 'device-in-use'
  | 'capture-failed'
  | 'not-supported';

export const CameraCapture = forwardRef<CameraCaptureRef, CameraCaptureProps>(({
  onPhotoCapture,
  onCancel,
  existingPhotoUrl
}, ref) => {
  // State management
  const [state, setState] = useState<CameraCaptureState>({
    stream: null,
    isInitializing: false,
    isCameraActive: false,
    isCapturing: false,
    capturedPhoto: null,
    error: null,
    facingMode: 'user'
  });

  // Refs for video and canvas elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect if device is mobile
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      // Check using matchMedia for mobile screen size
      const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
      // Also check user agent for mobile devices
      const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsMobile(mobileMediaQuery.matches || mobileUserAgent);
    };

    checkMobile();

    // Listen for screen size changes
    const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
    const handleResize = () => checkMobile();
    
    mobileMediaQuery.addEventListener('change', handleResize);
    
    return () => {
      mobileMediaQuery.removeEventListener('change', handleResize);
    };
  }, []);

  // Error messages mapping
  const errorMessages: Record<CameraError, string> = {
    'not-supported': 'Votre navigateur ne supporte pas l\'accès à la caméra',
    'permission-denied': 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur',
    'device-not-found': 'Aucune caméra détectée sur cet appareil',
    'device-in-use': 'La caméra est déjà utilisée par une autre application',
    'capture-failed': 'Erreur lors de la capture. Veuillez réessayer'
  };

  // Initialize camera on component mount
  useEffect(() => {
    // Don't initialize automatically - wait for user to click
    // initializeCamera();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  // Initialize camera when component is ready
  useEffect(() => {
    // Initialize camera after component is mounted and rendered
    const timer = setTimeout(() => {
      initializeCamera();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize camera stream
  const initializeCamera = async (newFacingMode?: 'user' | 'environment') => {
    console.log('🎥 [CameraCapture] Initializing camera...');
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ [CameraCapture] getUserMedia not supported');
      setState(prev => ({ ...prev, error: 'not-supported' }));
      return;
    }

    const targetFacingMode = newFacingMode || state.facingMode;
    console.log('📹 [CameraCapture] Target facing mode:', targetFacingMode);

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: targetFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 }
        },
        audio: false
      };

      console.log('🔧 [CameraCapture] Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ [CameraCapture] Camera stream obtained:', stream);
      console.log('📊 [CameraCapture] Stream tracks:', stream.getTracks());
      
      if (videoRef.current) {
        console.log('🎬 [CameraCapture] Setting srcObject on video element');
        videoRef.current.srcObject = stream;
        
        console.log('▶️ [CameraCapture] Video element properties:', {
          readyState: videoRef.current.readyState,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          paused: videoRef.current.paused
        });
        
        // Force video to play
        try {
          await videoRef.current.play();
          console.log('✅ [CameraCapture] Video play() succeeded');
        } catch (playError) {
          console.warn('⚠️ [CameraCapture] Video play error (may be normal):', playError);
        }
      } else {
        console.error('❌ [CameraCapture] videoRef.current is null!');
      }

      setState(prev => ({
        ...prev,
        stream,
        isInitializing: false,
        isCameraActive: true,
        error: null,
        facingMode: targetFacingMode
      }));
      
      console.log('✅ [CameraCapture] Camera initialization complete');
    } catch (error) {
      console.error('❌ [CameraCapture] Camera error:', error);
      handleCameraError(error as Error);
    }
  };

  // Handle camera errors
  const handleCameraError = (error: Error) => {
    let errorType: CameraError = 'capture-failed';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorType = 'permission-denied';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorType = 'device-not-found';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorType = 'device-in-use';
    }

    setState(prev => ({
      ...prev,
      error: errorType,
      isInitializing: false,
      isCameraActive: false
    }));
  };

  // Stop camera stream
  const stopCamera = () => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        track.stop();
      });
      
      // Verify all tracks are stopped (Requirement 8.5)
      const allTracksStopped = state.stream.getTracks().every(track => track.readyState === 'ended');
      if (!allTracksStopped) {
        console.warn('Warning: Not all camera tracks were properly stopped');
      }
      
      setState(prev => ({ ...prev, stream: null, isCameraActive: false }));
    }
  };

  // Expose stopCamera method to parent component via ref (Requirement 8.3)
  useImperativeHandle(ref, () => ({
    stopCamera
  }));

  // Image compression function (reused from StudentForm.tsx)
  // Compresses and resizes image to 300x400px, 3:4 ratio, JPEG 85%
  const compressImage = (imageSource: HTMLVideoElement | HTMLImageElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas non supporté'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas non supporté'));
        return;
      }

      // Dimensions cibles pour la photo (ratio 3:4 - portrait)
      const targetWidth = 300;
      const targetHeight = 400;

      // Calculer les dimensions en gardant le ratio
      let width = imageSource instanceof HTMLVideoElement ? imageSource.videoWidth : imageSource.width;
      let height = imageSource instanceof HTMLVideoElement ? imageSource.videoHeight : imageSource.height;
      const ratio = width / height;
      const targetRatio = targetWidth / targetHeight;

      if (ratio > targetRatio) {
        // Image trop large, on recadre sur la largeur
        width = height * targetRatio;
      } else {
        // Image trop haute, on recadre sur la hauteur
        height = width / targetRatio;
      }

      // Centrer le recadrage
      const sourceWidth = imageSource instanceof HTMLVideoElement ? imageSource.videoWidth : imageSource.width;
      const sourceHeight = imageSource instanceof HTMLVideoElement ? imageSource.videoHeight : imageSource.height;
      const offsetX = (sourceWidth - width) / 2;
      const offsetY = (sourceHeight - height) / 2;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // If using front camera (user), flip horizontally to match preview
      if (state.facingMode === 'user') {
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
      }

      // Dessiner l'image recadrée et redimensionnée
      ctx.drawImage(
        imageSource,
        offsetX, offsetY, width, height,
        0, 0, targetWidth, targetHeight
      );

      // Reset transformation for next use
      if (state.facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      // Convertir en base64 avec compression JPEG (qualité 85%)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Erreur de compression'));
          }
        },
        'image/jpeg',
        0.85
      );
    });
  };

  // Capture photo from video stream
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setState(prev => ({ ...prev, error: 'capture-failed' }));
      return;
    }

    // Set capturing state
    setState(prev => ({ ...prev, isCapturing: true }));

    try {
      const video = videoRef.current;
      
      // Use the compressImage function (reused from StudentForm.tsx)
      const compressedDataUrl = await compressImage(video);
      
      setState(prev => ({ ...prev, capturedPhoto: compressedDataUrl, isCapturing: false }));
      stopCamera();
    } catch (error) {
      console.error('Capture error:', error);
      setState(prev => ({ ...prev, error: 'capture-failed', isCapturing: false }));
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setState(prev => ({ ...prev, capturedPhoto: null }));
    initializeCamera();
  };

  // Confirm photo
  const confirmPhoto = () => {
    if (state.capturedPhoto) {
      // Stop camera stream before confirming (Requirement 8.1)
      stopCamera();
      // Call parent callback to set photo and close camera interface (Requirement 5.4)
      onPhotoCapture(state.capturedPhoto);
    }
  };

  // Switch camera (front/rear)
  const switchCamera = () => {
    stopCamera();
    const newFacingMode = state.facingMode === 'user' ? 'environment' : 'user';
    // Re-initialize with new facing mode
    setTimeout(() => {
      initializeCamera(newFacingMode);
    }, 100);
  };

  // Render error state
  if (state.error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </div>
            <p className="text-red-700 font-semibold">Erreur d'accès à la caméra</p>
          </div>
          <p className="text-red-600 text-sm">{errorMessages[state.error]}</p>
        </div>
        
        <button
          type="button"
          onClick={onCancel}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Utiliser l'upload de fichier
        </button>
      </div>
    );
  }

  // Render captured photo preview
  if (state.capturedPhoto) {
    return (
      <div className="space-y-4">
        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
          <img 
            src={state.capturedPhoto} 
            alt="Photo capturée" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={retakePhoto}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Reprendre
          </button>
          <button
            type="button"
            onClick={confirmPhoto}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Valider
          </button>
        </div>
      </div>
    );
  }

  // Render camera view
  return (
    <div className="space-y-4">
      {/* Loading state */}
      {state.isInitializing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Initialisation de la caméra...</p>
          </div>
        </div>
      )}

      {/* Video preview */}
      {(state.isCameraActive || state.isInitializing) && (
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => {
              // Force play when metadata is loaded
              const video = e.currentTarget;
              console.log('📺 [CameraCapture] Video metadata loaded:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });
              video.play().catch(err => console.warn('⚠️ [CameraCapture] Video play error:', err));
            }}
            style={{ transform: state.facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            className="w-full h-full object-cover"
          />
          
          {/* Frame overlay guide */}
          <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none" />
          
          {/* Camera switch button (mobile only) */}
          {isMobile && (
            <button
              type="button"
              onClick={switchCamera}
              disabled={state.isInitializing}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Changer de caméra"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture button */}
      {state.isCameraActive && (
        <button
          type="button"
          onClick={capturePhoto}
          disabled={state.isCapturing}
          className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.isCapturing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Capture en cours...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Capturer
            </>
          )}
        </button>
      )}
    </div>
  );
});

CameraCapture.displayName = 'CameraCapture';
