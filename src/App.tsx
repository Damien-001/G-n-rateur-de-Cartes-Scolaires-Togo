import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Trash2, 
  Search, 
  ChevronRight,
  FileDown,
  Loader2,
  Plus,
  Users,
  Palette
} from 'lucide-react';
import { Student, SchoolInfo, DEFAULT_SCHOOL_INFO, DEFAULT_CARD_COLORS, COLOR_PRESETS, CardColors } from './types';
import { Session, logout } from './lib/auth';
import { fetchStudents, upsertStudent, deleteStudent, deleteStudents, fetchSchoolInfo, saveSchoolInfo, insertStudents } from './lib/db';
import { startInactivityTimer, stopInactivityTimer } from './lib/inactivity';
import { StudentForm } from './components/StudentForm';
import { ImportExport } from './components/ImportExport';
import { PrintLayout } from './components/PrintLayout';
import { IDCard } from './components/IDCard';
import { SchoolSettings } from './components/SchoolSettings';
import { DashboardHeader } from './components/DashboardHeader';
import { SchoolConfigSidebar } from './components/SchoolConfigSidebar';
import { StudentCardItem } from './components/StudentCardItem';


interface AppProps {
  session: Session;
  onLogout: () => void;
}

export default function App({ session, onLogout }: AppProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(DEFAULT_SCHOOL_INFO);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSchoolSettingsOpen, setIsSchoolSettingsOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [view, setView] = useState<'manage' | 'preview'>('manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const schoolInfoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer d'inactivité — déconnexion après 10 min ───────────────────────────
  useEffect(() => {
    const handleTimeout = async () => {
      setShowInactivityWarning(false);
      await logout();
      onLogout();
    };

    // Avertissement 1 minute avant la déconnexion (à 9 min d'inactivité)
    const handleWarning = () => {
      setShowInactivityWarning(true);
      warningTimer.current = setTimeout(() => setShowInactivityWarning(false), 60000);
    };

    startInactivityTimer(handleTimeout, handleWarning);

    return () => {
      stopInactivityTimer();
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [onLogout]);


  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    // Courte pause pour laisser React mettre à jour le bouton
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      // Récupérer toutes les pages A4 rendues dans le DOM
      const pages = document.querySelectorAll<HTMLElement>('.a4-page');
      if (pages.length === 0) {
        alert('Aucune page à exporter.');
        return;
      }

      // A4 en mm: 210 × 297
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const A4_W_MM = 210;
      const A4_H_MM = 297;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = await html2canvas(page, {
          scale: 2,           // haute résolution
          useCORS: true,      // images cross-origin (photos Supabase)
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, A4_W_MM, A4_H_MM);
      }

      const date = new Date().toISOString().split('T')[0];
      pdf.save(`cartes_scolaires_${date}.pdf`);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ── Chargement initial depuis Supabase ──────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingTimeout(false);
      const startTime = performance.now();
      
      // Timeout de 15 secondes pour connexions lentes
      loadingTimer.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000);
      
      try {
        // Charger school_info d'abord (plus rapide)
        const fetchedSchool = await fetchSchoolInfo(session.userId);
        setSchoolInfo(fetchedSchool ?? DEFAULT_SCHOOL_INFO);
        
        // Puis charger les étudiants
        const fetchedStudents = await fetchStudents(session.userId);
        setStudents(fetchedStudents);
        
        const endTime = performance.now();
        console.log(`🚀 Chargement total en ${(endTime - startTime).toFixed(0)}ms`);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        // Continuer même en cas d'erreur
        setSchoolInfo(DEFAULT_SCHOOL_INFO);
        setStudents([]);
      } finally {
        if (loadingTimer.current) clearTimeout(loadingTimer.current);
        setLoading(false);
        setLoadingTimeout(false);
      }
    };
    
    loadData();
    
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, [session.userId]);

  // ── Sauvegarde school_info avec debounce (évite trop d'appels) ──────────────
  useEffect(() => {
    if (loading) return;
    if (schoolInfoSaveTimer.current) clearTimeout(schoolInfoSaveTimer.current);
    schoolInfoSaveTimer.current = setTimeout(() => {
      saveSchoolInfo(schoolInfo, session.userId)
        .catch(err => {
          console.error('Erreur sauvegarde school info:', err);
          // Ne pas afficher d'alerte pour ne pas gêner l'utilisateur
        });
    }, 2000); // Augmenté à 2s pour éviter les timeouts
    return () => {
      if (schoolInfoSaveTimer.current) clearTimeout(schoolInfoSaveTimer.current);
    };
  }, [schoolInfo, session.userId, loading]);

  // ── CRUD Élèves ─────────────────────────────────────────────────────────────
  const handleAddStudent = useCallback(async (student: Student) => {
    console.log('🚀 Début handleAddStudent avec:', student);
    console.log('👤 Session userId:', session.userId);
    
    try {
      console.log('💾 Appel upsertStudent...');
      const saved = await upsertStudent(student, session.userId);
      console.log('✅ Étudiant sauvegardé:', saved);
      
      setStudents(prev => {
        const isEdit = prev.some(s => s.id === saved.id);
        if (isEdit) {
          return prev.map(s => s.id === saved.id ? saved : s);
        } else {
          return [...prev, saved];
        }
      });
      
      // Fermer le formulaire seulement en cas de succès
      setIsFormOpen(false);
      setEditingStudent(undefined);
      console.log('✅ Formulaire fermé avec succès');
      
    } catch (err) {
      console.error('❌ Erreur sauvegarde élève:', err);
      // Ne pas fermer le formulaire en cas d'erreur
      // L'erreur sera affichée dans le formulaire
      throw err; // Relancer l'erreur pour que le formulaire puisse l'afficher
    }
  }, [session.userId]);

  const handleDeleteStudent = useCallback(async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) return;
    try {
      await deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      setSelectedStudents(prev => prev.filter(sid => sid !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression.');
    }
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedStudents.length === 0) return;
    const n = selectedStudents.length;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${n} élève${n > 1 ? 's' : ''} ? Cette action est irréversible.`)) return;
    try {
      await deleteStudents(selectedStudents);
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
      setSelectedStudents([]);
    } catch (err) {
      console.error('Erreur suppression massive:', err);
      alert('Erreur lors de la suppression en masse.');
    }
  }, [selectedStudents]);

  const filteredStudents = React.useMemo(() =>
    students.filter(s =>
      `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  }, [selectedStudents, filteredStudents]);

  const handleImport = useCallback(async (newStudents: Student[]) => {
    try {
      const saved = await insertStudents(newStudents, session.userId);
      setStudents(prev => [...prev, ...saved]);
    } catch (err) {
      console.error('Erreur import:', err);
      alert('Erreur lors de l\'import : ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }, [session.userId]);

  const handleEditStudent = useCallback((student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    onLogout();
  }, [onLogout]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  }, []);



  const studentsToPrint = React.useMemo(() => 
    selectedStudents.length > 0 
      ? students.filter(s => selectedStudents.includes(s.id))
      : students,
    [students, selectedStudents]
  );

  // Écran de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-700 font-bold text-lg">Chargement des données...</p>
        <p className="text-gray-500 text-sm">Connexion à Supabase en cours...</p>
        {loadingTimeout && (
          <div className="mt-4 p-6 bg-red-50 border-2 border-red-200 rounded-xl max-w-lg">
            <p className="text-red-800 font-bold mb-3 text-center text-lg">⚠️ Problème de Connexion Détecté</p>
            <div className="space-y-3 text-sm text-red-700 mb-4">
              <p className="font-semibold">Le chargement prend plus de 15 secondes. Causes possibles :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Connexion internet lente ou instable</li>
                <li>Configuration Supabase incorrecte dans le fichier .env</li>
                <li>Serveur Supabase temporairement indisponible</li>
                <li>Trop de données à charger (images lourdes)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                🔄 Recharger la page
              </button>
              <a
                href="https://status.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-white hover:bg-gray-50 text-red-700 font-medium rounded-lg border-2 border-red-200 transition-colors text-center"
              >
                Vérifier le statut de Supabase
              </a>
            </div>
          </div>
        )}
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
              className="flex items-center gap-2 text-gray-600 hover-brand font-medium transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Retour à la gestion
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm text-gray-500 font-medium">
              Aperçu avant impression ({studentsToPrint.length} élèves)
            </span>
          </div>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 brand-text" />
              <h2 className="font-bold text-gray-900">Couleurs de la carte</h2>
            </div>
            <button
              onClick={generatePDF}
              title="Ouvre la fenêtre d'impression — choisissez 'Enregistrer en PDF' comme destination"
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ouverture...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  Télécharger le PDF
                </>
              )}
            </button>
          </div>
        <div className="pt-20 pb-12 print:pt-0 print:pb-0">
          <PrintLayout students={studentsToPrint} schoolInfo={schoolInfo} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col pt-2">
      {/* Bandeau d'avertissement inactivité */}
      {showInactivityWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-white px-6 py-3.5 rounded-2xl flex items-center justify-between shadow-xl shadow-amber-950/10 no-print border border-amber-400/20 max-w-md w-full animate-bounce-once">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏱️</span>
            <p className="text-sm font-semibold">
              Déconnexion dans <strong>1 minute</strong> par inactivité.
            </p>
          </div>
          <button
            onClick={() => { setShowInactivityWarning(false); }}
            className="text-white font-bold text-xs uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all ml-4"
          >
            Rester
          </button>
        </div>
      )}

      {/* Header */}
      <DashboardHeader
        session={session}
        studentsCount={students.length}
        onPreviewClick={() => setView('preview')}
        onAddClick={() => setIsFormOpen(true)}
        onLogoutClick={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Config */}
          <div className="lg:col-span-4 space-y-6">
            <SchoolConfigSidebar
              schoolInfo={schoolInfo}
              setSchoolInfo={setSchoolInfo}
              setIsSchoolSettingsOpen={setIsSchoolSettingsOpen}
              students={students}
              onImport={handleImport}
            />
          </div>

          {/* Main Content / List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Barre de recherche */}
            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un élève..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus-brand outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500">
                    {students.length} élève{students.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={handleSelectAll}
                    disabled={filteredStudents.length === 0}
                    className="text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-sm cursor-pointer"
                  >
                    {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                </div>
              </div>
            </div>

            {/* Barre d'action contextuelle — suppression massive */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-5 py-3 shadow-sm animate-pulse-once">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800">
                      {selectedStudents.length} élève{selectedStudents.length > 1 ? 's' : ''} sélectionné{selectedStudents.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-red-500">Choisissez une action ci-dessous</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStudents([])}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md shadow-red-200 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer la sélection
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStudents.map((student) => (
                <StudentCardItem
                  key={student.id}
                  student={student}
                  isSelected={selectedStudents.includes(student.id)}
                  onToggleSelect={toggleSelect}
                  onEdit={handleEditStudent}
                  onDelete={handleDeleteStudent}
                />
              ))}


              {filteredStudents.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-200/60 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-800 opacity-80 mb-4 border border-emerald-100">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-gray-800">Aucun élève trouvé</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs text-center leading-relaxed">
                    Commencez par ajouter un élève manuellement ou importez une liste au format CSV.
                  </p>
                  <button 
                    onClick={() => setIsFormOpen(true)}
                    className="mt-6 btn-primary"
                  >
                    <Plus className="w-4 h-4" /> Ajouter votre premier élève
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

      {isSchoolSettingsOpen && (
        <SchoolSettings
          schoolInfo={schoolInfo}
          onUpdate={setSchoolInfo}
          onClose={() => setIsSchoolSettingsOpen(false)}
        />
      )}
    </div>
  );
}
