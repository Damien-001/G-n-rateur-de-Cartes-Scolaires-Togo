import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
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
import { fetchStudents, upsertStudent, deleteStudent, deleteStudents, fetchSchoolInfo, saveSchoolInfo, insertStudents } from './lib/db';
import { startInactivityTimer, stopInactivityTimer } from './lib/inactivity';
import { StudentForm } from './components/StudentForm';
import { ImportExport } from './components/ImportExport';
import { PrintLayout } from './components/PrintLayout';
import { IDCard } from './components/IDCard';
import { SchoolSettings } from './components/SchoolSettings';
import { ConfirmDialog } from './components/ConfirmDialog';
import PrivacyPolicy from './components/PrivacyPolicy';
import DataManagement from './components/DataManagement';
import CookieConsent from './components/CookieConsent';


interface AppProps {
  session: Session;
  onLogout: () => void;
}

export default function App({ session, onLogout }: AppProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(DEFAULT_SCHOOL_INFO);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSchoolSettingsOpen, setIsSchoolSettingsOpen] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
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

  // ── Timer d'inactivité — déconnexion après 30 min ───────────────────────────
  useEffect(() => {
    const handleTimeout = async () => {
      setShowInactivityWarning(false);
      await logout();
      onLogout();
    };

    // Avertissement 1 minute avant la déconnexion (à 29 min d'inactivité)
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

  // ── Déconnexion lors de la fermeture de l'application ───────────────────────
  // NOTE : Pas de déconnexion au beforeunload/visibilitychange.
  // La déconnexion se fait uniquement après 1h d'inactivité (timer dans inactivity.ts)
  // ou sur action explicite de l'utilisateur (bouton "Se déconnecter").

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

      // ✅ Attendre que toutes les images soient chargées
      const images = document.querySelectorAll<HTMLImageElement>('.a4-page img');
      await Promise.all(
        Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => {
              console.warn('Image failed to load:', img.src);
              resolve(null); // Continue même si une image échoue
            };
            // Timeout de 10 secondes par image
            setTimeout(() => resolve(null), 10000);
          });
        })
      );

      // Petit délai supplémentaire pour s'assurer que tout est rendu
      await new Promise(resolve => setTimeout(resolve, 500));

      // Importation dynamique des librairies lourdes (code-splitting)
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      // ✅ NOUVELLE APPROCHE: Capturer toutes les pages en une seule fois
      const container = document.querySelector<HTMLElement>('.print-layout-container');
      if (!container) {
        alert('Conteneur d\'impression introuvable.');
        return;
      }

      // Calculer la hauteur totale nécessaire
      const totalHeight = Array.from(pages).reduce((sum, page) => sum + page.offsetHeight, 0);
      const pageWidth = pages[0].offsetWidth;

      // Capturer tout le conteneur en une seule image
      const canvas = await html2canvas(container, {
        scale: 3,           // Résolution élevée (réduit de 5 à 3 pour éviter les problèmes de mémoire)
        useCORS: true,      // images cross-origin (photos Supabase)
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: pageWidth,
        height: totalHeight,
      });

      // Créer un PDF avec une seule page de la hauteur nécessaire
      const A4_W_MM = 210;
      const heightMM = (totalHeight / pageWidth) * A4_W_MM;

      const pdf = new jsPDF({ 
        orientation: heightMM > A4_W_MM ? 'portrait' : 'landscape', 
        unit: 'mm', 
        format: [A4_W_MM, heightMM] 
      });

      // ✅ Utiliser PNG pour éviter la compression JPEG et garder la netteté maximale
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, A4_W_MM, heightMM, undefined, 'NONE');

      const date = new Date().toISOString().split('T')[0];
      pdf.save(`cartes_scolaires_${date}.pdf`);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF: ' + (error instanceof Error ? error.message : String(error)));
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
      
      // Timeout réduit à 15 secondes pour un feedback plus rapide
      loadingTimer.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000);
      
      try {
        // ✅ OPTIMISATION : Charger en parallèle pour optimiser le temps
        const [fetchedSchool, fetchedStudents] = await Promise.all([
          fetchSchoolInfo(session.userId),
          fetchStudents(session.userId)
        ]);

        setSchoolInfo(fetchedSchool ?? DEFAULT_SCHOOL_INFO);
        setStudents(fetchedStudents);
        
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(0);
        console.log(`🚀 Chargement total en ${duration}ms`);
        
        // Log performance pour diagnostic
        if (parseInt(duration) > 3000) {
          console.warn('⚠️ Chargement lent détecté (>3s). Vérifiez votre connexion internet.');
        }
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
    }, 1000); // Réduit à 1s pour sauvegarder plus rapidement
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
      await deleteStudent(id, session.userId);
      setStudents(prev => prev.filter(s => s.id !== id));
      setSelectedStudents(prev => prev.filter(sid => sid !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression.');
    }
  }, [session.userId]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedStudents.length === 0) return;
    const n = selectedStudents.length;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${n} élève${n > 1 ? 's' : ''} ? Cette action est irréversible.`)) return;
    try {
      await deleteStudents(selectedStudents, session.userId);
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
      setSelectedStudents([]);
    } catch (err) {
      console.error('Erreur suppression massive:', err);
      alert('Erreur lors de la suppression en masse.');
    }
  }, [selectedStudents, session.userId]);

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
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-gray-800 font-semibold">Chargement en cours</p>
          <p className="text-gray-400 text-sm mt-1">Connexion à Supabase...</p>
        </div>
        {loadingTimeout && (
          <div className="mt-6 p-6 bg-white border border-red-100 rounded-2xl max-w-md shadow-sm">
            <p className="text-red-700 font-semibold mb-2">Connexion lente détectée</p>
            <p className="text-sm text-gray-600 mb-4">Le chargement prend plus de 15 secondes. Vérifiez votre connexion ou la configuration Supabase.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Recharger la page
            </button>
          </div>
        )}
      </div>
    );
  }
  if (view === 'preview') {
    return (
      <div className="min-h-screen bg-neutral-900">
        <div className="fixed top-0 left-0 right-0 h-14 bg-neutral-900/95 backdrop-blur border-b border-white/10 z-50 flex items-center justify-between px-6 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('manage')}
              className="flex items-center gap-2 text-neutral-400 hover:text-white font-medium transition-colors text-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">Retour</span>
            </button>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-neutral-500 text-sm hidden sm:inline">
              {studentsToPrint.length} carte{studentsToPrint.length > 1 ? 's' : ''} à imprimer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Génération...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Télécharger PDF</span>
                </>
              )}
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
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Bandeau d'avertissement inactivité */}
      {showInactivityWarning && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between shadow-lg no-print">
          <p className="text-sm font-medium">
            Inactivité — déconnexion dans <strong>1 minute</strong>.
          </p>
          <button onClick={() => setShowInactivityWarning(false)} className="text-white font-semibold text-sm underline hover:no-underline ml-4">
            Rester connecté
          </button>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center shrink-0">
              <SchoolIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 leading-none">Cartes Scolaires</h1>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Togo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
              <div className="w-6 h-6 bg-emerald-700 rounded-md flex items-center justify-center text-white text-[10px] font-bold">
                {session.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-gray-600 max-w-[100px] truncate">{session.fullName}</span>
            </div>
            <button onClick={() => setView('preview')} disabled={students.length === 0}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg font-semibold hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <FileDown className="w-4 h-4" />
              Télécharger PDF
            </button>
            <button onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
            <button onClick={handleLogout} title="Se déconnecter"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <LogOut className="w-4 h-4" />
            </button>
            <button onClick={() => setShowDataManagement(true)} title="Mes données"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6">
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <section className="bg-white rounded-2xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Configuration de l'école
                </h2>
                <button onClick={() => setIsSchoolSettingsOpen(true)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Avancé →
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nom de l'établissement</label>
                  <input type="text" value={schoolInfo.name}
                    onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
                </div>
                {/* Logo + Signature + Cachet */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { field: 'logoUrl' as const, label: 'Logo', icon: <SchoolIcon className="w-5 h-5 text-gray-200" />, rounded: 'rounded-xl' },
                    { field: 'signatureUrl' as const, label: 'Signature', icon: <Edit2 className="w-5 h-5 text-gray-200" />, rounded: 'rounded-xl' },
                    { field: 'stampUrl' as const, label: 'Cachet', icon: <div className="w-5 h-5 border-2 border-gray-200 rounded-full" />, rounded: 'rounded-full' },
                  ].map(({ field, label, icon, rounded }) => (
                    <div key={field}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                      <label className="cursor-pointer block">
                        <div className={`relative w-full aspect-square bg-gray-50 border border-dashed border-gray-200 ${rounded} flex items-center justify-center overflow-hidden hover:border-emerald-300 hover:bg-emerald-50/50 transition-all`}>
                          {schoolInfo[field] ? (
                            <>
                              <img src={schoolInfo[field]} alt={label} crossOrigin="anonymous" className="w-full h-full object-contain p-1.5" />
                              <button type="button"
                                onClick={(e) => { e.preventDefault(); setSchoolInfo({ ...schoolInfo, [field]: undefined }); }}
                                className="absolute top-1 right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow text-[8px] transition-colors">✕</button>
                            </>
                          ) : icon}
                        </div>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { const r = new FileReader(); r.onloadend = () => setSchoolInfo({ ...schoolInfo, [field]: r.result as string }); r.readAsDataURL(file); }
                          }} />
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400">Cliquez sur une zone pour importer</p>
              </div>
            </section>

            {/* Couleurs */}
            <section className="bg-white rounded-2xl p-5 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-gray-400" />
                Couleurs de la carte
              </h2>
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Thèmes</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button key={preset.name} title={preset.name}
                      onClick={() => {
                        const newInfo = { ...schoolInfo, cardColors: preset.colors };
                        setSchoolInfo(newInfo);
                        saveSchoolInfo(newInfo, session.userId).catch(console.error);
                      }}
                      className="group flex flex-col items-center gap-1.5">
                      <div className="w-full h-7 rounded-lg transition-all group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${preset.colors.headerBg} 55%, ${preset.colors.footerBar} 100%)`,
                          outline: schoolInfo.cardColors?.headerBg === preset.colors.headerBg ? `2px solid ${preset.colors.headerBg}` : '2px solid transparent',
                          outlineOffset: 2,
                        }} />
                      <span className="text-[9px] text-gray-400">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Personnaliser</p>
                {[
                  { key: 'headerBg' as keyof CardColors, label: 'Fond header' },
                  { key: 'headerText' as keyof CardColors, label: 'Texte header' },
                  { key: 'footerBar' as keyof CardColors, label: 'Barre du bas' },
                  { key: 'matriculeText' as keyof CardColors, label: 'Matricule' },
                ].map(({ key, label }) => {
                  const currentColors = { ...DEFAULT_CARD_COLORS, ...schoolInfo.cardColors };
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-300 font-mono">{currentColors[key]}</span>
                        <label className="cursor-pointer">
                          <div className="w-6 h-6 rounded-md border border-gray-100 hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: currentColors[key] }} />
                          <input type="color" value={currentColors[key]}
                            onChange={(e) => setSchoolInfo({ ...schoolInfo, cardColors: { ...currentColors, [key]: e.target.value } })}
                            className="sr-only" />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Download className="w-4 h-4 text-gray-400" />
                Import / Export
              </h2>
              <ImportExport onImport={handleImport} students={students} />
            </section>

            <section className="bg-emerald-700 rounded-2xl p-5 text-white">
              <h3 className="font-bold text-sm mb-3">Guide d'impression</h3>
              <ul className="text-xs space-y-2 text-emerald-100">
                {[
                  'Format A4 Portrait',
                  'Marges : "Aucune" ou "Par défaut"',
                  'Échelle : 100%',
                  'Activer "Graphiques d\'arrière-plan"',
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Main content — liste des élèves */}
          <div className="lg:col-span-8 space-y-4">
            {/* Barre de recherche + stats */}
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-3 rounded-2xl border border-gray-200">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="text" placeholder="Rechercher par nom ou matricule..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-medium text-gray-400 tabular-nums">
                  {students.length} élève{students.length > 1 ? 's' : ''}
                </span>
                <button onClick={handleSelectAll} disabled={filteredStudents.length === 0}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? 'Désélectionner tout' : 'Tout sélectionner'}
                </button>
              </div>
            </div>

            {/* Action contextuelle suppression massive */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <p className="text-sm font-semibold text-red-800">
                    {selectedStudents.length} élève{selectedStudents.length > 1 ? 's' : ''} sélectionné{selectedStudents.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedStudents([])}
                    className="text-xs font-semibold px-3 py-1.5 text-gray-500 hover:text-gray-700 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all active:scale-95">
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStudents.map((student) => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleSelect(student.id)}
                    className={`group relative bg-white rounded-xl p-4 border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-100'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Selection indicator */}
                    <div
                      className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-gray-200 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className={`w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border bg-gray-50 ${
                        isSelected ? 'border-emerald-200' : 'border-gray-100'
                      }`}>
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-5">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{student.lastName} {student.firstName}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{student.className}</p>
                        <p className="text-xs text-emerald-600 font-semibold mt-1 tabular-nums">{student.matricule}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="mt-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => handleEditStudent(student)}
                        className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Modifier">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteStudent(student.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}


              {filteredStudents.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-gray-200" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {searchTerm ? 'Aucun résultat' : 'Aucun élève pour l\'instant'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 mb-5">
                    {searchTerm ? `Aucun élève ne correspond à "${searchTerm}"` : 'Commencez par ajouter votre premier élève'}
                  </p>
                  {!searchTerm && (
                    <button onClick={() => setIsFormOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg font-semibold transition-all active:scale-95">
                      <Plus className="w-4 h-4" />
                      Ajouter un élève
                    </button>
                  )}
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

      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}

      {showDataManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Mes données</h2>
              <button onClick={() => setShowDataManagement(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <DataManagement userId={session.userId} userEmail={session.email} />
            </div>
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-between items-center">
              <button onClick={() => setShowPrivacyPolicy(true)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Politique de confidentialité
              </button>
              <button onClick={() => setShowDataManagement(false)}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <CookieConsent />
    </div>
  );
}
