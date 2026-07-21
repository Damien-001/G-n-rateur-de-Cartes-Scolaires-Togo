import React from 'react';
import { 
  Settings, 
  School as SchoolIcon, 
  Edit2, 
  Download, 
  Palette, 
  CheckCircle2 
} from 'lucide-react';
import { Student, SchoolInfo, CardColors, COLOR_PRESETS, DEFAULT_CARD_COLORS } from '../types';
import { ImportExport } from './ImportExport';

interface SchoolConfigSidebarProps {
  schoolInfo: SchoolInfo;
  setSchoolInfo: (info: SchoolInfo) => void;
  setIsSchoolSettingsOpen: (open: boolean) => void;
  students: Student[];
  onImport: (newStudents: Student[]) => void;
}

export const SchoolConfigSidebar: React.FC<SchoolConfigSidebarProps> = ({
  schoolInfo,
  setSchoolInfo,
  setIsSchoolSettingsOpen,
  students,
  onImport,
}) => {
  const currentColors = { ...DEFAULT_CARD_COLORS, ...schoolInfo.cardColors };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolInfo({ ...schoolInfo, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolInfo({ ...schoolInfo, signatureUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolInfo({ ...schoolInfo, stampUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* School settings container */}
      <div className="double-bezel-outer">
        <section className="double-bezel-inner p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900">Configuration École</h2>
            </div>
            <button
              onClick={() => setIsSchoolSettingsOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-850 hover:underline transition-colors cursor-pointer"
            >
              Paramètres avancés
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom de l'établissement</label>
              <input 
                type="text" 
                value={schoolInfo.name}
                onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus-brand outline-none text-sm transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo de l'école</label>
              <div className="flex items-center gap-3 mt-1">
                <div className="relative w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {schoolInfo.logoUrl ? (
                    <>
                      <img src={schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setSchoolInfo({ ...schoolInfo, logoUrl: undefined })}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors"
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
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:brand-50 file:brand-text hover:file:bg-brand-50 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Signature</label>
                <div className="flex flex-col gap-2">
                  <div className="relative w-full h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {schoolInfo.signatureUrl ? (
                      <>
                        <img src={schoolInfo.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setSchoolInfo({ ...schoolInfo, signatureUrl: undefined })}
                          className="absolute top-0 right-0 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          title="Supprimer la signature"
                        >
                          <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                        </button>
                      </>
                    ) : (
                      <Edit2 className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleSignatureChange}
                    className="block w-full text-xs text-gray-500 file:mr-1 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:brand-50 file:brand-text hover:file:bg-brand-50 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cachet</label>
                <div className="flex flex-col gap-2">
                  <div className="relative w-8 h-8 mx-auto bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {schoolInfo.stampUrl ? (
                      <>
                        <img src={schoolInfo.stampUrl} alt="Cachet" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setSchoolInfo({ ...schoolInfo, stampUrl: undefined })}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          title="Supprimer le cachet"
                        >
                          <span style={{ fontSize: 7, lineHeight: 1 }}>✕</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded-full" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleStampChange}
                    className="block w-full text-xs text-gray-500 file:mr-1 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:brand-50 file:brand-text hover:file:bg-brand-50 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Colors custom container */}
      <div className="double-bezel-outer">
        <section className="double-bezel-inner p-6">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Couleurs de la carte</h2>
          </div>

          {/* Color presets */}
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Thèmes prédéfinis</p>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  title={preset.name}
                  onClick={() => setSchoolInfo({ ...schoolInfo, cardColors: preset.colors })}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div
                    className="w-full h-8 rounded-lg border-2 transition-all duration-200 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.headerBg} 60%, ${preset.colors.footerBar} 100%)`,
                      borderColor: schoolInfo.cardColors?.headerBg === preset.colors.headerBg
                        ? preset.colors.headerBg
                        : 'transparent',
                      boxShadow: schoolInfo.cardColors?.headerBg === preset.colors.headerBg
                        ? `0 0 0 2px ${preset.colors.headerBg}40`
                        : 'none',
                    }}
                  />
                  <span className="text-[10px] text-gray-500 font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed custom pickers */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase">Personnaliser</p>
            {[
              { key: 'headerBg' as keyof CardColors, label: 'Fond du header' },
              { key: 'headerText' as keyof CardColors, label: 'Texte du header' },
              { key: 'footerBar' as keyof CardColors, label: 'Barre du bas' },
              { key: 'matriculeText' as keyof CardColors, label: 'Couleur matricule' },
            ].map(({ key, label }) => {
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{currentColors[key]}</span>
                    <label className="cursor-pointer">
                      <div
                        className="w-7 h-7 rounded-md border-2 border-gray-200 overflow-hidden shadow-sm hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: currentColors[key] }}
                      />
                      <input
                        type="color"
                        value={currentColors[key]}
                        onChange={(e) => setSchoolInfo({
                          ...schoolInfo,
                          cardColors: { ...currentColors, [key]: e.target.value }
                        })}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              );
            })}

            {/* Background Security Template Selector */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motif de fond (Sécurité)</label>
                <select
                  value={currentColors.bgTemplate || 'guilloche'}
                  onChange={(e) => setSchoolInfo({
                    ...schoolInfo,
                    cardColors: { ...currentColors, bgTemplate: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-xs font-semibold bg-white focus-brand transition-all cursor-pointer"
                >
                  <option value="guilloche">Motif Guilloché (Ondes)</option>
                  <option value="flag">Dégradé Couleurs Togo</option>
                  <option value="geometric">Géométrique Institutionnel</option>
                  <option value="minimal">Minimaliste (Blanc uni)</option>
                </select>
              </div>

              {currentColors.bgTemplate !== 'minimal' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Opacité du motif</label>
                    <span className="text-xs text-emerald-800 font-extrabold">{currentColors.bgOpacity !== undefined ? currentColors.bgOpacity : 4}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="18"
                    value={currentColors.bgOpacity !== undefined ? currentColors.bgOpacity : 4}
                    onChange={(e) => setSchoolInfo({
                      ...schoolInfo,
                      cardColors: { ...currentColors, bgOpacity: parseInt(e.target.value) }
                    })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* CSV Import/Export tool box */}
      <div className="double-bezel-outer">
        <section className="double-bezel-inner p-6">
          <div className="flex items-center gap-2 mb-6">
            <Download className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Import / Export</h2>
          </div>
          <ImportExport onImport={onImport} students={students} />
        </section>
      </div>

      {/* Printing guide */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-[1.5rem] p-6 text-white shadow-lg border border-emerald-700/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />
        <h3 className="font-bold text-base tracking-tight mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Guide d'impression
        </h3>
        <ul className="text-xs space-y-2.5 opacity-90 font-medium">
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Format A4 Portrait
          </li>
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Marges : "Aucune" ou "Par défaut"
          </li>
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Échelle : 100%
          </li>
          <li className="flex gap-2.5 items-center">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            Activer "Graphiques d'arrière-plan"
          </li>
        </ul>
      </div>
    </div>
  );
};
