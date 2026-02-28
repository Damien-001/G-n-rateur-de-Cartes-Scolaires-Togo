import React, { useState } from 'react';
import { Student, SchoolInfo } from '../types';
import { X, Upload, Plus, Trash2, Edit2 } from 'lucide-react';
import { IDCard } from './IDCard';

interface StudentFormProps {
  student?: Student;
  schoolInfo: SchoolInfo;
  onSubmit: (student: Student) => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ student, schoolInfo, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Student>>(
    student || {
      firstName: '',
      lastName: '',
      matricule: '',
      className: '',
      schoolYear: '2025-2026',
      birthDate: '',
      birthPlace: '',
      examCenter: '',
      photoUrl: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: student?.id || Math.random().toString(36).substr(2, 9),
    } as Student);
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
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Classe</label>
                <input
                  required
                  type="text"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: Terminale C"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Année Scolaire</label>
                <input
                  required
                  type="text"
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: 2025-2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date Naiss.</label>
                  <input
                    type="text"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ex: 12/05/2008"
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
          </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Photo de l'élève</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, photoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-gray-400">Format recommandé: Portrait (3:4)</p>
                  </div>
                </div>
              </div>
            </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
              {student ? 'Mettre à jour' : 'Ajouter'}
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
