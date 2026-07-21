import React, { useState } from 'react';
import { 
  Building2, 
  Smartphone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  Settings,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { SchoolInfo } from '../types';
import { Session } from '../lib/auth';

interface SchoolSettingsViewProps {
  session: Session;
  schoolInfo: SchoolInfo;
  studentsCount: number;
  onSaveSchoolInfo: (info: SchoolInfo) => Promise<void>;
  onBack: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  session,
  schoolInfo,
  studentsCount,
  onSaveSchoolInfo,
  onBack,
}) => {
  const [name, setName] = useState(schoolInfo.name || '');
  const [schoolType, setSchoolType] = useState(schoolInfo.schoolType || 'Lycée');
  const [location, setLocation] = useState(schoolInfo.location || '');
  const [phone, setPhone] = useState(schoolInfo.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Simulation parameters for SaaS
  const currentPlan = schoolInfo.subscriptionPlan || 'free';
  const maxFreeStudents = 15;
  const usagePercentage = Math.min(100, Math.round((studentsCount / maxFreeStudents) * 100));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const updatedInfo: SchoolInfo = {
        ...schoolInfo,
        name: name.trim(),
        schoolType: schoolType,
        location: location.trim(),
        phone: phone.trim(),
        // Keep subscription fields
        subscriptionPlan: currentPlan,
        subscriptionExpiresAt: schoolInfo.subscriptionExpiresAt,
      };
      await onSaveSchoolInfo(updatedInfo);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-16 font-sans">
      <div className="max-w-6xl mx-auto px-4 pt-8 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Settings className="w-6 h-6 text-emerald-600" />
                Paramètres de l'établissement
              </h1>
              <p className="text-sm text-gray-500 font-medium">Gérez le profil de votre école et votre abonnement SaaS.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: School Profile Settings */}
          <div className="lg:col-span-7 double-bezel-outer">
            <div className="double-bezel-inner p-6 sm:p-8 space-y-6 bg-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-4 border-b border-gray-100">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Profil de l'École
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nom de l'établissement</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Type de structure</label>
                    <select 
                      value={schoolType} 
                      onChange={e => setSchoolType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm bg-white cursor-pointer font-semibold"
                    >
                      <option value="Lycée">Lycée (Second cycle)</option>
                      <option value="Collège">Collège (Premier cycle)</option>
                      <option value="Complexe Scolaire">Complexe Scolaire (Primaire & Sec.)</option>
                      <option value="Primaire">Primaire / Maternelle</option>
                      <option value="Université / Institut">Université / Institut Sup.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ville / Localité</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)}
                      required
                      placeholder="Lomé, Togo"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Téléphone WhatsApp (Paiement/Alerte)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      required
                      placeholder="+228 90 12 34 56"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus-brand outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-gray-150 gap-4">
                  {saveStatus === 'success' && (
                    <span className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profil mis à jour !
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-xs text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-150">
                      Erreur lors de la sauvegarde.
                    </span>
                  )}
                  {saveStatus === 'idle' && <div />}

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary px-6 py-3 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Sauvegarder le profil'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side: SaaS Subscription & Limits */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Plan Info Card */}
            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-6 space-y-6 bg-white">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-4 border-b border-gray-100">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Abonnement SaaS
                </h2>

                {currentPlan === 'free' ? (
                  /* Free Trial State */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-100/50 uppercase tracking-wider">
                        Plan Découverte (Gratuit)
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Actif</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                        <span>Cartes scolaires générées</span>
                        <span className="text-emerald-800">{studentsCount} / {maxFreeStudents}</span>
                      </div>
                      
                      {/* Meter bar */}
                      <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 p-0.5">
                        <div 
                          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                        Le plan découverte est limité à {maxFreeStudents} élèves. Passez à la version annuelle pour générer des cartes en illimité sans filigrane.
                      </p>
                    </div>

                    {/* Pro Banner Offer */}
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 space-y-3">
                      <h3 className="text-sm font-extrabold text-emerald-900 flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-emerald-600" /> Plan Établissement Annuel
                      </h3>
                      <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
                        Générez des cartes en quantité illimitée pour tous les élèves de votre école, sans filigranes administratifs, pour seulement **30 000 F CFA / an**.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Pro Active State */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-black border border-emerald-100/50 uppercase tracking-wider">
                        Plan Établissement (Pro)
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Actif
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase">Utilisation</p>
                      <p className="text-2xl font-black text-emerald-800">{studentsCount} <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">élèves inscrits</span></p>
                      <p className="text-xs text-gray-400 font-semibold">Votre quota de cartes est illimité pour l'année scolaire.</p>
                    </div>

                    <div className="pt-2 text-xs font-semibold text-gray-500 border-t border-gray-100 flex justify-between">
                      <span>Prochain renouvellement :</span>
                      <span className="text-gray-900 font-bold">21 Juillet 2027</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Money Payment Info Card */}
            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-6 space-y-5 bg-white">
                <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Méthode de Paiement (Togo)
                </h2>

                <div className="space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                    Le paiement des abonnements s'effectue via Mobile Money. Envoyez le règlement annuel au numéro officiel ci-dessous et contactez-nous pour l'activation instantanée de votre école :
                  </p>

                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">T-Money (Togo)</p>
                        <p className="text-sm font-extrabold text-gray-900">+228 90 00 00 00</p>
                      </div>
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded">CardSchool SAS</span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Flooz / Moov Money</p>
                        <p className="text-sm font-extrabold text-gray-900">+228 95 00 00 00</p>
                      </div>
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded">CardSchool SAS</span>
                    </div>
                  </div>

                  <a 
                    href="https://wa.me/22890000000?text=Bonjour,%20je%20souhaite%20activer%20le%20plan%20pro%20pour%20mon%20ecole"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-100 cursor-pointer active:scale-95 transition-all"
                  >
                    <PhoneCall className="w-4 h-4" /> Envoyer la preuve de paiement WhatsApp
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
