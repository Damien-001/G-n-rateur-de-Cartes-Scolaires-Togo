import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Printer, 
  Users, 
  Settings, 
  Trash2, 
  Edit2, 
  Search, 
  School as SchoolIcon,
  LayoutGrid,
  List as ListIcon,
  Download,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Student, SchoolInfo, DEFAULT_SCHOOL_INFO } from './types';
import { StudentForm } from './components/StudentForm';
import { ImportExport } from './components/ImportExport';
import { PrintLayout } from './components/PrintLayout';
import { IDCard } from './components/IDCard';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(DEFAULT_SCHOOL_INFO);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [view, setView] = useState<'manage' | 'preview'>('manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Load from local storage
  useEffect(() => {
    const savedStudents = localStorage.getItem('togo_students');
    const savedSchool = localStorage.getItem('togo_school');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedSchool) setSchoolInfo(JSON.parse(savedSchool));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('togo_students', JSON.stringify(students));
    localStorage.setItem('togo_school', JSON.stringify(schoolInfo));
  }, [students, schoolInfo]);

  const handleAddStudent = (student: Student) => {
    if (editingStudent) {
      setStudents(students.map(s => s.id === student.id ? student : s));
    } else {
      setStudents([...students, student]);
    }
    setIsFormOpen(false);
    setEditingStudent(undefined);
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      setStudents(students.filter(s => s.id !== id));
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleImport = (newStudents: Student[]) => {
    setStudents([...students, ...newStudents]);
  };

  const toggleSelect = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentsToPrint = selectedStudents.length > 0 
    ? students.filter(s => selectedStudents.includes(s.id))
    : students;

  if (view === 'preview') {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex items-center justify-between px-6 no-print">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('manage')}
              className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Retour à la gestion
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm text-gray-500 font-medium">
              Aperçu avant impression ({studentsToPrint.length} élèves)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Printer className="w-5 h-5" />
              Imprimer / PDF
            </button>
          </div>
        </div>
        <div className="pt-20 pb-12">
          <PrintLayout students={studentsToPrint} schoolInfo={schoolInfo} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <SchoolIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Générateur de Cartes</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Scolaire • Togo</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('preview')}
              disabled={students.length === 0}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Config */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">Configuration École</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom de l'établissement</label>
                  <input 
                    type="text" 
                    value={schoolInfo.name}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL du Logo</label>
                  <input 
                    type="text" 
                    value={schoolInfo.logoUrl}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, logoUrl: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Signature (Optionnel)</label>
                  <input 
                    type="text" 
                    value={schoolInfo.signatureUrl}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, signatureUrl: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Download className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">Import / Export</h2>
              </div>
              <ImportExport onImport={handleImport} students={students} />
            </section>

            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-100">
              <h3 className="font-bold text-lg mb-2">Guide d'impression</h3>
              <ul className="text-sm space-y-2 opacity-90">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Format A4 Portrait
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Marges: "Aucune" ou "Par défaut"
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Échelle: 100%
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Activer "Graphiques d'arrière-plan"
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content / List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un élève..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  {selectedStudents.length > 0 ? `${selectedStudents.length} sélectionnés` : `${students.length} élèves total`}
                </span>
                {selectedStudents.length > 0 && (
                  <button 
                    onClick={() => setSelectedStudents([])}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Désélectionner
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredStudents.map((student) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={student.id}
                    className={`group relative bg-white rounded-2xl p-4 border transition-all hover:shadow-md ${
                      selectedStudents.includes(student.id) ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{student.lastName} {student.firstName}</h3>
                        <p className="text-sm text-gray-500 font-medium">{student.className}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-1">{student.matricule}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <button 
                        onClick={() => toggleSelect(student.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                          selectedStudents.includes(student.id) 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {selectedStudents.includes(student.id) ? 'Sélectionné' : 'Sélectionner'}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredStudents.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <Users className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium">Aucun élève trouvé</p>
                  <button 
                    onClick={() => setIsFormOpen(true)}
                    className="mt-4 text-emerald-600 font-bold hover:underline"
                  >
                    Ajouter votre premier élève
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {isFormOpen && (
        <StudentForm 
          student={editingStudent}
          onSubmit={handleAddStudent}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingStudent(undefined);
          }}
        />
      )}
    </div>
  );
}
