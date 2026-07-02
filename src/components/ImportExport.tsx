import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Student } from '../types';
import { Upload, Download, FileSpreadsheet, X, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface ImportExportProps {
  onImport: (students: Student[]) => void;
  students: Student[];
}

interface PreviewRow {
  index: number;
  data: Partial<Student>;
  errors: string[];
}

function normalizeDate(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // DD/MM/YYYY → YYYY-MM-DD (for <input type="date">)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD-MM-YYYY → YYYY-MM-DD
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, d, m, y] = dashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return trimmed; // return as-is, will be flagged as warning
}

function validatePreviewRow(row: Partial<Student>, index: number): PreviewRow {
  const errors: string[] = [];
  if (!row.lastName?.trim()) errors.push('Nom manquant');
  if (!row.firstName?.trim()) errors.push('Prénom manquant');
  if (!row.matricule?.trim()) errors.push('Matricule manquant');
  if (!row.className?.trim()) errors.push('Classe manquante');
  return { index, data: row, errors };
}

export const ImportExport: React.FC<ImportExportProps> = ({ onImport, students }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError('Fichier CSV invalide ou vide.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const parsed: Student[] = (results.data as any[]).map((row) => ({
          id: crypto.randomUUID(),
          firstName: (row.prenom || row.firstName || '').trim(),
          lastName: (row.nom || row.lastName || '').trim(),
          matricule: (row.matricule || '').trim(),
          className: (row.classe || row.className || '').trim(),
          schoolYear: (row.annee_scolaire || row.schoolYear || row.annee || '').trim() || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          birthDate: normalizeDate(row.date_naissance || row.birthDate || ''),
          birthPlace: (row.lieu_naissance || row.birthPlace || '').trim(),
          examCenter: (row.centre_examen || row.examCenter || row.centre || '').trim(),
          photoUrl: (row.photo_url || row.photoUrl || row.photo || '').trim(),
          expirationDate: normalizeDate(row.date_expiration || row.expirationDate || ''),
        }));

        const preview = parsed.map((s, i) => validatePreviewRow(s, i + 1));
        setPreviewRows(preview);
        setPendingStudents(parsed);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        setParseError(`Erreur de lecture : ${err.message}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const confirmImport = () => {
    onImport(pendingStudents);
    setPreviewRows(null);
    setPendingStudents([]);
  };

  const cancelImport = () => {
    setPreviewRows(null);
    setPendingStudents([]);
    setParseError(null);
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
      columns: ['nom', 'prenom', 'matricule', 'classe', 'annee_scolaire', 'date_naissance', 'lieu_naissance', 'centre_examen', 'photo_url', 'date_expiration'],
      delimiter: ';',
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'modele_import_eleves.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    if (students.length === 0) return;
    const rows = students.map((s) => ({
      nom: s.lastName,
      prenom: s.firstName,
      matricule: s.matricule,
      classe: s.className,
      annee_scolaire: s.schoolYear,
      date_naissance: s.birthDate || '',
      lieu_naissance: s.birthPlace || '',
      centre_examen: s.examCenter || '',
      photo_url: s.photoUrl || '',
      date_expiration: s.expirationDate || '',
    }));
    const csv = Papa.unparse(rows, {
      columns: ['nom', 'prenom', 'matricule', 'classe', 'annee_scolaire', 'date_naissance', 'lieu_naissance', 'centre_examen', 'photo_url', 'date_expiration'],
      delimiter: ';',
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `eleves_export_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const errorCount = previewRows?.filter((r) => r.errors.length > 0).length ?? 0;
  const validCount = (previewRows?.length ?? 0) - errorCount;

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
        >
          <Upload className="w-4 h-4" />
          Importer CSV
        </button>
        <button
          onClick={exportCSV}
          disabled={students.length === 0}
          title={students.length === 0 ? 'Aucun élève à exporter' : `Exporter ${students.length} élève${students.length > 1 ? 's' : ''}`}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Modèle
        </button>
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {parseError}
        </div>
      )}

      {/* Preview modal */}
      {previewRows && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-base font-bold text-gray-900">Prévisualisation de l'import</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {previewRows.length} ligne{previewRows.length > 1 ? 's' : ''} détectée{previewRows.length > 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={cancelImport} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Summary */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4 bg-white">
              <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold tabular-nums">{validCount}</span>
                <span>valide{validCount > 1 ? 's' : ''}</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold tabular-nums">{errorCount}</span>
                  <span>avec erreur{errorCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {errorCount > 0 && (
                <p className="text-xs text-gray-400 ml-auto">Les lignes avec erreurs seront quand même importées</p>
              )}
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold w-8">#</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Nom</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Prénom</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Matricule</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Classe</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Année</th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row) => (
                    <tr key={row.index} className={row.errors.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2 text-gray-400 tabular-nums">{row.index}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{row.data.lastName || <span className="text-red-400 italic">manquant</span>}</td>
                      <td className="px-4 py-2 text-gray-700">{row.data.firstName || <span className="text-red-400 italic">manquant</span>}</td>
                      <td className="px-4 py-2 text-gray-600 font-mono">{row.data.matricule || <span className="text-red-400 italic">manquant</span>}</td>
                      <td className="px-4 py-2 text-gray-600">{row.data.className || <span className="text-red-400 italic">manquant</span>}</td>
                      <td className="px-4 py-2 text-gray-500">{row.data.schoolYear}</td>
                      <td className="px-4 py-2">
                        {row.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600" title={row.errors.join(', ')}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            {row.errors[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <button onClick={cancelImport} className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors">
                Annuler
              </button>
              <button
                onClick={confirmImport}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-200"
              >
                Importer {previewRows.length} élève{previewRows.length > 1 ? 's' : ''}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
