import React, { useState, useEffect, useRef } from 'react';
import { 
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
  Sparkles, 
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
  Lock
} from 'lucide-react';
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
  createSchoolByAdmin,
  deleteSchoolByAdmin
} from '../lib/db';
import { supabase } from '../lib/supabase';
import { Session } from '../lib/auth';
import { LicenseKey, TOGO_REGIONS, ChatMessage, PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '../types';

interface AdminDashboardViewProps {
  session: Session;
  onLogout: () => void;
  onSwitchToSchoolView: () => void;
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
  } catch {}
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  session,
  onLogout,
  onSwitchToSchoolView
}) => {
  const [schools, setSchools] = useState<AdminSchoolDetail[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'schools' | 'payments' | 'licenses' | 'settings' | 'logs'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Toutes les régions');
  
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

  // Load SaaS statistics & configuration
  const loadData = async () => {
    setIsLoading(true);
    try {
      const allSchools = await fetchAllSchools();
      const studentCount = await fetchAllStudentsCount();
      const logs = await fetchAdminLogs();
      const allMsgs = await fetchChatMessages();
      const pSettings = await fetchPlatformSettings();
      setSchools(allSchools);
      setTotalStudents(studentCount);
      setActivityLogs(logs);
      setLicenseKeys(fetchAllLicenseKeys());
      setChatMessages(allMsgs);
      setPlatformSettings(pSettings);

      // Auto-select first chat if none selected
      if (!selectedSchoolChatId && allSchools.length > 0) {
        setSelectedSchoolChatId(allSchools[0].userId);
      }
    } catch (err) {
      console.error('Error loading admin statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDataChanged = () => {
      loadData();
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
          fetchAllSchools().then(setSchools).catch(() => {});
        }
      }
    };

    window.addEventListener('cardschool_school_registered', handleDataChanged);
    window.addEventListener('cardschool_school_deleted', handleDataChanged);
    window.addEventListener('cardschool_audit_log_added', handleDataChanged);
    window.addEventListener('cardschool_platform_settings_updated', handleDataChanged);
    window.addEventListener('cardschool_chat_message_received', handleNewChatMessage);
    window.addEventListener('storage', handleDataChanged);
    window.addEventListener('focus', handleDataChanged);

    // Supabase Realtime Subscription on chat_messages table
    let realtimeSub: any = null;
    try {
      realtimeSub = supabase
        .channel('admin_live_chat_channel')
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
              fetchAllSchools().then(setSchools).catch(() => {});
            }
          }
        })
        .subscribe();
    } catch {}

    const interval = setInterval(() => {
      fetchChatMessages().then(msgs => {
        setChatMessages(msgs);
      }).catch(() => {});
    }, 4000);

    return () => {
      window.removeEventListener('cardschool_school_registered', handleDataChanged);
      window.removeEventListener('cardschool_school_deleted', handleDataChanged);
      window.removeEventListener('cardschool_audit_log_added', handleDataChanged);
      window.removeEventListener('cardschool_platform_settings_updated', handleDataChanged);
      window.removeEventListener('cardschool_chat_message_received', handleNewChatMessage);
      window.removeEventListener('storage', handleDataChanged);
      window.removeEventListener('focus', handleDataChanged);
      if (realtimeSub) supabase.removeChannel(realtimeSub);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activeSubTab === 'payments' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSchoolChatId, chatMessages, activeSubTab]);

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
  const handleCreateLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    const createdKey = generateLicenseKey(
      12, 
      newKeyNote.trim() || undefined,
      newKeyTargetSchool.trim() || undefined
    );
    setLicenseKeys(fetchAllLicenseKeys());
    setNewKeyNote('');
    setNewKeyTargetSchool('');
    fetchAdminLogs().then(logs => setActivityLogs(logs));
    alert(`Nouvelle Clé PRO générée avec succès :\n${createdKey.code}${createdKey.targetSchoolName ? ` (Pour : ${createdKey.targetSchoolName})` : ''}`);
  };

  // Toggle key status (Activer / Désactiver)
  const handleToggleKeyStatus = async (keyId: string, currentCode: string, isSuspended?: boolean) => {
    const actionName = isSuspended ? 'réactiver' : 'désactiver / suspendre';
    if (window.confirm(`Voulez-vous vraiment ${actionName} la clé ${currentCode} ?`)) {
      await toggleLicenseKeyStatus(keyId);
      setLicenseKeys(fetchAllLicenseKeys());
      fetchAdminLogs().then(logs => setActivityLogs(logs));
    }
  };

  // Delete license key
  const handleDeleteKey = async (keyId: string, currentCode: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT la clé de licence ${currentCode} ?`)) {
      await deleteLicenseKey(keyId);
      setLicenseKeys(fetchAllLicenseKeys());
      fetchAdminLogs().then(logs => setActivityLogs(logs));
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
    const success = await updateSchoolCustomQuota(editingSchool.userId, customQuotaVal, editingSchool.name);
    if (success) {
      alert(`Le quota de "${editingSchool.name}" a été mis à jour à ${customQuotaVal} cartes.`);
      setEditingSchool(null);
      loadData();
    } else {
      alert("Erreur lors de la mise à jour du quota.");
    }
  };

  // Upgrade trial schools to Pro subscription plan
  const handleUpgradeToPro = async (schoolUserId: string, schoolName: string) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const expiresAtStr = nextYear.toISOString().split('T')[0];

    if (window.confirm(`Confirmez-vous l'activation du Plan PRO (Licence 1 An) pour l'établissement "${schoolName}" ?`)) {
      const success = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr, schoolName);
      if (success) {
        alert(`Félicitations ! L'abonnement PRO a été activé avec succès pour "${schoolName}".`);
        loadData();
      } else {
        alert("Erreur lors de la mise à jour de l'abonnement.");
      }
    }
  };

  // Suspend a school account
  const handleSuspendSchool = async (schoolUserId: string, schoolName: string) => {
    if (window.confirm(`Voulez-vous suspendre l'accès de l'établissement "${schoolName}" pour impayé ou litige ? L'ajout et l'impression d'élèves seront bloqués.`)) {
      const success = await updateSchoolSubscription(schoolUserId, 'suspended', '', schoolName);
      if (success) {
        alert(`Le compte de "${schoolName}" a été suspendu.`);
        loadData();
      } else {
        alert("Erreur lors de la suspension.");
      }
    }
  };

  // Downgrade or Reset subscription to Free trial plan
  const handleResetToFree = async (schoolUserId: string, schoolName: string) => {
    if (window.confirm(`Confirmez-vous le retour au Plan Découverte (Gratuit) pour l'établissement "${schoolName}" ?`)) {
      const success = await updateSchoolSubscription(schoolUserId, 'free', '', schoolName);
      if (success) {
        alert(`L'abonnement a été réinitialisé au Plan Gratuit pour "${schoolName}".`);
        loadData();
      } else {
        alert("Erreur lors de la mise à jour de l'abonnement.");
      }
    }
  };

  // Delete School Handler
  const handleDeleteSchool = async (schoolUserId: string, schoolName: string) => {
    if (window.confirm(`⚠️ ATTENTION SUPPRESSION DÉFINITIVE :\n\nVoulez-vous supprimer définitivement l'établissement "${schoolName}" ?\n\nToutes ses cartes d'élèves, ses messages et ses journaux associés seront effacés.`)) {
      setIsLoading(true);
      try {
        await deleteSchoolByAdmin(schoolUserId);
        setSchools(prev => prev.filter(s => s.userId !== schoolUserId));
        loadData();
      } catch (err) {
        console.error('handleDeleteSchool error:', err);
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

    try {
      const newMsg = await sendChatMessage(
        selectedSchoolChatId,
        schoolName,
        'admin',
        replyMsg
      );
      setChatMessages(prev => {
        const timeMs = new Date(newMsg.createdAt).getTime();
        const exists = prev.some(m => 
          m.id === newMsg.id || 
          (m.schoolId === newMsg.schoolId && m.senderRole === newMsg.senderRole && m.message === newMsg.message && Math.abs(new Date(m.createdAt).getTime() - timeMs) < 4000)
        );
        if (exists) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  // Validate payment from chat directly
  const handleValidateChatPayment = async (schoolId: string, schoolName: string) => {
    if (window.confirm(`Confirmez-vous la validation du paiement Mobile Money et l'activation PRO 1 An pour "${schoolName}" ?`)) {
      const ok = await validatePaymentFromChat(schoolId, schoolName);
      if (ok) {
        alert(`Paiement validé avec succès ! ${schoolName} est désormais PRO et un message de confirmation a été transmis dans le chat.`);
        loadData();
      } else {
        alert("Erreur lors de la validation du paiement.");
      }
    }
  };

  // Save Platform & Payment Settings
  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const ok = await savePlatformSettings(platformSettings);
      if (ok) {
        setSettingsToast({ type: 'success', message: 'Paramètres de paiement et contacts mis à jour avec succès !' });
        setTimeout(() => setSettingsToast(null), 4000);
      } else {
        setSettingsToast({ type: 'error', message: 'Erreur lors de la sauvegarde.' });
      }
    } catch (err) {
      setSettingsToast({ type: 'error', message: 'Erreur lors de la sauvegarde des paramètres.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetDefaultSettings = () => {
    if (window.confirm("Voulez-vous restaurer les numéros de paiement et coordonnées par défaut ?")) {
      setPlatformSettings(DEFAULT_PLATFORM_SETTINGS);
    }
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
            <p className="text-[8px] text-emerald-700 font-bold uppercase tracking-wider">CardSchool Togo</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onSwitchToSchoolView}
            title="Simuler Vue École"
            className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer active:scale-95 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
          </button>

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
      <aside className="hidden md:flex md:w-64 md:h-full bg-[#f8faf6] text-slate-700 flex-col justify-between p-6 shrink-0 border-r border-slate-200/80 shadow-sm overflow-y-auto">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white border border-emerald-500/20 shadow-md shadow-emerald-600/10 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-slate-900 truncate leading-tight uppercase tracking-wider">
                Console Admin
              </h2>
              <p className="text-[9px] text-emerald-700 font-black uppercase tracking-[0.1em] mt-0.5">CardSchool Togo</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Supervision Globale', icon: TrendingUp },
              { id: 'schools', label: 'Écoles Partenaires', icon: Building2 },
              { id: 'payments', label: 'Chat & Preuves Paiement', icon: MessageSquare, badge: (unreadSchoolMessagesCount > 0 ? unreadSchoolMessagesCount : pendingReceiptsCount) },
              { id: 'licenses', label: 'Clés de Licence PRO', icon: Key },
              { id: 'settings', label: 'Paramètres & Contacts', icon: Settings },
              { id: 'logs', label: "Journal d'Activité", icon: History },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200/80 space-y-4">
          <button
            onClick={onSwitchToSchoolView}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Simuler Vue École
          </button>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main dashboard panels scroll area */}
      <main className="flex-1 min-w-0 md:h-full overflow-y-auto bg-gray-50/50 pb-20 md:pb-8">
        
        {/* Desktop / Tablet Header toolbar */}
        <header className="hidden md:flex bg-white border-b border-slate-200/70 py-4 px-8 justify-between items-center sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              SaaS Administration Togo
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Monitoring • Validation Mobile Money • Gestion Licences</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubTab('payments')}
              className="relative p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-xl transition-all cursor-pointer"
              title="Discussions et Notifications Directes"
            >
              <Bell className="w-4 h-4" />
              {unreadSchoolMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadSchoolMessagesCount > 9 ? '9+' : unreadSchoolMessagesCount}
                </span>
              )}
            </button>

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
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                school.subscriptionPlan === 'pro' 
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
                          {filteredSchools.map((school) => (
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
                                      onClick={() => handleUpgradeToPro(school.userId, school.name)} 
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition-colors cursor-pointer"
                                    >
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
                                      onClick={() => handleUpgradeToPro(school.userId, school.name)} 
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition-colors cursor-pointer shadow-sm"
                                    >
                                      Activer PRO
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
                          ))}
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
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px]">
                
                {/* Left column: Schools conversations list */}
                <div className="lg:col-span-4 double-bezel-outer h-full flex flex-col">
                  <div className="double-bezel-inner p-4 bg-white flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Discussions & Preuves</h3>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{sortedConversations.length} échanges</span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 mt-2">
                      {sortedConversations.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-10 font-medium">Aucun échange ou établissement pour l'instant.</p>
                      ) : (
                        sortedConversations.map(conv => {
                          const isSelected = selectedSchoolChatId === conv.schoolId;

                          return (
                            <button
                              key={conv.schoolId}
                              onClick={() => setSelectedSchoolChatId(conv.schoolId)}
                              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1 my-1 ${
                                isSelected 
                                   ? 'bg-emerald-50 border border-emerald-200/80 shadow-sm' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-black truncate max-w-[170px] ${isSelected ? 'text-emerald-900' : 'text-gray-800'}`}>
                                  {conv.schoolName}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  conv.plan === 'pro' 
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
                <div className="lg:col-span-8 double-bezel-outer h-full flex flex-col">
                  <div className="double-bezel-inner p-0 bg-white flex-1 flex flex-col overflow-hidden">
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
                            <div className="p-4 bg-gray-50/80 border-b border-slate-200/70 flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                  {schoolDisplayName}
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    schoolPlan === 'pro' 
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
                                    onClick={() => handleValidateChatPayment(currentSchool?.userId || selectedSchoolChatId, schoolDisplayName)}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                    title="Valider la preuve et passer en PRO"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
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
                            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#faf9f6]">
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

                                      <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                                        isSchool 
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
                                          onClick={() => handleValidateChatPayment(selectedSchoolChatId, currentSchool?.name || 'Établissement')}
                                          className="mt-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <CheckCircle2 className="w-3 h-3" /> Valider cette preuve de paiement
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                              <div ref={chatBottomRef} />
                            </div>

                            {/* Reply Input Form */}
                            <form onSubmit={handleSendAdminReply} className="p-4 bg-white border-t border-slate-200/70 flex items-center gap-2">
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

                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'all', label: 'Toutes' },
                        { id: 'available', label: 'Disponibles' },
                        { id: 'used', label: 'Utilisées' },
                        { id: 'suspended', label: 'Désactivées' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setKeyFilter(f.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            keyFilter === f.id 
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
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            k.isSuspended 
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

                          <div className="flex items-center gap-2">
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
                              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                k.isSuspended
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

          {/* TAB 5: PLATFORM & PAYMENT SETTINGS */}
          {activeSubTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Toast feedback notification */}
              {settingsToast && (
                <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fadeIn ${
                  settingsToast.type === 'success' 
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Payment Numbers & Contacts Inputs */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Section 0: Passerelle de Paiement FedaPay */}
                    <div className="double-bezel-outer">
                      <div className="double-bezel-inner p-6 space-y-4 bg-gradient-to-br from-white via-white to-amber-50/20">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                Passerelle de Paiement Direct FedaPay
                              </h3>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Prélèvement USSD direct T-Money & Flooz avec activation automatique
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            platformSettings.fedapayEnabled 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {platformSettings.fedapayEnabled ? 'ON — ACTIF' : 'OFF — DÉSACTIVÉ'}
                          </span>
                        </div>

                        <div className="space-y-4 pt-1">
                          {/* Real iOS-Style Visual ON / OFF Toggle Switch */}
                          <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 gap-4">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900">
                                  Interrupteur Paiement FedaPay
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  platformSettings.fedapayEnabled 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-slate-300 text-slate-700'
                                }`}>
                                  {platformSettings.fedapayEnabled ? 'ON' : 'OFF'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                                {platformSettings.fedapayEnabled
                                  ? "Le bouton de paiement direct T-Money / Flooz est activé pour toutes les écoles."
                                  : "Le bouton FedaPay est désactivé. Seul le paiement manuel avec envoi de reçu sera proposé."}
                              </p>
                            </div>

                            {/* Clickable Switch */}
                            <button
                              type="button"
                              onClick={() => setPlatformSettings(prev => ({ ...prev, fedapayEnabled: !prev.fedapayEnabled }))}
                              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                                platformSettings.fedapayEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                              aria-label="Activer / Désactiver FedaPay"
                            >
                              <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  platformSettings.fedapayEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Environment Mode: Sandbox vs Live */}
                          <div className="space-y-2">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              Environnement FedaPay
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                onClick={() => setPlatformSettings(prev => ({ ...prev, fedapayEnvironment: 'sandbox' }))}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  platformSettings.fedapayEnvironment === 'sandbox'
                                    ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 text-amber-950'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black flex items-center gap-1.5">
                                    🧪 Mode Test (Sandbox)
                                  </span>
                                  {platformSettings.fedapayEnvironment === 'sandbox' && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                  Clé obtenue sur <strong>sandbox.fedapay.com</strong> pour tester sans frais réels.
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPlatformSettings(prev => ({ ...prev, fedapayEnvironment: 'live' }))}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  platformSettings.fedapayEnvironment === 'live'
                                    ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black flex items-center gap-1.5">
                                    🚀 Mode Production (Live)
                                  </span>
                                  {platformSettings.fedapayEnvironment === 'live' && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                  Clé obtenue sur <strong>fedapay.com</strong> pour encaisser les vrais paiements.
                                </p>
                              </button>
                            </div>
                          </div>

                          {/* How to get API Key Step-by-step box */}
                          <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl space-y-1.5 text-[11px]">
                            <p className="font-extrabold text-amber-950 flex items-center gap-1.5">
                              <Info className="w-4 h-4 text-amber-700 shrink-0" />
                              Comment obtenir votre propre Clé Publique FedaPay :
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-amber-900 font-medium text-[10px] leading-relaxed">
                              <li>
                                Connectez-vous sur votre compte FedaPay :{' '}
                                <a 
                                  href={platformSettings.fedapayEnvironment === 'sandbox' ? "https://sandbox.fedapay.com" : "https://fedapay.com"} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline font-bold text-amber-950 hover:text-amber-700"
                                >
                                  {platformSettings.fedapayEnvironment === 'sandbox' ? "sandbox.fedapay.com (Test)" : "fedapay.com (Production)"} ↗
                                </a>
                              </li>
                              <li>Allez dans le menu <strong>Paramètres &gt; Clés d'API</strong></li>
                              <li>
                                Copiez la <strong>Clé Publique (Public Key)</strong> qui commence par{' '}
                                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">
                                  {platformSettings.fedapayEnvironment === 'sandbox' ? 'pk_sandbox_...' : 'pk_live_...'}
                                </code>
                              </li>
                              <li>Collez-la dans le champ ci-dessous et cliquez sur <strong>Enregistrer</strong>.</li>
                            </ol>
                          </div>

                          {/* Public API Key Input */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                Votre Clé Publique FedaPay ({platformSettings.fedapayEnvironment === 'sandbox' ? 'Sandbox' : 'Live'})
                              </label>
                              <a
                                href={platformSettings.fedapayEnvironment === 'sandbox' ? "https://sandbox.fedapay.com" : "https://fedapay.com"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                              >
                                Ouvrir FedaPay <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                value={platformSettings.fedapayPublicKey || ''}
                                onChange={e => setPlatformSettings(prev => ({ ...prev, fedapayPublicKey: e.target.value.trim() }))}
                                placeholder={platformSettings.fedapayEnvironment === 'sandbox' ? "pk_sandbox_votre_cle_personnelle" : "pk_live_votre_cle_personnelle"}
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 outline-none text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {platformSettings.fedapayPublicKey === 'pk_sandbox_M77UqfN9m23w36vPqC46E2Yp' ? (
                                <span className="text-amber-700 font-bold">⚠️ Clé d'exemple factice détectée. Veuillez la remplacer par votre propre clé Sandbox créée sur sandbox.fedapay.com.</span>
                              ) : (
                                "Cette clé publique est transmise au guichet sécurisé côté client."
                              )}
                            </p>
                          </div>

                          {/* Quick Save FedaPay Settings Button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsSavingSettings(true);
                                const ok = await savePlatformSettings(platformSettings);
                                setIsSavingSettings(false);
                                if (ok) {
                                  setSettingsToast({ type: 'success', message: 'Configuration FedaPay enregistrée avec succès !' });
                                  setTimeout(() => setSettingsToast(null), 3000);
                                  alert("✅ Configuration FedaPay et clé enregistrées avec succès !");
                                }
                              }}
                              disabled={isSavingSettings}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              <span>{isSavingSettings ? 'Enregistrement en cours...' : 'Enregistrer la configuration FedaPay'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

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
                              placeholder="Ex: CardSchool SAS ou Nom du Trésorier"
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
                              placeholder="Ex: CardSchool SAS"
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
                                placeholder="contact@cardschool.tg"
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

                          {/* FedaPay Button Preview */}
                          {platformSettings.fedapayEnabled ? (
                            <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs flex items-center justify-between text-xs font-black">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                                <span>Payer en ligne (T-Money / Flooz)</span>
                              </div>
                              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded text-white font-mono font-bold">
                                {(platformSettings.annualPriceCFA || 30000).toLocaleString()} F
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-100 border border-dashed border-slate-300 rounded-xl text-center text-[10px] text-slate-500 font-semibold">
                              Bouton FedaPay désactivé (Paiement manuel uniquement)
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">T-Money (Togo)</p>
                                <p className="text-xs font-black text-slate-900">{platformSettings.tmoneyNumber || '+228 90 00 00 00'}</p>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                                {platformSettings.tmoneyHolder || 'CardSchool'}
                              </span>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Flooz / Moov Money</p>
                                <p className="text-xs font-black text-slate-900">{platformSettings.floozNumber || '+228 95 00 00 00'}</p>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                                {platformSettings.floozHolder || 'CardSchool'}
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

      {/* Mobile Bottom Navigation Bar for Admin */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 md:hidden flex items-center justify-around px-1 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        {[
          { id: 'overview', label: 'Supervision', icon: TrendingUp },
          { id: 'schools', label: 'Écoles', icon: Building2 },
          { id: 'payments', label: 'Paiements', icon: MessageSquare, badge: (unreadSchoolMessagesCount > 0 ? unreadSchoolMessagesCount : pendingReceiptsCount) },
          { id: 'licenses', label: 'Licences', icon: Key },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id || (item.id === 'settings' && activeSubTab === 'logs');
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer active:scale-95 ${
                isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-400 font-medium hover:text-slate-600'
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

