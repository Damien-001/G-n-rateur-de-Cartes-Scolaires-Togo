import React, { useState } from 'react';
import { Student } from '../types';
import { X, Upload, Plus, Trash2, Edit2 } from 'lucide-react';

interface StudentFormProps {
  student?: Student;
  onSubmit: (student: Student) => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ student, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Student>>(
    student || {
      firstName: '',
      lastName: '',
      matricule: '',
      className: '',
      schoolYear: '2025-2026',
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
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
          <h2 className="text-xl font-bold text-emerald-900">
            {student ? 'Modifier l\'élève' : 'Ajouter un élève'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-emerald-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">URL de la Photo</label>
            <input
              type="url"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-top border-gray-100">
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
    </div>
  );
};
