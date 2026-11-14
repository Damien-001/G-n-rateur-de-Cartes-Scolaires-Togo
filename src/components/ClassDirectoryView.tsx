import React, { useState, useMemo } from 'react';
import { Student, SchoolInfo } from '../types';
import { formatDateDisplay } from '../lib/utils';
import { 
  GraduationCap, 
  Users, 
  Camera, 
  Printer, 
  Upload, 
  FileSpreadsheet, 
  FileDown, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Check,
  UserCheck,
  UserX,
  ClipboardList
} from 'lucide-react';

interface ClassDirectoryViewProps {
  students: Student[];
  allClasses: string[];
  schoolInfo: SchoolInfo;
  onOpenAddStudent: (className?: string) => void;
  onOpenImportModal: (className?: string) => void;
  onDownloadTemplate: (className: string) => void;
  onExportClassCSV: (className: string) => void;
  onPrintClass: (className: string) => void;
  onOpenAttendanceSheet?: (className: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  selectedStudents: string[];
  onToggleSelectStudent: (id: string) => void;
  onSelectAllInClass?: (className: string) => void;
}

export const ClassDirectoryView: React.FC<ClassDirectoryViewProps> = ({
  students,
  allClasses,
  schoolInfo,
  onOpenAddStudent,
  onOpenImportModal,
  onDownloadTemplate,
  onExportClassCSV,
  onPrintClass,
  onOpenAttendanceSheet,
  onEditStudent,
  onDeleteStudent,
  selectedStudents,
  onToggleSelectStudent,
}) => {
  // Currently expanded class for detailed list view
  const [expandedClass, setExpandedClass] = useState<string | null>(allClasses[0] || null);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [filterMissingPhoto, setFilterMissingPhoto] = useState(false);

  // Class statistics
  const classStats = useMemo(() => {
    return allClasses.map(cls => {
      const classStudents = students.filter(s => s.className === cls);
      const withPhoto = classStudents.filter(s => s.photoUrl && s.photoUrl.trim().length > 0).length;
      const photoRate = classStudents.length > 0 ? Math.round((withPhoto / classStudents.length) * 100) : 0;
      return {
        className: cls,
        count: classStudents.length,
        withPhoto,
        withoutPhoto: classStudents.length - withPhoto,
        photoRate,
      };
    });
  }, [allClasses, students]);

  // Overall totals
  const totalStudents = students.length;
  const totalWithPhoto = students.filter(s => s.photoUrl && s.photoUrl.trim().length > 0).length;
  const overallPhotoRate = totalStudents > 0 ? Math.round((totalWithPhoto / totalStudents) * 100) : 0;

  // Filter students for the active/expanded class
  const activeClassStudents = useMemo(() => {
    if (!expandedClass) return [];
    return students.filter(s => {
      if (s.className !== expandedClass) return false;
      if (filterMissingPhoto && s.photoUrl && s.photoUrl.trim().length > 0) return false;
      if (classSearchTerm.trim()) {
        const term = classSearchTerm.toLowerCase();
        const matchName = `${s.lastName} ${s.firstName}`.toLowerCase().includes(term);
        const matchMatricule = (s.matricule || '').toLowerCase().includes(term);
        return matchName || matchMatricule;
      }
      return true;
    });
  }, [students, expandedClass, filterMissingPhoto, classSearchTerm]);

  if (allClasses.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4 shadow-sm animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-black text-slate-900">Aucune classe pour le moment</h3>
          <p className="text-xs text-slate-500 font-medium">
            Pour organiser vos élèves par classe, importez un fichier CSV ou ajoutez un élève manuellement en indiquant sa classe (ex: 6ème A, Terminale C...).
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenImportModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Importer une classe (CSV)</span>
          </button>
          <button
            onClick={() => onOpenAddStudent()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un élève</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
                Répertoire des Classes • {schoolInfo.name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {allClasses.length} classe{allClasses.length > 1 ? 's' : ''} enregistrée{allClasses.length > 1 ? 's' : ''}
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Suivi des effectifs, complétude des photos et impression directe des cartes par classe
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Stat Box: Total Students */}
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 min-w-[120px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">Total Élèves</span>
              <span className="text-xl font-black text-white">{totalStudents}</span>
            </div>

            {/* Stat Box: Photo Completion */}
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 min-w-[140px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Photos Prêtes</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                  {overallPhotoRate}%
                </span>
              </div>
              <span className="text-xl font-black text-white">{totalWithPhoto} / {totalStudents}</span>
            </div>

            {/* Quick Action: New Class import */}
            <button
              onClick={() => onOpenImportModal()}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Importer une classe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classStats.map(c => {
          const isSelected = expandedClass === c.className;
          return (
            <div
              key={c.className}
              onClick={() => setExpandedClass(isSelected ? null : c.className)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/10'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Header: Class Name + Student count */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">{c.className}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {c.count} élève{c.count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <span className={`p-1.5 rounded-lg text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-emerald-600' : ''}`}>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>

              {/* Photos Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400" /> Photos disponibles
                  </span>
                  <span className={c.photoRate === 100 ? 'text-emerald-700 font-black' : 'text-slate-700'}>
                    {c.withPhoto}/{c.count} ({c.photoRate}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      c.photoRate === 100 ? 'bg-emerald-600' : c.photoRate > 50 ? 'bg-teal-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${c.photoRate}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div 
                className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onPrintClass(c.className)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-850 font-bold text-xs transition-colors cursor-pointer"
                  title={`Imprimer les cartes de ${c.className}`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>

                <button
                  onClick={() => onOpenImportModal(c.className)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title={`Importer dans ${c.className}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDownloadTemplate(c.className)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title={`Télécharger modèle CSV pour ${c.className}`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onExportClassCSV(c.className)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title={`Exporter CSV de ${c.className}`}
                >
                  <FileDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Class Detailed Student Table */}
      {expandedClass && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5 sm:p-7 space-y-5 animate-fadeIn">
          {/* Detailed Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Registre des élèves : {expandedClass}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-850">
                    {students.filter(s => s.className === expandedClass).length} élèves
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Gestion nominative, vérification des photos et actions individuelles
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenAddStudent(expandedClass)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ajouter à {expandedClass}</span>
              </button>

              <button
                onClick={() => onPrintClass(expandedClass)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Imprimer les cartes</span>
              </button>

              {onOpenAttendanceSheet && (
                <button
                  onClick={() => onOpenAttendanceSheet(expandedClass)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Générer la feuille d'émargement officielle de remise des cartes"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Fiche d'Émargement</span>
                </button>
              )}

              <button
                onClick={() => onExportClassCSV(expandedClass)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Exporter CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar inside the class */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Rechercher dans ${expandedClass}...`}
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus-brand outline-none text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setFilterMissingPhoto(!filterMissingPhoto)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  filterMissingPhoto
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Sans photo seulement</span>
              </button>

              <span className="text-xs font-bold text-slate-400 uppercase">
                {activeClassStudents.length} affiché{activeClassStudents.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Student Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-4">Élève (Nom & Prénoms)</th>
                    <th className="py-3 px-4">Matricule</th>
                    <th className="py-3 px-4">Date & Lieu Naissance</th>
                    <th className="py-3 px-4">Statut Photo</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {activeClassStudents.map((s, index) => {
                    const hasPhoto = !!(s.photoUrl && s.photoUrl.trim().length > 0);
                    const isSelected = selectedStudents.includes(s.id);
                    return (
                      <tr 
                        key={s.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                      >
                        {/* Checkbox / Index */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectStudent(s.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Name & Photo thumbnail */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {hasPhoto ? (
                                <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-black text-slate-400 uppercase">
                                  {s.lastName.charAt(0)}{s.firstName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">
                                {s.lastName} {s.firstName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.schoolYear || '2025-2026'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Matricule */}
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {s.matricule || '—'}
                        </td>

                        {/* Birth */}
                        <td className="py-2.5 px-4 text-slate-600">
                          <span className="font-semibold text-slate-800">{formatDateDisplay(s.birthDate)}</span>
                          {s.birthPlace && <span className="text-[10px] text-slate-400 block">{s.birthPlace}</span>}
                        </td>

                        {/* Photo Status */}
                        <td className="py-2.5 px-4">
                          {hasPhoto ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-850">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Photo prête
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Photo manquante
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditStudent(s)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier les informations"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer l'élève ${s.firstName} ${s.lastName} ?`)) {
                                  onDeleteStudent(s.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer cet élève"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {activeClassStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-xs text-slate-600">Aucun élève trouvé</p>
                        <p className="text-[11px] mt-0.5">
                          {classSearchTerm || filterMissingPhoto
                            ? 'Aucun élève ne correspond aux critères de filtre.'
                            : `Aucun élève n'est encore enregistré dans la classe ${expandedClass}.`}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

