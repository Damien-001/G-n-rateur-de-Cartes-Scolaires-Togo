import React, { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import {
  Trash2,
  Search,
  GraduationCap,
  LayoutGrid,
  Printer,
  Upload,
  ChevronRight,
  ChevronLeft,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Plus,
  Users,
  Palette,
  Settings,
  LogOut,
  CreditCard,
  Shield,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Lock,
  Ban,
  Filter,
  CheckCircle2,
  Menu,
  X,
  Maximize2,
  Minimize2,
  FileText,
  Sparkles
} from 'lucide-react';
import { Student, SchoolInfo, DEFAULT_SCHOOL_INFO, DEFAULT_CARD_COLORS, COLOR_PRESETS, CardColors } from './types';
import { Session, logout } from './lib/auth';
import { fetchStudents, upsertStudent, deleteStudent, deleteStudents, fetchSchoolInfo, saveSchoolInfo, insertStudents, saveAdminLog, registerSchoolRecord, isValidUuid } from './lib/db';
import { setStoredSchoolInfo } from './lib/offlineStorage';
import { recordPageView } from './lib/analytics';
import { formatDateDisplay } from './lib/utils';
import { startInactivityTimer, stopInactivityTimer } from './lib/inactivity';
import { ClassDirectoryView } from './components/ClassDirectoryView';
import { ImportExport } from './components/ImportExport';
import { IDCard } from './components/IDCard';
import { IDCardBack } from './components/IDCardBack';
import { SchoolSettings } from './components/SchoolSettings';
import { SchoolConfigSidebar } from './components/SchoolConfigSidebar';
import { StudentCardItem } from './components/StudentCardItem';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { SchoolChatDrawer } from './components/SchoolChatDrawer';
import { CardVerificationModal } from './components/CardVerificationModal';

// Code-splitting via React.lazy pour les vues volumineuses
const StudentForm = React.lazy(() => import('./components/StudentForm').then(m => ({ default: m.StudentForm })));
const ClassImportModal = React.lazy(() => import('./components/ClassImportModal').then(m => ({ default: m.ClassImportModal })));
const PrintLayout = React.lazy(() => import('./components/PrintLayout').then(m => ({ default: m.PrintLayout })));
const SchoolSettingsView = React.lazy(() => import('./components/SchoolSettingsView').then(m => ({ default: m.SchoolSettingsView })));
const CardDesignView = React.lazy(() => import('./components/CardDesignView').then(m => ({ default: m.CardDesignView })));
const AdminDashboardView = React.lazy(() => import('./components/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));


interface AppProps {
  session: Session;
  onLogout: () => void;
}

export default function App({ session, onLogout }: AppProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => ({
    ...DEFAULT_SCHOOL_INFO,
    name: session.schoolName
      ? session.schoolName.toUpperCase()
      : (session.isOfflineGuest ? 'ÉCOLE NATIONALE DU TOGO' : ''),
    schoolType: session.schoolType || 'Lycée',
    location: session.location || '',
    phone: session.phone || '',
  }));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSchoolSettingsOpen, setIsSchoolSettingsOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [printMode, setPrintMode] = useState<'recto' | 'recto-verso'>('recto');
  const [cardsPerPage, setCardsPerPage] = useState<8 | 10>(10);
  const [mobileFitScreen, setMobileFitScreen] = useState<boolean>(true);
  const [printViewStyle, setPrintViewStyle] = useState<'cards' | 'sheet'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'sheet';
  });
  const [downloadReadyModal, setDownloadReadyModal] = useState<{
    url: string;
    filename: string;
    count: number;
  } | null>(null);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'design' | 'print' | 'settings' | 'billing'>('students');
  const isSuperAdminUser = session.userId === 'admin-super-user-id' ||
    session.email?.toLowerCase().trim() === 'admin@sukupass.tg' ||
    session.email?.toLowerCase().trim() === 'admin@cardschool.tg';
  const [isAdminView, setIsAdminView] = useState(isSuperAdminUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cardschool_school_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cardschool_school_sidebar_open', String(next));
      } catch { }
      return next;
    });
  };
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [printClassFilter, setPrintClassFilter] = useState<string>('all');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('all');
  const [studentViewMode, setStudentViewMode] = useState<'cards' | 'classes'>('cards');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetClass, setImportTargetClass] = useState<string | undefined>(undefined);

  const handleOpenImportModal = (targetClass?: string) => {
    setImportTargetClass(targetClass || (studentClassFilter !== 'all' ? studentClassFilter : undefined));
    setIsImportModalOpen(true);
  };

  const handleExportClassCSV = async (cls: string) => {
    const isAll = !cls || cls === 'all';
    const list = isAll ? students : students.filter(s => s.className === cls);
    if (list.length === 0) {
      alert(!isAll ? `Aucun élève trouvé dans la classe ${cls}.` : 'Aucun élève à exporter.');
      return;
    }
    const dataToExport = list.map(s => ({
      nom: s.lastName,
      prenom: s.firstName,
      matricule: s.matricule,
      classe: s.className,
      annee_scolaire: s.schoolYear || '2025-2026',
      date_naissance: formatDateDisplay(s.birthDate),
      lieu_naissance: s.birthPlace || '',
      centre_examen: s.examCenter || '',
      photo_url: s.photoUrl || '',
      date_expiration: formatDateDisplay(s.expirationDate),
    }));
    const csv = Papa.unparse(dataToExport, {
      columns: ['nom', 'prenom', 'matricule', 'classe', 'annee_scolaire', 'date_naissance', 'lieu_naissance', 'centre_examen', 'photo_url', 'date_expiration'],
      delimiter: ';',
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const classSuffix = !isAll ? `_${cls.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
    link.setAttribute('download', `eleves${classSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadClassTemplate = async (cls: string) => {
    const templateClass = cls && cls !== 'all' ? cls : '6ème A';
    const sample = [
      {
        nom: 'KOFFI',
        prenom: 'Jean',
        matricule: '2025-TG-001',
        classe: templateClass,
        annee_scolaire: '2025-2026',
        date_naissance: '12/05/2010',
        lieu_naissance: 'Lomé',
        centre_examen: 'Lycée de Tokoin',
        photo_url: '',
        date_expiration: '31/12/2026',
      },
      {
        nom: 'MENSAH',
        prenom: 'Afi',
        matricule: '2025-TG-002',
        classe: templateClass,
        annee_scolaire: '2025-2026',
        date_naissance: '24/09/2011',
        lieu_naissance: 'Kpalimé',
        centre_examen: 'Lycée de Tokoin',
        photo_url: '',
        date_expiration: '31/12/2026',
      }
    ];

    const csv = Papa.unparse(sample, {
      columns: ['nom', 'prenom', 'matricule', 'classe', 'annee_scolaire', 'date_naissance', 'lieu_naissance', 'centre_examen', 'photo_url', 'date_expiration'],
      delimiter: ';',
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const classSuffix = templateClass.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `modele_eleves_${classSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const schoolInfoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscription & Restrictions state
  const isPlanExpired = schoolInfo.subscriptionPlan === 'pro' && !!schoolInfo.subscriptionExpiresAt && new Date(schoolInfo.subscriptionExpiresAt).getTime() < Date.now();
  const isEffectivePro = schoolInfo.subscriptionPlan === 'pro' && !isPlanExpired;
  const isAccountSuspended = schoolInfo.subscriptionPlan === 'suspended';
  const effectiveQuota = schoolInfo.customQuota || 15;
  const isQuotaExceeded = !isEffectivePro && students.length >= effectiveQuota;

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
    if (isAccountSuspended) {
      alert("⚠️ Votre compte est actuellement suspendu. Le téléchargement et l'impression de cartes scolaires sont bloqués. Veuillez contacter le support pour réactiver votre accès.");
      setIsChatOpen(true);
      return;
    }

    if (studentsToPrint.length === 0) {
      alert("Aucun élève sélectionné pour l'impression.");
      return;
    }

    setIsGeneratingPDF(true);
    setPdfProgress({ current: 0, total: Math.ceil(studentsToPrint.length / cardsPerPage) * (printMode === 'recto-verso' ? 2 : 1) });

    // Basculer vers la feuille A4 pour que html2canvas trouve les éléments dans le DOM
    const prevViewStyle = printViewStyle;
    if (prevViewStyle !== 'sheet') {
      setPrintViewStyle('sheet');
    }

    // Attendre de manière dynamique que les pages A4 soient prêtes dans le DOM
    let pages = document.querySelectorAll<HTMLElement>('.a4-page');
    let attempts = 0;
    while (pages.length === 0 && attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 100));
      pages = document.querySelectorAll<HTMLElement>('.a4-page');
      attempts++;
    }

    if (pages.length === 0) {
      alert("Erreur : Impossible de charger la feuille d'impression. Veuillez réessayer.");
      setIsGeneratingPDF(false);
      setPdfProgress(null);
      if (prevViewStyle !== 'sheet') setPrintViewStyle(prevViewStyle);
      return;
    }

    // Réinitialiser temporairement les wrappers d'échelle mobile à 100% (794x1123) pour html2canvas
    const scaleWrappers = document.querySelectorAll<HTMLElement>('.a4-page-scale-wrapper');
    const originalWrappers = Array.from(scaleWrappers).map(w => ({
      wrapper: w,
      width: w.style.width,
      height: w.style.height,
      innerTransform: (w.firstElementChild as HTMLElement)?.style.transform || ''
    }));

    scaleWrappers.forEach(w => {
      w.style.width = '794px';
      w.style.height = '1123px';
      if (w.firstElementChild) {
        (w.firstElementChild as HTMLElement).style.transform = 'none';
      }
    });

    try {
      // Chargement dynamique des bibliothèques PDF & Canvas
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
      // 1.2 sur mobile (ultra-rapide, 3x moins de calculs et de mémoire), 1.6 sur desktop
      const renderScale = isMobileDevice ? 1.2 : 1.6;

      // A4 en mm: 210 × 297
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4',
        compress: true 
      });
      const A4_W_MM = 210;
      const A4_H_MM = 297;

      for (let i = 0; i < pages.length; i++) {
        setPdfProgress({ current: i + 1, total: pages.length });
        const page = pages[i];
        const canvas = await html2canvas(page, {
          scale: renderScale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 2500,
          removeContainer: true,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.82);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, A4_W_MM, A4_H_MM, undefined, 'FAST');
      }

      const cleanSchoolName = (schoolInfo.name || 'sukupass')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 30);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `cartes_scolaires_${cleanSchoolName}_${dateStr}.pdf`;

      // 1. Créer le Blob PDF et URL Blob
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // 2. Tenter le téléchargement automatique standard
      try {
        pdf.save(filename);
      } catch (saveErr) {
        console.warn('pdf.save direct a échoué (normal sur certains navigateurs mobiles):', saveErr);
      }

      // 3. Ouvrir la modale de succès avec lien direct de secours (garantit 100% de succès sur iPhone & Android)
      setDownloadReadyModal({
        url: blobUrl,
        filename,
        count: studentsToPrint.length
      });

      saveAdminLog(
        session.userId,
        'Impression Cartes PDF',
        `Génération d'un PDF de ${studentsToPrint.length} cartes (${printMode}, ${cardsPerPage} par page)`,
        schoolInfo.name
      );
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF. Vous pouvez aussi utiliser le bouton "Imprimer" pour générer le PDF directement via votre navigateur.');
    } finally {
      // Restaurer l'échelle mobile adaptée immédiatement
      originalWrappers.forEach(item => {
        item.wrapper.style.width = item.width;
        item.wrapper.style.height = item.height;
        if (item.wrapper.firstElementChild) {
          (item.wrapper.firstElementChild as HTMLElement).style.transform = item.innerTransform;
        }
      });
      if (prevViewStyle !== 'sheet') {
        setPrintViewStyle(prevViewStyle);
      }
      setIsGeneratingPDF(false);
      setPdfProgress(null);
    }
  };

  // ── Chargement initial depuis Supabase ──────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      // Si c'est le super-admin, ne pas charger ni créer d'école élève
      if (isSuperAdminUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadingTimeout(false);
      const startTime = performance.now();

      // Timeout de 15 secondes pour connexions lentes
      loadingTimer.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000);

      try {
        // Charger school_info et students en PARALLÈLE (élimine la cascade réseau)
        const [fetchedSchool, fetchedStudents] = await Promise.all([
          fetchSchoolInfo(session.userId),
          fetchStudents(session.userId)
        ]);
        if (fetchedSchool) {
          if (!fetchedSchool.name && (session.schoolName || session.fullName)) {
            fetchedSchool.name = (session.schoolName || session.fullName).toUpperCase();
            saveSchoolInfo(fetchedSchool, session.userId).catch(() => { });
          }
          setSchoolInfo(fetchedSchool);
          registerSchoolRecord({
            ...fetchedSchool,
            userId: session.userId,
            managerName: session.fullName,
            managerEmail: session.email,
            updatedAt: new Date().toISOString(),
          }).catch(() => { });
          saveAdminLog(
            session.userId,
            'Activité Compte Établissement',
            `Connexion active : ${session.fullName || session.email} (${session.email})`,
            fetchedSchool.name || session.fullName || 'Établissement'
          ).catch(() => { });
        } else {
          const fallbackName = session.schoolName
            ? session.schoolName.toUpperCase()
            : (session.fullName ? `COMPLEXE SCOLAIRE ${session.fullName.toUpperCase()}` : (session.isOfflineGuest ? 'ÉCOLE NATIONALE DU TOGO' : 'ÉTABLISSEMENT DU TOGO'));

          const initialInfo: SchoolInfo = {
            ...DEFAULT_SCHOOL_INFO,
            name: fallbackName,
            schoolType: session.schoolType || 'Lycée',
            location: session.location || '',
            phone: session.phone || '',
            subscriptionPlan: 'free',
          };
          setSchoolInfo(initialInfo);
          saveSchoolInfo(initialInfo, session.userId).catch(() => { });
          registerSchoolRecord({
            ...initialInfo,
            userId: session.userId,
            managerName: session.fullName,
            managerEmail: session.email,
            updatedAt: new Date().toISOString(),
          }).catch(() => { });
          saveAdminLog(
            session.userId,
            'Activité Compte Établissement',
            `Compte initialisé : ${session.fullName || session.email} (${session.email})`,
            initialInfo.name
          ).catch(() => { });
        }

        // Affecter les étudiants chargés en parallèle
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

  // ── Écouteur temps-réel des activations et mises à jour d'abonnement ───────────
  useEffect(() => {
    // Si c'est l'admin, ne pas écouter les changements d'abonnement d'école
    if (isSuperAdminUser) {
      return;
    }

    const handleSubscriptionChange = (e: any) => {
      if (e?.detail?.plan) {
        setSchoolInfo(prev => ({
          ...prev,
          subscriptionPlan: e.detail.plan,
          subscriptionExpiresAt: e.detail.expiresAt || prev.subscriptionExpiresAt
        }));
      } else {
        fetchSchoolInfo(session.userId).then(s => {
          if (s) setSchoolInfo(s);
        }).catch(() => { });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      // Ne réagir que si la clé modifiée concerne spécifiquement l'école actuelle
      if (e?.key && !e.key.includes(session.userId) && !e.key.includes('subscription')) {
        return;
      }
      if (!isValidUuid(session.userId)) {
        return;
      }
      fetchSchoolInfo(session.userId).then(s => {
        if (s) setSchoolInfo(s);
      }).catch(() => { });
    };

    window.addEventListener('cardschool_subscription_updated', handleSubscriptionChange);
    window.addEventListener('cardschool_school_registered', handleSubscriptionChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cardschool_subscription_updated', handleSubscriptionChange);
      window.removeEventListener('cardschool_school_registered', handleSubscriptionChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [session.userId, session.email]);

  // ── Sauvegarde school_info avec debounce (évite trop d'appels) ──────────────
  useEffect(() => {
    if (loading) return;
    // Ne jamais auto-sauvegarder sur Supabase pour le super-admin ou un compte local non-UUID
    if (isSuperAdminUser || !isValidUuid(session.userId)) {
      if (session.userId && !isValidUuid(session.userId)) {
        setStoredSchoolInfo(session.userId, schoolInfo);
      }
      return;
    }

    if (schoolInfoSaveTimer.current) clearTimeout(schoolInfoSaveTimer.current);
    schoolInfoSaveTimer.current = setTimeout(() => {
      saveSchoolInfo(schoolInfo, session.userId)
        .catch(err => {
          console.error('Erreur sauvegarde school info:', err);
        });
    }, 2000);
    return () => {
      if (schoolInfoSaveTimer.current) clearTimeout(schoolInfoSaveTimer.current);
    };
  }, [schoolInfo, session.userId, session.email, loading]);

  // ── Synchro Hors-ligne ──────────────────────────────────────────────────────
  const handleSyncComplete = useCallback(() => {
    if (session.userId && isValidUuid(session.userId)) {
      fetchStudents(session.userId).then(setStudents);
      fetchSchoolInfo(session.userId).then(s => s && setSchoolInfo(s));
    }
  }, [session.userId]);

  // ── CRUD Élèves ─────────────────────────────────────────────────────────────
  const handleAddStudent = useCallback(async (student: Student) => {
    console.log('🚀 Début handleAddStudent avec:', student);
    console.log('👤 Session userId:', session.userId);

    try {
      console.log('💾 Appel upsertStudent...');
      const saved = await upsertStudent(student, session.userId);
      console.log('✅ Étudiant sauvegardé:', saved);

      const isEdit = students.some(s => s.id === saved.id);
      setStudents(prev => {
        if (isEdit) {
          return prev.map(s => s.id === saved.id ? saved : s);
        } else {
          return [...prev, saved];
        }
      });

      saveAdminLog(
        session.userId,
        isEdit ? 'Modification Élève' : 'Ajout Élève',
        `${saved.firstName} ${saved.lastName} (${saved.className})`,
        schoolInfo.name
      );

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
      saveAdminLog(
        session.userId,
        'Suppression Élève',
        'Un élève a été retiré de la liste',
        schoolInfo.name
      );
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

  const allClasses = React.useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.className && s.className.trim()) set.add(s.className.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = React.useMemo(() =>
    students.filter(s => {
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = studentClassFilter === 'all' || s.className === studentClassFilter;
      return matchesSearch && matchesClass;
    }), [students, searchTerm, studentClassFilter]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  }, [selectedStudents, filteredStudents]);

  const handleOpenAddStudent = () => {
    if (isAccountSuspended) {
      alert("⚠️ Votre compte est actuellement suspendu. L'ajout d'élèves est bloqué. Veuillez contacter le support dans le chat pour réactiver votre compte.");
      setIsChatOpen(true);
      return;
    }
    if (isPlanExpired) {
      alert("⚠️ Votre abonnement PRO annuel est arrivé à expiration. Veuillez renouveler votre abonnement dans l'onglet 'Abonnement' pour continuer à générer des cartes en illimité.");
      setIsChatOpen(true);
      return;
    }
    if (isQuotaExceeded) {
      alert(`⚠️ Quota gratuit atteint (${students.length}/${effectiveQuota} cartes). Passez au Plan PRO pour ajouter des élèves en illimité.`);
      setIsChatOpen(true);
      return;
    }
    setIsFormOpen(true);
  };

  const handleImport = useCallback(async (newStudents: Student[], targetClass?: string) => {
    if (isAccountSuspended) {
      alert("⚠️ Votre compte est actuellement suspendu. L'importation d'élèves est bloquée. Veuillez contacter le support pour réactiver votre compte.");
      setIsChatOpen(true);
      return;
    }
    if (isPlanExpired) {
      alert("⚠️ Votre abonnement PRO annuel est arrivé à expiration. Veuillez renouveler votre abonnement pour importer vos listes d'élèves.");
      setIsChatOpen(true);
      return;
    }
    if (!isEffectivePro && (students.length + newStudents.length) > effectiveQuota) {
      alert(`⚠️ Impossible d'importer ${newStudents.length} élèves : cela dépasserait votre quota gratuit de ${effectiveQuota} élèves (${students.length} déjà enregistrés). Passez au Plan PRO illimité pour importer toute votre base scolaire.`);
      setIsChatOpen(true);
      return;
    }
    try {
      const saved = await insertStudents(newStudents, session.userId);
      setStudents(prev => [...prev, ...saved]);
      if (targetClass) {
        setStudentClassFilter(targetClass);
      }
      saveAdminLog(
        session.userId,
        'Importation CSV',
        `${saved.length} élèves importés avec succès`,
        schoolInfo.name
      );
    } catch (err) {
      console.error('Erreur import:', err);
      alert('Erreur lors de l\'import : ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }, [session.userId, isAccountSuspended, isPlanExpired, isEffectivePro, students.length, effectiveQuota, schoolInfo.name]);

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

  const studentsToPrint = React.useMemo(() => {
    let base = students;
    if (printClassFilter !== 'all') {
      base = base.filter(s => s.className === printClassFilter);
    }
    if (selectedStudents.length > 0) {
      base = base.filter(s => selectedStudents.includes(s.id));
    }
    return base;
  }, [students, printClassFilter, selectedStudents]);

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
  if (isAdminView) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }>
        <AdminDashboardView
          session={session}
          onLogout={handleLogout}
          onSwitchToSchoolView={() => setIsAdminView(false)}
        />
      </React.Suspense>
    );
  }

  if (activeTab === 'print') {
    return (
      <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#faf9f6] flex flex-col md:flex-row">
        {/* Mobile Top Header */}
        <header className="md:hidden bg-[#f8faf6] border-b border-slate-200/90 px-4 py-3 flex items-center justify-between sticky top-0 z-40 no-print shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-slate-900 truncate leading-tight uppercase tracking-tight">
                {schoolInfo.name.split(' (')[0] || "Mon École"}
              </h2>
              <p className="text-[8px] text-emerald-700 font-bold uppercase tracking-wider">Togo • UEMOA</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isSuperAdminUser && (
              <button
                onClick={() => setIsAdminView(true)}
                title="Console Admin"
                className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer active:scale-95 shadow-xs"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsVerificationOpen(true)}
              title="Vérifier une carte officielle"
              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer active:scale-95 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer active:scale-95 shadow-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Sidebar - Fixed on desktop */}
        <aside className={`hidden md:flex ${isSidebarOpen ? 'md:w-64' : 'md:w-20'
          } md:h-full bg-[#f8faf6] text-slate-700 flex-col shrink-0 no-print border-r border-slate-200 shadow-sm transition-[width] duration-300 ease-in-out overflow-x-hidden`}>
          {/* School Logo Section: exact height h-[73px], edge-to-edge border-b */}
          <div className={`h-[73px] flex items-center border-b border-slate-200 shrink-0 ${isSidebarOpen ? 'px-5 justify-between' : 'justify-center px-2'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white border border-emerald-500/20 shadow-md shadow-emerald-600/10 shrink-0" title={!isSidebarOpen ? schoolInfo.name : undefined}>
                <Palette className="w-5 h-5" />
              </div>
              {isSidebarOpen && (
                <div className="min-w-0 flex-1 animate-fadeIn">
                  <h2 className="text-sm font-black text-slate-900 truncate leading-tight uppercase tracking-tight">
                    {schoolInfo.name.split(' (')[0] || "Mon École"}
                  </h2>
                  <p className="text-[9px] text-emerald-700 font-black uppercase tracking-[0.12em] mt-0.5">Togo • UEMOA</p>
                </div>
              )}
            </div>
          </div>

          <div className={`py-6 flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden ${isSidebarOpen ? 'px-4' : 'px-2'}`}>
            <div className="space-y-4">
              {isSuperAdminUser && (
                <div className="relative group">
                  <button
                    onClick={() => setIsAdminView(true)}
                    className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2 px-4 py-2.5' : 'justify-center w-12 h-12 mx-auto'
                      } bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all active:scale-[0.98]`}
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    {isSidebarOpen && <span>Console Admin</span>}
                  </button>
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                      Console d'administration
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </div>
              )}

              {/* Navigation links */}
              <nav className="space-y-1.5">
                {[
                  { id: 'students', label: 'Gestion des élèves', icon: Users },
                  { id: 'design', label: 'Design de la carte', icon: Palette },
                  { id: 'print', label: 'Impression des cartes', icon: FileDown },
                  { id: 'settings', label: "Paramètres de l'école", icon: Settings },
                  { id: 'billing', label: "Mon Abonnement", icon: CreditCard },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center w-12 h-12 mx-auto'
                          } rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {isSidebarOpen && <span className="truncate">{item.label}</span>}
                      </button>

                      {!isSidebarOpen && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                          {item.label}
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Quick Verification Button */}
              <div className="relative group pt-1">
                <button
                  onClick={() => setIsVerificationOpen(true)}
                  className={`w-full flex items-center ${isSidebarOpen ? 'gap-2.5 px-3.5 py-2.5' : 'justify-center w-12 h-12 mx-auto'
                    } rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-sm active:scale-95`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  {isSidebarOpen && <span>Vérifier une carte</span>}
                </button>
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                    Vérifier une carte
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile & Logout & Arrow at the BOTTOM */}
            <div className="pt-4 border-t border-slate-200/80 space-y-2">
              <div className="relative group">
                {isSidebarOpen ? (
                  <div className="flex items-center justify-between gap-2.5 px-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs uppercase shrink-0">
                        <span className="leading-none select-none">{session.fullName?.charAt(0) || 'U'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate leading-tight">{session.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">{session.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleSidebar}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition-colors cursor-pointer shrink-0 border border-slate-200/60 shadow-2xs active:scale-95 ml-1"
                      title="Réduire le menu"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-12 h-12 mx-auto">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs uppercase shrink-0">
                      <span className="leading-none select-none">{session.fullName?.charAt(0) || 'U'}</span>
                    </div>
                  </div>
                )}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                    <p className="font-bold">{session.fullName}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{session.email}</p>
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                )}
              </div>

              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center w-12 h-12 mx-auto'
                    } rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer`}
                >
                  <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                  {isSidebarOpen && <span>Déconnexion</span>}
                </button>
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                    Déconnexion
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                )}
              </div>

              {/* Collapse/Expand Toggle Arrow Button when collapsed */}
              {!isSidebarOpen && (
                <div className="relative group pt-1 border-t border-slate-200/60 flex justify-center">
                  <button
                    onClick={toggleSidebar}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer border border-transparent hover:border-slate-200 active:scale-95"
                    title="Agrandir le menu"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                    Agrandir le menu
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content area - Independently scrollable */}
        <div className="flex-1 min-w-0 md:h-full overflow-y-auto pb-36 md:pb-8">
          {/* Top Sticky Bar */}
          <div className="sticky top-0 z-40 bg-white shadow-xs px-4 sm:px-6 md:h-[73px] py-3 md:py-0 flex flex-col md:flex-row md:items-center justify-between no-print border-b border-slate-200 shrink-0 space-y-3 md:space-y-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-slate-900 font-black whitespace-nowrap">
                    Aperçu d'impression
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                    {studentsToPrint.length} carte{studentsToPrint.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  • {Math.ceil(studentsToPrint.length / cardsPerPage) * (printMode === 'recto-verso' ? 2 : 1)} page(s) A4
                </span>
              </div>

              {/* Desktop Interactive Print Options */}
              <div className="hidden lg:flex items-center gap-4">
                {/* View Mode Toggle: Cartes vs Planche A4 */}
                <div className="bg-gray-100 p-0.5 rounded-lg flex items-center border border-gray-200/60">
                  <button
                    onClick={() => setPrintViewStyle('cards')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${printViewStyle === 'cards' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Vue Cartes</span>
                  </button>
                  <button
                    onClick={() => setPrintViewStyle('sheet')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${printViewStyle === 'sheet' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Feuille A4</span>
                  </button>
                </div>

                {/* Class Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Classe:</span>
                  <select
                    value={printClassFilter}
                    onChange={(e) => setPrintClassFilter(e.target.value)}
                    className="bg-gray-100 hover:bg-gray-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer border border-transparent focus:border-emerald-500 transition-colors"
                  >
                    <option value="all">Toutes ({students.length})</option>
                    {allClasses.map(cls => (
                      <option key={cls} value={cls}>
                        {cls} ({students.filter(s => s.className === cls).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Print Mode Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Mode:</span>
                  <div className="bg-gray-100 p-0.5 rounded-lg flex">
                    <button
                      onClick={() => setPrintMode('recto')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${printMode === 'recto' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                      Recto Seul
                    </button>
                    <button
                      onClick={() => setPrintMode('recto-verso')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${printMode === 'recto-verso' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                      Recto/Verso
                    </button>
                  </div>
                </div>

                {/* Cards Density Selector (for sheet mode) */}
                {printViewStyle === 'sheet' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Densité:</span>
                    <div className="bg-gray-100 p-0.5 rounded-lg flex">
                      <button
                        onClick={() => setCardsPerPage(8)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${cardsPerPage === 8 ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                          }`}
                      >
                        8
                      </button>
                      <button
                        onClick={() => setCardsPerPage(10)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${cardsPerPage === 10 ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                          }`}
                      >
                        10
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  title="Imprimer directement ou enregistrer en PDF via le navigateur"
                  className="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
                <button
                  onClick={generatePDF}
                  title="Télécharge le PDF officiel A4 prêt pour l'impression"
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs px-3 sm:px-4 py-2 sm:py-2.5 shrink-0"
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Génération...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Télécharger PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Print Options Sub-bar */}
            <div className="flex lg:hidden flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              {/* Dual View Mode Switcher: Cartes (HD) vs Planche A4 */}
              <div className="bg-slate-100 p-0.5 rounded-lg flex items-center shrink-0 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPrintViewStyle('cards')}
                  className={`text-[11px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${printViewStyle === 'cards'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Cartes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintViewStyle('sheet')}
                  className={`text-[11px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${printViewStyle === 'sheet'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Planche A4</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-1 min-w-[90px]">
                <select
                  value={printClassFilter}
                  onChange={(e) => setPrintClassFilter(e.target.value)}
                  className="w-full bg-gray-100 text-[11px] font-bold text-slate-800 rounded-lg px-2 py-1 outline-none cursor-pointer border border-transparent focus:border-emerald-500"
                >
                  <option value="all">Toutes ({students.length})</option>
                  {allClasses.map(cls => (
                    <option key={cls} value={cls}>
                      {cls} ({students.filter(s => s.className === cls).length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Recto / Verso selector */}
                <div className="bg-gray-100 p-0.5 rounded-lg flex">
                  <button
                    onClick={() => setPrintMode('recto')}
                    className={`text-[10px] font-bold px-1.5 py-1 rounded transition-all ${printMode === 'recto' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
                      }`}
                  >
                    Recto
                  </button>
                  <button
                    onClick={() => setPrintMode('recto-verso')}
                    className={`text-[10px] font-bold px-1.5 py-1 rounded transition-all ${printMode === 'recto-verso' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
                      }`}
                  >
                    R/V
                  </button>
                </div>

                {/* In sheet mode: Fit screen toggle */}
                {printViewStyle === 'sheet' && (
                  <button
                    type="button"
                    onClick={() => setMobileFitScreen(prev => !prev)}
                    className={`text-[10px] font-bold px-1.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${mobileFitScreen
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-black'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    title={mobileFitScreen ? "Feuille A4 adaptée à l'écran (Cliquer pour zoom 100%)" : "Mode taille réelle 100%"}
                  >
                    {mobileFitScreen ? (
                      <>
                        <Minimize2 className="w-3 h-3 text-emerald-700" />
                        <span>Ajusté</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3 h-3 text-gray-600" />
                        <span>100%</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 border border-gray-200 flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Imprimer directement via le navigateur"
                >
                  <Printer className="w-3 h-3 text-slate-600" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mode 1: Full-Width Individual Cards Stream (Perfect for mobile preview) */}
          {printViewStyle === 'cards' && (
            <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-4 space-y-5 no-print">
              <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-[12px] leading-tight">
                      {studentsToPrint.length} badge{studentsToPrint.length > 1 ? 's' : ''} en affichage direct HD
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Lisibilité 100% nette sur téléphone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPrintViewStyle('sheet')}
                  className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 active:scale-95 cursor-pointer"
                >
                  Planche A4 📄
                </button>
              </div>

              {studentsToPrint.map((student, idx) => (
                <div
                  key={`mobile-card-${student.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 flex flex-col items-center transition-all hover:shadow-md"
                >
                  <div className="w-full flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 truncate text-xs uppercase tracking-tight">
                          {student.lastName} {student.firstName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Classe: {student.className} • N° {student.matricule || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                      {printMode === 'recto-verso' ? 'Recto & Verso' : 'Recto'}
                    </span>
                  </div>

                  {/* Recto Card */}
                  <div className="w-full flex justify-center overflow-x-auto py-1">
                    <div
                      className="shrink-0 rounded-xl overflow-hidden shadow-xs border border-slate-200/60"
                      style={{
                        maxWidth: '100%',
                        transformOrigin: 'top center',
                      }}
                    >
                      <IDCard student={student} schoolInfo={schoolInfo} showCuttingMarks={false} />
                    </div>
                  </div>

                  {/* Verso Card if Recto-Verso is enabled */}
                  {printMode === 'recto-verso' && (
                    <div className="w-full flex flex-col items-center mt-3 pt-3 border-t border-dashed border-slate-200">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 self-start px-1">
                        Verso officiel
                      </span>
                      <div className="w-full flex justify-center overflow-x-auto py-1">
                        <div
                          className="shrink-0 rounded-xl overflow-hidden shadow-xs border border-slate-200/60"
                          style={{
                            maxWidth: '100%',
                            transformOrigin: 'top center',
                          }}
                        >
                          <IDCardBack student={student} schoolInfo={schoolInfo} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {studentsToPrint.length === 0 && (
                <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600">Aucun élève trouvé pour cette sélection</p>
                  <p className="text-xs text-slate-400 mt-1">Changez le filtre de classe ou ajoutez des élèves.</p>
                </div>
              )}

              {/* Bottom Quick Download Button in card feed */}
              {studentsToPrint.length > 0 && (
                <div className="pt-2 pb-6 flex justify-center">
                  <button
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    className="btn-primary w-full py-3.5 text-xs sm:text-sm font-bold shadow-lg flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Génération du PDF officiel...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        <span>Télécharger le PDF A4 ({studentsToPrint.length} cartes)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Printable A4 Sheets Layout (Scaled for phone, full for print) */}
          <div className={`${printViewStyle === 'cards' ? 'hidden print:block' : 'block'} w-full overflow-x-auto py-4 sm:py-8 print:py-0 px-1 sm:px-6 print:px-0`}>
            <div className="w-fit min-w-full mx-auto flex flex-col items-center">
              <PrintLayout
                students={studentsToPrint}
                schoolInfo={schoolInfo}
                printMode={printMode}
                cardsPerPage={cardsPerPage}
                fitToScreen={mobileFitScreen}
              />
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 md:hidden flex items-center justify-around px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] no-print">
          {[
            { id: 'students', label: 'Élèves', icon: Users },
            { id: 'design', label: 'Design', icon: Palette },
            { id: 'print', label: 'Imprimer', icon: FileDown },
            { id: 'settings', label: 'Réglages', icon: Settings },
            { id: 'billing', label: 'Abonnement', icon: CreditCard },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer active:scale-95 ${isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium hover:text-slate-600'
                  }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Floating Chat Drawer for Support & Payment */}
        <SchoolChatDrawer
          session={session}
          schoolInfo={schoolInfo}
          isOpen={isChatOpen}
          onOpen={() => setIsChatOpen(true)}
          onClose={() => setIsChatOpen(false)}
        />

        {/* Official Card Verification Modal */}
        <CardVerificationModal
          isOpen={isVerificationOpen}
          onClose={() => setIsVerificationOpen(false)}
          students={students}
          schoolInfo={schoolInfo}
        />

        {/* PDF Download Ready Modal (Mobile & Safari Fallback) */}
        {downloadReadyModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl space-y-4 animate-scaleUp">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Vos cartes sont prêtes !</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {downloadReadyModal.count} carte{downloadReadyModal.count > 1 ? 's' : ''} officielle{downloadReadyModal.count > 1 ? 's' : ''} générée{downloadReadyModal.count > 1 ? 's' : ''} en haute définition.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <a
                  href={downloadReadyModal.url}
                  download={downloadReadyModal.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-3.5 text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileDown className="w-5 h-5 shrink-0" />
                  <span>Ouvrir / Télécharger le PDF</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setDownloadReadyModal(null);
                    window.print();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimer via le navigateur (AirPrint)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDownloadReadyModal(null)}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Generation Progress Modal */}
        {isGeneratingPDF && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center animate-spin">
                <Loader2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Génération du PDF officiel...</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {pdfProgress && pdfProgress.total > 0
                    ? `Capture HD de la page ${pdfProgress.current} sur ${pdfProgress.total}...`
                    : 'Préparation de la mise en page...'}
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: pdfProgress && pdfProgress.total > 0
                      ? `${Math.max(10, Math.round((pdfProgress.current / pdfProgress.total) * 100))}%`
                      : '20%'
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400">Veuillez ne pas fermer cette page pendant le traitement.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#faf9f6] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#f8faf6] border-b border-slate-200/90 px-4 py-3 flex items-center justify-between sticky top-0 z-40 no-print shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
            <Palette className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 truncate leading-tight uppercase tracking-tight">
              {schoolInfo.name.split(' (')[0] || "Mon École"}
            </h2>
            <p className="text-[8px] text-emerald-700 font-bold uppercase tracking-wider">Togo • UEMOA</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isSuperAdminUser && (
            <button
              onClick={() => setIsAdminView(true)}
              title="Console Admin"
              className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer active:scale-95 shadow-xs"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsVerificationOpen(true)}
            title="Vérifier une carte officielle"
            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer active:scale-95 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer active:scale-95 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Global Navigation Sidebar - Desktop Only */}
      <aside className={`hidden md:flex ${isSidebarOpen ? 'md:w-64' : 'md:w-20'
        } md:h-full bg-[#f8faf6] text-slate-700 flex-col shrink-0 no-print border-r border-slate-200 shadow-sm transition-[width] duration-300 ease-in-out overflow-x-hidden`}>
        {/* School Logo Section: exact height h-[73px], edge-to-edge border-b */}
        <div className={`h-[73px] flex items-center border-b border-slate-200 shrink-0 ${isSidebarOpen ? 'px-5 justify-between' : 'justify-center px-2'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white border border-emerald-500/20 shadow-md shadow-emerald-600/10 shrink-0" title={!isSidebarOpen ? schoolInfo.name : undefined}>
              <Palette className="w-5 h-5" />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1 animate-fadeIn">
                <h2 className="text-sm font-black text-slate-900 truncate leading-tight uppercase tracking-tight">
                  {schoolInfo.name.split(' (')[0] || "Mon École"}
                </h2>
                <p className="text-[9px] text-emerald-700 font-black uppercase tracking-[0.12em] mt-0.5">Togo • UEMOA</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Nav & Footer Content */}
        <div className={`py-6 flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden ${isSidebarOpen ? 'px-4' : 'px-2'}`}>
          <div className="space-y-4">
            {isSuperAdminUser && (
              <div className="relative group">
                <button
                  onClick={() => setIsAdminView(true)}
                  className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2 px-4 py-2.5' : 'justify-center w-12 h-12 mx-auto'
                    } bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all active:scale-[0.98]`}
                  title={!isSidebarOpen ? "Console d'administration" : undefined}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && <span>Console Admin</span>}
                </button>
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                    Console d'administration
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                  </div>
                )}
              </div>
            )}

            {/* Navigation links */}
            <nav className="space-y-1.5">
              {[
                { id: 'students', label: 'Gestion des élèves', icon: Users },
                { id: 'design', label: 'Design de la carte', icon: Palette },
                { id: 'print', label: 'Impression des cartes', icon: FileDown },
                { id: 'settings', label: "Paramètres de l'école", icon: Settings },
                { id: 'billing', label: "Mon Abonnement", icon: CreditCard },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <div key={item.id} className="relative group">
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center w-12 h-12 mx-auto'
                        } rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {isSidebarOpen && <span className="truncate">{item.label}</span>}
                    </button>

                    {/* Floating Tooltip on hover when collapsed */}
                    {!isSidebarOpen && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                        {item.label}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Quick Verification Button */}
            <div className="relative group pt-1">
              <button
                onClick={() => setIsVerificationOpen(true)}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-2.5 px-3.5 py-2.5' : 'justify-center w-12 h-12 mx-auto'
                  } rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-sm active:scale-95`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                {isSidebarOpen && <span>Vérifier une carte</span>}
              </button>
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                  Vérifier une carte
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>
          </div>

          {/* Profile, Logout & Collapse arrow AT THE BOTTOM */}
          <div className="pt-4 border-t border-slate-200/80 space-y-2">
            {/* User Profile */}
            <div className="relative group">
              {isSidebarOpen ? (
                <div className="flex items-center justify-between gap-2.5 px-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs uppercase shrink-0">
                      <span className="leading-none select-none">{session.fullName?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">{session.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">{session.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition-colors cursor-pointer shrink-0 border border-slate-200/60 shadow-2xs active:scale-95 ml-1"
                    title="Réduire le menu"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-12 h-12 mx-auto">
                  <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs uppercase shrink-0">
                    <span className="leading-none select-none">{session.fullName?.charAt(0) || 'U'}</span>
                  </div>
                </div>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                  <p className="font-bold">{session.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{session.email}</p>
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="relative group">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center w-12 h-12 mx-auto'
                  } rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer`}
              >
                <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                {isSidebarOpen && <span>Déconnexion</span>}
              </button>
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                  Déconnexion
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>

            {/* Collapse/Expand Toggle Arrow Button when collapsed */}
            {!isSidebarOpen && (
              <div className="relative group pt-1 border-t border-slate-200/60 flex justify-center">
                <button
                  onClick={toggleSidebar}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer border border-transparent hover:border-slate-200 active:scale-95"
                  title="Agrandir le menu"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                  Agrandir le menu
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 md:h-full overflow-y-auto pb-24 md:pb-8">
        {/* Desktop Header Toolbar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 h-[73px] px-6 sm:px-8 justify-between items-center sticky top-0 z-20 shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {schoolInfo.name.split(' (')[0] || "Mon Établissement"}
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Année Scolaire 2025 - 2026 • Portail Officiel Togo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${isEffectivePro ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
              {isEffectivePro ? '⭐ Plan PRO Actif' : 'Plan Découverte'}
            </span>

            <button
              onClick={() => setIsVerificationOpen(true)}
              title="Vérifier une carte officielle"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 text-xs font-bold cursor-pointer active:scale-95 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Vérifier une carte</span>
            </button>
          </div>
        </header>
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

        {/* Tab switcher render */}
        {activeTab === 'design' ? (
          <CardDesignView
            schoolInfo={schoolInfo}
            studentsCount={students.length}
            onSaveSchoolInfo={async (newInfo) => {
              setSchoolInfo(newInfo);
              await saveSchoolInfo(newInfo, session.userId);
            }}
          />
        ) : activeTab === 'settings' ? (
          <SchoolSettingsView
            session={session}
            schoolInfo={schoolInfo}
            studentsCount={students.length}
            mode="profile"
            onSaveSchoolInfo={async (newInfo) => {
              setSchoolInfo(newInfo);
              await saveSchoolInfo(newInfo, session.userId);
            }}
            onBack={() => setActiveTab('students')}
            onOpenChat={() => setIsChatOpen(true)}
          />
        ) : activeTab === 'billing' ? (
          <SchoolSettingsView
            session={session}
            schoolInfo={schoolInfo}
            studentsCount={students.length}
            mode="billing"
            onSaveSchoolInfo={async (newInfo) => {
              setSchoolInfo(newInfo);
              await saveSchoolInfo(newInfo, session.userId);
            }}
            onBack={() => setActiveTab('students')}
            onOpenChat={() => setIsChatOpen(true)}
          />
        ) : (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

            {/* Suspended Alert Banner */}
            {isAccountSuspended && (
              <div className="mb-6 p-4 bg-red-600 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <Ban className="w-6 h-6 text-red-200 shrink-0" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">Accès Suspendu par l'Administration</h3>
                    <p className="text-xs text-red-100 font-medium">L'ajout, l'import et l'impression de cartes sont actuellement bloqués. Réglez votre abonnement et envoyez la capture dans le chat pour débloquer immédiatement votre compte.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 text-xs font-black rounded-xl shadow transition-all shrink-0 cursor-pointer"
                >
                  💬 Ouvrir le Chat & Débloquer
                </button>
              </div>
            )}

            {/* Quota Exceeded Alert Banner */}
            {!isAccountSuspended && isQuotaExceeded && (
              <div className="mb-6 p-4 bg-amber-500 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-100 shrink-0" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">Quota Gratuit Atteint ({students.length}/{effectiveQuota} cartes)</h3>
                    <p className="text-xs text-amber-100 font-medium">Vous avez atteint la limite du plan découverte. Activez le plan PRO 1 An (30 000 F CFA) pour ajouter et imprimer des élèves sans aucune limite.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-4 py-2 bg-white text-amber-900 hover:bg-amber-50 text-xs font-black rounded-xl shadow transition-all shrink-0 cursor-pointer"
                >
                  ⭐ Activer Plan PRO
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-5 border-b border-slate-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                  <span>Gestion des Élèves</span>
                  {studentViewMode === 'classes' && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-850 font-black border border-emerald-200">
                      Vue Répertoire par Classe
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                  {studentViewMode === 'classes'
                    ? 'Répertoire des effectifs, suivi de la prise de photos et impression directe par classe.'
                    : 'Configurez le visuel des cartes et gérez la liste nominative de vos élèves.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Switcher: Vue Cartes vs Vue par Classe */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStudentViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${studentViewMode === 'cards'
                        ? 'bg-white text-emerald-850 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                    title="Affichage individuel sous forme de cartes d'identité"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Vue Cartes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentViewMode('classes')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${studentViewMode === 'classes'
                        ? 'bg-white text-emerald-850 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                    title="Affichage synthétique par classe et registre d'élèves"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Vue par Classe</span>
                    {allClasses.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${studentViewMode === 'classes' ? 'bg-emerald-100 text-emerald-850' : 'bg-slate-200 text-slate-600'
                        }`}>
                        {allClasses.length}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleOpenAddStudent}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 btn-primary active:scale-95 text-xs sm:text-sm cursor-pointer shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un élève</span>
                </button>
              </div>
            </div>

            {studentViewMode === 'classes' ? (
              <ClassDirectoryView
                students={students}
                allClasses={allClasses}
                schoolInfo={schoolInfo}
                onOpenAddStudent={(cls) => {
                  if (cls) setStudentClassFilter(cls);
                  handleOpenAddStudent();
                }}
                onOpenImportModal={(cls) => handleOpenImportModal(cls)}
                onDownloadTemplate={(cls) => handleDownloadClassTemplate(cls)}
                onExportClassCSV={(cls) => handleExportClassCSV(cls)}
                onPrintClass={(cls) => {
                  setPrintClassFilter(cls);
                  setActiveTab('print');
                }}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                selectedStudents={selectedStudents}
                onToggleSelectStudent={toggleSelect}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sidebar / Config */}
                <div className="lg:col-span-4 space-y-6">
                  <SchoolConfigSidebar
                    schoolInfo={schoolInfo}
                    setSchoolInfo={setSchoolInfo}
                    setIsSchoolSettingsOpen={setIsSchoolSettingsOpen}
                    students={students}
                    onImport={handleImport}
                    allClasses={allClasses}
                    currentClassFilter={studentClassFilter}
                    isEffectivePro={isEffectivePro}
                    effectiveQuota={effectiveQuota}
                  />
                </div>

                {/* Main Content / List */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Barre de recherche et filtres */}
                  <div className="double-bezel-outer">
                    <div className="double-bezel-inner p-4 flex flex-col sm:flex-row gap-3 justify-between items-center bg-white">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un élève par nom, prénom ou matricule..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-55 focus:bg-white focus-brand outline-none transition-all text-xs font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs font-bold text-gray-400 uppercase shrink-0">
                          {filteredStudents.length} affiché{filteredStudents.length > 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={handleSelectAll}
                          disabled={filteredStudents.length === 0}
                          className="text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0
                            ? 'Désélectionner'
                            : 'Tout sélectionner'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Class Quick-Navigation Tabs & Actions Toolbar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
                    {/* Left: Scrollable Class Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-1 min-w-0">
                      <button
                        onClick={() => setStudentClassFilter('all')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${studentClassFilter === 'all'
                            ? 'bg-emerald-600 text-white shadow-sm font-black'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                      >
                        Toutes les classes ({students.length})
                      </button>
                      {allClasses.map(cls => {
                        const count = students.filter(s => s.className === cls).length;
                        const isActive = studentClassFilter === cls;
                        return (
                          <button
                            key={cls}
                            onClick={() => setStudentClassFilter(cls)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${isActive
                                ? 'bg-emerald-600 text-white shadow-sm font-black'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                          >
                            <GraduationCap className="w-3.5 h-3.5 opacity-70" />
                            <span>{cls}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-emerald-700/60 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleOpenImportModal()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-850 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shrink-0 cursor-pointer"
                        title="Ajouter ou importer une nouvelle classe"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-700" />
                        <span>+ Nouvelle classe</span>
                      </button>
                    </div>

                    {/* Right side: Total classes count */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 shrink-0">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{allClasses.length} classe{allClasses.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Specific Class Header Banner with direct actions */}
                  {studentClassFilter !== 'all' && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">
                              Classe : {studentClassFilter}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-850 border border-emerald-200">
                              {filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Gestion ciblée et impression pour la classe {studentClassFilter}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setPrintClassFilter(studentClassFilter);
                            setActiveTab('print');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                          title={`Imprimer les cartes de la classe ${studentClassFilter}`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer {studentClassFilter}</span>
                        </button>

                        <button
                          onClick={() => handleOpenImportModal(studentClassFilter)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                          title={`Importer des élèves dans la classe ${studentClassFilter}`}
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Importer dans cette classe</span>
                        </button>
                      </div>
                    </div>
                  )}

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
                          className="flex items-center gap-2 text-sm font-bold px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md shadow-red-200 active:scale-95 cursor-pointer"
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
                        <p className="text-xs text-gray-400 mt-1 max-w-xs text-center leading-relaxed font-semibold">
                          {searchTerm || studentClassFilter !== 'all'
                            ? 'Aucun résultat ne correspond aux filtres de recherche sélectionnés.'
                            : 'Commencez par ajouter un élève manuellement ou importez une liste au format CSV.'}
                        </p>
                        <button
                          onClick={handleOpenAddStudent}
                          className="mt-6 btn-primary cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4" /> Ajouter un élève
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 md:hidden flex items-center justify-around px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] no-print">
        {[
          { id: 'students', label: 'Élèves', icon: Users },
          { id: 'design', label: 'Design', icon: Palette },
          { id: 'print', label: 'Imprimer', icon: FileDown },
          { id: 'settings', label: 'Réglages', icon: Settings },
          { id: 'billing', label: 'Abonnement', icon: CreditCard },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer active:scale-95 ${isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium hover:text-slate-600'
                }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[9px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Drawers avec Suspense */}
      <React.Suspense fallback={null}>
        {isFormOpen && (
          <StudentForm
            student={editingStudent}
            schoolInfo={schoolInfo}
            onSubmit={handleAddStudent}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingStudent(undefined);
            }}
            defaultClass={studentClassFilter !== 'all' ? studentClassFilter : undefined}
            existingClasses={allClasses}
          />
        )}

        {isImportModalOpen && (
          <ClassImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImport}
            existingClasses={allClasses}
            initialClass={importTargetClass}
            totalCurrentStudents={students.length}
            effectiveQuota={effectiveQuota}
            isEffectivePro={isEffectivePro}
          />
        )}

        {isSchoolSettingsOpen && (
          <SchoolSettings
            schoolInfo={schoolInfo}
            onUpdate={setSchoolInfo}
            onClose={() => setIsSchoolSettingsOpen(false)}
          />
        )}

        {/* Floating Chat Drawer for Support & Payment */}
        <SchoolChatDrawer
          session={session}
          schoolInfo={schoolInfo}
          isOpen={isChatOpen}
          onOpen={() => setIsChatOpen(true)}
          onClose={() => setIsChatOpen(false)}
        />

        {/* Official Card Verification Modal */}
        <CardVerificationModal
          isOpen={isVerificationOpen}
          onClose={() => setIsVerificationOpen(false)}
          students={students}
          schoolInfo={schoolInfo}
        />

        {/* PDF Download Ready Modal (Mobile & Safari Fallback) */}
        {downloadReadyModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl space-y-4 animate-scaleUp">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Vos cartes sont prêtes !</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {downloadReadyModal.count} carte{downloadReadyModal.count > 1 ? 's' : ''} officielle{downloadReadyModal.count > 1 ? 's' : ''} générée{downloadReadyModal.count > 1 ? 's' : ''} en haute définition.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <a
                  href={downloadReadyModal.url}
                  download={downloadReadyModal.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-3.5 text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileDown className="w-5 h-5 shrink-0" />
                  <span>Ouvrir / Télécharger le PDF</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setDownloadReadyModal(null);
                    window.print();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimer via le navigateur (AirPrint)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDownloadReadyModal(null)}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Generation Progress Modal */}
        {isGeneratingPDF && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center animate-spin">
                <Loader2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Génération du PDF officiel...</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {pdfProgress && pdfProgress.total > 0
                    ? `Capture HD de la page ${pdfProgress.current} sur ${pdfProgress.total}...`
                    : 'Préparation de la mise en page...'}
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: pdfProgress && pdfProgress.total > 0
                      ? `${Math.max(10, Math.round((pdfProgress.current / pdfProgress.total) * 100))}%`
                      : '20%'
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400">Veuillez ne pas fermer cette page pendant le traitement.</p>
            </div>
          </div>
        )}
      </React.Suspense>

      {/* Offline Status & Sync Banner */}
      <OfflineStatusBanner
        userId={session.userId}
        onSyncComplete={handleSyncComplete}
      />
    </div>
  );
}

