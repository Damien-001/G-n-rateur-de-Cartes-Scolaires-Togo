import React from 'react';
import { 
  Download, 
  CheckCircle2 
} from 'lucide-react';
import { Student, SchoolInfo } from '../types';
import { ImportExport } from './ImportExport';

interface SchoolConfigSidebarProps {
  schoolInfo: SchoolInfo;
  setSchoolInfo: (info: SchoolInfo) => void;
  setIsSchoolSettingsOpen: (open: boolean) => void;
  students: Student[];
  onImport: (newStudents: Student[], targetClass?: string) => Promise<void> | void;
  allClasses?: string[];
  currentClassFilter?: string;
  isEffectivePro?: boolean;
  effectiveQuota?: number;
}

export const SchoolConfigSidebar: React.FC<SchoolConfigSidebarProps> = ({
  schoolInfo,
  setSchoolInfo,
  setIsSchoolSettingsOpen,
  students,
  onImport,
  allClasses = [],
  currentClassFilter = 'all',
  isEffectivePro = false,
  effectiveQuota = 15,
}) => {
  return (
    <div className="space-y-6">

      {/* CSV Import/Export tool box */}
      <div className="double-bezel-outer">
        <section className="double-bezel-inner p-6">
          <div className="flex items-center gap-2 mb-6">
            <Download className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Import / Export</h2>
          </div>
          <ImportExport 
            onImport={onImport} 
            students={students} 
            allClasses={allClasses}
            currentClassFilter={currentClassFilter}
            isEffectivePro={isEffectivePro}
            effectiveQuota={effectiveQuota}
          />
        </section>
      </div>

      {/* Printing guide */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-[1.5rem] p-6 text-white shadow-lg border border-emerald-700/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />
        <h3 className="font-bold text-base tracking-tight mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Guide d'impression
        </h3>
        <ul className="text-xs space-y-2.5 opacity-90 font-medium">
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Format A4 Portrait
          </li>
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Marges : "Aucune" ou "Par défaut"
          </li>
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Échelle : 100%
          </li>
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Activer "Graphiques d'arrière-plan"
          </li>
        </ul>
      </div>
    </div>
  );
};
