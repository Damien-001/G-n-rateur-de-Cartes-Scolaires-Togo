import React, { useRef } from 'react';
import Papa from 'papaparse';
import { Student } from '../types';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';

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
      },
    ];
    const csv = Papa.unparse(template, {
      columns: ['nom','prenom','matricule','classe','annee_scolaire','date_naissance','lieu_naissance','centre_examen','photo_url'],
      delimiter: ';',
    });
    // BOM UTF-8 pour que Excel ouvre correctement les accents
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'modele_import_eleves.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors font-medium shadow-sm"
      >
        <Upload className="w-4 h-4" />
        Importer CSV
      </button>
      <button
        onClick={downloadTemplate}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Modèle CSV
      </button>
    </div>
  );
};
