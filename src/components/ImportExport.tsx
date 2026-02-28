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
      complete: (results) => {
        const importedStudents: Student[] = results.data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          firstName: row.firstName || row.prenom || '',
          lastName: row.lastName || row.nom || '',
          matricule: row.matricule || '',
          className: row.className || row.classe || '',
          schoolYear: row.schoolYear || row.annee || '2025-2026',
          examCenter: row.examCenter || row.centre || '',
          photoUrl: row.photoUrl || row.photo || '',
        }));
        onImport(importedStudents);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const downloadTemplate = () => {
    const template = [
      ['lastName', 'firstName', 'matricule', 'className', 'schoolYear', 'examCenter', 'photoUrl'],
      ['KOFFI', 'Jean', '2024-TG-001', 'Terminale C', '2025-2026', 'Lycée de Tokoin', ''],
    ];
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
