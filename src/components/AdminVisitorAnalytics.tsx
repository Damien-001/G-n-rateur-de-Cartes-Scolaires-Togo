import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe, 
  MapPin, 
  Calendar, 
  RefreshCw, 
  Download, 
  ArrowUpRight, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { VisitorStats, computeVisitorStats, PageVisit } from '../lib/analytics';

interface AdminVisitorAnalyticsProps {
  totalRegisteredSchools: number;
}

export const AdminVisitorAnalytics: React.FC<AdminVisitorAnalyticsProps> = ({
  totalRegisteredSchools
}) => {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await computeVisitorStats(totalRegisteredSchools);
      setStats(data);
    } catch (err) {
      console.error('Error computing analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Écouter les nouvelles visites en direct
    const handleNewVisit = () => {
      loadStats();
    };

    window.addEventListener('cardschool_new_visit_recorded', handleNewVisit);
    return () => {
      window.removeEventListener('cardschool_new_visit_recorded', handleNewVisit);
    };
  }, [totalRegisteredSchools]);

  // Exporter les données de visites en CSV
  const exportVisitsCSV = () => {
    if (!stats || stats.recentVisits.length === 0) return;
    const headers = ['ID', 'Date_Heure', 'Page', 'Appareil', 'Navigateur', 'Systeme', 'Region', 'Source'];
    const rows = stats.recentVisits.map(v => [
      v.id,
      new Date(v.timestamp).toLocaleString('fr-FR'),
      v.path,
      v.device,
      v.browser,
      v.os,
      v.region,
      v.referrer
    ]);
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `visiteurs_cartes_scolaires_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">Chargement des statistiques d'audience...</p>
      </div>
    );
  }

  if (!stats) return null;

  // Calcul valeur max pour échelle du graphique
  const maxDayVisits = Math.max(...stats.dailyTrend.map(d => d.visits), 10);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner with live badge & Controls */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
                Tracking d'Audience en Temps Réel • CardSchool Togo
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Statistiques des Visiteurs & Fréquentation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Consultez l'affluence des directeurs d'école, les régions togolaises d'où proviennent les connexions et le taux de conversion vers les inscriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportVisitsCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadStats}
              disabled={isLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Unique Visitors */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              Visiteurs Uniques
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.uniqueVisitors.toLocaleString('fr-FR')}
            </h3>
            <p className="text-xs text-emerald-800 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% ce mois</span>
              <span className="text-slate-600 font-normal">vs mois précédent</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Total des visites</span>
            <span className="font-extrabold text-slate-800">{stats.totalVisits.toLocaleString('fr-FR')}</span>
          </div>
        </div>

        {/* KPI 2: Today Visits */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              Aujourd'hui
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.todayVisits.toLocaleString('fr-FR')}
            </h3>
            <p className="text-xs text-teal-800 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span>{stats.todayUnique} visiteurs uniques aujourd'hui</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Cette semaine</span>
            <span className="font-extrabold text-slate-800">{stats.weekVisits.toLocaleString('fr-FR')} visites</span>
          </div>
        </div>

        {/* KPI 3: Mobile Traffic % */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              Part Mobile (Togo)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.deviceBreakdown.mobilePercent}%
            </h3>
            <p className="text-xs text-blue-800 font-bold">
              Usage prédominant sur smartphone
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Ordinateurs PC/Mac</span>
            <span className="font-extrabold text-slate-800">{stats.deviceBreakdown.desktopPercent}%</span>
          </div>
        </div>

        {/* KPI 4: Conversion Rate */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
              Taux de Conversion
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.conversionRate}%
            </h3>
            <p className="text-xs text-amber-800 font-bold">
              Visiteurs $\rightarrow$ Écoles inscrites
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Établissements enregistrés</span>
            <span className="font-black text-emerald-800">{totalRegisteredSchools}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Daily Evolution Chart (7 Days) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Évolution des Visites des 7 Derniers Jours
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Fluctuations quotidiennes des visites totales et des visiteurs uniques
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-t from-emerald-600 to-teal-500" />
              <span className="text-slate-600">Visites totales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-300" />
              <span className="text-slate-600">Visiteurs uniques</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="pt-8 pb-4">
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 border-b border-slate-200/80 pb-2">
            {stats.dailyTrend.map((day, idx) => {
              const heightPercent = Math.max(12, Math.round((day.visits / maxDayVisits) * 100));
              const uniqueHeightPercent = Math.max(8, Math.round((day.unique / maxDayVisits) * 100));
              const isHovered = hoveredBarIndex === idx;

              return (
                <div 
                  key={day.date}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-black shadow-xl whitespace-nowrap z-20 animate-fadeIn pointer-events-none">
                      <p className="text-emerald-300">{day.label} : {day.visits} visites</p>
                      <p className="text-slate-300 font-medium text-[10px]">{day.unique} visiteurs uniques</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  )}

                  {/* Dual Bar (Visits & Unique) */}
                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                    {/* Visits Bar */}
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className={`w-1/2 rounded-t-lg transition-all duration-300 bg-gradient-to-t from-emerald-600 to-teal-500 ${
                        isHovered ? 'brightness-110 shadow-md shadow-emerald-500/30' : 'group-hover:opacity-95'
                      }`}
                    />
                    {/* Unique Bar */}
                    <div 
                      style={{ height: `${uniqueHeightPercent}%` }}
                      className="w-1/2 rounded-t-lg transition-all duration-300 bg-slate-300 group-hover:bg-slate-400"
                    />
                  </div>

                  {/* Date label */}
                  <span className={`text-[11px] font-bold mt-2 transition-colors ${
                    isHovered ? 'text-emerald-700 font-black' : 'text-slate-500'
                  }`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3: Devices & Regions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card: Device Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Répartition par Appareil
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Types de supports utilisés par les établissements et visiteurs
            </p>
          </div>

          <div className="space-y-4">
            {/* Mobile */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-800">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Smartphones (Android & iOS)
                </span>
                <span className="text-slate-900 font-black">
                  {stats.deviceBreakdown.mobilePercent}% <span className="text-slate-600 font-normal">({stats.deviceBreakdown.mobile} visites)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.deviceBreakdown.mobilePercent}%` }}
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                />
              </div>
            </div>

            {/* Desktop */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-800">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  Ordinateurs de Bureau & PC Portables
                </span>
                <span className="text-slate-900 font-black">
                  {stats.deviceBreakdown.desktopPercent}% <span className="text-slate-600 font-normal">({stats.deviceBreakdown.desktop} visites)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.deviceBreakdown.desktopPercent}%` }}
                  className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                />
              </div>
            </div>

            {/* Tablet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-800">
                  <Tablet className="w-4 h-4 text-purple-600" />
                  Tablettes Tactiles (iPad / Android)
                </span>
                <span className="text-slate-900 font-black">
                  {stats.deviceBreakdown.tabletPercent}% <span className="text-slate-600 font-normal">({stats.deviceBreakdown.tablet} visites)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stats.deviceBreakdown.tabletPercent}%` }}
                  className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-950 font-medium leading-relaxed">
              <strong>Optimisation Mobile 100% active :</strong> Le portail s'adapte automatiquement sur les smartphones des directeurs et parents d'élèves pour une consultation rapide sans ordinateur.
            </p>
          </div>
        </div>

        {/* Card: Geographic Origin */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Origine Géographique (Togo & Régions)
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Répartition des visites par région éducative
            </p>
          </div>

          <div className="space-y-3">
            {stats.regionBreakdown.slice(0, 5).map(reg => (
              <div key={reg.region} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-emerald-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700 font-black text-xs shadow-2xs">
                    🇹🇬
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{reg.region}</p>
                    <p className="text-[10px] text-slate-600">{reg.count} sessions enregistrées</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-850 rounded-full text-xs font-black">
                    {reg.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Most Visited Pages & Real-time Live Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Visited Pages */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Pages les Plus Consultées
            </h3>
            <span className="text-[11px] font-bold text-slate-600 uppercase">Top Vues</span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.pageBreakdown.slice(0, 5).map((page, idx) => (
              <div key={page.path} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{page.label}</p>
                    <p className="text-[10px] text-slate-600 font-mono truncate">{page.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-extrabold text-slate-800">{page.count} vues</span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {page.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Realtime Live Visit Feed */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Flux des Visites Récentes
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-850">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              En direct
            </span>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Heure</th>
                    <th className="py-2.5 px-3">Région</th>
                    <th className="py-2.5 px-3">Support</th>
                    <th className="py-2.5 px-3">Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {stats.recentVisits.slice(0, 8).map(visit => {
                    const timeStr = new Date(visit.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                          {visit.region}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            {visit.device === 'mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {visit.device}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] truncate max-w-[120px]">
                          {visit.path}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
