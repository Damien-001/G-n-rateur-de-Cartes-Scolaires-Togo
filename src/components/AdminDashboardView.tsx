import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Sparkles,
  Shield,
  Users,
  Building2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  User,
  PhoneCall,
  TrendingUp,
  History,
  Check,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Key,
  Download,
  Copy,
  Filter,
  MapPin,
  Sliders,
  Plus,
  CheckCheck,
  MessageSquare,
  Power,
  PowerOff,
  Trash2,
  Eye,
  Send,
  Paperclip,
  Ban,
  ExternalLink,
  Smartphone,
  AlertTriangle,
  Settings,
  Mail,
  Phone,
  Save,
  RotateCcw,
  HelpCircle,
  Info,
  DollarSign,
  MessageCircle,
  Globe,
  Bell,
  Volume2,
  AlertCircle,
  Menu,
  X,
  Zap,
  Lock,
  ArrowDown,
  Play,
  Video,
  Tag,
  ChevronUp,
  ChevronDown,
  Star,
  EyeOff,
  PlusCircle
} from 'lucide-react';
import { parseVideoSource, isGooglePhotosUrl } from '../lib/videoHelper';
import {
  fetchAllSchools,
  fetchAllStudentsCount,
  updateSchoolSubscription,
  AdminSchoolDetail,
  saveAdminLog,
  fetchAllLicenseKeys,
  generateLicenseKey,
  toggleLicenseKeyStatus,
  deleteLicenseKey,
  exportSchoolsToCSV,
  updateSchoolCustomQuota,
  fetchAdminLogs,
  AdminLogItem,
  fetchChatMessages,
  sendChatMessage,
  validatePaymentFromChat,
  fetchPlatformSettings,
  savePlatformSettings,
  PLATFORM_SETTINGS_STORAGE_KEY,
  createSchoolByAdmin,
  deleteSchoolByAdmin,
  activateSchoolDirectly,
  createPreassignedLicenseForSchool,
  purgeOrphanLicenseKeys
} from '../lib/db';
import { supabase } from '../lib/supabase';
import { isAppOnline } from '../lib/offlineStorage';
import { Session } from '../lib/auth';
import { LicenseKey, TOGO_REGIONS, ChatMessage, PlatformSettings, DEFAULT_PLATFORM_SETTINGS, LandingPricingPlan, DEFAULT_PRICING_PLANS } from '../types';
import { AdminVisitorAnalytics } from './AdminVisitorAnalytics';

interface AdminDashboardViewProps {
  session: Session;
  onLogout: () => void;
  onSwitchToSchoolView?: () => void;
}

type AdminLog = AdminLogItem;

// Helper to play synthesized notification chime
const playAdminChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch { }
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  session,
  onLogout,
  onSwitchToSchoolView
}) => {
  const [schools, setSchools] = useState<AdminSchoolDetail[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cardschool_admin_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cardschool_admin_sidebar_open', String(next));
      } catch { }
      return next;
    });
  };
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'schools' | 'payments' | 'licenses' | 'pricing' | 'analytics' | 'settings' | 'logs'>('overview');
  const activeSubTabRef = useRef(activeSubTab);
  useEffect(() => {
    activeSubTabRef.current = activeSubTab;
  }, [activeSubTab]);

  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoSaveSuccess, setVideoSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Toutes les régions');
  const [newFeatureInputs, setNewFeatureInputs] = useState<Record<number, string>>({});

  // Custom manual quotas state
  const [editingSchool, setEditingSchool] = useState<AdminSchoolDetail | null>(null);
  const [customQuotaVal, setCustomQuotaVal] = useState<number>(15);

  // Direct School Creation Modal State
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolType, setNewSchoolType] = useState('Lycée');
  const [newSchoolLocation, setNewSchoolLocation] = useState('');
  const [newSchoolPhone, setNewSchoolPhone] = useState('');
  const [newSchoolRegion, setNewSchoolRegion] = useState('Grand Lomé');
  const [newSchoolQuota, setNewSchoolQuota] = useState(15);
  const [newSchoolPlan, setNewSchoolPlan] = useState<'free' | 'pro'>('free');
  const [isSubmittingNewSchool, setIsSubmittingNewSchool] = useState(false);

  // License keys state
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [keyFilter, setKeyFilter] = useState<'all' | 'available' | 'used' | 'suspended'>('all');
  const [newKeyTargetSchool, setNewKeyTargetSchool] = useState('');
  const [newKeyNote, setNewKeyNote] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Chat & Payment proofs state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedSchoolChatId, setSelectedSchoolChatId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Live account creation notification state
  const [newAccountNotification, setNewAccountNotification] = useState<{
    id: string;
    name: string;
    schoolType: string;
    location: string;
    managerEmail?: string;
    managerName?: string;
    time: string;
  } | null>(null);
  const [unreadNewAccountsCount, setUnreadNewAccountsCount] = useState<number>(0);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  // Live real-time notification state
  const [latestNotification, setLatestNotification] = useState<{
    id: string;
    schoolId: string;
    schoolName: string;
    message: string;
    time: string;
    hasAttachment?: boolean;
  } | null>(null);

  // Real audit logs state loaded from database/local activity
  const [activityLogs, setActivityLogs] = useState<AdminLog[]>([]);

  // Platform & Payment Settings state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsToast, setSettingsToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Direct 1-Click Activation Modal State
  const [activatingSchool, setActivatingSchool] = useState<{
    userId: string;
    name: string;
    licenseCode?: string;
    currentPlan?: string;
    managerPhone?: string;
  } | null>(null);
  const [activationDuration, setActivationDuration] = useState<number>(12);
  const [isProcessingDirectActivation, setIsProcessingDirectActivation] = useState(false);

  // Load SaaS statistics & configuration — all fetches run in parallel
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [allSchools, studentCount, logs, allMsgs, pSettings, keys] = await Promise.all([
        fetchAllSchools(),
        fetchAllStudentsCount(),
        fetchAdminLogs(),
        fetchChatMessages(),
        fetchPlatformSettings(),
        fetchAllLicenseKeys(),
      ]);
      setSchools(allSchools);
      setTotalStudents(studentCount);
      setActivityLogs(logs);
      setLicenseKeys(keys);
      setChatMessages(prev => {
        if (prev.length === allMsgs.length) {
          const hasDiff = prev.some((m, idx) => m.id !== allMsgs[idx]?.id || m.message !== allMsgs[idx]?.message || m.status !== allMsgs[idx]?.status);
          if (!hasDiff) return prev;
        }
        return allMsgs;
      });
      // Only update platform settings if not a silent background sync OR if user is not currently in settings tab
      if (!silent || (activeSubTabRef.current !== 'settings' && activeSubTabRef.current !== 'pricing')) {
        setPlatformSettings(pSettings);
      }

      // Auto-select first chat if none selected
      if (!selectedSchoolChatId && allSchools.length > 0) {
        setSelectedSchoolChatId(allSchools[0].userId);
      }
    } catch (err) {
      console.error('Error loading admin statistics:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDataChanged = () => {
      loadData(true);
    };

    const handleLicensesChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setLicenseKeys(e.detail);
      } else {
        fetchAllLicenseKeys().then(setLicenseKeys).catch(() => { });
      }
    };

    // Live chat message received event handler
    const handleNewChatMessage = (e: any) => {
      const newMsg = e.detail as ChatMessage;
      if (newMsg) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === newMsg.id || (m.schoolId === newMsg.schoolId && m.createdAt === newMsg.createdAt && m.message === newMsg.message))) {
            return prev;
          }
          return [...prev, newMsg];
        });

        if (newMsg.senderRole === 'school') {
          playAdminChime();
          setLatestNotification({
            id: newMsg.id,
            schoolId: newMsg.schoolId,
            schoolName: newMsg.schoolName || 'Établissement',
            message: newMsg.message,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            hasAttachment: !!newMsg.attachmentUrl
          });
          // Refresh schools in case a brand new school sent the message
          fetchAllSchools().then(setSchools).catch(() => { });
        }
      }
    };

    // Live school registration event handler
    const handleSchoolRegistered = (e: any) => {
      const school = e.detail;
      if (school && school.userId !== 'admin-super-user-id') {
        playAdminChime();
        setNewAccountNotification({
          id: school.userId || Date.now().toString(),
          name: school.name || 'Nouvel Établissement',
          schoolType: school.schoolType || 'Établissement',
          location: school.location || 'Togo',
          managerEmail: school.managerEmail || school.email || '',
          managerName: school.managerName || '',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        });
        setUnreadNewAccountsCount(prev => prev + 1);
        fetchAllSchools().then(setSchools).catch(() => { });
      }
    };
    window.addEventListener('cardschool_school_registered', handleSchoolRegistered);
    window.addEventListener('cardschool_school_registered', handleDataChanged);
    window.addEventListener('cardschool_school_deleted', handleDataChanged);
    window.addEventListener('cardschool_audit_log_added', handleDataChanged);
    window.addEventListener('cardschool_platform_settings_updated', handleDataChanged);
    window.addEventListener('cardschool_licenses_updated', handleLicensesChanged);
    window.addEventListener('cardschool_chat_message_received', handleNewChatMessage);
    window.addEventListener('storage', handleDataChanged);
    window.addEventListener('focus', handleDataChanged);

    // Supabase Realtime Subscription on chat_messages table
    let realtimeSub: any = null;
    try {
      realtimeSub = supabase
        .channel('admin_live_chat_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'school_info' }, (payload) => {
          const row = payload.new as any;
          if (row && row.user_id && row.user_id !== 'admin-super-user-id') {
            playAdminChime();
            setNewAccountNotification({
              id: row.user_id,
              name: row.name || 'Nouvel Établissement',
              schoolType: (row.card_colors as any)?.schoolType || 'Établissement',
              location: (row.card_colors as any)?.location || 'Togo',
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            });
            setUnreadNewAccountsCount(prev => prev + 1);
            fetchAllSchools().then(setSchools).catch(() => { });
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_logs' }, (payload) => {
          const row = payload.new as any;
          if (row && (row.action === 'Nouvelle Inscription' || row.action?.toLowerCase().includes('inscription'))) {
            playAdminChime();
            setNewAccountNotification({
              id: row.school_id || Date.now().toString(),
              name: row.school_name || 'Nouvel Établissement',
              schoolType: 'Établissement',
              location: 'Togo',
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            });
            setUnreadNewAccountsCount(prev => prev + 1);
            fetchAllSchools().then(setSchools).catch(() => { });
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          const row = payload.new as any;
          if (row) {
            const incomingMsg: ChatMessage = {
              id: row.id?.toString() || `${row.school_id}_${row.created_at}`,
              schoolId: row.school_id,
              schoolName: row.school_name || 'Établissement',
              senderRole: (row.sender_role || row.sender) === 'admin' ? 'admin' : 'school',
              message: row.message || '',
              attachmentUrl: row.attachment_url || undefined,
              createdAt: row.created_at || new Date().toISOString(),
              status: row.status || 'sent',
            };

            setChatMessages(prev => {
              if (prev.some(m => m.id === incomingMsg.id || (m.schoolId === incomingMsg.schoolId && m.createdAt === incomingMsg.createdAt))) {
                return prev;
              }
              return [...prev, incomingMsg];
            });

            if (incomingMsg.senderRole === 'school') {
              playAdminChime();
              setLatestNotification({
                id: incomingMsg.id,
                schoolId: incomingMsg.schoolId,
                schoolName: incomingMsg.schoolName || 'Établissement',
                message: incomingMsg.message,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                hasAttachment: !!incomingMsg.attachmentUrl
              });
              fetchAllSchools().then(setSchools).catch(() => { });
            }
          }
        })
        .subscribe();
    } catch { }

    const interval = setInterval(() => {
      if (isAppOnline()) {
        fetchChatMessages().then(msgs => {
          setChatMessages(prev => {
            if (prev.length === msgs.length) {
              const hasDiff = prev.some((m, idx) => m.id !== msgs[idx]?.id || m.message !== msgs[idx]?.message || m.status !== msgs[idx]?.status);
              if (!hasDiff) return prev;
            }
            return msgs;
          });
        }).catch(() => { });
      }
    }, 5000);

    return () => {
      window.removeEventListener('cardschool_school_registered', handleSchoolRegistered);
      window.removeEventListener('cardschool_school_registered', handleDataChanged);
      window.removeEventListener('cardschool_school_deleted', handleDataChanged);
      window.removeEventListener('cardschool_audit_log_added', handleDataChanged);
      window.removeEventListener('cardschool_platform_settings_updated', handleDataChanged);
      window.removeEventListener('cardschool_licenses_updated', handleLicensesChanged);
      window.removeEventListener('cardschool_chat_message_received', handleNewChatMessage);
      window.removeEventListener('storage', handleDataChanged);
      window.removeEventListener('focus', handleDataChanged);
      if (realtimeSub) supabase.removeChannel(realtimeSub);
      clearInterval(interval);
    };
  }, []);

  // Scroll handler to track when admin scrolls up manually to read older messages
  const handleChatScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 70;
    userScrolledUpRef.current = !isNearBottom;
    setShowScrollBottomBtn(!isNearBottom);
  };

  const scrollToChatBottom = (smooth: boolean = true) => {
    userScrolledUpRef.current = false;
    setShowScrollBottomBtn(false);
    if (messagesContainerRef.current) {
      if (smooth) {
        messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // When switching conversations, force scroll to bottom immediately
    userScrolledUpRef.current = false;
    setShowScrollBottomBtn(false);
    const t = setTimeout(() => scrollToChatBottom(false), 60);
    return () => clearTimeout(t);
  }, [selectedSchoolChatId]);

  useEffect(() => {
    if (activeSubTab === 'payments' && messagesContainerRef.current) {
      // Only auto-scroll down if the user has NOT scrolled up to read history
      if (!userScrolledUpRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [chatMessages, activeSubTab]);

  // Filter schools based on search and region
  const filteredSchools = schools.filter(school => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = school.name.toLowerCase().includes(term) ||
      (school.location && school.location.toLowerCase().includes(term)) ||
      (school.phone && school.phone.includes(term)) ||
      (school.managerName && school.managerName.toLowerCase().includes(term)) ||
      (school.managerEmail && school.managerEmail.toLowerCase().includes(term));

    const matchesRegion = selectedRegion === 'Toutes les régions' || (school.region || 'Grand Lomé') === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  // Filter license keys
  const filteredLicenseKeys = licenseKeys.filter(k => {
    if (keyFilter === 'available') return !k.isUsed && !k.isSuspended;
    if (keyFilter === 'used') return k.isUsed;
    if (keyFilter === 'suspended') return k.isSuspended;
    return true;
  });

  // Generate a new license key with optional target school
  const handleCreateLicenseKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdKey = await generateLicenseKey(
        12,
        newKeyNote.trim() || undefined,
        newKeyTargetSchool.trim() || undefined
      );
      const updated = await fetchAllLicenseKeys();
      setLicenseKeys(updated);
      setNewKeyNote('');
      setNewKeyTargetSchool('');
      fetchAdminLogs().then(logs => setActivityLogs(logs)).catch(() => { });
      alert(`Nouvelle Clé PRO générée avec succès :\n${createdKey.code}${createdKey.targetSchoolName ? ` (Pour : ${createdKey.targetSchoolName})` : ''}`);
    } catch (err) {
      console.error('handleCreateLicenseKey error:', err);
      alert('Erreur lors de la génération de la clé de licence.');
    }
  };

  // Toggle key status (Activer / Désactiver)
  const handleToggleKeyStatus = async (keyId: string, currentCode: string, isSuspended?: boolean) => {
    const actionName = isSuspended ? 'réactiver' : 'désactiver / suspendre';
    if (window.confirm(`Voulez-vous vraiment ${actionName} la clé ${currentCode} ?\n\nCela mettra également à jour le statut de l'école associée en temps réel.`)) {
      // Optimistic update immédiate (0ms)
      setLicenseKeys(prev => prev.map(k => (k.id === keyId || k.code === currentCode) ? { ...k, isSuspended: !isSuspended } : k));
      setSettingsToast({
        type: 'success',
        message: isSuspended ? `Clé ${currentCode} réactivée instantanément.` : `Clé ${currentCode} suspendue instantanément.`
      });
      setTimeout(() => setSettingsToast(null), 3500);

      toggleLicenseKeyStatus(keyId).then(() => {
        loadData();
      }).catch(err => {
        console.error('handleToggleKeyStatus error:', err);
        loadData();
      });
    }
  };

  // Delete license key
  const handleDeleteKey = async (keyId: string, currentCode: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT la clé de licence ${currentCode} ?`)) {
      // Optimistic removal immédiate (0ms)
      setLicenseKeys(prev => prev.filter(k => k.id !== keyId && k.code !== currentCode));
      setSettingsToast({ type: 'success', message: `Clé ${currentCode} supprimée instantanément.` });
      setTimeout(() => setSettingsToast(null), 3000);

      deleteLicenseKey(keyId).then(() => {
        fetchAllLicenseKeys().then(updated => setLicenseKeys(updated)).catch(() => { });
        fetchAdminLogs().then(logs => setActivityLogs(logs)).catch(() => { });
      }).catch(err => {
        console.error('handleDeleteKey error:', err);
        loadData();
      });
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Save custom quota
  const handleSaveCustomQuota = async () => {
    if (!editingSchool) return;
    const targetSchool = editingSchool;
    const targetQuota = customQuotaVal;
    // Optimistic UI update immédiate (0ms)
    setSchools(prev => prev.map(s => s.userId === targetSchool.userId ? { ...s, customQuota: targetQuota } : s));
    setEditingSchool(null);
    setSettingsToast({
      type: 'success',
      message: `Quota de "${targetSchool.name}" mis à jour à ${targetQuota} cartes instantanément !`
    });
    setTimeout(() => setSettingsToast(null), 3500);

    updateSchoolCustomQuota(targetSchool.userId, targetQuota, targetSchool.name).then(success => {
      if (!success) loadData();
    }).catch(err => {
      console.error('handleSaveCustomQuota error:', err);
      loadData();
    });
  };

  // Open direct activation modal
  const handleOpenDirectActivation = (schoolUserId: string, schoolName: string, currentPlan?: string, phone?: string) => {
    // Look for a preassigned license key for this school
    const matchedKey = licenseKeys.find(k =>
      !k.isUsed && (
        (k.targetSchoolId && k.targetSchoolId === schoolUserId) ||
        (k.targetSchoolName && k.targetSchoolName.toUpperCase() === (schoolName || '').toUpperCase())
      )
    );
    setActivatingSchool({
      userId: schoolUserId,
      name: schoolName,
      licenseCode: matchedKey?.code,
      currentPlan: currentPlan || 'free',
      managerPhone: phone
    });
    setActivationDuration(12);
  };

  // Process 1-click direct activation
  const handleConfirmDirectActivation = async () => {
    if (!activatingSchool) return;
    const target = activatingSchool;
    const duration = activationDuration;
    // Optimistic UI update immédiate (0ms)
    setSchools(prev => prev.map(s => s.userId === target.userId ? { ...s, plan: 'pro', isPro: true } : s));
    setActivatingSchool(null);
    playAdminChime();
    setSettingsToast({
      type: 'success',
      message: `Établissement "${target.name}" activé en PRO pour ${duration} mois instantanément !`
    });
    setTimeout(() => setSettingsToast(null), 4000);

    activateSchoolDirectly(target.userId, target.name, duration).then(res => {
      if (!res.success) {
        alert(res.message || "Erreur lors de l'activation directe.");
      }
      loadData();
    }).catch(err => {
      console.error('handleConfirmDirectActivation error:', err);
      loadData();
    });
  };

  // Upgrade trial schools to Pro subscription plan
  const handleUpgradeToPro = async (schoolUserId: string, schoolName: string) => {
    handleOpenDirectActivation(schoolUserId, schoolName, 'free');
  };

  // Suspend a school account
  const handleSuspendSchool = async (schoolUserId: string, schoolName: string) => {
    if (window.confirm(`Voulez-vous suspendre l'accès de l'établissement "${schoolName}" pour impayé ou litige ? L'ajout et l'impression d'élèves seront bloqués.`)) {
      // Optimistic UI update immédiate (0ms)
      setSchools(prev => prev.map(s => s.userId === schoolUserId ? { ...s, plan: 'suspended', isPro: false } : s));
      setSettingsToast({
        type: 'success',
        message: `Compte de "${schoolName}" suspendu avec succès.`
      });
      setTimeout(() => setSettingsToast(null), 3500);

      updateSchoolSubscription(schoolUserId, 'suspended', '', schoolName).then(success => {
        if (!success) loadData();
      }).catch(() => loadData());
    }
  };

  // Downgrade or Reset subscription to Free trial plan
  const handleResetToFree = async (schoolUserId: string, schoolName: string) => {
    if (window.confirm(`Confirmez-vous le retour au Plan Découverte (Gratuit) pour l'établissement "${schoolName}" ?`)) {
      // Optimistic UI update immédiate (0ms)
      setSchools(prev => prev.map(s => s.userId === schoolUserId ? { ...s, plan: 'free', isPro: false } : s));
      setSettingsToast({
        type: 'success',
        message: `Abonnement réinitialisé au Plan Gratuit pour "${schoolName}".`
      });
      setTimeout(() => setSettingsToast(null), 3500);

      updateSchoolSubscription(schoolUserId, 'free', '', schoolName).then(success => {
        if (!success) loadData();
      }).catch(() => loadData());
    }
  };

  // Delete School Handler
  const handleDeleteSchool = async (schoolUserId: string, schoolName: string) => {
    if (window.confirm(`⚠️ ATTENTION SUPPRESSION DÉFINITIVE :\n\nVoulez-vous supprimer définitivement l'établissement "${schoolName}" ?\n\nToutes ses cartes d'élèves, ses clés de licence, ses messages et ses journaux associés seront effacés.`)) {
      // Optimistic removal immédiate (0ms)
      setSchools(prev => prev.filter(s => s.userId !== schoolUserId));
      setSettingsToast({
        type: 'success',
        message: `Établissement "${schoolName}" supprimé.`
      });
      setTimeout(() => setSettingsToast(null), 3000);

      deleteSchoolByAdmin(schoolUserId, schoolName).then(() => {
        loadData();
      }).catch(err => {
        console.error('handleDeleteSchool error:', err);
        loadData();
      });
    }
  };

  // Purge orphan license keys
  const handlePurgeOrphanKeys = async () => {
    if (window.confirm("Voulez-vous nettoyer le registre et supprimer les clés de licence orphelines (écoles supprimées ou tests passés) ?")) {
      setIsLoading(true);
      try {
        const res = await purgeOrphanLicenseKeys();
        await loadData();
        alert(`Nettoyage terminé avec succès : ${res.removedCount} clé(s) orpheline(s) supprimée(s).`);
      } catch (err) {
        console.error('handlePurgeOrphanKeys error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Direct School Creation Handler
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) {
      alert("Veuillez saisir le nom de l'établissement.");
      return;
    }

    setIsSubmittingNewSchool(true);
    try {
      const res = await createSchoolByAdmin({
        name: newSchoolName,
        schoolType: newSchoolType,
        location: newSchoolLocation,
        phone: newSchoolPhone,
        region: newSchoolRegion,
        customQuota: newSchoolQuota,
        plan: newSchoolPlan
      });

      if (res.success) {
        alert(`Établissement "${newSchoolName.toUpperCase()}" créé et enregistré avec succès !`);
        setIsCreatingSchool(false);
        setNewSchoolName('');
        setNewSchoolLocation('');
        setNewSchoolPhone('');
        setNewSchoolQuota(15);
        setNewSchoolPlan('free');
        loadData();
      } else {
        alert("Erreur lors de la création de l'établissement.");
      }
    } catch (err) {
      console.error('handleCreateSchool error:', err);
      alert("Erreur inattendue.");
    } finally {
      setIsSubmittingNewSchool(false);
    }
  };

  // Send admin chat reply
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedSchoolChatId) return;

    const replyMsg = adminReplyText.trim();
    setAdminReplyText('');

    const targetSchool = schools.find(s => s.userId === selectedSchoolChatId);
    const convDetail = sortedConversations.find(c => c.schoolId === selectedSchoolChatId);
    const schoolName = targetSchool?.name || convDetail?.schoolName || 'Établissement';

    // Optimistic message affiché immédiatement (0ms)
    const optimisticId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      schoolId: selectedSchoolChatId,
      schoolName,
      senderRole: 'admin',
      message: replyMsg,
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToChatBottom(true), 20);

    try {
      const newMsg = await sendChatMessage(
        selectedSchoolChatId,
        schoolName,
        'admin',
        replyMsg
      );
      setChatMessages(prev => prev.map(m => m.id === optimisticId ? newMsg : m));
      setTimeout(() => scrollToChatBottom(true), 60);
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  // Validate payment from chat directly
  const handleValidateChatPayment = async (schoolId: string, schoolName: string) => {
    if (window.confirm(`Confirmez-vous la validation du paiement Mobile Money et l'activation PRO 1 An pour "${schoolName}" ?`)) {
      // Optimistic UI update immédiate (0ms)
      setSchools(prev => prev.map(s => s.userId === schoolId ? { ...s, plan: 'pro', isPro: true } : s));
      setChatMessages(prev => prev.map(m => m.schoolId === schoolId && m.attachmentUrl ? { ...m, status: 'validated' } : m));
      playAdminChime();
      setSettingsToast({
        type: 'success',
        message: `Paiement validé instantanément ! ${schoolName} est désormais PRO 1 An.`
      });
      setTimeout(() => setSettingsToast(null), 4000);

      validatePaymentFromChat(schoolId, schoolName).then(ok => {
        if (ok) {
          loadData();
        } else {
          alert("Erreur lors de la validation du paiement.");
          loadData();
        }
      }).catch(() => loadData());
    }
  };

  // Save Platform & Payment Settings (Instant & non-blocking)
  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    playAdminChime();
    setSettingsToast({ type: 'success', message: 'Paramètres de paiement et contacts mis à jour instantanément !' });
    setTimeout(() => setSettingsToast(null), 4000);

    savePlatformSettings(platformSettings).then(ok => {
      if (!ok) {
        setSettingsToast({ type: 'error', message: 'Erreur lors de la sauvegarde.' });
      }
    }).catch(err => {
      setSettingsToast({ type: 'error', message: 'Erreur lors de la sauvegarde des paramètres.' });
    }).finally(() => {
      setIsSavingSettings(false);
    });
  };

  // Mise à jour immédiate des champs vidéo avec cache local instantané
  const updateVideoSettingsField = (field: 'demoVideoUrl' | 'demoVideoTitle' | 'demoVideoPoster', val: string) => {
    setPlatformSettings(prev => {
      const updated = { ...prev, [field]: val };
      savePlatformSettings(updated);
      return updated;
    });
  };

  // Enregistrement dédié et instantané de la vidéo de présentation
  const handleSaveVideoOnly = async () => {
    setIsSavingVideo(true);
    setVideoSaveSuccess(true);
    playAdminChime();
    setSettingsToast({ type: 'success', message: 'Vidéo de présentation enregistrée avec succès ! Elle est désormais active sur la page d\'accueil.' });
    setTimeout(() => {
      setVideoSaveSuccess(false);
      setSettingsToast(null);
    }, 4500);

    savePlatformSettings(platformSettings).finally(() => {
      setIsSavingVideo(false);
    });
  };

  const handleResetDefaultSettings = () => {
    if (window.confirm("Voulez-vous restaurer les numéros de paiement et coordonnées par défaut ?")) {
      setPlatformSettings(DEFAULT_PLATFORM_SETTINGS);
      savePlatformSettings(DEFAULT_PLATFORM_SETTINGS);
      setSettingsToast({ type: 'success', message: 'Paramètres réinitialisés avec succès !' });
      setTimeout(() => setSettingsToast(null), 3000);
    }
  };

  // Pricing plans helpers for Landing Page
  const currentPricingPlans: LandingPricingPlan[] = (platformSettings.pricingPlans && platformSettings.pricingPlans.length > 0)
    ? platformSettings.pricingPlans
    : DEFAULT_PRICING_PLANS;

  const handleTogglePricingSection = () => {
    setPlatformSettings(prev => {
      const nextVal = prev.pricingEnabled === false;
      const updated = { ...prev, pricingEnabled: nextVal };
      savePlatformSettings(updated);
      return updated;
    });
    playAdminChime();
    setSettingsToast({
      type: 'success',
      message: platformSettings.pricingEnabled === false
        ? 'Section Tarifs activée et visible sur la vitrine instantanément !'
        : 'Section Tarifs masquée de la vitrine instantanément !'
    });
    setTimeout(() => setSettingsToast(null), 3500);
  };

  const handleAddPricingPlan = () => {
    const newPlan: LandingPricingPlan = {
      id: 'plan_' + Date.now(),
      badge: 'Sur-mesure',
      name: 'Nouvelle Formule',
      description: 'Description claire et engageante pour cette offre scolaire.',
      price: `${(platformSettings.annualPriceCFA || 30000).toLocaleString()} F CFA`,
      period: '/ an',
      features: [
        'Cartes élèves illimitées',
        'Fonds et logos personnalisés',
        'Support technique prioritaire'
      ],
      buttonText: "S'abonner maintenant",
      buttonAction: 'signup',
      buttonUrl: '',
      isPopular: false,
      enabled: true
    };
    setPlatformSettings(prev => {
      const updatedList = [...((prev.pricingPlans && prev.pricingPlans.length > 0) ? prev.pricingPlans : DEFAULT_PRICING_PLANS), newPlan];
      const updated = { ...prev, pricingPlans: updatedList };
      savePlatformSettings(updated);
      return updated;
    });
    setSettingsToast({ type: 'success', message: 'Nouvelle formule ajoutée et active instantanément !' });
    setTimeout(() => setSettingsToast(null), 3000);
  };

  const handleUpdatePricingPlan = (index: number, updatedFields: Partial<LandingPricingPlan>) => {
    setPlatformSettings(prev => {
      const list = [...((prev.pricingPlans && prev.pricingPlans.length > 0) ? prev.pricingPlans : DEFAULT_PRICING_PLANS)];
      list[index] = { ...list[index], ...updatedFields };
      const updated = { ...prev, pricingPlans: list };
      savePlatformSettings(updated);
      return updated;
    });
  };

  const handleRemovePricingPlan = (index: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette formule de tarif ?")) {
      setPlatformSettings(prev => {
        const list = [...((prev.pricingPlans && prev.pricingPlans.length > 0) ? prev.pricingPlans : DEFAULT_PRICING_PLANS)];
        list.splice(index, 1);
        const updated = { ...prev, pricingPlans: list };
        savePlatformSettings(updated);
        return updated;
      });
      setSettingsToast({ type: 'success', message: 'Formule supprimée instantanément.' });
      setTimeout(() => setSettingsToast(null), 3000);
    }
  };

  const handleMovePricingPlan = (index: number, direction: 'up' | 'down') => {
    setPlatformSettings(prev => {
      const list = [...((prev.pricingPlans && prev.pricingPlans.length > 0) ? prev.pricingPlans : DEFAULT_PRICING_PLANS)];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      const updated = { ...prev, pricingPlans: list };
      savePlatformSettings(updated);
      return updated;
    });
  };

  const handleAddFeatureToPlan = (planIndex: number, featText: string) => {
    if (!featText.trim()) return;
    setPlatformSettings(prev => {
      const list = [...((prev.pricingPlans && prev.pricingPlans.length > 0) ? prev.pricingPlans : DEFAULT_PRICING_PLANS)];
      const plan = list[planIndex];
      list[planIndex] = {
        ...plan,
        features: [...plan.features, featText.trim()]
      };
      const updated = { ...prev, pricingPlans: list };
      savePlatformSettings(updated);
      return updated;
    });
  };

  const handleRemoveFeatureFromPlan = (planIndex: number, featIndex: number) => {
    setPlatformSettings(prev => {
      const list = [...((prev.pricingPlans && prev.pricingPlans.length > 0) ? prev.pricingPlans : DEFAULT_PRICING_PLANS)];
      const plan = list[planIndex];
      const newFeats = plan.features.filter((_, idx) => idx !== featIndex);
      list[planIndex] = { ...plan, features: newFeats };
      const updated = { ...prev, pricingPlans: list };
      savePlatformSettings(updated);
      return updated;
    });
  };

  const handleResetPricingPlans = () => {
    if (window.confirm("Voulez-vous restaurer les 3 offres tarifaires d'origine de la vitrine ?")) {
      const updated = {
        ...platformSettings,
        pricingTitle: DEFAULT_PLATFORM_SETTINGS.pricingTitle,
        pricingSubtitle: DEFAULT_PLATFORM_SETTINGS.pricingSubtitle,
        pricingPlans: DEFAULT_PRICING_PLANS
      };
      setPlatformSettings(updated);
      savePlatformSettings(updated);
      setSettingsToast({ type: 'success', message: 'Offres tarifaires d\'origine restaurées instantanément !' });
      setTimeout(() => setSettingsToast(null), 3000);
    }
  };

  const handleSavePricingOnly = async () => {
    setIsSavingSettings(true);
    playAdminChime();
    setSettingsToast({
      type: 'success',
      message: 'Tarification enregistrée avec succès ! La vitrine est actualisée instantanément.'
    });
    setTimeout(() => setSettingsToast(null), 4000);

    savePlatformSettings(platformSettings).then(ok => {
      if (!ok) {
        setSettingsToast({ type: 'error', message: 'Erreur lors de la sauvegarde de la tarification.' });
      }
    }).catch(err => {
      setSettingsToast({ type: 'error', message: 'Erreur réseau lors de la sauvegarde.' });
    }).finally(() => {
      setIsSavingSettings(false);
    });
  };

  // Group chat messages by school
  const currentSchoolMessages = chatMessages.filter(m => m.schoolId === selectedSchoolChatId);
  const pendingReceiptsCount = chatMessages.filter(m => m.attachmentUrl && m.status !== 'validated').length;
  const unreadSchoolMessagesCount = chatMessages.filter(m => m.senderRole === 'school').length;

  // Build unified sorted conversations list
  const conversationsMap = new Map<string, { schoolId: string; schoolName: string; plan?: string; lastMessage?: ChatMessage; unvalidatedReceipt?: boolean; phone?: string; location?: string }>();

  schools.forEach(sch => {
    const schMsgs = chatMessages.filter(m => m.schoolId === sch.userId);
    const lastMsg = schMsgs[schMsgs.length - 1];
    const hasUnvalidatedReceipt = schMsgs.some(m => m.attachmentUrl && m.status !== 'validated');
    conversationsMap.set(sch.userId, {
      schoolId: sch.userId,
      schoolName: sch.name,
      plan: sch.subscriptionPlan || 'free',
      lastMessage: lastMsg,
      unvalidatedReceipt: hasUnvalidatedReceipt,
      phone: sch.phone,
      location: sch.location
    });
  });

  chatMessages.forEach(msg => {
    if (msg.schoolId && !conversationsMap.has(msg.schoolId)) {
      const schMsgs = chatMessages.filter(m => m.schoolId === msg.schoolId);
      const lastMsg = schMsgs[schMsgs.length - 1];
      const hasUnvalidatedReceipt = schMsgs.some(m => m.attachmentUrl && m.status !== 'validated');
      conversationsMap.set(msg.schoolId, {
        schoolId: msg.schoolId,
        schoolName: msg.schoolName || 'Établissement Enregistré',
        plan: 'free',
        lastMessage: lastMsg,
        unvalidatedReceipt: hasUnvalidatedReceipt
      });
    }
  });

  const sortedConversations = Array.from(conversationsMap.values()).sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Calculate SaaS global KPI widgets metrics
  const activeProSchoolsCount = schools.filter(s => s.subscriptionPlan === 'pro').length;
  const freeSchoolsCount = schools.filter(s => s.subscriptionPlan !== 'pro' && s.subscriptionPlan !== 'suspended').length;
  const suspendedSchoolsCount = schools.filter(s => s.subscriptionPlan === 'suspended').length;
  const estimatedAnnualRevenue = activeProSchoolsCount * (platformSettings.annualPriceCFA || 30000);

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#f8faf6] border-b border-slate-200/90 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 truncate leading-tight uppercase tracking-tight">
              Console Admin
            </h2>
            <p className="text-[8px] text-emerald-700 font-bold uppercase tracking-wider">SukuPass Togo</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 shadow-xs"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            title="Déconnexion"
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer active:scale-95 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Fixed Side Menu Navigation - Desktop Only */}
      <aside className={`hidden md:flex ${isSidebarOpen ? 'md:w-64' : 'md:w-20'
        } md:h-full bg-[#f8faf6] text-slate-700 flex-col shrink-0 border-r border-slate-200 shadow-sm transition-[width] duration-300 ease-in-out overflow-x-hidden`}>
        {/* Top Logo Section: exact height h-[73px], edge-to-edge border-b */}
        <div className={`h-[73px] flex items-center border-b border-slate-200 shrink-0 ${isSidebarOpen ? 'px-5 justify-between' : 'justify-center px-2'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white border border-emerald-500/20 shadow-md shadow-emerald-600/10 shrink-0" title={!isSidebarOpen ? "Console Admin - SukuPass Togo" : undefined}>
              <Shield className="w-5 h-5" />
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1 animate-fadeIn">
                <h2 className="text-sm font-black text-slate-900 truncate leading-tight uppercase tracking-wider">
                  Console Admin
                </h2>
                <p className="text-[9px] text-emerald-700 font-black uppercase tracking-[0.1em] mt-0.5">SukuPass Togo</p>
              </div>
            )}
          </div>
        </div>

        <div className={`py-6 flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden ${isSidebarOpen ? 'px-4' : 'px-2'}`}>
          <div>
            <nav className="space-y-1.5">
              {[
                { id: 'overview', label: 'Supervision Globale', icon: TrendingUp },
                { id: 'schools', label: 'Écoles Partenaires', icon: Building2 },
                { id: 'payments', label: 'Chat & Preuves Paiement', icon: MessageSquare, badge: (unreadSchoolMessagesCount > 0 ? unreadSchoolMessagesCount : pendingReceiptsCount) },
                { id: 'licenses', label: 'Clés de Licence PRO', icon: Key },
                { id: 'pricing', label: 'Tarifs Vitrine', icon: Tag },
                { id: 'analytics', label: 'Statistiques Visiteurs', icon: BarChart3 },
                { id: 'settings', label: 'Paramètres & Contacts', icon: Settings },
                { id: 'logs', label: "Journal d'Activité", icon: History },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeSubTab === item.id;
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => setActiveSubTab(item.id as any)}
                      className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center w-12 h-12 mx-auto'
                        } rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                      <div className="relative shrink-0 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                        {item.badge && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {isSidebarOpen && <span className="truncate">{item.label}</span>}
                    </button>

                    {!isSidebarOpen && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                        {item.label}
                        {item.badge && item.badge > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-200/80 space-y-2">
            {/* User Profile & Collapse Arrow */}
            <div className="relative group">
              {isSidebarOpen ? (
                <div className="flex items-center justify-between gap-2.5 px-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs uppercase shrink-0">
                      <span className="leading-none select-none">{session.fullName?.charAt(0) || session.email?.charAt(0) || 'A'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">{session.fullName || 'Administrateur'}</p>
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
                    <span className="leading-none select-none">{session.fullName?.charAt(0) || session.email?.charAt(0) || 'A'}</span>
                  </div>
                </div>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0">
                  <p className="font-bold">{session.fullName || 'Administrateur'}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{session.email}</p>
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>

            {/* Déconnexion */}
            <div className="relative group">
              <button
                onClick={onLogout}
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

      {/* Main dashboard panels scroll area */}
      <main className="flex-1 min-w-0 md:h-full overflow-y-auto bg-gray-50/50 pb-20 md:pb-8">

        {/* Desktop / Tablet Header toolbar: exact h-[73px], edge-to-edge border-b */}
        <header className="hidden md:flex bg-white border-b border-slate-200 h-[73px] px-8 justify-between items-center sticky top-0 z-30 shadow-xs shrink-0">
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              SaaS Administration Togo
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Monitoring • Validation Mobile Money • Gestion Licences</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                className="relative p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl transition-all cursor-pointer"
                title="Notifications & Activité Récente"
              >
                <Bell className="w-4 h-4" />
                {(unreadSchoolMessagesCount > 0 || unreadNewAccountsCount > 0) && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {(unreadSchoolMessagesCount + unreadNewAccountsCount) > 9 ? '9+' : (unreadSchoolMessagesCount + unreadNewAccountsCount)}
                  </span>
                )}
              </button>

              {/* Notification Floating Menu */}
              {isNotificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-emerald-600" />
                      Notifications Récentes
                    </h4>
                    <button
                      onClick={() => {
                        setUnreadNewAccountsCount(0);
                        setIsNotificationDropdownOpen(false);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Fermer
                    </button>
                  </div>

                  {/* Account Registrations notification item */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {newAccountNotification ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-emerald-800 uppercase">Nouvelle Inscription</span>
                          <span className="text-[9px] text-slate-400">{newAccountNotification.time}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{newAccountNotification.name}</p>
                        <p className="text-[10px] text-slate-500">{newAccountNotification.schoolType} à {newAccountNotification.location}</p>
                        <button
                          onClick={() => {
                            setSearchTerm(newAccountNotification.name);
                            setActiveSubTab('schools');
                            setIsNotificationDropdownOpen(false);
                          }}
                          className="mt-1 text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          Voir la fiche école →
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                        Aucune nouvelle inscription en attente
                      </div>
                    )}

                    {unreadSchoolMessagesCount > 0 && (
                      <div
                        onClick={() => {
                          setActiveSubTab('payments');
                          setIsNotificationDropdownOpen(false);
                        }}
                        className="p-3 bg-amber-50 hover:bg-amber-100/70 rounded-xl border border-amber-200 cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-800 uppercase">Messages Écoles</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-black">{unreadSchoolMessagesCount} non lus</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">Preuves de paiement et questions reçues</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => {
                        setActiveSubTab('schools');
                        setIsNotificationDropdownOpen(false);
                      }}
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      Voir toutes les écoles
                    </button>
                    <button
                      onClick={() => {
                        setActiveSubTab('analytics');
                        setIsNotificationDropdownOpen(false);
                      }}
                      className="font-bold text-slate-600 hover:underline"
                    >
                      Voir les statistiques
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => exportSchoolsToCSV(filteredSchools)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Exporter le registre en CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export CSV
            </button>

            <button
              onClick={loadData}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-xl transition-all cursor-pointer active:scale-95"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* New Account Registration Toast Banner */}
        {newAccountNotification && (
          <div className="mx-8 mt-6 p-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between border border-emerald-400/50 animate-bounce-once">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/25 flex items-center justify-center text-emerald-300 shrink-0 border border-emerald-400/40 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-400/30 text-emerald-200 border border-emerald-400/40">
                    🎉 Nouveau Compte Créé !
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium">({newAccountNotification.time})</span>
                </div>
                <p className="text-sm font-bold text-white mt-1">
                  L'établissement <span className="text-emerald-300 font-black">{newAccountNotification.name}</span> ({newAccountNotification.schoolType} à {newAccountNotification.location}) vient de créer son compte !
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSearchTerm(newAccountNotification.name);
                  setActiveSubTab('schools');
                  setNewAccountNotification(null);
                  setUnreadNewAccountsCount(0);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Voir l'école</span>
              </button>
              <button
                onClick={() => setNewAccountNotification(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Chat & Notification Toast Banner */}
        {latestNotification && (
          <div className="mx-8 mt-6 p-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/40 animate-bounce-once">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-400/30 shadow-inner">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                    Nouveau Message Direct Reçu
                  </span>
                  <span className="text-[10px] text-slate-300 font-medium">({latestNotification.time})</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">
                  <span className="text-emerald-300 font-black">{latestNotification.schoolName}</span> : {latestNotification.message}
                  {latestNotification.hasAttachment && (
                    <span className="ml-2 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                      📎 Reçu Mobile Money Joint
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedSchoolChatId(latestNotification.schoolId);
                  setActiveSubTab('payments');
                  setLatestNotification(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl shadow cursor-pointer transition-all active:scale-95"
              >
                Répondre / Voir
              </button>
              <button
                onClick={() => setLatestNotification(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab content renderer */}
        <div className="p-8 space-y-8">

          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Visitor Analytics Shortcut Banner in Overview */}
              <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-3xl p-5 shadow-sm border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black flex items-center gap-2">
                      <span>Statistiques Visiteurs & Fréquentation en Direct</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h4>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Analysez les visites quotidiennes, les appareils (smartphones / PC) et la provenance des directeurs d'école au Togo.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('analytics')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
                >
                  <span>Consulter l'audience</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Stats Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-2 bg-white">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Écoles Partenaires</p>
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">{schools.length}</p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span>{activeProSchoolsCount} Pro</span> • <span>{freeSchoolsCount} Découverte</span>
                      {suspendedSchoolsCount > 0 && <span className="text-red-500">• {suspendedSchoolsCount} Suspendue(s)</span>}
                    </p>
                  </div>
                </div>

                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-2 bg-white">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Cartes Élèves Générées</p>
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">{totalStudents}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Volume total cumulé sur la plateforme</p>
                  </div>
                </div>

                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-2 bg-white">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Abonnements Actifs</p>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">{activeProSchoolsCount}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">
                      Taux de conversion : {schools.length > 0 ? Math.round((activeProSchoolsCount / schools.length) * 100) : 0}%
                    </p>
                  </div>
                </div>

                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-2 bg-white">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenus Estimés (CFA)</p>
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-black text-emerald-800">{estimatedAnnualRevenue.toLocaleString()} F</p>
                    <p className="text-[10px] text-gray-400 font-bold">Base annuelle active (30k CFA / école)</p>
                  </div>
                </div>

              </div>

              {/* Split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                <div className="lg:col-span-7 double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-5 bg-white">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Établissements Récemment Enregistrés
                    </h3>

                    {isLoading ? (
                      <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
                    ) : schools.length === 0 ? (
                      <p className="text-xs text-gray-500 font-medium text-center py-8">Aucun établissement inscrit pour le moment.</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {schools.slice(0, 5).map((school, i) => (
                          <div key={i} className="py-3 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-800 truncate">{school.name}</p>
                              <p className="text-[10px] text-gray-400 font-semibold">{school.location || 'Localisation non définie'} • {school.phone || 'Pas de numéro'}</p>
                            </div>
                            <div className="text-right pl-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${school.subscriptionPlan === 'pro'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                : (school.subscriptionPlan === 'suspended' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-800 border border-amber-100')
                                }`}>
                                {school.subscriptionPlan || 'free'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-5 bg-white">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" />
                      Activités Récentes (Audit Logs)
                    </h3>

                    {activityLogs.length === 0 ? (
                      <div className="py-8 text-center">
                        <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium">Aucune activité récente enregistrée.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activityLogs.slice(0, 5).map((log) => (
                          <div key={log.id} className="text-xs space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-gray-800 truncate max-w-[150px]">{log.schoolName}</span>
                              <span className="text-[9px] text-gray-400 font-medium">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] font-extrabold text-emerald-850">{log.action}</p>
                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">{log.details}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHOOLS LIST */}
          {activeSubTab === 'schools' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-4 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:max-w-2xl">
                    <div className="relative w-full sm:flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, ville, téléphone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus-brand bg-white transition-all"
                      />
                    </div>
                    <div className="relative w-full sm:w-56 shrink-0">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                      <select
                        value={selectedRegion}
                        onChange={e => setSelectedRegion(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus-brand bg-white appearance-none cursor-pointer"
                      >
                        <option value="Toutes les régions">Toutes les régions</option>
                        {TOGO_REGIONS.map(reg => (
                          <option key={reg} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCreatingSchool(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter un Établissement
                    </button>
                    <button
                      onClick={() => exportSchoolsToCSV(filteredSchools)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      onClick={loadData}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
                      title="Actualiser la liste"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-slate-200/70 shrink-0">
                      {filteredSchools.length} école(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-0 bg-white overflow-hidden">
                  {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
                  ) : filteredSchools.length === 0 ? (
                    <div className="py-20 text-center text-xs text-gray-500 font-medium">Aucun établissement ne correspond aux filtres.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] border-collapse text-left">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-slate-200/70 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <th className="px-6 py-4">Établissement</th>
                            <th className="px-6 py-4">Région & Contacts</th>
                            <th className="px-6 py-4">Volume Cartes</th>
                            <th className="px-6 py-4">Quota Limite</th>
                            <th className="px-6 py-4">Plan & Statut</th>
                            <th className="px-6 py-4 text-right">Actions Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {filteredSchools.map((school) => {
                            const preassignedKey = licenseKeys.find(k =>
                              (k.targetSchoolId && k.targetSchoolId === school.userId) ||
                              (k.targetSchoolName && k.targetSchoolName.toUpperCase() === school.name.toUpperCase()) ||
                              (k.usedBySchoolId && k.usedBySchoolId === school.userId)
                            );

                            return (
                              <tr key={school.userId} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-gray-900">{school.name}</p>
                                    {school.schoolType && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                        {school.schoolType}
                                      </span>
                                    )}
                                  </div>
                                  {(school.managerName || school.managerEmail) && (
                                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                                      <User className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{school.managerName || 'Responsable'}</span>
                                      {school.managerEmail && <span className="text-slate-400 font-normal">({school.managerEmail})</span>}
                                    </p>
                                  )}
                                  {preassignedKey && (
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${preassignedKey.isUsed
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                        }`}>
                                        <Key className="w-2.5 h-2.5 text-emerald-600" />
                                        {preassignedKey.code}
                                        {preassignedKey.isUsed ? ' (Active)' : ' (En attente)'}
                                      </span>
                                      <button
                                        onClick={() => handleCopyCode(preassignedKey.code)}
                                        className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                                        title="Copier la clé"
                                      >
                                        {copiedCode === preassignedKey.code ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-600">
                                  <p className="flex items-center gap-1 text-emerald-700 font-bold">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {school.region || 'Grand Lomé'}
                                  </p>
                                  <p className="text-[10px] text-gray-400">{school.location || 'Localisation N/A'} • {school.phone || 'Tel N/A'}</p>
                                </td>
                                <td className="px-6 py-4 font-black text-emerald-850">
                                  {school.studentCount} cartes
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700">{school.customQuota || 15} cartes</span>
                                    <button
                                      onClick={() => {
                                        setEditingSchool(school);
                                        setCustomQuotaVal(school.customQuota || 15);
                                      }}
                                      className="p-1 hover:bg-gray-200 text-gray-500 rounded transition-colors cursor-pointer"
                                      title="Modifier le quota"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {(() => {
                                    const isExpired = school.subscriptionPlan === 'pro' && !!school.subscriptionExpiresAt && new Date(school.subscriptionExpiresAt).getTime() < Date.now();
                                    if (school.subscriptionPlan === 'pro') {
                                      if (isExpired) {
                                        return (
                                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                                            PRO Expiré
                                          </span>
                                        );
                                      }
                                      return (
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
                                          PRO (Actif)
                                        </span>
                                      );
                                    }
                                    if (school.subscriptionPlan === 'suspended') {
                                      return (
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-100">
                                          Suspendu
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                        Gratuit
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                  {school.subscriptionPlan === 'pro' ? (
                                    <>
                                      <button
                                        onClick={() => handleSuspendSchool(school.userId, school.name)}
                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                        title="Suspendre l'accès"
                                      >
                                        Suspendre
                                      </button>
                                      <button
                                        onClick={() => handleResetToFree(school.userId, school.name)}
                                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                      >
                                        Reset Gratuit
                                      </button>
                                    </>
                                  ) : school.subscriptionPlan === 'suspended' ? (
                                    <>
                                      <button
                                        onClick={() => handleOpenDirectActivation(school.userId, school.name, school.subscriptionPlan, school.phone)}
                                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm inline-flex items-center gap-1"
                                      >
                                        <Zap className="w-3 h-3 text-amber-300" />
                                        Réactiver en PRO
                                      </button>
                                      <button
                                        onClick={() => handleResetToFree(school.userId, school.name)}
                                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                      >
                                        Débloquer en Gratuit
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleOpenDirectActivation(school.userId, school.name, school.subscriptionPlan, school.phone)}
                                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-lg text-[10px] transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                                        title="Valider le paiement et activer en PRO directement"
                                      >
                                        <Zap className="w-3 h-3 text-amber-300" />
                                        <span>Valider Paiement & Activer PRO</span>
                                      </button>
                                      <button
                                        onClick={() => handleSuspendSchool(school.userId, school.name)}
                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                        title="Bloquer l'école"
                                      >
                                        Bloquer
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDeleteSchool(school.userId, school.name)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[10px] transition-colors cursor-pointer inline-flex items-center ml-1"
                                    title="Supprimer définitivement cet établissement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHAT & MOBILE MONEY PAYMENT PROOFS */}
          {activeSubTab === 'payments' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)] min-h-[580px] max-h-[780px]">

                {/* Left column: Schools conversations list */}
                <div className="lg:col-span-4 double-bezel-outer h-full flex flex-col min-h-0">
                  <div className="double-bezel-inner p-4 bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 shrink-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Discussions & Preuves</h3>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{sortedConversations.length} échanges</span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 mt-2">
                      {sortedConversations.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-10 font-medium">Aucun échange ou établissement pour l'instant.</p>
                      ) : (
                        sortedConversations.map(conv => {
                          const isSelected = selectedSchoolChatId === conv.schoolId;

                          return (
                            <button
                              key={conv.schoolId}
                              onClick={() => setSelectedSchoolChatId(conv.schoolId)}
                              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1 my-1 ${isSelected
                                ? 'bg-emerald-50 border border-emerald-200/80 shadow-sm'
                                : 'hover:bg-gray-50'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-black truncate max-w-[170px] ${isSelected ? 'text-emerald-900' : 'text-gray-800'}`}>
                                  {conv.schoolName}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${conv.plan === 'pro'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (conv.plan === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')
                                  }`}>
                                  {conv.plan || 'free'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-500 font-medium truncate max-w-[180px]">
                                  {conv.lastMessage ? (conv.lastMessage.attachmentUrl ? '📎 Preuve reçue' : conv.lastMessage.message) : 'Aucun message pour l\'instant'}
                                </span>
                                {conv.unvalidatedReceipt && (
                                  <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse">
                                    Reçu à valider
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column: Selected conversation message view */}
                <div className="lg:col-span-8 double-bezel-outer h-full flex flex-col min-h-0">
                  <div className="double-bezel-inner p-0 bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
                    {selectedSchoolChatId ? (
                      (() => {
                        const currentSchool = schools.find(s => s.userId === selectedSchoolChatId);
                        const convDetail = sortedConversations.find(c => c.schoolId === selectedSchoolChatId);
                        const schoolDisplayName = currentSchool?.name || convDetail?.schoolName || currentSchoolMessages[0]?.schoolName || 'Établissement';
                        const schoolPlan = currentSchool?.subscriptionPlan || convDetail?.plan || 'free';
                        const schoolLocation = currentSchool?.location || convDetail?.location || 'Localisation non définie';
                        const schoolPhone = currentSchool?.phone || convDetail?.phone || 'Téléphone non renseigné';
                        const hasReceipt = currentSchoolMessages.some(m => m.attachmentUrl);

                        return (
                          <>
                            {/* Chat Header */}
                            <div className="p-4 bg-gray-50/80 border-b border-slate-200/70 flex items-center justify-between shrink-0">
                              <div>
                                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                  {schoolDisplayName}
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${schoolPlan === 'pro'
                                    ? 'bg-emerald-600 text-white'
                                    : (schoolPlan === 'suspended' ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200')
                                    }`}>
                                    {schoolPlan === 'pro' ? 'PRO (Actif)' : (schoolPlan === 'suspended' ? 'Compte Suspendu' : 'Plan Découverte')}
                                  </span>
                                </h4>
                                <p className="text-[10px] text-gray-400 font-semibold">
                                  {schoolLocation} • {schoolPhone}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {schoolPlan !== 'pro' ? (
                                  <button
                                    onClick={() => handleOpenDirectActivation(currentSchool?.userId || selectedSchoolChatId, schoolDisplayName, schoolPlan, schoolPhone)}
                                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                    title="Valider le paiement et activer directement le compte PRO"
                                  >
                                    <Zap className="w-4 h-4 text-amber-300" />
                                    Valider Paiement & Activer PRO
                                  </button>
                                ) : (
                                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                                    <CheckCheck className="w-4 h-4" /> Abonnement PRO Validé
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chat messages */}
                            <div
                              ref={messagesContainerRef}
                              onScroll={handleChatScroll}
                              className="flex-1 min-h-0 p-5 overflow-y-auto space-y-4 bg-[#faf9f6] relative"
                            >
                              {currentSchoolMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                                  <Smartphone className="w-10 h-10 text-gray-300 mb-2" />
                                  <p className="text-xs font-bold text-gray-600">Aucun message échangé avec cet établissement.</p>
                                  <p className="text-[11px] text-gray-400 font-medium">Vous pouvez leur envoyer un message direct pour les guider.</p>
                                </div>
                              ) : (
                                currentSchoolMessages.map(m => {
                                  const isSchool = m.senderRole === 'school';
                                  return (
                                    <div key={m.id} className={`flex flex-col ${isSchool ? 'items-start' : 'items-end'}`}>
                                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-semibold mb-1 px-1">
                                        <span>{isSchool ? (m.schoolName || 'Directeur d\'école') : 'Vous (Administrateur)'}</span>
                                        <span>•</span>
                                        <span>{new Date(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                      </div>

                                      <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${isSchool
                                        ? 'bg-white text-gray-900 border border-slate-200/80 rounded-tl-none'
                                        : 'bg-emerald-600 text-white rounded-tr-none'
                                        }`}>
                                        {/* Image attachment / Mobile money proof */}
                                        {m.attachmentUrl && (
                                          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200/80 bg-black/5">
                                            <img
                                              src={m.attachmentUrl}
                                              alt="Preuve Mobile Money"
                                              className="max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                              onClick={() => setPreviewImageUrl(m.attachmentUrl!)}
                                            />
                                            <div className="p-2 bg-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-700">
                                              <span className="flex items-center gap-1">
                                                <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                                                Capture Reçu Flooz / T-Money
                                              </span>
                                              <button
                                                onClick={() => setPreviewImageUrl(m.attachmentUrl!)}
                                                className="text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                                              >
                                                <Eye className="w-3 h-3" /> Zoomer
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        <p className="whitespace-pre-wrap">{m.message}</p>
                                      </div>

                                      {isSchool && m.attachmentUrl && currentSchool?.subscriptionPlan !== 'pro' && (
                                        <button
                                          onClick={() => handleOpenDirectActivation(selectedSchoolChatId, currentSchool?.name || 'Établissement', currentSchool?.subscriptionPlan || 'free', currentSchool?.phone)}
                                          className="mt-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[10px] font-black rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <Zap className="w-3 h-3 text-amber-300" /> Valider cette preuve & Activer PRO
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                              <div ref={chatBottomRef} />

                              {/* Floating jump to bottom button when scrolled up */}
                              {showScrollBottomBtn && (
                                <div className="sticky bottom-2 flex justify-center z-20 pointer-events-none">
                                  <button
                                    type="button"
                                    onClick={() => scrollToChatBottom(true)}
                                    className="pointer-events-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all cursor-pointer animate-bounce-once"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                    <span>Nouveaux messages</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Reply Input Form */}
                            <form onSubmit={handleSendAdminReply} className="p-4 bg-white border-t border-slate-200/70 flex items-center gap-2 shrink-0">
                              <input
                                type="text"
                                value={adminReplyText}
                                onChange={e => setAdminReplyText(e.target.value)}
                                placeholder="Répondre à cet établissement (ex: Paiement reçu, nous activons votre compte...)"
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all text-gray-800 placeholder-gray-400"
                              />
                              <button
                                type="submit"
                                disabled={!adminReplyText.trim()}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                <Send className="w-4 h-4" />
                                <span>Envoyer</span>
                              </button>
                            </form>
                          </>
                        );
                      })()
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-medium text-xs">
                        Sélectionnez un établissement dans la liste pour voir ses messages.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: LICENSE KEYS GENERATOR & MANAGEMENT */}
          {activeSubTab === 'licenses' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Generator Card */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-4 bg-white">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-gray-100">
                    <Key className="w-5 h-5 text-emerald-600" />
                    Générateur de Clés de Licence PRO (1 An)
                  </h2>
                  <form onSubmit={handleCreateLicenseKey} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                        Établissement Cible (Optionnel)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Lycée de Tokoin, Complexe La Grâce..."
                        value={newKeyTargetSchool}
                        onChange={e => setNewKeyTargetSchool(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus-brand bg-white"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                        Note / Référence Paiement
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Espèces, Chèque, Promo 2026..."
                        value={newKeyNote}
                        onChange={e => setNewKeyNote(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus-brand bg-white"
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4" /> Générer Clé PRO
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Keys Filter & List */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-5 bg-white">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-800">Registre des Clés Générées</span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {filteredLicenseKeys.length} clé(s)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePurgeOrphanKeys}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Supprimer les clés orphelines sans école associée"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Nettoyer Orphelines</span>
                      </button>

                      {[
                        { id: 'all', label: 'Toutes' },
                        { id: 'available', label: 'Disponibles' },
                        { id: 'used', label: 'Utilisées' },
                        { id: 'suspended', label: 'Désactivées' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setKeyFilter(f.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${keyFilter === f.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredLicenseKeys.length === 0 ? (
                    <div className="py-12 text-center">
                      <Key className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs text-gray-600 font-bold mb-1">Aucune clé ne correspond aux critères.</p>
                      <p className="text-[11px] text-gray-400 font-medium max-w-sm mx-auto">
                        Générez de nouvelles clés ci-dessus pour les attribuer aux établissements scolaires.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredLicenseKeys.map(k => (
                        <div
                          key={k.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${k.isSuspended
                            ? 'bg-red-50/40 border-red-200'
                            : (k.isUsed ? 'bg-amber-50/40 border-amber-200' : 'bg-gray-50 border-slate-200/80')
                            }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-sm text-gray-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-mono tracking-wider shadow-sm">
                                {k.code}
                              </span>

                              {/* Status Badges */}
                              {k.isSuspended ? (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                                  <Ban className="w-3 h-3" /> Suspendue / Inactive
                                </span>
                              ) : k.isUsed ? (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Activée & Utilisée
                                </span>
                              ) : (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Active & Disponible
                                </span>
                              )}

                              {/* Target School Tag */}
                              {k.targetSchoolName && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-blue-600" />
                                  École ciblée : <strong className="font-black">{k.targetSchoolName}</strong>
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-gray-500 font-medium">
                              {k.isUsed
                                ? `Utilisée par ${k.usedBySchoolName || 'un établissement'} le ${k.usedAt ? new Date(k.usedAt).toLocaleDateString() : ''}`
                                : `Créée le ${new Date(k.createdAt).toLocaleDateString()} ${k.note ? `• ${k.note}` : ''}`
                              }
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Direct Activate for Preassigned School */}
                            {k.targetSchoolName && !k.isUsed && !k.isSuspended && (
                              <button
                                onClick={() => {
                                  const sch = schools.find(s =>
                                    (k.targetSchoolId && s.userId === k.targetSchoolId) ||
                                    s.name.toUpperCase() === k.targetSchoolName?.toUpperCase()
                                  );
                                  handleOpenDirectActivation(
                                    sch?.userId || k.targetSchoolId || '',
                                    k.targetSchoolName || 'Établissement',
                                    sch?.subscriptionPlan || 'free',
                                    sch?.phone
                                  );
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                                title="Valider le paiement et activer directement pour cette école"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                                <span>Valider & Activer pour l'école</span>
                              </button>
                            )}

                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyCode(k.code)}
                              className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                              title="Copier le code de licence"
                            >
                              {copiedCode === k.code ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                              <span>{copiedCode === k.code ? 'Copié !' : 'Copier'}</span>
                            </button>

                            {/* Toggle Suspend/Activate */}
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.code, k.isSuspended)}
                              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${k.isSuspended
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                }`}
                              title={k.isSuspended ? 'Réactiver cette clé' : 'Désactiver / Suspendre cette clé'}
                            >
                              {k.isSuspended ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                              <span className="text-[10px] hidden sm:inline">{k.isSuspended ? 'Activer' : 'Désactiver'}</span>
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteKey(k.id, k.code)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 border border-red-200 rounded-xl transition-all cursor-pointer"
                              title="Supprimer définitivement la clé"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: VISITOR ANALYTICS */}
          {activeSubTab === 'analytics' && (
            <AdminVisitorAnalytics totalRegisteredSchools={schools.length} />
          )}

          {/* TAB: PRICING PLANS / TARIFICATION LANDING PAGE */}
          {activeSubTab === 'pricing' && (() => {
            const plans = currentPricingPlans;
            const activePlansCount = plans.filter(p => p.enabled !== false).length;
            const isTwoCards = activePlansCount === 2;

            return (
              <div className="space-y-6 animate-fadeIn">
                {/* Toast feedback notification */}
                {settingsToast && (
                  <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fadeIn ${settingsToast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    <div className="flex items-center gap-2.5 text-xs font-bold">
                      {settingsToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      <span>{settingsToast.message}</span>
                    </div>
                    <button
                      onClick={() => setSettingsToast(null)}
                      className="p-1 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Header banner */}
                <div className="p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-xs">
                        <Tag className="w-3.5 h-3.5 text-amber-300" />
                        <span>Vitrine Publique & Landing Page</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        Tarification & Offres d'Abonnement
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl leading-relaxed">
                        Configurez les formules tarifaires, prix, avantages et boutons d'action visibles par les visiteurs sur la landing page. Toutes les modifications sont publiées instantanément.
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="px-3 py-1 bg-white/15 rounded-xl text-xs font-bold text-white">
                          {plans.length} formules configurées
                        </span>
                        <span className="px-3 py-1 bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold">
                          {activePlansCount} active{activePlansCount > 1 ? 's' : ''} sur la vitrine
                        </span>
                        {isTwoCards && (
                          <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            Mode 2 Tarifs Actif : Justification et centrage automatique appliqués
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={handleTogglePricingSection}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${platformSettings.pricingEnabled !== false
                            ? 'bg-emerald-500/25 hover:bg-emerald-500/35 text-white border border-emerald-400/40'
                            : 'bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40'
                          }`}
                        title={platformSettings.pricingEnabled !== false ? "Cliquer pour masquer toute la section Tarifs de la landing page" : "Cliquer pour afficher la section Tarifs sur la landing page"}
                      >
                        {platformSettings.pricingEnabled !== false ? (
                          <>
                            <Eye className="w-4 h-4 text-emerald-300" />
                            <span>Section Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-amber-300" />
                            <span>Section Masquée</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPricingPlan}
                        className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4 text-emerald-700" />
                        Ajouter une Offre
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPricingPlans}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Restaurer les 3 offres initiales"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Par défaut
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePricingOnly}
                        disabled={isSavingSettings}
                        className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isSavingSettings ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Enregistrer les Tarifs
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section Title & Subtitle Customizer */}
                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-4 bg-white">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200/70">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        En-tête de la Section « Offres & Abonnements » sur la Landing Page
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                          Titre Principal
                        </label>
                        <input
                          type="text"
                          value={platformSettings.pricingTitle || ''}
                          onChange={e => setPlatformSettings(prev => ({ ...prev, pricingTitle: e.target.value }))}
                          placeholder="Ex: Des tarifs transparents, adaptés à votre école"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                          Sous-titre / Accroche
                        </label>
                        <input
                          type="text"
                          value={platformSettings.pricingSubtitle || ''}
                          onChange={e => setPlatformSettings(prev => ({ ...prev, pricingSubtitle: e.target.value }))}
                          placeholder="Ex: Pas de frais cachés. Choisissez l'abonnement..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-medium text-slate-800 focus:border-emerald-500 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plans List Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Cartes Tarifaires ({plans.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isTwoCards
                        ? "✨ 2 cartes actives : la vitrine applique automatiquement une justification et un équilibrage parfaits."
                        : "Astuce : désactivez ou supprimez une offre pour passer à 2 tarifs bien justifiés."}
                    </span>
                  </div>

                  {plans.map((plan, index) => {
                    const isEnabled = plan.enabled !== false;
                    const isPopular = Boolean(plan.isPopular);

                    return (
                      <div
                        key={plan.id || index}
                        className={`double-bezel-outer transition-all ${isPopular ? 'ring-2 ring-emerald-500/50' : ''
                          }`}
                      >
                        <div className={`double-bezel-inner p-6 space-y-5 bg-white ${!isEnabled ? 'opacity-70 bg-slate-50/60' : ''
                          }`}>
                          {/* Card Top Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">
                                #{index + 1}
                              </span>
                              <span className="text-sm font-black text-slate-900">
                                {plan.name || 'Offre sans nom'}
                              </span>
                              {plan.badge && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                                  {plan.badge}
                                </span>
                              )}
                              {isPopular && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                                  <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                                  Recommandé
                                </span>
                              )}
                              {!isEnabled ? (
                                <button type="button" onClick={() => handleUpdatePricingPlan(index, { enabled: true })} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1 cursor-pointer transition-colors" title="Cliquer pour afficher cette offre sur la vitrine">
                                  <EyeOff className="w-3 h-3" />
                                  <span>Masqué de la vitrine (Activer)</span>
                                </button>
                              ) : (
                                <button type="button" onClick={() => handleUpdatePricingPlan(index, { enabled: false })} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center gap-1 border border-emerald-100 cursor-pointer transition-colors" title="Cliquer pour masquer cette offre de la vitrine">
                                  <Eye className="w-3 h-3" />
                                  <span>Visible sur la vitrine (Masquer)</span>
                                </button>
                              )}
                            </div>

                            {/* Move Up / Down / Delete actions */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdatePricingPlan(index, { enabled: !isEnabled })}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isEnabled
                                    ? 'hover:bg-slate-100 text-slate-600 hover:text-amber-600'
                                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                  }`}
                                title={isEnabled ? "Masquer cette formule sur la vitrine" : "Afficher cette formule sur la vitrine"}
                              >
                                {isEnabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-amber-700" />}
                              </button>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMovePricingPlan(index, 'up')}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                                title="Déplacer vers le haut"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={index === plans.length - 1}
                                onClick={() => handleMovePricingPlan(index, 'down')}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                                title="Déplacer vers le bas"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <div className="w-px h-4 bg-slate-200 mx-1" />
                              <button
                                type="button"
                                onClick={() => handleRemovePricingPlan(index)}
                                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer cette formule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {!isEnabled && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-950 font-medium">
                              <div className="flex items-center gap-2">
                                <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Cette offre est actuellement <strong>masquée</strong> sur la landing page.</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUpdatePricingPlan(index, { enabled: true })}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs shrink-0"
                              >
                                Rendre Visible
                              </button>
                            </div>
                          )}

                          {/* Inputs Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Nom de la formule */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                Nom de la Formule <span className="text-emerald-600">*</span>
                              </label>
                              <input
                                type="text"
                                value={plan.name}
                                onChange={e => handleUpdatePricingPlan(index, { name: e.target.value })}
                                placeholder="Ex: Plan Annuel"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>

                            {/* Badge */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                Badge / Catégorie
                              </label>
                              <input
                                type="text"
                                value={plan.badge || ''}
                                onChange={e => handleUpdatePricingPlan(index, { badge: e.target.value })}
                                placeholder="Ex: Établissement, Découverte"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>

                            {/* Prix affiché */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                  Tarif Affiché <span className="text-emerald-600">*</span>
                                </label>
                                {platformSettings.annualPriceCFA ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePricingPlan(index, { price: `${platformSettings.annualPriceCFA.toLocaleString()} F CFA` })}
                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer underline"
                                  >
                                    PRO ({platformSettings.annualPriceCFA.toLocaleString()} F)
                                  </button>
                                ) : null}
                              </div>
                              <input
                                type="text"
                                value={plan.price}
                                onChange={e => handleUpdatePricingPlan(index, { price: e.target.value })}
                                placeholder="Ex: 30 000 F CFA ou 0 F CFA"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-black text-emerald-800 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>

                            {/* Période */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                Périodicité / Durée
                              </label>
                              <input
                                type="text"
                                value={plan.period || ''}
                                onChange={e => handleUpdatePricingPlan(index, { period: e.target.value })}
                                placeholder="Ex: / an, / à vie, ou vide"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Description de l'Offre
                            </label>
                            <textarea
                              rows={2}
                              value={plan.description || ''}
                              onChange={e => handleUpdatePricingPlan(index, { description: e.target.value })}
                              placeholder="Pour tester les fonctionnalités avant l'année scolaire..."
                              className="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs font-medium text-slate-800 focus:border-emerald-500 bg-slate-50/50 resize-none leading-relaxed"
                            />
                          </div>

                          {/* Action & Button Settings */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                Texte du Bouton CTA
                              </label>
                              <input
                                type="text"
                                value={plan.buttonText || ''}
                                onChange={e => handleUpdatePricingPlan(index, { buttonText: e.target.value })}
                                placeholder="Ex: S'abonner maintenant"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                Action du Bouton
                              </label>
                              <select
                                value={plan.buttonAction || 'signup'}
                                onChange={e => handleUpdatePricingPlan(index, { buttonAction: e.target.value as any })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50 cursor-pointer"
                              >
                                <option value="signup">Inscription Directe (Modal Inscription)</option>
                                <option value="contact">Contact WhatsApp (wa.me)</option>
                                <option value="custom_url">Lien Externe Personnalisé</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                {plan.buttonAction === 'contact'
                                  ? 'Lien WhatsApp (ou laisser vide pour n° par défaut)'
                                  : plan.buttonAction === 'custom_url'
                                    ? 'URL de destination'
                                    : 'Optionnel (Lien de redirection)'}
                              </label>
                              <input
                                type="text"
                                value={plan.buttonUrl || ''}
                                onChange={e => handleUpdatePricingPlan(index, { buttonUrl: e.target.value })}
                                placeholder={
                                  plan.buttonAction === 'contact'
                                    ? `https://wa.me/${(platformSettings.whatsappNumber || '22890000000').replace(/[^0-9]/g, '')}`
                                    : 'https://...'
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-medium text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                          </div>

                          {/* Toggles */}
                          <div className="flex flex-wrap items-center gap-6 pt-2 pb-1 border-t border-slate-100">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={e => handleUpdatePricingPlan(index, { enabled: e.target.checked })}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                              <span>Afficher cette offre sur la vitrine</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none">
                              <input
                                type="checkbox"
                                checked={isPopular}
                                onChange={e => handleUpdatePricingPlan(index, { isPopular: e.target.checked })}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                              <span className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                Mettre en avant cette formule (Badge "Recommandé" & bordure émeraude)
                              </span>
                            </label>
                          </div>

                          {/* Features Manager */}
                          <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Avantages & Fonctionnalités Incluses ({(plan.features || []).length})
                            </label>

                            <div className="flex flex-wrap gap-2">
                              {(plan.features || []).map((feat, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{feat}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFeatureFromPlan(index, fIdx)}
                                    className="p-0.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer ml-1"
                                    title="Supprimer cet avantage"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>

                            {/* Add Feature input */}
                            <div className="flex items-center gap-2 pt-1 max-w-md">
                              <input
                                type="text"
                                value={newFeatureInputs[index] || ''}
                                onChange={e => setNewFeatureInputs(prev => ({ ...prev, [index]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = newFeatureInputs[index] || '';
                                    if (val.trim()) {
                                      handleAddFeatureToPlan(index, val);
                                      setNewFeatureInputs(prev => ({ ...prev, [index]: '' }));
                                    }
                                  }
                                }}
                                placeholder="+ Ajouter un avantage (ex: Cartes illimitées)..."
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none text-xs font-medium text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = newFeatureInputs[index] || '';
                                  if (val.trim()) {
                                    handleAddFeatureToPlan(index, val);
                                    setNewFeatureInputs(prev => ({ ...prev, [index]: '' }));
                                  }
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs shrink-0"
                              >
                                Ajouter
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Preview Container */}
                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-6 space-y-6 bg-gradient-to-b from-white to-slate-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Aperçu en Direct de la Vitrine (Landing Page)
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTwoCards && (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                            Justification 2 Cartes Active
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                          Rendu Visiteur Réel
                        </span>
                      </div>
                    </div>

                    {/* Preview Pricing Section */}
                    <div className="p-6 sm:p-10 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-8">
                      <div className="text-center max-w-2xl mx-auto space-y-3">
                        <div className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          Offres & Abonnements
                        </div>
                        <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          {platformSettings.pricingTitle || "Des tarifs transparents, adaptés à votre école"}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                          {platformSettings.pricingSubtitle || "Pas de frais cachés. Choisissez l'abonnement qui correspond à la taille de votre établissement."}
                        </p>
                      </div>

                      {/* Dynamic Preview Cards Grid with 2-card justification */}
                      <div className={
                        activePlansCount === 1
                          ? "grid grid-cols-1 gap-6 max-w-sm mx-auto items-stretch justify-center"
                          : activePlansCount === 2
                            ? "grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto items-stretch justify-center"
                            : activePlansCount === 3
                              ? "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch"
                              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto items-stretch"
                      }>
                        {plans.filter(p => p.enabled !== false).map((plan, pIdx) => {
                          const isPopular = Boolean(plan.isPopular);

                          return (
                            <div
                              key={plan.id || pIdx}
                              className={`p-6 rounded-2xl flex flex-col justify-between relative transition-all w-full h-full ${isPopular
                                ? `border-2 border-emerald-600 bg-white shadow-lg shadow-emerald-950/5 ${isTwoCards ? 'md:scale-[1.01]' : 'scale-105'
                                }`
                                : 'border border-slate-200/90 bg-slate-50/70'
                                }`}
                            >
                              {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xs whitespace-nowrap">
                                  Recommandé
                                </div>
                              )}

                              <div className="space-y-3 flex-1 flex flex-col">
                                {plan.badge && (
                                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isPopular ? 'text-emerald-600' : 'text-slate-400'
                                    }`}>
                                    {plan.badge}
                                  </span>
                                )}
                                <h5 className="text-lg font-black text-slate-900">{plan.name}</h5>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed min-h-[2rem]">
                                  {plan.description}
                                </p>
                                <div className="pt-1">
                                  <span className={`text-2xl font-black ${isPopular ? 'text-emerald-600' : 'text-slate-900'
                                    }`}>
                                    {plan.price}
                                  </span>
                                  {plan.period && (
                                    <span className="text-xs text-slate-400 font-medium"> {plan.period}</span>
                                  )}
                                </div>

                                <ul className="space-y-2 pt-3 text-[11px] font-semibold text-slate-600 flex-1">
                                  {(plan.features || []).map((feat, fIdx) => (
                                    <li key={fIdx} className="flex gap-2 items-start">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                      <span className="leading-snug">{feat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button
                                type="button"
                                disabled
                                className={`mt-6 w-full py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-wider ${isPopular
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'border-2 border-emerald-600 text-emerald-700'
                                  }`}
                              >
                                {plan.buttonText || (plan.buttonAction === 'signup' ? 'Commencer' : 'Contacter')}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {isTwoCards && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-center gap-2 text-center text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Justification parfaite : Les 2 cartes sont alignées côte-à-côte avec des largeurs équilibrées, une hauteur uniforme et des boutons parfaitement alignés sur la ligne de base.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Save Action Bar */}
                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Enregistrez pour synchroniser immédiatement la grille tarifaire avec la vitrine publique.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAddPricingPlan}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      + Ajouter une Offre
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePricingOnly}
                      disabled={isSavingSettings}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Enregistrer les Tarifs
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 5: PLATFORM & PAYMENT SETTINGS */}
          {activeSubTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Toast feedback notification */}
              {settingsToast && (
                <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fadeIn ${settingsToast.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
                  }`}>
                  <div className="flex items-center gap-2.5 text-xs font-bold">
                    {settingsToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span>{settingsToast.message}</span>
                  </div>
                  <button
                    onClick={() => setSettingsToast(null)}
                    className="p-1 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Header explanation banner */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0 mt-0.5">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-emerald-950">Configuration des Coordonnées & Paiements Mobile Money</h2>
                    <p className="text-xs text-emerald-800/80 font-medium mt-0.5">
                      Les numéros Flooz / T-Money et contacts configurés ici sont instantanément mis à jour pour toutes les écoles dans leur espace de règlement, leurs paramètres et le chat d'assistance.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetDefaultSettings}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Restaurer les valeurs initiales"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    Valeurs par défaut
                  </button>
                </div>
              </div>

              {/* Main Settings Form */}
              <form onSubmit={handleSavePlatformSettings} className="space-y-6">

                {/* Banner Shortcut to Pricing Management */}
                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Tarification & Forfaits de la Vitrine (Landing Page)
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Modifiez les formules de prix affichées aux visiteurs (Plan Gratuit, Annuel, Sur Mesure, etc.) avec justification automatique en mode 2 tarifs.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('pricing')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer shrink-0 active:scale-95"
                    >
                      Gérer les Tarifs →
                    </button>
                  </div>
                </div>

                {/* Section 0: Information Paiement Direct Mobile Money */}
                <div className="double-bezel-outer">
                  <div className="double-bezel-inner p-5 space-y-3 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Système de Règlement Direct Mobile Money (Togo)
                        </h3>
                        <p className="text-[11px] text-emerald-800 font-medium">
                          Validation par notification SMS / Mobile Money sans intermédiaire
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Les établissements effectuent leur transfert directement sur vos comptes <strong>T-Money</strong> et <strong>Moov Flooz</strong> ci-dessous. Dès confirmation de la réception des fonds sur votre téléphone, vous validez et activez leur compte PRO en 1 clic depuis la liste des <strong>Écoles</strong> ou le <strong>Chat de support</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Left Column: Payment Numbers & Contacts Inputs */}
                  <div className="lg:col-span-7 space-y-6">


                    {/* Section 1: Mobile Money Numbers */}
                    <div className="double-bezel-outer">
                      <div className="double-bezel-inner p-6 space-y-4 bg-white">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-200/70">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Numéros de Réception Mobile Money
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* T-Money Number */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Numéro T-Money (Togo) <span className="text-emerald-600">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={platformSettings.tmoneyNumber}
                              onChange={e => setPlatformSettings(prev => ({ ...prev, tmoneyNumber: e.target.value }))}
                              placeholder="Ex: +228 90 00 00 00"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Affiché sur le badge T-Money pour les écoles</p>
                          </div>

                          {/* T-Money Holder */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Nom du Bénéficiaire T-Money
                            </label>
                            <input
                              type="text"
                              required
                              value={platformSettings.tmoneyHolder}
                              onChange={e => setPlatformSettings(prev => ({ ...prev, tmoneyHolder: e.target.value }))}
                              placeholder="Ex: SukuPass SAS ou Nom du Trésorier"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Titulaire officiel apparaissant sur le reçu</p>
                          </div>

                          {/* Flooz Number */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Numéro Moov Flooz (Togo) <span className="text-emerald-600">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={platformSettings.floozNumber}
                              onChange={e => setPlatformSettings(prev => ({ ...prev, floozNumber: e.target.value }))}
                              placeholder="Ex: +228 95 00 00 00"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Affiché sur le badge Flooz pour les écoles</p>
                          </div>

                          {/* Flooz Holder */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Nom du Bénéficiaire Flooz
                            </label>
                            <input
                              type="text"
                              required
                              value={platformSettings.floozHolder}
                              onChange={e => setPlatformSettings(prev => ({ ...prev, floozHolder: e.target.value }))}
                              placeholder="Ex: SukuPass SAS"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Titulaire officiel apparaissant sur le reçu</p>
                          </div>
                        </div>

                        {/* Annual PRO Pricing */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            Tarif Annuel PRO de Référence (FCFA / An) <span className="text-emerald-600">*</span>
                          </label>
                          <div className="relative max-w-xs">
                            <input
                              type="number"
                              min="0"
                              step="500"
                              required
                              value={platformSettings.annualPriceCFA}
                              onChange={e => setPlatformSettings(prev => ({ ...prev, annualPriceCFA: parseInt(e.target.value) || 0 }))}
                              className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-black text-emerald-800 focus:border-emerald-500 bg-slate-50/50"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                              FCFA / an
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">
                            Montant affiché dans l'espace école pour l'offre PRO illimitée.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Support & Official Contacts */}
                    <div className="double-bezel-outer">
                      <div className="double-bezel-inner p-6 space-y-4 bg-white">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-200/70">
                          <PhoneCall className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Contacts Officiels & Support Technique
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Support Email */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Email de Support Officiel
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="email"
                                required
                                value={platformSettings.supportEmail}
                                onChange={e => setPlatformSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                placeholder="contact@sukupass.tg"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                          </div>

                          {/* Support Phone */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Téléphone / Ligne Directe
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                required
                                value={platformSettings.supportPhone}
                                onChange={e => setPlatformSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                                placeholder="+228 90 00 00 00"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                          </div>

                          {/* WhatsApp Number */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Numéro WhatsApp Direct
                            </label>
                            <div className="relative">
                              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                              <input
                                type="text"
                                required
                                value={platformSettings.whatsappNumber}
                                onChange={e => setPlatformSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                                placeholder="+228 90 00 00 00"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Utilisé pour ouvrir automatiquement la discussion WhatsApp</p>
                          </div>

                          {/* Office Location */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Localisation / Siège
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                value={platformSettings.officeAddress || ''}
                                onChange={e => setPlatformSettings(prev => ({ ...prev, officeAddress: e.target.value }))}
                                placeholder="Lomé, Togo"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2.5: Vidéo de Présentation (Landing Page) */}
                    <div className="double-bezel-outer">
                      <div className="double-bezel-inner p-6 space-y-4 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/70 gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                Vidéo de Présentation • Vitrine Landing Page
                              </h3>
                              <p className="text-[10px] text-slate-400 font-medium">
                                Diffusez votre vidéo de présentation officielle sur la page d'accueil de SukuPass
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {isGooglePhotosUrl(platformSettings.demoVideoUrl) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Google Photos Incompatible
                              </span>
                            ) : platformSettings.demoVideoUrl ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active sur la vitrine
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 px-2.5 py-1 bg-slate-100 rounded-md">
                                Non définie
                              </span>
                            )}

                            {/* Bouton de sauvegarde directe en en-tête */}
                            <button
                              type="button"
                              onClick={handleSaveVideoOnly}
                              disabled={isSavingVideo}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              title="Enregistrer la vidéo immédiatement"
                            >
                              {isSavingVideo ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : videoSaveSuccess ? (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              <span>{videoSaveSuccess ? 'Enregistré !' : 'Enregistrer'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 pt-1">
                          {/* Video URL */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Lien de la Vidéo (URL)
                            </label>
                            <div className="relative">
                              <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="url"
                                value={platformSettings.demoVideoUrl || ''}
                                onChange={e => updateVideoSettingsField('demoVideoUrl', e.target.value)}
                                placeholder="Ex: https://www.youtube.com/watch?v=... ou https://drive.google.com/... ou https://.../video.mp4"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-medium pt-0.5">
                              <span className="font-bold text-slate-600">Plateformes supportées :</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[9px] border border-emerald-200">YouTube (Recommandé)</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[9px]">Google Drive</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[9px]">Loom</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[9px]">Vimeo</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[9px]">Fichier .MP4 / WebM</span>
                            </div>
                          </div>

                          {/* Alerte spécifique Google Photos */}
                          {isGooglePhotosUrl(platformSettings.demoVideoUrl) && (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 space-y-2.5">
                              <div className="flex items-center gap-2 font-black text-xs text-amber-900">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Lien Google Photos détecté — Non intégrable directement</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                                Google bloque automatiquement la lecture de ses photos et vidéos sur des sites web externes pour des raisons de confidentialité et de sécurité (en-tête de restriction <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono text-[10px]">SAMEORIGIN</code>). Votre vidéo restera invisible pour les visiteurs avec ce lien.
                              </p>
                              <div className="bg-white/90 rounded-xl p-3.5 border border-amber-200 space-y-2 text-[11px] text-slate-800">
                                <p className="font-black text-amber-950 text-xs">
                                  Comment faire fonctionner votre vidéo en 2 minutes :
                                </p>
                                <ol className="list-decimal list-inside space-y-1.5 font-medium">
                                  <li>
                                    <strong className="text-emerald-700">Option 1 (Recommandée & Gratuite) — YouTube :</strong> Téléversez votre vidéo sur YouTube, réglez la visibilité sur <strong>« Non répertoriée »</strong> (personne ne peut la trouver par recherche, seuls les visiteurs de SukuPass la verront), puis collez le lien YouTube ici.
                                  </li>
                                  <li>
                                    <strong className="text-emerald-700">Option 2 — Google Drive :</strong> Déposez la vidéo sur votre Google Drive, clic droit &gt; <em>Partager</em> &gt; sélectionnez <strong>« Tous les utilisateurs disposant du lien »</strong> (Lecteur), puis collez le lien de partage ici.
                                  </li>
                                  <li>
                                    <strong className="text-emerald-700">Option 3 — Fichier direct :</strong> Un fichier direct hébergé se terminant par <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px]">.mp4</code>.
                                  </li>
                                </ol>
                              </div>
                            </div>
                          )}

                          {/* Video Title */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Titre / Slogan de la Vidéo
                            </label>
                            <input
                              type="text"
                              value={platformSettings.demoVideoTitle || ''}
                              onChange={e => updateVideoSettingsField('demoVideoTitle', e.target.value)}
                              placeholder="Ex: Découvrez SukuPass en action — Les badges scolaires en quelques clics"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Sous-titre affiché juste au-dessus du lecteur vidéo sur la vitrine</p>
                          </div>

                          {/* Video Poster Image (Optional) */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Image de Couverture / Miniature (Optionnel)
                            </label>
                            <input
                              type="url"
                              value={platformSettings.demoVideoPoster || ''}
                              onChange={e => updateVideoSettingsField('demoVideoPoster', e.target.value)}
                              placeholder="Ex: https://.../image-miniature.jpg"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-bold text-slate-900 focus:border-emerald-500 bg-slate-50/50"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Image affichée sur le lecteur avant le démarrage de la vidéo</p>
                          </div>

                          {/* Live Video Preview in Admin */}
                          {platformSettings.demoVideoUrl && (() => {
                            const parsed = parseVideoSource(platformSettings.demoVideoUrl);
                            return (
                              <div className="pt-3 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    Aperçu direct du lecteur :
                                  </span>
                                  {parsed?.type && (
                                    <span className="text-[10px] font-mono font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                                      Source : {parsed.type.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video max-w-full shadow-inner relative flex items-center justify-center">
                                  {parsed && !parsed.isUnsupported ? (
                                    parsed.embedUrl ? (
                                      <iframe
                                        src={parsed.embedUrl}
                                        title="Aperçu vidéo admin"
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    ) : (
                                      <video
                                        src={parsed.directUrl}
                                        poster={platformSettings.demoVideoPoster || undefined}
                                        controls
                                        playsInline
                                        className="w-full h-full object-contain"
                                      />
                                    )
                                  ) : (
                                    <div className="p-6 text-center max-w-md mx-auto space-y-2">
                                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                                      <p className="text-xs text-white font-bold">
                                        {parsed?.warning || "Format d'URL non reconnu"}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        Utilisez un lien YouTube ou Google Drive public pour activer le lecteur.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Barre d'action basse dédiée pour enregistrer la vidéo */}
                          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-[11px] text-slate-500 font-medium">
                              Enregistrez vos modifications pour les publier instantanément sur la vitrine.
                            </span>
                            <button
                              type="button"
                              onClick={handleSaveVideoOnly}
                              disabled={isSavingVideo}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                            >
                              {isSavingVideo ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Enregistrement...
                                </>
                              ) : videoSaveSuccess ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  Enregistré avec succès !
                                </>
                              ) : (
                                <>
                                  <Save className="w-3.5 h-3.5" />
                                  Enregistrer la Vidéo
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Payment Instructions & Live Preview */}
                  <div className="lg:col-span-5 space-y-6">

                    {/* Section 3: Custom Guidance Messages */}
                    <div className="double-bezel-outer">
                      <div className="double-bezel-inner p-6 space-y-4 bg-white">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-200/70">
                          <HelpCircle className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Consignes & Message d'Assistance
                          </h3>
                        </div>

                        <div className="space-y-4 pt-1">
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Consignes de Paiement pour les Écoles
                            </label>
                            <textarea
                              rows={3}
                              value={platformSettings.paymentInstructions || ''}
                              onChange={e => setPlatformSettings(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                              placeholder="Instructions affichées avant l'envoi du reçu..."
                              className="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs font-medium text-slate-800 focus:border-emerald-500 bg-slate-50/50 leading-relaxed resize-none"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Visible sur la page des paramètres d'abonnement</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Message sur les Horaires / Disponibilité
                            </label>
                            <textarea
                              rows={2}
                              value={platformSettings.supportNotice || ''}
                              onChange={e => setPlatformSettings(prev => ({ ...prev, supportNotice: e.target.value }))}
                              placeholder="Ex: Notre équipe est disponible du Lundi au Samedi de 8h à 18h..."
                              className="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs font-medium text-slate-800 focus:border-emerald-500 bg-slate-50/50 leading-relaxed resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div className="double-bezel-outer">
                      <div className="double-bezel-inner p-6 space-y-4 bg-gradient-to-b from-white to-slate-50">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              Aperçu en Direct (Vue École)
                            </h3>
                          </div>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            Temps Réel
                          </span>
                        </div>

                        {/* Preview Cards */}
                        <div className="space-y-3 pt-1">
                          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                            Tarif annuel PRO : <strong className="text-emerald-800 font-black">{(platformSettings.annualPriceCFA || 30000).toLocaleString()} FCFA / an</strong>.
                          </p>

                          {/* Direct Mobile Money Info Preview */}
                          <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs flex items-center justify-between text-xs font-black">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-amber-300" />
                              <span>Paiement Direct T-Money / Flooz</span>
                            </div>
                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded text-white font-mono font-bold">
                              {(platformSettings.annualPriceCFA || 30000).toLocaleString()} FCFA
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">T-Money (Togo)</p>
                                <p className="text-xs font-black text-slate-900">{platformSettings.tmoneyNumber || '+228 90 00 00 00'}</p>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                                {platformSettings.tmoneyHolder || 'SukuPass'}
                              </span>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Flooz / Moov Money</p>
                                <p className="text-xs font-black text-slate-900">{platformSettings.floozNumber || '+228 95 00 00 00'}</p>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                                {platformSettings.floozHolder || 'SukuPass'}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-1.5 text-[10px]">
                            <p className="font-extrabold text-emerald-900 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-emerald-700" /> {platformSettings.supportEmail}
                            </p>
                            <p className="font-extrabold text-emerald-900 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-700" /> {platformSettings.supportPhone}
                            </p>
                            {platformSettings.whatsappNumber && (
                              <p className="font-extrabold text-emerald-900 flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 text-emerald-700" /> WhatsApp : {platformSettings.whatsappNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bottom Submit Action Bar */}
                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Dernière modification : {platformSettings.updatedAt ? new Date(platformSettings.updatedAt).toLocaleString() : 'Configuration par défaut'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingSettings ? 'Enregistrement en cours...' : 'Enregistrer les Paramètres'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeSubTab === 'logs' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-5 bg-white">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-gray-100">
                    <History className="w-5 h-5 text-emerald-600" />
                    Registre Général d'Audit & Activités
                  </h2>
                  {activityLogs.length === 0 ? (
                    <div className="py-16 text-center">
                      <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs text-gray-600 font-bold mb-1">Aucune activité enregistrée dans le registre d'audit.</p>
                      <p className="text-[11px] text-gray-400 font-medium max-w-sm mx-auto">
                        Les connexions, modifications d'écoles, ajouts d'élèves, discussions et générations de licences s'inscriront ici automatiquement.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="text-xs font-black text-gray-900">{log.schoolName} - {log.action}</p>
                            <p className="text-xs text-gray-500">{log.details}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Edit Custom Quota */}
      {editingSchool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
            <h3 className="text-sm font-black text-gray-900">Modifier Quota d'Élèves : {editingSchool.name}</h3>
            <input
              type="number"
              value={customQuotaVal}
              onChange={e => setCustomQuotaVal(parseInt(e.target.value) || 15)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-sm outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingSchool(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer">Annuler</button>
              <button onClick={handleSaveCustomQuota} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Attachment Image */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                Preuve de paiement Mobile Money
              </span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
            <div className="p-2 bg-gray-100 flex justify-center max-h-[75vh] overflow-auto">
              <img src={previewImageUrl} alt="Reçu agrandi" className="max-h-[70vh] object-contain rounded-xl shadow-md" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Création Directe d'Établissement */}
      {isCreatingSchool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Ajouter un Établissement</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Création manuelle d'un compte scolaire partenaire</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingSchool(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom de l'établissement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LYCÉE MODERNE DE LOMÉ"
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Type d'établissement
                  </label>
                  <select
                    value={newSchoolType}
                    onChange={e => setNewSchoolType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Lycée">Lycée (Secondaire II)</option>
                    <option value="Collège">Collège (Secondaire I)</option>
                    <option value="Complexe Scolaire">Complexe Scolaire</option>
                    <option value="École Primaire">École Primaire</option>
                    <option value="Institut / Supérieur">Institut / Supérieur</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Région du Togo
                  </label>
                  <select
                    value={newSchoolRegion}
                    onChange={e => setNewSchoolRegion(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  >
                    {TOGO_REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ville / Quartier
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lomé - Tokoin"
                    value={newSchoolLocation}
                    onChange={e => setNewSchoolLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+228 90 00 00 00"
                    value={newSchoolPhone}
                    onChange={e => setNewSchoolPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plan Initial
                  </label>
                  <select
                    value={newSchoolPlan}
                    onChange={e => setNewSchoolPlan(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="free">Découverte (Gratuit)</option>
                    <option value="pro">PRO (Actif 1 An)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quota Initial de Cartes
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newSchoolQuota}
                    onChange={e => setNewSchoolQuota(parseInt(e.target.value) || 15)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingSchool(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewSchool}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingNewSchool ? 'Création en cours...' : 'Créer l\'Établissement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIRECT 1-CLICK ACTIVATION MODAL */}
      {activatingSchool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Validation de Paiement & Activation Directe</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Activation immédiate sans saisie de code pour l'école</p>
                </div>
              </div>
              <button
                onClick={() => setActivatingSchool(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* School Details Card */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-850">Établissement Bénéficiaire</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {activatingSchool.currentPlan === 'suspended' ? 'Suspendu' : 'Plan Découverte'}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900">{activatingSchool.name}</p>
              {activatingSchool.managerPhone && (
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Contact : {activatingSchool.managerPhone}</span>
                </p>
              )}

              {/* Preassigned key info */}
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-600">Licence pré-assignée :</span>
                {activatingSchool.licenseCode ? (
                  <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                    {activatingSchool.licenseCode}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Nouvelle clé générée automatiquement</span>
                )}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                Durée de l'Abonnement PRO
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { months: 6, label: '6 Mois', price: '18 000 CFA' },
                  { months: 12, label: '1 An (Recommandé)', price: '30 000 CFA' },
                  { months: 24, label: '2 Ans', price: '55 000 CFA' },
                  { months: 120, label: 'Permanent', price: 'Illimité' }
                ].map((opt) => (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setActivationDuration(opt.months)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${activationDuration === opt.months
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                  >
                    <span className="text-xs font-black">{opt.label}</span>
                    <span className={`text-[10px] font-bold mt-1 ${activationDuration === opt.months ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {opt.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-600 leading-relaxed space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Activation automatique Zéro-Saisie
              </p>
              <p>
                Le compte de l'établissement basculera immédiatement en <strong>PRO Illimité</strong>. La licence sera automatiquement marquée comme validée et un message de confirmation sera envoyé dans le chat de l'école.
              </p>
            </div>

            {/* Actions Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivatingSchool(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDirectActivation}
                disabled={isProcessingDirectActivation}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessingDirectActivation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Activation en cours...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Valider le Paiement & Activer PRO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar for Admin */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 md:hidden flex items-center justify-around px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        {[
          { id: 'overview', label: 'Supervision', icon: TrendingUp },
          { id: 'schools', label: 'Écoles', icon: Building2 },
          { id: 'payments', label: 'Paiements', icon: MessageSquare, badge: (unreadSchoolMessagesCount > 0 ? unreadSchoolMessagesCount : pendingReceiptsCount) },
          { id: 'pricing', label: 'Tarifs', icon: Tag },
          { id: 'licenses', label: 'Licences', icon: Key },
          { id: 'analytics', label: 'Audience', icon: BarChart3 },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id || (item.id === 'settings' && activeSubTab === 'logs');
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer active:scale-95 ${isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium hover:text-slate-600'
                }`}
            >
              <div className={`p-1 rounded-xl transition-all relative ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 bg-amber-400 text-slate-950 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};

