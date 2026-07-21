import React from 'react';
import { School as SchoolIcon, FileDown, Plus, LogOut } from 'lucide-react';
import { Session } from '../lib/auth';

interface DashboardHeaderProps {
  session: Session;
  studentsCount: number;
  onPreviewClick: () => void;
  onAddClick: () => void;
  onLogoutClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  session,
  studentsCount,
  onPreviewClick,
  onAddClick,
  onLogoutClick,
}) => {
  return (
    <header className="sticky top-4 z-40 px-4 w-full no-print">
      <div className="max-w-7xl mx-auto bg-white/85 backdrop-blur-md border border-gray-100/90 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] h-20 px-6 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white border border-emerald-400/20 shadow-md shadow-emerald-800/5">
            <SchoolIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Générateur de Cartes</h1>
            <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-[0.15em] mt-0.5">Scolaire • Togo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold border border-emerald-400/10">
              {session.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">{session.fullName}</span>
          </div>

          <button 
            onClick={onPreviewClick}
            disabled={studentsCount === 0}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-850 border border-emerald-100/60 hover:bg-emerald-100/80 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 text-sm"
          >
            <FileDown className="w-5 h-5 text-emerald-700" />
            Télécharger PDF
          </button>
          
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-2.5 btn-primary active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" />
            Ajouter Élève
          </button>
          
          <button
            onClick={onLogoutClick}
            title="Se déconnecter"
            className="flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
