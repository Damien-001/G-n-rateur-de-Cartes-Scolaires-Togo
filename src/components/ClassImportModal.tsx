import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Student, CLASSES_LIST } from '../types';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Check, 
  ArrowRight,
  FileText
} from 'lucide-react';

interface ClassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newStudents: Student[], targetClass?: string) => Promise<void> | void;
  existingClasses: string[];
  initialClass?: string;
  totalCurrentStudents: number;
  effectiveQuota?: number;
  isEffectivePro?: boolean;
}

export const ClassImportModal: React.FC<ClassImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingClasses,
  initialClass,
  totalCurrentStudents,
  effectiveQuota = 15,
  isEffectivePro = false,
}) => {
  const [importMode, setImportMode] = useState<'specific_class' | 'detect_from_csv'>('specific_class');
  const [selectedClass, setSelectedClass] = useState<string>(initialClass && initialClass !== 'all' ? initialClass : '');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [customClassName, setCustomClassName] = useState('');
  
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialClass when modal opens or initialClass changes
  useEffect(() => {
    if (initialClass && initialClass !== 'all') {
      setSelectedClass(initialClass);
      setIsCustomClass(false);
    } else if (existingClasses.length > 0 && !selectedClass) {
      setSelectedClass(existingClasses[0]);
    }
  }, [initialClass, isOpen, existingClasses]);

  if (!isOpen) return null;

  // Build list of all available class choices (school's existing classes + Togo official list)
  const combinedClasses = Array.from(new Set([
    ...existingClasses,
    ...CLASSES_LIST
  ])).filter(Boolean);

  const effectiveTargetClass = isCustomClass ? customClassName.trim() : selectedClass;

  const processFile = (file: File) => {
    setParseError(null);
    setIsProcessingFile(true);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' Ko');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // auto-detect comma or semicolon
      complete: (results) => {
        setIsProcessingFile(false);
        if (!results.data || results.data.length === 0) {
          setParseError("Le fichier sélectionné est vide ou ne contient aucune ligne valide.");
          setParsedStudents([]);
          return;
        }

        const validRows: Student[] = [];
        let autoClassMissingCount = 0;

        results.data.forEach((row: any) => {
          // Normalize column names
          const lastName = (row.nom || row.lastName || row.Nom || '').trim();
          const firstName = (row.prenom || row.firstName || row.Prenom || row.prenoms || row.Prenoms || '').trim();
          const matricule = (row.matricule || row.Matricule || '').trim();
          let cls = (row.classe || row.className || row.Classe || '').trim();

          // If assigning to specific class, override
          if (importMode === 'specific_class') {
            cls = effectiveTargetClass;
          } else if (!cls) {
            autoClassMissingCount++;
          }

          if (lastName || firstName || matricule) {
            validRows.push({
              id: crypto.randomUUID(),
              firstName,
              lastName,
              matricule: matricule || `MTR-${Math.floor(1000 + Math.random() * 9000)}`,
              className: cls || (importMode === 'specific_class' ? effectiveTargetClass : 'Non définie'),
              schoolYear: (row.annee_scolaire || row.schoolYear || row.annee || '2025-2026').trim(),
              birthDate: (row.date_naissance || row.birthDate || '').trim(),
              birthPlace: (row.lieu_naissance || row.birthPlace || '').trim(),
              examCenter: (row.centre_examen || row.examCenter || '').trim(),
              photoUrl: (row.photo_url || row.photoUrl || '').trim(),
              expirationDate: (row.date_expiration || row.expirationDate || '').trim(),
            });
          }
        });

        if (validRows.length === 0) {
          setParseError("Aucun élève valide n'a pu être extrait. Vérifiez que votre fichier contient bien les colonnes 'nom', 'prenom'.");
          setParsedStudents([]);
          return;
        }

        if (importMode === 'detect_from_csv' && autoClassMissingCount > 0) {
          setParseError(`${autoClassMissingCount} élève(s) n'ont pas de colonne classe renseignée dans le fichier.`);
        }

        setParsedStudents(validRows);
      },
      error: (err) => {
        setIsProcessingFile(false);
        setParseError(`Erreur de lecture du fichier CSV : ${err.message}`);
        setParsedStudents([]);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDownloadTemplate = () => {
    const templateClass = importMode === 'specific_class' && effectiveTargetClass ? effectiveTargetClass : '6ème A';
    const sample = [
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

    const csv = Papa.unparse(sample, {
      columns: ['nom','prenom','matricule','classe','annee_scolaire','date_naissance','lieu_naissance','centre_examen','photo_url','date_expiration'],
      delimiter: ';',
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `modele_eleves_${templateClass.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    if (parsedStudents.length === 0) return;

    if (importMode === 'specific_class' && !effectiveTargetClass) {
      alert("Veuillez sélectionner ou saisir une classe pour les élèves.");
      return;
    }

    // Check quota
    if (!isEffectivePro && (totalCurrentStudents + parsedStudents.length) > effectiveQuota) {
      alert(`Impossible d'importer ${parsedStudents.length} élèves : cela dépasserait votre quota gratuit de ${effectiveQuota} élèves (${totalCurrentStudents} déjà inscrits). Passez au Plan PRO illimité.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-apply target class in case it was modified after parsing
      const finalStudents = parsedStudents.map(s => ({
        ...s,
        className: importMode === 'specific_class' ? effectiveTargetClass : s.className
      }));

      await onImport(finalStudents, importMode === 'specific_class' ? effectiveTargetClass : undefined);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'enregistrement : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200/80 space-y-6 my-auto max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Importer des élèves par classe
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Importation directe depuis fichier Excel ou CSV avec affectation automatique
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          
          {/* Step 1: Destination Mode */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              1. Choisir le mode de classement par classe
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Attribuer à une classe spécifique */}
              <div 
                onClick={() => setImportMode('specific_class')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  importMode === 'specific_class'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input 
                    type="radio" 
                    checked={importMode === 'specific_class'} 
                    onChange={() => setImportMode('specific_class')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500" 
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Attribuer à une classe spécifique
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                      Recommandé si vous avez un fichier par classe (ex: <em>6ème A.csv</em>). Tous les élèves prendront cette classe.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option B: Détecter automatiquement depuis le fichier */}
              <div 
                onClick={() => setImportMode('detect_from_csv')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  importMode === 'detect_from_csv'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input 
                    type="radio" 
                    checked={importMode === 'detect_from_csv'} 
                    onChange={() => setImportMode('detect_from_csv')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500" 
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Détecter depuis le fichier CSV
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                      Chaque élève recevra la classe mentionnée dans la colonne <em>'classe'</em> de sa ligne.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Class Selector (Visible if specific_class) */}
            {importMode === 'specific_class' && (
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    Classe de destination pour ces élèves :
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomClass(!isCustomClass);
                      if (!isCustomClass) setCustomClassName('');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    {isCustomClass ? "← Choisir parmi les classes suggérées" : "+ Créer une classe sur-mesure"}
                  </button>
                </div>

                {!isCustomClass ? (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-white text-xs font-bold text-slate-900 rounded-xl px-3.5 py-2.5 border border-emerald-300 focus:border-emerald-600 outline-none shadow-xs cursor-pointer"
                  >
                    <option value="">Sélectionnez la classe cible...</option>
                    {combinedClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: 6ème Bilingue, Terminale CD, CP1 B..."
                      value={customClassName}
                      onChange={(e) => setCustomClassName(e.target.value)}
                      autoFocus
                      className="flex-1 bg-white text-xs font-bold text-slate-900 rounded-xl px-3.5 py-2.5 border border-emerald-300 focus:border-emerald-600 outline-none shadow-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: File Upload / Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                2. Déposer le fichier CSV des élèves
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-[11px] font-bold text-emerald-850 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 hover:bg-emerald-100 transition-colors shadow-2xs"
                title={effectiveTargetClass ? `Télécharger le modèle avec la classe ${effectiveTargetClass} pré-remplie` : 'Télécharger le modèle CSV'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Modèle CSV {effectiveTargetClass ? `(${effectiveTargetClass})` : ''}</span>
              </button>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragOver 
                  ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]' 
                  : fileName 
                    ? 'border-emerald-300 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {isProcessingFile ? (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-600">Lecture et analyse du fichier...</span>
                </div>
              ) : fileName ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 truncate max-w-xs">{fileName}</p>
                    <p className="text-[10px] text-slate-500">{fileSize} • Cliquez pour changer de fichier</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-850 rounded-full text-xs font-black ml-auto">
                    {parsedStudents.length} élèves
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 py-2">
                  <Upload className="w-7 h-7 mx-auto text-emerald-600" />
                  <p className="text-xs font-bold text-slate-800">
                    Glissez votre fichier ici ou <span className="text-emerald-700 underline">parcourez votre ordinateur</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Formats supportés : CSV (séparateur virgule ou point-virgule)</p>
                </div>
              )}
            </div>

            {parseError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-semibold animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Step 3: Live Preview Table (if students parsed) */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  3. Aperçu des élèves détectés ({parsedStudents.length})
                </label>
                <span className="text-[10px] font-bold text-slate-400">Affichage des 4 premiers</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3">Nom & Prénoms</th>
                      <th className="py-2.5 px-3">Matricule</th>
                      <th className="py-2.5 px-3">Classe attribuée</th>
                      <th className="py-2.5 px-3">Date naiss.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {parsedStudents.slice(0, 4).map((s, idx) => (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {s.lastName} {s.firstName}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          {s.matricule}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {importMode === 'specific_class' ? effectiveTargetClass || 'À choisir' : s.className}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {s.birthDate || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedStudents.length === 0 || (importMode === 'specific_class' && !effectiveTargetClass) || isSubmitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Importation en cours...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {parsedStudents.length > 0
                    ? `Confirmer l'import (${parsedStudents.length} élèves)`
                    : 'Importer les élèves'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

