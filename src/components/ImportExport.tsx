import React, { useState } from 'react';
import Papa from 'papaparse';
import { Student } from '../types';
import { formatDateDisplay } from '../lib/utils';
import { Upload, FileSpreadsheet, FileDown } from 'lucide-react';

const ClassImportModal = React.lazy(() => import('./ClassImportModal').then(m => ({ default: m.ClassImportModal })));

interface ImportExportProps {
  onImport: (students: Student[], targetClass?: string) => Promise<void> | void;
  students: Student[];
  allClasses?: string[];
  currentClassFilter?: string;
  isEffectivePro?: boolean;
  effectiveQuota?: number;
}

export const ImportExport: React.FC<ImportExportProps> = ({ 
  onImport, 
  students,
  allClasses = [],
  currentClassFilter = 'all',
  isEffectivePro = false,
  effectiveQuota = 15,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const downloadTemplate = async () => {
    const templateClass = currentClassFilter !== 'all' ? currentClassFilter : '6ème A';
    const template = [
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
    const csv = Papa.unparse(template, {
      columns: ['nom','prenom','matricule','classe','annee_scolaire','date_naissance','lieu_naissance','centre_examen','photo_url','date_expiration'],
      delimiter: ';',
    });
    // BOM UTF-8 pour ouverture correcte dans Microsoft Excel avec accents
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'modele_import_eleves_togo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async () => {
    const studentsToExport = currentClassFilter !== 'all'
      ? students.filter(s => s.className === currentClassFilter)
      : students;

    if (studentsToExport.length === 0) {
      alert(currentClassFilter !== 'all' 
        ? `Aucun élève trouvé dans la classe ${currentClassFilter}.` 
        : 'Aucun élève à exporter.'
      );
      return;
    }

    const dataToExport = studentsToExport.map(s => ({
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
      columns: ['nom','prenom','matricule','classe','annee_scolaire','date_naissance','lieu_naissance','centre_examen','photo_url','date_expiration'],
      delimiter: ';',
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const classSuffix = currentClassFilter !== 'all' ? `_${currentClassFilter.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
    link.setAttribute('download', `eleves_sukupass${classSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={() => setIsImportModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer active:scale-95"
        title="Importer des élèves depuis un fichier Excel ou CSV"
      >
        <Upload className="w-4 h-4" />
        <span>Importer Excel / CSV</span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={downloadTemplate}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border border-emerald-200/80 rounded-xl transition-all font-bold text-xs cursor-pointer active:scale-95"
          title="Télécharger le modèle Excel pré-formaté"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
          <span>Modèle Excel</span>
        </button>

        <button
          onClick={handleExportCSV}
          disabled={students.length === 0}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 rounded-xl transition-all font-bold text-xs shadow-xs cursor-pointer active:scale-95"
          title={currentClassFilter !== 'all' ? `Exporter les élèves de ${currentClassFilter}` : "Exporter tous les élèves"}
        >
          <FileDown className="w-3.5 h-3.5 text-slate-600" />
          <span>Exporter ({currentClassFilter !== 'all' ? students.filter(s => s.className === currentClassFilter).length : students.length})</span>
        </button>
      </div>

      {/* Dedicated Class-Aware Import Modal */}
      {isImportModalOpen && (
        <React.Suspense fallback={null}>
          <ClassImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={onImport}
            existingClasses={allClasses}
            initialClass={currentClassFilter !== 'all' ? currentClassFilter : undefined}
            totalCurrentStudents={students.length}
            effectiveQuota={effectiveQuota}
            isEffectivePro={isEffectivePro}
          />
        </React.Suspense>
      )}
    </div>
  );
};
