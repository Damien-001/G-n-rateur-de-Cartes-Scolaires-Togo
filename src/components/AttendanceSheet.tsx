import React from 'react';
import { SchoolInfo, Student } from '../types';
import { Printer, ArrowLeft, Users, CheckCircle, FileText } from 'lucide-react';

interface AttendanceSheetProps {
  schoolInfo: SchoolInfo;
  students: Student[];
  selectedClass?: string;
  onBack: () => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  schoolInfo,
  students,
  selectedClass,
  onBack,
}) => {
  const filteredStudents = selectedClass && selectedClass !== 'all'
    ? students.filter(s => s.className === selectedClass)
    : students;

  // Trier par ordre alphabétique de nom puis prénom
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans">
      {/* Top action bar (non imprimée) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>
            Effectif : <strong>{sortedStudents.length} élève{sortedStudents.length > 1 ? 's' : ''}</strong>
            {selectedClass && selectedClass !== 'all' ? ` (Classe de ${selectedClass})` : ' (Toutes classes)'}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer la Fiche d'Émargement</span>
        </button>
      </div>

      {/* Feuille A4 d'émargement officielle */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl border border-slate-200 rounded-2xl print:m-0 print:p-6 print:shadow-none print:border-none print:rounded-none">
        
        {/* En-tête officiel Togo */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="text-left space-y-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              {schoolInfo.name || 'ÉTABLISSEMENT DU TOGO'}
            </h2>
            <p className="text-[10px] font-bold text-slate-600">
              {schoolInfo.schoolType || 'Enseignement Secondaire'} • {schoolInfo.location || 'Togo'}
            </p>
            {schoolInfo.phone && (
              <p className="text-[9px] text-slate-500 font-mono">Tél: {schoolInfo.phone}</p>
            )}
          </div>

          <div className="text-center">
            {schoolInfo.logoUrl ? (
              <img src={schoolInfo.logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto" />
            ) : (
              <div className="w-12 h-12 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-black text-xs mx-auto">
                TG
              </div>
            )}
          </div>

          <div className="text-right space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">RÉPUBLIQUE TOGOLAISE</p>
            <p className="text-[9px] font-bold text-slate-600">Travail - Liberté - Patrie</p>
            <p className="text-[9px] text-slate-500 font-bold pt-1">
              Année Scolaire : {sortedStudents[0]?.schoolYear || '2025-2026'}
            </p>
          </div>
        </div>

        {/* Titre du document */}
        <div className="text-center mb-6">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900">
            Fiche d'Émargement & de Retrait des Cartes Scolaires
          </h1>
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 mt-1 border border-slate-200">
            {selectedClass && selectedClass !== 'all' ? `Classe : ${selectedClass}` : 'Registre Général'} • Date d'édition : {currentDate}
          </div>
        </div>

        {/* Tableau nominatif */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-black uppercase text-[10px]">
                <th className="border border-slate-300 px-2.5 py-2 w-10 text-center">N°</th>
                <th className="border border-slate-300 px-3 py-2 w-28">Matricule</th>
                <th className="border border-slate-300 px-3 py-2">Nom & Prénoms</th>
                <th className="border border-slate-300 px-2 py-2 w-16 text-center">Sexe</th>
                <th className="border border-slate-300 px-3 py-2 w-24">Classe</th>
                <th className="border border-slate-300 px-3 py-2 w-28">Né(e) le</th>
                <th className="border border-slate-300 px-4 py-2 w-36 text-center">Date & Signature du Retrait</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 px-4 py-8 text-center text-slate-400 font-bold">
                    Aucun élève trouvé dans cette classe.
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/50">
                    <td className="border border-slate-300 px-2.5 py-2 text-center font-bold text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-mono font-bold text-slate-800">
                      {student.matricule || '-'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900 uppercase">
                      {student.lastName} <span className="font-semibold capitalize text-slate-700">{student.firstName}</span>
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700">
                      {student.gender || '-'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-800">
                      {student.className}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-slate-600 font-medium">
                      {student.birthDate || '-'}
                    </td>
                    <td className="border border-slate-300 px-4 py-2 text-center">
                      <div className="h-7 border-b border-dashed border-slate-300" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de page avec signatures administratives */}
        <div className="mt-10 pt-4 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-12">
            <p className="font-black uppercase tracking-wider text-slate-800">
              Le Surveillant Général / Censeur
            </p>
            <div className="h-10 border-b border-dashed border-slate-300 w-44 mx-auto" />
          </div>

          <div className="space-y-12">
            <p className="font-black uppercase tracking-wider text-slate-800">
              Le Chef d'Établissement (Proviseur / Directeur)
            </p>
            {schoolInfo.signatureUrl || schoolInfo.stampUrl ? (
              <div className="flex items-center justify-center gap-2 h-10">
                {schoolInfo.stampUrl && (
                  <img src={schoolInfo.stampUrl} alt="Cachet" className="h-12 w-12 object-contain opacity-80" />
                )}
                {schoolInfo.signatureUrl && (
                  <img src={schoolInfo.signatureUrl} alt="Signature" className="h-10 w-24 object-contain" />
                )}
              </div>
            ) : (
              <div className="h-10 border-b border-dashed border-slate-300 w-44 mx-auto" />
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-[9px] text-slate-400 font-semibold border-t border-slate-200 pt-3">
          Document généré via la plateforme SukuPass Togo • Système officiel de sécurisation et d'identification scolaire
        </div>
      </div>
    </div>
  );
};
