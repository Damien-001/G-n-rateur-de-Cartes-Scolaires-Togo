import React, { useState } from 'react';
import { SchoolInfo, CardColors, COLOR_PRESETS, DEFAULT_CARD_COLORS } from '../types';
import { X, Upload, Trash2, Settings, Palette, FileImage, PenTool, Stamp } from 'lucide-react';

interface SchoolSettingsProps {
  schoolInfo: SchoolInfo;
  onUpdate: (schoolInfo: SchoolInfo) => void;
  onClose: () => void;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({ schoolInfo, onUpdate, onClose }) => {
  const [formData, setFormData] = useState<SchoolInfo>({
    ...schoolInfo,
    cardColors: { ...DEFAULT_CARD_COLORS, ...schoolInfo.cardColors }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  const handleImageUpload = (field: 'logoUrl' | 'signatureUrl' | 'stampUrl', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (field: 'logoUrl' | 'signatureUrl' | 'stampUrl') => {
    setFormData({ ...formData, [field]: undefined });
  };

  const applyColorPreset = (colors: CardColors) => {
    setFormData({ ...formData, cardColors: colors });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-emerald-700" />
            <h2 className="text-xl font-bold text-emerald-900">Paramètres de l'École</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-emerald-700" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Informations générales
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l'école</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: ÉCOLE NATIONALE DU TOGO"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Images et éléments visuels
              </h3>

              {/* Logo */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Logo de l'école</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.logoUrl ? (
                      <>
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => removeImage('logoUrl')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          title="Supprimer le logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('logoUrl', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format recommandé: PNG ou SVG, fond transparent</p>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Signature du Proviseur
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-16 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.signatureUrl ? (
                      <>
                        <img src={formData.signatureUrl} alt="Signature" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => removeImage('signatureUrl')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          title="Supprimer la signature"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <PenTool className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('signatureUrl', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format recommandé: PNG avec fond transparent</p>
                  </div>
                </div>
              </div>

              {/* Cachet */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Stamp className="w-4 h-4" />
                  Cachet de l'école
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-white rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.stampUrl ? (
                      <>
                        <img src={formData.stampUrl} alt="Cachet" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => removeImage('stampUrl')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          title="Supprimer le cachet"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <Stamp className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('stampUrl', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format recommandé: PNG circulaire avec fond transparent</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Couleurs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Couleurs de la carte
              </h3>

              {/* Presets */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Thèmes prédéfinis</label>
                <div className="grid grid-cols-4 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyColorPreset(preset.colors)}
                      className="p-3 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-colors group"
                      title={`Appliquer le thème ${preset.name}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: preset.colors.headerBg }}
                        />
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: preset.colors.footerBar }}
                        />
                      </div>
                      <div className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleurs personnalisées */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Couleur de l'en-tête</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.cardColors?.headerBg || DEFAULT_CARD_COLORS.headerBg}
                      onChange={(e) => setFormData({
                        ...formData,
                        cardColors: { ...formData.cardColors, headerBg: e.target.value }
                      })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.cardColors?.headerBg || DEFAULT_CARD_COLORS.headerBg}
                      onChange={(e) => setFormData({
                        ...formData,
                        cardColors: { ...formData.cardColors, headerBg: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Barre du bas</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.cardColors?.footerBar || DEFAULT_CARD_COLORS.footerBar}
                      onChange={(e) => setFormData({
                        ...formData,
                        cardColors: { ...formData.cardColors, footerBar: e.target.value }
                      })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.cardColors?.footerBar || DEFAULT_CARD_COLORS.footerBar}
                      onChange={(e) => setFormData({
                        ...formData,
                        cardColors: { ...formData.cardColors, footerBar: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};