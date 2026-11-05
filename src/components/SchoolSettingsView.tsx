import React, { useState, useEffect } from 'react';
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
  PhoneCall,
  Key,
  Mail,
  Phone,
  MessageCircle,
  MessageSquare,
  Copy,
  Info,
  Zap,
  Lock,
  ShieldCheck,
  CheckCheck,
  Loader2,
  X
} from 'lucide-react';
import { SchoolInfo, PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '../types';
import { Session } from '../lib/auth';
import { redeemLicenseKey, fetchPlatformSettings } from '../lib/db';

interface SchoolSettingsViewProps {
  session: Session;
  schoolInfo: SchoolInfo;
  studentsCount: number;
  onSaveSchoolInfo: (info: SchoolInfo) => Promise<void>;
  onBack: () => void;
  mode?: 'profile' | 'billing';
  onOpenChat?: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  session,
  schoolInfo,
  studentsCount,
  onSaveSchoolInfo,
  onBack,
  mode = 'profile',
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>(mode);
  const [name, setName] = useState(schoolInfo.name || '');
  const [schoolType, setSchoolType] = useState(schoolInfo.schoolType || 'Lycée');
  const [region, setRegion] = useState(schoolInfo.region || 'Maritime');
  const [location, setLocation] = useState(schoolInfo.location || '');
  const [phone, setPhone] = useState(schoolInfo.phone || '');
  const [logoUrl, setLogoUrl] = useState(schoolInfo.logoUrl || '');
  const [signatureUrl, setSignatureUrl] = useState(schoolInfo.signatureUrl || '');
  const [stampUrl, setStampUrl] = useState(schoolInfo.stampUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  useEffect(() => {
    const refreshSettings = () => {
      fetchPlatformSettings().then(setPlatformSettings);
    };

    refreshSettings();

    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setPlatformSettings(e.detail);
      } else {
        refreshSettings();
      }
    };

    const handleSubscriptionUpdate = (e: any) => {
      if (e?.detail?.plan) {
        const newPlan = e.detail.plan;
        const newExp = e.detail.expiresAt || schoolInfo.subscriptionExpiresAt;
        if (schoolInfo.subscriptionPlan !== newPlan || schoolInfo.subscriptionExpiresAt !== newExp) {
          onSaveSchoolInfo({
            ...schoolInfo,
            subscriptionPlan: newPlan,
            subscriptionExpiresAt: newExp
          });
        }
      }
    };

    window.addEventListener('cardschool_platform_settings_updated', handleSettingsUpdate);
    window.addEventListener('cardschool_subscription_updated', handleSubscriptionUpdate);
    window.addEventListener('cardschool_school_registered', handleSubscriptionUpdate);
    window.addEventListener('storage', refreshSettings);
    window.addEventListener('focus', refreshSettings);

    return () => {
      window.removeEventListener('cardschool_platform_settings_updated', handleSettingsUpdate);
      window.removeEventListener('cardschool_subscription_updated', handleSubscriptionUpdate);
      window.removeEventListener('cardschool_school_registered', handleSubscriptionUpdate);
      window.removeEventListener('storage', refreshSettings);
      window.removeEventListener('focus', refreshSettings);
    };
  }, [schoolInfo, onSaveSchoolInfo]);

  // Simulation parameters for SaaS
  const isPlanExpired = schoolInfo.subscriptionPlan === 'pro' && !!schoolInfo.subscriptionExpiresAt && new Date(schoolInfo.subscriptionExpiresAt).getTime() < Date.now();
  const isEffectivePro = schoolInfo.subscriptionPlan === 'pro' && !isPlanExpired;
  const currentPlan = schoolInfo.subscriptionPlan || 'free';
  const maxFreeStudents = schoolInfo.customQuota || 15;
  const usagePercentage = Math.min(100, Math.round((studentsCount / maxFreeStudents) * 100));

  // Copy Feedback State
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const handleCopyNumber = (num: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num.replace(/\s+/g, ''));
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // License Key Redemption State (Optionnel / Secours)
  const [licenseInputCode, setLicenseInputCode] = useState('');
  const [isRedeemingLicense, setIsRedeemingLicense] = useState(false);
  const [licenseFeedback, setLicenseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRedeemLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInputCode.trim()) return;

    setIsRedeemingLicense(true);
    setLicenseFeedback(null);

    try {
      const res = await redeemLicenseKey(licenseInputCode.trim(), session.userId, schoolInfo.name || name);
      if (res.success) {
        setLicenseFeedback({ type: 'success', message: res.message });
        setLicenseInputCode('');
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const expStr = nextYear.toISOString().split('T')[0];
        await onSaveSchoolInfo({
          ...schoolInfo,
          subscriptionPlan: 'pro',
          subscriptionExpiresAt: expStr
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setLicenseFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setLicenseFeedback({ 
        type: 'error', 
        message: err?.message || "Une erreur inattendue est survenue lors de l'activation." 
      });
    } finally {
      setIsRedeemingLicense(false);
    }
  };

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
        logoUrl: logoUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        stampUrl: stampUrl || undefined,
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
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              {mode === 'billing' ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    Mon Plan & Abonnement
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Suivez votre statut d'abonnement SaaS, votre volume de cartes et activez vos licences.</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    Paramètres de l'Établissement
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Mettez à jour les coordonnées officielles, logo, signature et cachet de l'école.</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onBack}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la gestion des élèves
          </button>
        </div>

        {/* Global Suspended Warning if applicable */}
        {schoolInfo.subscriptionPlan === 'suspended' && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-between text-red-800 animate-pulse-once">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Compte Actuellement Suspendu</h4>
                <p className="text-xs text-red-700 font-medium">
                  Votre accès à la création et l'impression de cartes est temporairement restreint. Envoyez votre preuve de paiement dans le chat pour réactivation immédiate.
                </p>
              </div>
            </div>
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow cursor-pointer transition-all shrink-0"
              >
                Ouvrir le Chat
              </button>
            )}
          </div>
        )}



        {/* Body Content */}
        {mode === 'billing' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Formule Actuelle, Activation & Assistance */}
            <div className="lg:col-span-6 space-y-6">
              {/* Plan Overview Card */}
              <div className="double-bezel-outer">
              <div className="double-bezel-inner p-6 sm:p-8 space-y-6 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Formule Actuelle</span>
                    <h2 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
                      {isEffectivePro 
                        ? 'Plan PRO Illimité' 
                        : isPlanExpired
                        ? 'Plan PRO Expiré'
                        : (schoolInfo.subscriptionPlan === 'suspended' ? 'Compte Suspendu' : 'Plan Découverte')}
                      {isEffectivePro && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">Actif</span>
                      )}
                      {isPlanExpired && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">À renouveler</span>
                      )}
                    </h2>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    isEffectivePro ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>Cartes Générées :</span>
                    <span className="text-gray-900">{studentsCount} / {isEffectivePro ? 'Illimité' : `${maxFreeStudents} max`}</span>
                  </div>

                  {!isEffectivePro && (
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercentage >= 90 ? 'bg-red-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  )}

                  {isEffectivePro ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 space-y-2">
                      <p className="text-xs text-emerald-900 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Abonnement annuel actif
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold leading-relaxed">
                        Votre école bénéficie de l'impression illimitée de cartes, des exports PDF HD, du support prioritaire et du QR-code officiel.
                        {schoolInfo.subscriptionExpiresAt && (
                          <span className="block mt-1 font-bold">Expire le : {new Date(schoolInfo.subscriptionExpiresAt).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  ) : isPlanExpired ? (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                      <p className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        Abonnement annuel arrivé à échéance
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                        Votre abonnement PRO pour la session précédente est arrivé à terme le {new Date(schoolInfo.subscriptionExpiresAt!).toLocaleDateString()}. Veuillez renouveler votre licence pour la nouvelle rentrée scolaire afin de réactiver l'impression illimitée.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                      <p className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        Limite du Plan Gratuit
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                        Le plan découverte est limité à {maxFreeStudents} cartes scolaires. Passez au Plan PRO pour imprimer toutes les cartes de l'établissement sans restriction.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* License Key Redemption Card */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-4 bg-white">
                  <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-600" />
                    Activer une Clé de Licence PRO
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Vous avez reçu une clé de licence PRO de la part de l'administration ? Saisissez-la ci-dessous pour débloquer immédiatement votre compte.
                  </p>

                  {licenseFeedback && (
                    <div className={`p-3.5 rounded-xl text-xs font-bold flex items-start gap-2.5 animate-fadeIn ${
                      licenseFeedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {licenseFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">{licenseFeedback.message}</div>
                    </div>
                  )}

                  <form 
                    onSubmit={handleRedeemLicense}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ex: TOGO-PRO-2026-X89A ou avec tirets"
                      value={licenseInputCode}
                      onChange={(e) => {
                        setLicenseInputCode(e.target.value);
                        if (licenseFeedback) setLicenseFeedback(null);
                      }}
                      disabled={isRedeemingLicense}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 uppercase font-mono font-bold text-xs outline-none focus-brand bg-white disabled:bg-gray-100"
                    />
                    <button
                      type="submit"
                      disabled={isRedeemingLicense || !licenseInputCode.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      {isRedeemingLicense ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Vérification...</span>
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-4 h-4" />
                          <span>Activer la Clé</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Support & Assistance Card */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-3 bg-white">
                  <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Assistance & Contacts Officiels
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    Besoin d'aide ou d'une facture proforma ? Contactez notre équipe d'assistance :
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                    <a 
                      href={`mailto:${platformSettings.supportEmail}`}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl flex items-center gap-2 text-slate-800 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{platformSettings.supportEmail}</span>
                    </a>
                    <a 
                      href={`tel:${platformSettings.supportPhone}`}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl flex items-center gap-2 text-slate-800 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{platformSettings.supportPhone}</span>
                    </a>
                  </div>
                  {platformSettings.supportNotice && (
                    <p className="text-[11px] text-slate-400 font-medium italic pt-1">
                      ℹ️ {platformSettings.supportNotice}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Money Payment Info Card */}
            <div className="lg:col-span-6 space-y-6">
              <div className="double-bezel-outer">
                <div className="double-bezel-inner p-6 space-y-5 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Paiement Direct Mobile Money (Togo)
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Activation PRO après vérification du reçu
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      T-Money & Flooz
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Price banner */}
                    <div className="p-4 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl text-white flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">Tarif Annuel PRO</span>
                        <h3 className="text-base font-black text-white mt-0.5">Licence Cartes Illimitées (365 Jours)</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-200">
                          {(platformSettings.annualPriceCFA || 30000).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-300/80 font-bold block">FCFA / an</span>
                      </div>
                    </div>

                    {/* Instructions banner if any */}
                    {platformSettings.paymentInstructions && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-950 font-medium leading-relaxed flex items-start gap-2">
                        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{platformSettings.paymentInstructions}</span>
                      </div>
                    )}

                    {/* Payment Numbers Cards */}
                    <div className="space-y-2.5">
                      {/* T-Money Card */}
                      <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-700 text-xs shrink-0">
                            TM
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">T-Money (Togocom)</span>
                              <span className="text-[9px] font-mono text-slate-400 font-bold">(*145#)</span>
                            </div>
                            <p className="text-sm font-black text-slate-900 tracking-wide">{platformSettings.tmoneyNumber || '+228 90 00 00 00'}</p>
                            <p className="text-[10px] text-emerald-800 font-bold">Titulaire : {platformSettings.tmoneyHolder || 'SukuPass Togo'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyNumber(platformSettings.tmoneyNumber || '+228 90 00 00 00')}
                          className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                          title="Copier le numéro T-Money"
                        >
                          {copiedNumber === (platformSettings.tmoneyNumber || '+228 90 00 00 00') ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Flooz Card */}
                      <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-700 text-xs shrink-0">
                            FL
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Moov Flooz (Moov Africa)</span>
                              <span className="text-[9px] font-mono text-slate-400 font-bold">(*155#)</span>
                            </div>
                            <p className="text-sm font-black text-slate-900 tracking-wide">{platformSettings.floozNumber || '+228 95 00 00 00'}</p>
                            <p className="text-[10px] text-emerald-800 font-bold">Titulaire : {platformSettings.floozHolder || 'SukuPass Togo'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyNumber(platformSettings.floozNumber || '+228 95 00 00 00')}
                          className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                          title="Copier le numéro Flooz"
                        >
                          {copiedNumber === (platformSettings.floozNumber || '+228 95 00 00 00') ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 3-Step Simple Guide */}
                    <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Procédure d'activation en 3 étapes :
                      </p>
                      <ol className="text-xs text-slate-600 space-y-1.5 font-medium pl-1">
                        <li className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Transférez les <strong>{(platformSettings.annualPriceCFA || 30000).toLocaleString()} FCFA</strong> vers le numéro T-Money ou Flooz ci-dessus.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Faites une capture d'écran du SMS de confirmation de transfert reçu sur votre téléphone.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Envoyez la capture dans le <strong>Chat d'assistance</strong> ci-dessous. Dès réception, l'administrateur valide votre compte immédiatement.</span>
                        </li>
                      </ol>
                    </div>

                    {/* Action Buttons: Chat & WhatsApp */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      {onOpenChat && (
                        <button
                          type="button"
                          onClick={onOpenChat}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Ouvrir le Chat & Envoyer le Reçu</span>
                        </button>
                      )}
                      {platformSettings.whatsappNumber && (
                        <a 
                          href={`https://wa.me/${platformSettings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Bonjour,%20je%20viens%20d'effectuer%20le%20paiement%20PRO%20pour%20l'%C3%A9tablissement%20${encodeURIComponent(schoolInfo.name || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                        >
                          <PhoneCall className="w-4 h-4 text-emerald-400" /> WhatsApp Direct
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full double-bezel-outer">
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

                {/* Logo, Signature & Cachet uploads */}
                <div className="pt-6 border-t border-gray-100 space-y-5">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Documents officiels (Cartes)</h3>
                  
                  {/* Logo de l'école */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Logo de l'école</label>
                    <div className="flex items-center gap-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                      <div className="relative w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {logoUrl ? (
                          <>
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => setLogoUrl('')}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                              title="Supprimer le logo"
                            >
                              <span style={{ fontSize: 9, lineHeight: 1 }}>✕</span>
                            </button>
                          </>
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setLogoUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Signature & Cachet side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Signature */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Signature</label>
                      <div className="flex flex-col gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="relative w-full h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                          {signatureUrl ? (
                            <>
                              <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setSignatureUrl('')}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                                title="Supprimer la signature"
                              >
                                <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold italic">Aucune signature</span>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setSignatureUrl(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Cachet */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cachet</label>
                      <div className="flex flex-col gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="relative w-10 h-10 mx-auto bg-white border border-slate-200 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                          {stampUrl ? (
                            <>
                              <img src={stampUrl} alt="Cachet" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setStampUrl('')}
                                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                                title="Supprimer le cachet"
                              >
                                <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                              </button>
                            </>
                          ) : (
                            <div className="w-3.5 h-3.5 border border-slate-200 rounded-full border-dashed" />
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setStampUrl(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200/80 gap-4">
                  {saveStatus === 'success' && (
                    <span className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profil mis à jour !
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-xs text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
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
        )}

      </div>

    </div>
  );
};
