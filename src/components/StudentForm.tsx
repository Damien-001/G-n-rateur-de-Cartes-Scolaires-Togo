import React, { useState, useRef, useEffect } from 'react';
import { Student, SchoolInfo, CLASSES_LIST, SCHOOL_YEARS } from '../types';
import { X, Upload, Plus, Trash2, Edit2, Camera, User, Calendar, MapPin, Shield, Landmark, BookOpen, AlertCircle } from 'lucide-react';
import { IDCard } from './IDCard';
import { IDCardBack } from './IDCardBack';

interface StudentFormProps {
  student?: Student;
  schoolInfo: SchoolInfo;
  onSubmit: (student: Student) => void;
  onCancel: () => void;
  defaultClass?: string;
  existingClasses?: string[];
}

export const StudentForm: React.FC<StudentFormProps> = ({ student, schoolInfo, onSubmit, onCancel, defaultClass, existingClasses = [] }) => {
  const availableClasses = Array.from(new Set([
    ...(existingClasses || []),
    ...CLASSES_LIST,
    ...(defaultClass ? [defaultClass] : []),
    ...(student?.className ? [student.className] : [])
  ])).filter(Boolean);
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName:  student?.firstName  ?? '',
    lastName:   student?.lastName   ?? '',
    matricule:  student?.matricule  ?? '',
    className:  student?.className  ?? (defaultClass || ''),
    schoolYear: student?.schoolYear ?? '2025-2026',
    birthDate:  student?.birthDate  ?? '',
    birthPlace: student?.birthPlace ?? '',
    examCenter: student?.examCenter ?? '',
    photoUrl:   student?.photoUrl   ?? '',
    qrCodeData: student?.qrCodeData ?? '',
    expirationDate: student?.expirationDate ?? '',
  });

  const [isCustomClassInput, setIsCustomClassInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fonction pour démarrer la webcam
  const startWebcam = async () => {
    setWebcamError(null);
    setIsWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Erreur d'accès à la webcam:", err);
      setWebcamError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setIsWebcamActive(false);
    }
  };

  // Fonction pour arrêter la webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  // Nettoyage lors de la fermeture
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capturer la photo depuis le flux vidéo
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const targetWidth = 300;
      const targetHeight = 400;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      const videoRatio = videoWidth / videoHeight;
      const targetRatio = targetWidth / targetHeight; // 0.75

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = videoWidth;
      let sourceHeight = videoHeight;

      if (videoRatio > targetRatio) {
        sourceWidth = videoHeight * targetRatio;
        sourceX = (videoWidth - sourceWidth) / 2;
      } else {
        sourceHeight = videoWidth / targetRatio;
        sourceY = (videoHeight - sourceHeight) / 2;
      }

      ctx.drawImage(
        video,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, targetWidth, targetHeight
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
      stopWebcam();
    }
  };

  // Fonction pour compresser et redimensionner l'image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Dimensions cibles pour la photo (ratio 3:4 - portrait)
          const targetWidth = 300;
          const targetHeight = 400;
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas non supporté'));
            return;
          }

          // Calculer les dimensions en gardant le ratio
          let width = img.width;
          let height = img.height;
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
          const offsetX = (img.width - width) / 2;
          const offsetY = (img.height - height) / 2;

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Dessiner l'image recadrée et redimensionnée
          ctx.drawImage(
            img,
            offsetX, offsetY, width, height,
            0, 0, targetWidth, targetHeight
          );

          // Convertir en base64 avec compression JPEG (qualité 85%)
          const compressedDataUrl = canvas.toBlob(
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
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('📝 Soumission du formulaire avec les données:', formData);
      
      const studentData = {
        ...formData,
        id: student?.id || crypto.randomUUID(),
      } as Student;
      
      console.log('👤 Données étudiant finales:', studentData);
      
      await onSubmit(studentData);
    } catch (err) {
      console.error('❌ Erreur lors de la soumission:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewStudent: Student = {
    ...formData,
    id: student?.id || 'preview',
    firstName: formData.firstName || 'Prénoms',
    lastName: formData.lastName || 'NOM',
    matricule: formData.matricule || 'MATRICULE',
    className: formData.className || 'CLASSE',
    schoolYear: formData.schoolYear || '2025-2026',
    birthDate: formData.birthDate || 'DATE',
    birthPlace: formData.birthPlace || 'LIEU',
  } as Student;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="double-bezel-outer w-full max-w-5xl overflow-hidden shadow-2xl">
        <div className="double-bezel-inner flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
                  <div className="flex-1 overflow-y-auto max-h-[90vh] md:max-h-none bg-white">
            {/* Form Header */}
            <div className="px-8 py-6 border-b border-gray-100/70 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                    {student ? "Modifier les informations de l'élève" : "Ajouter un nouvel élève"}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Saisie des informations de la carte d'identité scolaire</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onCancel} 
                className="md:hidden p-2 hover:bg-gray-150 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400/80" /> Nom
                </label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800 placeholder-gray-400"
                  placeholder="Ex: KOFFI"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400/80" /> Prénoms
                </label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800 placeholder-gray-400"
                  placeholder="Ex: Jean-Luc"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-gray-400/80" /> Matricule
                </label>
                <input
                  required
                  type="text"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-semibold text-emerald-800 placeholder-gray-400"
                  placeholder="Ex: 2024-TG-001"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Landmark className="w-3.5 h-3.5 text-gray-400/80" /> Centre d'Examen
                </label>
                <input
                  type="text"
                  value={formData.examCenter}
                  onChange={(e) => setFormData({ ...formData, examCenter: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800 placeholder-gray-400"
                  placeholder="Ex: Lycée de Tokoin"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400/80" /> Classe
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomClassInput(!isCustomClassInput)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {isCustomClassInput ? "Choisir dans la liste" : "+ Saisie libre"}
                  </button>
                </div>
                {isCustomClassInput ? (
                  <input
                    required
                    type="text"
                    placeholder="Ex: 6ème A, 3ème 2, Terminale CD..."
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus-brand outline-none text-sm font-semibold text-gray-800"
                  />
                ) : (
                  <select
                    required
                    value={formData.className}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomClassInput(true);
                      } else {
                        setFormData({ ...formData, className: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">Sélectionner une classe</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                    <option value="__custom__">+ Autre classe personnalisée...</option>
                  </select>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400/80" /> Année Scolaire
                </label>
                <select
                  required
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800"
                >
                  {SCHOOL_YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3 h-3 text-gray-400/80" /> Date Naiss.
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3 h-3 text-gray-400/80" /> Lieu Naiss.
                  </label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800 placeholder-gray-400"
                    placeholder="Ex: Lomé"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400/80" /> Date d'Expiration
                </label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/30 hover:bg-gray-50/70 focus:bg-white focus-brand outline-none transition-all duration-200 text-sm font-medium text-gray-800"
                />
              </div>
            </div>
          </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <Camera className="w-3.5 h-3.5 text-gray-400/80" /> Photo de l'élève
                </label>
                
                {isWebcamActive ? (
                  <div className="flex flex-col items-center gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/60 max-w-sm">
                    <div className="relative w-44 h-56 bg-black rounded-2xl overflow-hidden shadow-inner border border-gray-250">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-3 border border-dashed border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                        <p className="text-[8px] text-white/50 uppercase tracking-[0.2em] font-bold">Cadrer le visage</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full max-w-[190px]">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        Prendre la photo
                      </button>
                      <button
                        type="button"
                        onClick={stopWebcam}
                        className="px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="relative w-16 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                      {formData.photoUrl ? (
                        <>
                          <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photoUrl: '' })}
                            className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                            title="Supprimer la photo"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="photo-file-input"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                if (file.size > 10 * 1024 * 1024) {
                                  alert('La photo est trop volumineuse (max 10MB)');
                                  return;
                                }
                                const compressedDataUrl = await compressImage(file);
                                setFormData({ ...formData, photoUrl: compressedDataUrl });
                              } catch (err) {
                                console.error('Erreur compression image:', err);
                                alert('Erreur lors du traitement de l\'image');
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="photo-file-input"
                          className="px-3.5 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm bg-white"
                        >
                          <Upload className="w-3.5 h-3.5 text-gray-400" />
                          Importer un fichier
                        </label>
                        
                        <button
                          type="button"
                          onClick={startWebcam}
                          className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Prendre une photo
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400">Format recommandé : Portrait (3:4) • Compression automatique</p>
                      {webcamError && (
                        <p className="text-[11px] text-red-650 font-semibold">{webcamError}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 flex gap-3 items-start">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-red-800 font-bold text-sm">Erreur lors de l'enregistrement</p>
                <p className="text-red-600 text-xs mt-0.5 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100/70">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs font-bold"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isSubmitting ? 'Enregistrement...' : (student ? 'Mettre à jour' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      <div className="hidden md:flex flex-col w-[420px] bg-gray-50/50 p-8 items-center justify-start overflow-y-auto relative border-l border-gray-100 max-h-[90vh]">
        <button 
          onClick={onCancel} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-150 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6 pt-6">
          <span className="text-[10px] font-extrabold text-emerald-800 tracking-[0.2em] uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
            Aperçu en temps réel
          </span>
          <p className="text-xs text-gray-400 mt-2 font-medium">Les modifications apparaissent instantanément</p>
        </div>

        <div className="flex flex-col gap-6 items-center w-full py-4 shrink-0">
          {/* Recto */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recto (Face)</span>
            <div className="p-2.5 bg-gray-100/60 rounded-2xl border border-gray-250/55 shadow-sm scale-95 origin-center bg-white">
              <div className="rounded-xl overflow-hidden shadow-md border border-gray-300 bg-white shrink-0">
                <IDCard student={previewStudent} schoolInfo={schoolInfo} showCuttingMarks={false} />
              </div>
            </div>
          </div>

          {/* Verso */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verso (Dos)</span>
            <div className="p-2.5 bg-gray-100/60 rounded-2xl border border-gray-250/55 shadow-sm scale-95 origin-center bg-white">
              <div className="rounded-xl overflow-hidden shadow-md border border-gray-300 bg-white shrink-0">
                <IDCardBack student={previewStudent} schoolInfo={schoolInfo} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 px-5 py-3 bg-emerald-50/30 rounded-2xl border border-emerald-100/40 max-w-[280px] w-full shrink-0">
          <p className="text-[10px] text-emerald-850 font-bold leading-relaxed text-center">
            Note : Les dimensions réelles de la carte (85x54mm) seront respectées lors de l'impression.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};
