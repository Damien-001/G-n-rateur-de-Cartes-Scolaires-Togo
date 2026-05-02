import React, { useState } from 'react';
import { Student, SchoolInfo, CLASSES_LIST, SCHOOL_YEARS } from '../types';
import { X, Upload, Plus, Trash2, Edit2 } from 'lucide-react';
import { IDCard } from './IDCard';

interface StudentFormProps {
  student?: Student;
  schoolInfo: SchoolInfo;
  onSubmit: (student: Student) => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ student, schoolInfo, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName:  student?.firstName  ?? '',
    lastName:   student?.lastName   ?? '',
    matricule:  student?.matricule  ?? '',
    className:  student?.className  ?? '',
    schoolYear: student?.schoolYear ?? '2025-2026',
    birthDate:  student?.birthDate  ?? '',
    birthPlace: student?.birthPlace ?? '',
    examCenter: student?.examCenter ?? '',
    photoUrl:   student?.photoUrl   ?? '',
    qrCodeData: student?.qrCodeData ?? '',
    expirationDate: student?.expirationDate ?? '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Form Section */}
        <div className="flex-1 overflow-y-auto max-h-[90vh] md:max-h-none border-r border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
            <h2 className="text-xl font-bold text-emerald-900">
              {student ? 'Modifier l\'élève' : 'Ajouter un élève'}
            </h2>
            <button onClick={onCancel} className="md:hidden p-2 hover:bg-emerald-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-emerald-700" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom</label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: KOFFI"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prénoms</label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: Jean-Luc"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Matricule</label>
                <input
                  required
                  type="text"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: 2024-TG-001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Centre d'Examen</label>
                <input
                  type="text"
                  value={formData.examCenter}
                  onChange={(e) => setFormData({ ...formData, examCenter: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: Lycée de Tokoin"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Classe</label>
                <select
                  required
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                >
                  <option value="">Sélectionner une classe</option>
                  {CLASSES_LIST.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Année Scolaire</label>
                <select
                  required
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                >
                  {SCHOOL_YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date Naiss.</label>
                  <input
                    required
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lieu Naiss.</label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ex: Lomé"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date d'Expiration</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Photo de l'élève</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.photoUrl ? (
                      <>
                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: '' })}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          title="Supprimer la photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            // Vérifier la taille du fichier (max 10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              alert('La photo est trop volumineuse (max 10MB)');
                              return;
                            }
                            
                            // Compresser et redimensionner l'image
                            const compressedDataUrl = await compressImage(file);
                            setFormData({ ...formData, photoUrl: compressedDataUrl });
                          } catch (err) {
                            console.error('Erreur compression image:', err);
                            alert('Erreur lors du traitement de l\'image');
                          }
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-gray-400">Format recommandé: Portrait (3:4) - Compression automatique</p>
                  </div>
                </div>
              </div>
            </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </div>
                <p className="text-red-700 font-medium">Erreur lors de l'ajout</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      <div className="hidden md:flex flex-col w-[400px] bg-gray-50 p-8 items-center justify-center relative">
        <button 
          onClick={onCancel} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="text-center mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Prévisualisation en direct</h3>
          <p className="text-xs text-gray-400 mt-1">Les modifications apparaissent instantanément</p>
        </div>

        <div className="scale-[1.1] shadow-2xl rounded-lg overflow-hidden">
          <IDCard 
            student={{
              ...formData,
              id: student?.id || 'preview',
              firstName: formData.firstName || 'Prénoms',
              lastName: formData.lastName || 'NOM',
              matricule: formData.matricule || 'MATRICULE',
              className: formData.className || 'CLASSE',
              schoolYear: formData.schoolYear || '2025-2026',
              birthDate: formData.birthDate || 'DATE',
              birthPlace: formData.birthPlace || 'LIEU',
            } as Student} 
            schoolInfo={schoolInfo} 
            showCuttingMarks={false}
          />
        </div>

        <div className="mt-12 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
          <p className="text-[10px] text-emerald-700 font-medium">
            Note: Les dimensions réelles seront respectées lors de l'impression A4.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};
