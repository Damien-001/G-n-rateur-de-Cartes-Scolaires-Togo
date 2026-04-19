import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Printer, 
  Users, 
  Settings, 
  Trash2, 
  Edit2, 
  Search, 
  School as SchoolIcon,
  Download,
  ChevronRight,
  CheckCircle2,
  FileDown,
  Palette,
  LogOut,
  Loader2
} from 'lucide-react';
import { Student, SchoolInfo, DEFAULT_SCHOOL_INFO, DEFAULT_CARD_COLORS, COLOR_PRESETS, CardColors } from './types';
import { Session, logout } from './lib/auth';
import { fetchStudents, upsertStudent, deleteStudent, fetchSchoolInfo, saveSchoolInfo, insertStudents } from './lib/db';
import { StudentForm } from './components/StudentForm';
import { ImportExport } from './components/ImportExport';
import { PrintLayout } from './components/PrintLayout';
import { IDCard } from './components/IDCard';


interface AppProps {
  session: Session;
  onLogout: () => void;
}

export default function App({ session, onLogout }: AppProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(DEFAULT_SCHOOL_INFO);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [view, setView] = useState<'manage' | 'preview'>('manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const schoolInfoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = () => {
    const originalTitle = document.title;
    document.title = `cartes_scolaires_${new Date().toISOString().split('T')[0]}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  // ── Chargement initial depuis Supabase ──────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStudents(session.userId),
      fetchSchoolInfo(session.userId),
    ]).then(([fetchedStudents, fetchedSchool]) => {
      setStudents(fetchedStudents);
      setSchoolInfo(fetchedSchool ?? DEFAULT_SCHOOL_INFO);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [session.userId]);

  // ── Sauvegarde school_info avec debounce (évite trop d'appels) ──────────────
  useEffect(() => {
    if (loading) return;
    if (schoolInfoSaveTimer.current) clearTimeout(schoolInfoSaveTimer.current);
    schoolInfoSaveTimer.current = setTimeout(() => {
      saveSchoolInfo(schoolInfo, session.userId).catch(console.error);
    }, 800);
    return () => {
      if (schoolInfoSaveTimer.current) clearTimeout(schoolInfoSaveTimer.current);
    };
  }, [schoolInfo, session.userId, loading]);

  // ── CRUD Élèves ─────────────────────────────────────────────────────────────
  const handleAddStudent = async (student: Student) => {
    try {
      const saved = await upsertStudent(student, session.userId);
      if (editingStudent) {
        setStudents(students.map(s => s.id === saved.id ? saved : s));
      } else {
        setStudents([...students, saved]);
      }
    } catch (err) {
      console.error('Erreur sauvegarde élève:', err);
      alert('Erreur lors de la sauvegarde. Vérifiez votre connexion.');
    }
    setIsFormOpen(false);
    setEditingStudent(undefined);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) return;
    try {
      await deleteStudent(id);
      setStudents(students.filter(s => s.id !== id));
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleImport = async (newStudents: Student[]) => {
    try {
      const saved = await insertStudents(newStudents, session.userId);
      setStudents(prev => [...prev, ...saved]);
    } catch (err) {
      console.error('Erreur import:', err);
      alert('Erreur lors de l\'import : ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
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

  // Écran de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Chargement des données...</p>
      </div>
    );
  }

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
              onClick={generatePDF}
              className="flex items-center gap-2 px-5 py-2 border-2 border-[#047857] text-[#047857] rounded-full font-bold hover:bg-emerald-50 transition-all"
            >
              <FileDown className="w-5 h-5" />
              Télécharger PDF
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-[#047857] text-white rounded-full font-bold hover:bg-[#065f46] transition-all shadow-lg shadow-emerald-200"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
          </div>
        </div>
        <div className="pt-20 pb-12 print:pt-0 print:pb-0">
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

          <div className="flex items-center gap-3">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {session.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{session.fullName}</span>
            </div>

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
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo de l'école</label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {schoolInfo.logoUrl ? (
                        <img src={schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <SchoolIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSchoolInfo({ ...schoolInfo, logoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Signature / Cachet</label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {schoolInfo.signatureUrl ? (
                        <img src={schoolInfo.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                      ) : (
                        <Edit2 className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSchoolInfo({ ...schoolInfo, signatureUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Color Customization */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-5">
                <Palette className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">Couleurs de la carte</h2>
              </div>

              {/* Presets */}
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Thèmes prédéfinis</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      title={preset.name}
                      onClick={() => setSchoolInfo({ ...schoolInfo, cardColors: preset.colors })}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div
                        className="w-full h-8 rounded-lg border-2 transition-all group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${preset.colors.headerBg} 60%, ${preset.colors.footerBar} 100%)`,
                          borderColor: schoolInfo.cardColors?.headerBg === preset.colors.headerBg
                            ? preset.colors.headerBg
                            : 'transparent',
                          boxShadow: schoolInfo.cardColors?.headerBg === preset.colors.headerBg
                            ? `0 0 0 2px ${preset.colors.headerBg}40`
                            : 'none',
                        }}
                      />
                      <span className="text-[10px] text-gray-500 font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom pickers */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase">Personnaliser</p>
                {[
                  { key: 'headerBg' as keyof CardColors, label: 'Fond du header' },
                  { key: 'headerText' as keyof CardColors, label: 'Texte du header' },
                  { key: 'footerBar' as keyof CardColors, label: 'Barre du bas' },
                  { key: 'matriculeText' as keyof CardColors, label: 'Couleur matricule' },
                ].map(({ key, label }) => {
                  const currentColors = { ...DEFAULT_CARD_COLORS, ...schoolInfo.cardColors };
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono">{currentColors[key]}</span>
                        <label className="cursor-pointer">
                          <div
                            className="w-7 h-7 rounded-md border-2 border-gray-200 overflow-hidden shadow-sm hover:scale-110 transition-transform"
                            style={{ backgroundColor: currentColors[key] }}
                          />
                          <input
                            type="color"
                            value={currentColors[key]}
                            onChange={(e) => setSchoolInfo({
                              ...schoolInfo,
                              cardColors: { ...currentColors, [key]: e.target.value }
                            })}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
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
              {filteredStudents.map((student) => (
                  <div
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
                  </div>
                ))}

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
          schoolInfo={schoolInfo}
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
