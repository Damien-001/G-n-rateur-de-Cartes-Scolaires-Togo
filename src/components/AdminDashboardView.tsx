import React, { useState, useEffect } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { 
  fetchAllSchools, 
  fetchAllStudentsCount, 
  updateSchoolSubscription, 
  AdminSchoolDetail, 
  saveAdminLog,
  fetchAllLicenseKeys,
  generateLicenseKey,
  exportSchoolsToCSV,
  updateSchoolCustomQuota
} from '../lib/db';
import { Session } from '../lib/auth';
import { LicenseKey, TOGO_REGIONS } from '../types';

interface AdminDashboardViewProps {
  session: Session;
  onLogout: () => void;
  onSwitchToSchoolView: () => void;
}

interface AdminLog {
  id: string;
  schoolName: string;
  action: string;
  details: string;
  createdAt: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  session,
  onLogout,
  onSwitchToSchoolView
}) => {
  const [schools, setSchools] = useState<AdminSchoolDetail[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'schools' | 'payments' | 'licenses' | 'logs'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Toutes les régions');
  
  // Custom manual quotas state
  const [editingSchool, setEditingSchool] = useState<AdminSchoolDetail | null>(null);
  const [customQuotaVal, setCustomQuotaVal] = useState<number>(15);

  // License keys state
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [keyFilter, setKeyFilter] = useState<'all' | 'available' | 'used'>('all');
  const [newKeyNote, setNewKeyNote] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Mocked audit logs for real time activity overview fallback
  const [activityLogs, setActivityLogs] = useState<AdminLog[]>([
    { id: '1', schoolName: 'Lycée de Tokoin', action: 'Génération PDF', details: 'Impression de 45 cartes élèves', createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    { id: '2', schoolName: 'Collège Notre Dame', action: 'Importation CSV', details: 'Importation réussie de 88 élèves', createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: '3', schoolName: 'Lycée Scientifique de Lomé', action: 'Mise à jour Signature', details: 'Signature officielle du Proviseur enregistrée', createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    { id: '4', schoolName: 'Complexe Scolaire La Sagesse', action: 'Inscription', details: 'Nouvel établissement enregistré (Plan Découverte)', createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
    { id: '5', schoolName: 'Lycée de Tsévié', action: 'Paiement Mobile Money', details: 'Validation manuelle du plan PRO initiée', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
  ]);

  // Load SaaS statistics
  const loadData = async () => {
    setIsLoading(true);
    try {
      const allSchools = await fetchAllSchools();
      const studentCount = await fetchAllStudentsCount();
      setSchools(allSchools);
      setTotalStudents(studentCount);
      setLicenseKeys(fetchAllLicenseKeys());
    } catch (err) {
      console.error('Error loading admin statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter schools based on search and region
  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.location && school.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (school.phone && school.phone.includes(searchTerm));
    
    const matchesRegion = selectedRegion === 'Toutes les régions' || (school.region || 'Grand Lomé') === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  // Filter license keys
  const filteredLicenseKeys = licenseKeys.filter(k => {
    if (keyFilter === 'available') return !k.isUsed;
    if (keyFilter === 'used') return k.isUsed;
    return true;
  });

  // Generate a new license key
  const handleCreateLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    const createdKey = generateLicenseKey(12, newKeyNote.trim() || undefined);
    setLicenseKeys(fetchAllLicenseKeys());
    setNewKeyNote('');
    alert(`Nouvelle Clé PRO générée avec succès :\n${createdKey.code}`);
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
    const success = await updateSchoolCustomQuota(editingSchool.userId, customQuotaVal);
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
      const success = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr);
      if (success) {
        const newLog: AdminLog = {
          id: Math.random().toString(),
          schoolName: schoolName,
          action: 'Abonnement Activé',
          details: `Validation du Plan PRO (Expire le ${expiresAtStr})`,
          createdAt: new Date().toISOString()
        };
        setActivityLogs(prev => [newLog, ...prev]);
        alert(`Félicitations ! L'abonnement PRO a été activé avec succès pour "${schoolName}".`);
        loadData();
      } else {
        alert("Erreur lors de la mise à jour de l'abonnement.");
      }
    }
  };

  // Downgrade or Reset subscription to Free trial plan
  const handleResetToFree = async (schoolUserId: string, schoolName: string) => {
    if (window.confirm(`Confirmez-vous le retour au Plan Découverte (Gratuit) pour l'établissement "${schoolName}" ?`)) {
      const success = await updateSchoolSubscription(schoolUserId, 'free', '');
      if (success) {
        const newLog: AdminLog = {
          id: Math.random().toString(),
          schoolName: schoolName,
          action: 'Abonnement Réinitialisé',
          details: 'Retour au Plan Découverte (Gratuit)',
          createdAt: new Date().toISOString()
        };
        setActivityLogs(prev => [newLog, ...prev]);
        alert(`L'abonnement a été réinitialisé au Plan Gratuit pour "${schoolName}".`);
        loadData();
      } else {
        alert("Erreur lors de la mise à jour de l'abonnement.");
      }
    }
  };

  // Calculate SaaS global KPI widgets metrics
  const activeProSchoolsCount = schools.filter(s => s.subscriptionPlan === 'pro').length;
  const freeSchoolsCount = schools.length - activeProSchoolsCount;
  const estimatedAnnualRevenue = activeProSchoolsCount * 30000;

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* Side Menu Navigation */}
      <aside className="w-full md:w-64 bg-[#f8faf6] text-slate-700 flex flex-col justify-between p-6 shrink-0 border-r border-slate-200/80 shadow-sm">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white border border-emerald-500/20 shadow-md shadow-emerald-600/10 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-slate-900 truncate leading-tight uppercase tracking-wider">
                Console Admin
              </h2>
              <p className="text-[9px] text-emerald-700 font-black uppercase tracking-[0.1em] mt-0.5">CardSchool SaaS</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Supervision Globale', icon: TrendingUp },
              { id: 'schools', label: 'Écoles Partenaires', icon: Building2 },
              { id: 'payments', label: 'Validation Paiements', icon: CreditCard },
              { id: 'licenses', label: 'Clés de Licence PRO', icon: Key },
              { id: 'logs', label: "Journal d'Activité", icon: History },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
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
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50/50">
        
        {/* Header toolbar */}
        <header className="bg-white border-b border-gray-150 py-5 px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              SaaS Administration Togo
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Monitoring & Validation mobile money</p>
          </div>
          
          <div className="flex items-center gap-3">
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
              title="Rafraîchir les statistiques"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

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
                                  : 'bg-amber-50 text-amber-800 border border-amber-100'
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
                      onClick={() => exportSchoolsToCSV(filteredSchools)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                    <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-150 shrink-0">
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
                          <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-500 uppercase tracking-widest">
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
                                <p className="font-extrabold text-gray-900">{school.name}</p>
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
                                    className="p-1 hover:bg-gray-200 text-gray-500 rounded transition-colors"
                                    title="Modifier le quota"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  school.subscriptionPlan === 'pro' 
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-800 border border-amber-100'
                                }`}>
                                  {school.subscriptionPlan || 'free'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                {school.subscriptionPlan === 'free' ? (
                                  <button onClick={() => handleUpgradeToPro(school.userId, school.name)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition-colors">Activer Pro</button>
                                ) : (
                                  <button onClick={() => handleResetToFree(school.userId, school.name)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold rounded-lg text-[10px] transition-colors">Reset Gratuit</button>
                                )}
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

          {/* TAB 3: PAYMENTS APPROVAL */}
          {activeSubTab === 'payments' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-4 bg-white">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-gray-100">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Validation Manuelle Mobile Money (Togo)
                  </h2>
                  <div className="divide-y divide-gray-100">
                    {schools.filter(s => s.subscriptionPlan === 'free').length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-12 font-medium">Aucune demande de paiement en attente.</p>
                    ) : (
                      schools.filter(s => s.subscriptionPlan === 'free').map((school) => (
                        <div key={school.userId} className="py-4 flex items-center justify-between">
                          <p className="text-xs font-black text-gray-900">{school.name}</p>
                          <button onClick={() => handleUpgradeToPro(school.userId, school.name)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[10px]">Valider</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LICENSE KEYS GENERATOR */}
          {activeSubTab === 'licenses' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-4 bg-white">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-gray-100">
                    <Key className="w-5 h-5 text-emerald-600" />
                    Générateur de Clés de Licence PRO (1 An)
                  </h2>
                  <form onSubmit={handleCreateLicenseKey} className="flex flex-col sm:flex-row gap-3 pt-2">
                    <input type="text" placeholder="Note explicative" value={newKeyNote} onChange={e => setNewKeyNote(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus-brand bg-white" />
                    <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
                      <Plus className="w-4 h-4" /> Générer
                    </button>
                  </form>
                </div>
              </div>

              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-5 bg-white">
                  <div className="space-y-3">
                    {filteredLicenseKeys.map(k => (
                      <div key={k.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="font-black text-sm text-gray-900 bg-white px-2.5 py-1 rounded-md border">{k.code}</span>
                          <p className="text-[10px] text-gray-500 font-medium">Créée le {new Date(k.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleCopyCode(k.code)} className="px-3.5 py-2 bg-white border rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
                          {copiedCode === k.code ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                          {copiedCode === k.code ? 'Copié !' : 'Copier'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeSubTab === 'logs' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-5 bg-white">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-gray-100">
                    <History className="w-5 h-5 text-emerald-600" />
                    Registre Général d'Audit & Activités
                  </h2>
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-gray-900">{log.schoolName} - {log.action}</p>
                          <p className="text-xs text-gray-500">{log.details}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Edit Custom Quota */}
      {editingSchool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5">
            <h3 className="text-sm font-black text-gray-900">Modifier Quota d'Élèves : {editingSchool.name}</h3>
            <input type="number" value={customQuotaVal} onChange={e => setCustomQuotaVal(parseInt(e.target.value) || 15)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingSchool(null)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs">Annuler</button>
              <button onClick={handleSaveCustomQuota} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
