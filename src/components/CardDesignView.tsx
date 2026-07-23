import React, { useState } from 'react';
import { 
  Palette, 
  Building2, 
  Settings, 
  CheckCircle2, 
  Sparkles,
  School as SchoolIcon,
  Edit2,
  Sliders,
  FileImage,
  Upload,
  PhoneCall
} from 'lucide-react';
import { SchoolInfo, CardColors, COLOR_PRESETS, DEFAULT_CARD_COLORS, Student } from '../types';
import { IDCard } from './IDCard';
import { IDCardBack } from './IDCardBack';

interface CardDesignViewProps {
  schoolInfo: SchoolInfo;
  onSaveSchoolInfo: (info: SchoolInfo) => Promise<void>;
  studentsCount: number;
}

const SAMPLE_STUDENT: Student = {
  id: 'sample-id',
  firstName: 'Abla',
  lastName: 'KOFFI',
  matricule: 'TG-2026-007',
  className: 'Seconde S',
  schoolYear: '2025-2026',
  birthDate: '2009-04-12',
  birthPlace: 'Lomé',
  photoUrl: '', // empty to trigger sample profile icon
};

export const CardDesignView: React.FC<CardDesignViewProps> = ({
  schoolInfo,
  onSaveSchoolInfo,
  studentsCount
}) => {
  // Local copies of the style properties
  const [cardColors, setCardColors] = useState<CardColors>({
    ...DEFAULT_CARD_COLORS,
    ...schoolInfo.cardColors
  });
  
  const [logoUrl, setLogoUrl] = useState(schoolInfo.logoUrl || '');
  const [signatureUrl, setSignatureUrl] = useState(schoolInfo.signatureUrl || '');
  const [stampUrl, setStampUrl] = useState(schoolInfo.stampUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // SVG safety backgrounds
  const bgTemplate = cardColors.bgTemplate || 'minimal';
  const bgOpacity = cardColors.bgOpacity ?? 6;

  // Custom Color updater helper
  const updateColor = (key: keyof CardColors, val: string) => {
    setCardColors(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSignatureUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStampUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDesign = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const updatedInfo: SchoolInfo = {
        ...schoolInfo,
        logoUrl: logoUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        stampUrl: stampUrl || undefined,
        cardColors: cardColors
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

  // Construct a preview schoolInfo using local unsaved states
  const previewSchoolInfo: SchoolInfo = {
    ...schoolInfo,
    logoUrl: logoUrl || undefined,
    signatureUrl: signatureUrl || undefined,
    stampUrl: stampUrl || undefined,
    cardColors: cardColors
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Palette className="w-6 h-6 text-emerald-600 animate-pulse" />
            Personnalisation & Design de la Carte
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Configurez les visuels de votre établissement et prévisualisez le rendu en temps réel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Controls Customizer */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Logo & Signature & Stamp uploads card */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 space-y-5 bg-white">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileImage className="w-4 h-4 text-emerald-600" />
                Fichiers & Empreintes Officiels
              </h2>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo de l'école</label>
                <div className="flex items-center gap-3 mt-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                  <div className="relative w-12 h-12 bg-white border border-gray-250 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="absolute top-0 right-0 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                          title="Supprimer le logo"
                        >
                          <span style={{ fontSize: 9, lineHeight: 1 }}>✕</span>
                        </button>
                      </>
                    ) : (
                      <SchoolIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Signature & Cachet split */}
              <div className="grid grid-cols-2 gap-4">
                {/* Signature */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Signature</label>
                  <div className="flex flex-col gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                    <div className="relative w-full h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                      {signatureUrl ? (
                        <>
                          <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setSignatureUrl('')}
                            className="absolute top-0 right-0 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                            title="Supprimer la signature"
                          >
                            <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                          </button>
                        </>
                      ) : (
                        <Edit2 className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleSignatureChange}
                      className="block w-full text-[10px] text-gray-500 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Stamp */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cachet</label>
                  <div className="flex flex-col gap-2 bg-gray-55 p-2.5 rounded-xl border border-gray-150">
                    <div className="relative w-9 h-9 mx-auto bg-white border border-gray-200 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                      {stampUrl ? (
                        <>
                          <img src={stampUrl} alt="Cachet" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setStampUrl('')}
                            className="absolute top-0 right-0 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer"
                            title="Supprimer le cachet"
                          >
                            <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                          </button>
                        </>
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded-full border-dashed" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleStampChange}
                      className="block w-full text-[10px] text-gray-500 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Palette de couleurs card */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 space-y-5 bg-white">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                Palette de Couleurs
              </h2>

              {/* Color Presets */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Thèmes Prédéfinis</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      title={preset.name}
                      onClick={() => setCardColors(preset.colors)}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div
                        className="w-full h-8 rounded-lg border-2 transition-all duration-200 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${preset.colors.headerBg} 60%, ${preset.colors.footerBar} 100%)`,
                          borderColor: cardColors.headerBg === preset.colors.headerBg ? preset.colors.headerBg : 'transparent',
                          boxShadow: cardColors.headerBg === preset.colors.headerBg ? `0 0 0 2px ${preset.colors.headerBg}40` : 'none',
                        }}
                      />
                      <span className="text-[10px] text-gray-400 font-bold tracking-tight">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Ajustement Précis</p>
                {[
                  { key: 'headerBg' as keyof CardColors, label: 'Bandeau Supérieur (Fond)' },
                  { key: 'headerText' as keyof CardColors, label: 'Texte du Bandeau Sup.' },
                  { key: 'footerBar' as keyof CardColors, label: 'Barre du Bas (Fond)' },
                  { key: 'matriculeText' as keyof CardColors, label: 'Couleur du Matricule' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-650 font-bold">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono font-semibold">{cardColors[key]}</span>
                      <input 
                        type="color" 
                        value={cardColors[key] || '#ffffff'}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sécurité et Motif de fond card */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 space-y-5 bg-white">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Arrière-Plan Sécurisé & Filigranes
              </h2>

              {/* Template selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motif Anti-Contrefaçon</label>
                <select
                  value={bgTemplate}
                  onChange={(e) => setCardColors(prev => ({ ...prev, bgTemplate: e.target.value as any }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-white outline-none cursor-pointer"
                >
                  <option value="minimal">Minimaliste (Discret)</option>
                  <option value="guilloche">Motif Guilloché (Médaille de sécurité)</option>
                  <option value="flag">Drapeau Togolais (Lignes dynamiques)</option>
                  <option value="geometric">Lignes Géométriques d'identification</option>
                </select>
              </div>

              {/* Opacity slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase mb-1">
                  <span>Opacité du motif</span>
                  <span className="text-emerald-800">{bgOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="18" 
                  value={bgOpacity}
                  onChange={(e) => setCardColors(prev => ({ ...prev, bgOpacity: parseInt(e.target.value) }))}
                  className="w-full accent-emerald-600 h-2 bg-gray-150 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Card Live Previews */}
        <div className="lg:col-span-7 space-y-8 flex flex-col items-center">
          
          {/* Real-time ID Cards Mockup Frame */}
          <div className="w-full bg-gray-55 rounded-3xl border border-gray-200/60 p-8 flex flex-col items-center gap-8 shadow-inner">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-spin-slow" />
              Prévisualisation en Temps Réel (Recto/Verso)
            </h2>

            {/* Recto / Verso stacked frame */}
            <div className="flex flex-col gap-6 items-center justify-center scale-95 sm:scale-100 transition-all duration-300">
              {/* Front side */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recto (Face)</span>
                <div className="shadow-2xl shadow-gray-950/10 rounded-2xl overflow-hidden bg-white hover:scale-[1.02] transition-transform duration-200">
                  <IDCard student={SAMPLE_STUDENT} schoolInfo={previewSchoolInfo} />
                </div>
              </div>

              {/* Back side */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verso (Dos)</span>
                <div className="shadow-2xl shadow-gray-950/10 rounded-2xl overflow-hidden bg-white hover:scale-[1.02] transition-transform duration-200">
                  <IDCardBack student={SAMPLE_STUDENT} schoolInfo={previewSchoolInfo} />
                </div>
              </div>
            </div>
          </div>

          {/* Validation Box & Save Trigger */}
          <div className="w-full max-w-xl double-bezel-outer">
            <div className="double-bezel-inner p-6 bg-white space-y-4 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-bold text-gray-800">Le design de la carte vous convient-il ?</h3>
              <p className="text-xs text-gray-500 font-semibold max-w-sm">
                En validant ce design, cette palette de couleurs, logos, signatures et cachets officiels seront appliqués à l'ensemble des cartes d'élèves générées et imprimées.
              </p>

              <div className="pt-2 w-full flex items-center justify-center gap-4">
                {saveStatus === 'success' && (
                  <span className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> Gabarit Validé & Enregistré !
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-xs text-red-750 font-bold bg-red-50 px-3 py-2 rounded-xl border border-red-150">
                    Erreur lors de la sauvegarde.
                  </span>
                )}
                
                {saveStatus === 'idle' && (
                  <button
                    onClick={handleSaveDesign}
                    disabled={isSaving}
                    className="w-full max-w-xs py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSaving ? 'Validation...' : 'Valider & Enregistrer le Design'}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
