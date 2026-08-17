import React, { useRef } from 'react';
import Papa from 'papaparse';
import { Student } from '../types';
import { Upload, Download, FileSpreadsheet, FileDown } from 'lucide-react';

interface ImportExportProps {
  onImport: (students: Student[]) => void;
  students: Student[];
}

export const ImportExport: React.FC<ImportExportProps> = ({ onImport, students }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // auto-detect ; or ,
      complete: (results) => {
        const importedStudents: Student[] = results.data.map((row: any) => ({
          id: crypto.randomUUID(),
          firstName: row.prenom || row.firstName || '',
          lastName: row.nom || row.lastName || '',
          matricule: row.matricule || '',
          className: row.classe || row.className || '',
          schoolYear: row.annee_scolaire || row.schoolYear || row.annee || '2025-2026',
          birthDate: row.date_naissance || row.birthDate || '',
          birthPlace: row.lieu_naissance || row.birthPlace || '',
          examCenter: row.centre_examen || row.examCenter || row.centre || '',
          photoUrl: row.photo_url || row.photoUrl || row.photo || '',
          expirationDate: row.date_expiration || row.expirationDate || '',
        }));
        onImport(importedStudents);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        nom: 'KOFFI',
        prenom: 'Jean',
        matricule: '2024-TG-001',
        classe: 'Terminale C',
        annee_scolaire: '2025-2026',
        date_naissance: '12/05/2008',
        lieu_naissance: 'Lomé',
        centre_examen: 'Lycée de Tokoin',
        photo_url: '',
        date_expiration: '31/12/2026',
      },
    ];
    const csv = Papa.unparse(template, {
      columns: ['nom','prenom','matricule','classe','annee_scolaire','date_naissance','lieu_naissance','centre_examen','photo_url','date_expiration'],
      delimiter: ';',
    });
    // BOM UTF-8 pour que Excel ouvre correctement les accents
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'modele_import_eleves_togo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      alert('Aucun élève à exporter.');
      return;
    }

    const dataToExport = students.map(s => ({
      nom: s.lastName,
      prenom: s.firstName,
      matricule: s.matricule,
      classe: s.className,
      annee_scolaire: s.schoolYear || '2025-2026',
      date_naissance: s.birthDate || '',
      lieu_naissance: s.birthPlace || '',
      centre_examen: s.examCenter || '',
      photo_url: s.photoUrl || '',
      date_expiration: s.expirationDate || '',
    }));

    const csv = Papa.unparse(dataToExport, {
      columns: ['nom','prenom','matricule','classe','annee_scolaire','date_naissance','lieu_naissance','centre_examen','photo_url','date_expiration'],
      delimiter: ';',
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `eleves_cardschool_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer active:scale-95"
        title="Importer des élèves depuis un fichier CSV"
      >
        <Upload className="w-3.5 h-3.5 text-emerald-700" />
        Importer CSV
      </button>

      <button
        onClick={handleExportCSV}
        disabled={students.length === 0}
        className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-50 rounded-xl transition-all font-bold text-xs shadow-sm cursor-pointer active:scale-95"
        title="Exporter la liste des élèves au format Excel / CSV"
      >
        <FileDown className="w-3.5 h-3.5 text-slate-600" />
        Exporter CSV ({students.length})
      </button>

      <button
        onClick={downloadTemplate}
        className="flex items-center gap-2 px-3.5 py-2 bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 rounded-xl transition-all font-bold text-xs cursor-pointer active:scale-95"
        title="Télécharger le modèle CSV officiel"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
        Modèle CSV
      </button>
    </div>
  );
};

