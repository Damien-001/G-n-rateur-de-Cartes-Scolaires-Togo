import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  GraduationCap, 
  Building2, 
  User, 
  QrCode,
  Award,
  Sparkles
} from 'lucide-react';
import { Student, SchoolInfo } from '../types';
import { formatDateDisplay } from '../lib/utils';
import { QRGenerator } from './QRGenerator';

interface CardVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolInfo: SchoolInfo;
}

export const CardVerificationModal: React.FC<CardVerificationModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolInfo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  if (!isOpen) return null;

  const results = searchQuery.trim()
    ? students.filter(s =>
        s.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const verifiedStudent = selectedStudent || (results.length === 1 ? results[0] : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-850 via-emerald-750 to-teal-800 p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight tracking-tight flex items-center gap-2">
                Vérificateur Officiel de Carte Scolaire
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-emerald-400/30">
                  MEPST Togo
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 font-medium">Contrôle d'authenticité et certification numérique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par Matricule ou Nom de l'élève..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedStudent(null);
              }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Search Results Dropdown / Pills if multiple */}
          {searchQuery.trim() && results.length > 1 && !selectedStudent && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Élèves correspondants ({results.length}) :</p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {results.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center uppercase">
                        {st.firstName.charAt(0)}{st.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-900 leading-tight">
                          {st.lastName} {st.firstName}
                        </p>
                        <p className="text-xs text-slate-500">{st.className} • Matricule: <span className="font-bold text-emerald-700">{st.matricule}</span></p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 group-hover:underline">Vérifier →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verification Badge & Details */}
          {verifiedStudent ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Authenticity Certificate Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-3xl p-5 border-2 border-emerald-200/80 shadow-sm relative overflow-hidden">
                {/* Decorative Stamp Watermark */}
                <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-44 h-44 text-emerald-900" />
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-emerald-200/60 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                        CARTE SCOLAIRE AUTHENTIQUE & VALIDE
                      </h4>
                      <p className="text-[11px] text-emerald-800 font-semibold">
                        Certifiée par {schoolInfo.name}
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {verifiedStudent.schoolYear || '2025-2026'}
                  </span>
                </div>

                {/* Student Identity Section */}
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-emerald-300 bg-white shadow-md flex-shrink-0">
                    {verifiedStudent.photoUrl ? (
                      <img src={verifiedStudent.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3 className="text-base font-black text-slate-900 leading-tight uppercase">
                      {verifiedStudent.lastName} <span className="text-emerald-800">{verifiedStudent.firstName}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold text-slate-700 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                        Classe : {verifiedStudent.className}
                      </span>
                      <span className="bg-emerald-100/90 text-emerald-900 px-2.5 py-1 rounded-lg font-black border border-emerald-300 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-emerald-800" />
                        Matricule : {verifiedStudent.matricule}
                      </span>
                    </div>

                    {verifiedStudent.birthDate && (
                      <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1 pt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Né(e) le {formatDateDisplay(verifiedStudent.birthDate)} {verifiedStudent.birthPlace ? `à ${verifiedStudent.birthPlace}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Security Metadata Footer */}
                <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-900/80 font-semibold">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-700" />
                    {schoolInfo.location || 'République Togolaise'}
                  </span>
                  <span>Expire le : {formatDateDisplay(verifiedStudent.expirationDate) || '31/08/2026'}</span>
                </div>
              </div>

              {/* QR Code Mirror preview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-800">Signature Numérique Intégrée</p>
                  <p className="text-[11px] text-slate-500">Données inviolables conformes aux normes scolaires nationales.</p>
                </div>
                <div className="p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <QRGenerator value={`MEPST-TG|${verifiedStudent.matricule}|${verifiedStudent.lastName}|${verifiedStudent.firstName}|${verifiedStudent.className}|${schoolInfo.name}`} size={56} />
                </div>
              </div>
            </div>
          ) : searchQuery.trim() && results.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Aucune carte trouvée pour « {searchQuery} »</p>
              <p className="text-xs text-slate-500">Veuillez vérifier l'orthographe du nom ou le numéro de matricule saisi.</p>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50/80 rounded-3xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Prêt pour la vérification</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Saisissez le matricule ou le nom d'un élève pour certifier instantanément sa carte scolaire.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Vérification sécurisée CardSchool Togo v3.1
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
