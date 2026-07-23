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
  Power,
  RefreshCw,
  LogOut,
  Sparkles
} from 'lucide-react';
import { fetchAllSchools, fetchAllStudentsCount, updateSchoolSubscription, AdminSchoolDetail, saveAdminLog } from '../lib/db';
import { Session } from '../lib/auth';

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
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'schools' | 'payments' | 'logs'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom manual quotas state
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [customQuotaVal, setCustomQuotaVal] = useState<number>(15);

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
    } catch (err) {
      console.error('Error loading admin statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter schools based on search
  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (school.location && school.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Upgrade trial schools to Pro subscription plan
  const handleUpgradeToPro = async (schoolUserId: string, schoolName: string) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const expiresAtStr = nextYear.toISOString().split('T')[0];

    if (window.confirm(`Confirmez-vous l'activation du Plan PRO (Licence 1 An) pour l'établissement "${schoolName}" ?`)) {
      const success = await updateSchoolSubscription(schoolUserId, 'pro', expiresAtStr);
      if (success) {
        // Log locally
        const newLog: AdminLog = {
          id: Math.random().toString(),
          schoolName: schoolName,
          action: 'Abonnement Activé',
          details: `Validation du Plan PRO (Expire le ${expiresAtStr})`,
          createdAt: new Date().toISOString()
        };
        setActivityLogs(prev => [newLog, ...prev]);
        alert(`Félicitations ! L'abonnement PRO a été activé avec succès pour "${schoolName}".`);
        loadData(); // Reload table
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
  const estimatedAnnualRevenue = activeProSchoolsCount * 30000; // 30,000 F CFA per year per Pro school

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
          
          <button
            onClick={loadData}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-xl transition-all cursor-pointer active:scale-95"
            title="Rafraîchir les statistiques"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Tab content renderer */}
        <div className="p-8 space-y-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Stats Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* School counts widget */}
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

                {/* Total Cards count widget */}
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

                {/* Conversion metrics */}
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

                {/* Revenue estimer */}
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

              {/* Split layout: Recent signups & Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left column: Recent Schools */}
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
                              <p className="text-[9px] text-gray-400 mt-1 font-semibold">
                                {school.studentCount} {school.studentCount === 1 ? 'élève' : 'élèves'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Audit logs preview */}
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
              {/* Search filter bar */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-4 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Rechercher une école, une ville..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-xs font-semibold focus-brand bg-white transition-all"
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-150">
                    {filteredSchools.length} école(s) trouvée(s)
                  </span>
                </div>
              </div>

              {/* Schools ledger card table */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-0 bg-white overflow-hidden">
                  {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
                  ) : filteredSchools.length === 0 ? (
                    <div className="py-20 text-center text-xs text-gray-500 font-medium">Aucun établissement ne correspond aux filtres.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] border-collapse text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <th className="px-6 py-4">Établissement</th>
                            <th className="px-6 py-4">Localisation & Tel</th>
                            <th className="px-6 py-4">Cartes Édités</th>
                            <th className="px-6 py-4">Plan & Statut</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {filteredSchools.map((school) => (
                            <tr key={school.userId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-extrabold text-gray-900">{school.name}</p>
                                <p className="text-[10px] text-gray-400 font-medium">Inscrit : {school.updatedAt ? new Date(school.updatedAt).toLocaleDateString() : 'N/A'}</p>
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-600">
                                <p>{school.location || 'N/A'}</p>
                                <p className="text-[10px] text-gray-400">{school.phone || 'N/A'}</p>
                              </td>
                              <td className="px-6 py-4 font-black text-emerald-850">
                                {school.studentCount}
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
                                  <button
                                    onClick={() => handleUpgradeToPro(school.userId, school.name)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition-colors cursor-pointer"
                                  >
                                    Activer Pro
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleResetToFree(school.userId, school.name)}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold rounded-lg text-[10px] transition-colors cursor-pointer"
                                  >
                                    Reset Gratuit
                                  </button>
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
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Visualisez les écoles demandant l'activation du Plan Pro. Une fois que vous recevez les fonds correspondants sur vos comptes marchands T-Money (+228 90 00 00 00) ou Flooz (+228 95 00 00 00), cliquez sur "Valider" pour activer immédiatement leur licence.
                  </p>

                  <div className="divide-y divide-gray-100">
                    {schools.filter(s => s.subscriptionPlan === 'free').length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-12 font-medium">Aucune demande de paiement en attente. Toutes les écoles actives sont sur le plan PRO.</p>
                    ) : (
                      schools
                        .filter(s => s.subscriptionPlan === 'free')
                        .map((school) => (
                          <div key={school.userId} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-xs font-black text-gray-900">{school.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                {school.location || 'Localisation non fournie'} • Tel: {school.phone || 'N/A'}
                              </p>
                              <p className="text-[10px] text-amber-800 font-semibold bg-amber-50 inline-block px-2.5 py-0.5 rounded border border-amber-100/50">
                                Montant attendu : 30 000 F CFA / an
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a 
                                href={`https://wa.me/${school.phone?.replace(/[^0-9+]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm bg-white"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
                                Contacter WhatsApp
                              </a>
                              
                              <button
                                onClick={() => handleUpgradeToPro(school.userId, school.name)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[10px] flex items-center gap-1.5 transition-all shadow-md shadow-emerald-200 cursor-pointer active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Valider le Règlement
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
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
                      <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-100/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900">{log.schoolName}</span>
                            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100/60 rounded text-[8px] font-extrabold uppercase">{log.action}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">{log.details}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
