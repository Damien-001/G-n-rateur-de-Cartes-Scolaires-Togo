import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  Scale,
  X,
  CheckCircle2,
  Building2,
  Database,
  EyeOff,
  UserCheck,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export type LegalTab = 'privacy' | 'cgu' | 'data_protection' | 'legal';

interface LegalPrivacyModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalPrivacyModal: React.FC<LegalPrivacyModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const tabs: { id: LegalTab; label: string; shortLabel: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'privacy', label: 'Politique de Confidentialité', shortLabel: 'Confidentialité', icon: Lock },
    { id: 'cgu', label: "Conditions d'Utilisation (CGU)", shortLabel: 'CGU & Essai 14j', icon: FileText },
    { id: 'data_protection', label: 'Protection des Données (Togo)', shortLabel: 'Loi 2019-014', icon: ShieldCheck },
    { id: 'legal', label: 'Mentions Légales & Sécurité', shortLabel: 'Mentions Légales', icon: Scale },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  SukuPass Togo • Charte Officielle
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Centre Légal, Confidentialité & Protection des Données Scolaires
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed flex-1">
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-emerald-950 text-sm">
                    Engagement de Confidentialité Absolue des Établissements Scolaires
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Dernière mise à jour : Novembre 2026 • Applicable à tous les établissements d'enseignement du Togo (Primaire, Collège, Lycée, Complexe Scolaire et Enseignement Supérieur).
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">1</span>
                  Données collectées sur la plateforme
                </h4>
                <p>
                  Dans le cadre strict de la génération, de la gestion et de la vérification des cartes d'identité scolaires, <strong>SukuPass Togo</strong> ne collecte que les informations strictement nécessaires :
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    "Identité de l'établissement (Nom officiel, type, région, localité, logo, cachet et signature du chef d'établissement)",
                    "Coordonnées du responsable de compte (Nom complet, adresse email professionnelle, numéro de téléphone / WhatsApp)",
                    "Données nominatives des élèves (Nom, prénoms, numéro matricule, classe, date et lieu de naissance, centre d'examen)",
                    "Photographie d'identité scolaire de l'élève (prise via webcam ou importée par l'établissement)"
                  ].map((item, i) => (
                    <li key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2 text-xs font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">2</span>
                  Utilisation exclusive et interdiction de revente
                </h4>
                <p>
                  Les données des élèves et des écoles appartiennent <strong>exclusivement à l'établissement scolaire</strong> qui les enregistre. SukuPass Togo s'engage formellement à :
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 pl-2">
                  <li>Ne jamais vendre, louer, céder ou partager les listes d'élèves ou leurs photographies à des tiers.</li>
                  <li>N'utiliser ces informations que pour générer les planches d'impression PDF A4 et permettre la vérification d'authenticité par QR Code.</li>
                  <li>Isoler hermétiquement chaque établissement : aucune école ne peut voir ou rechercher les élèves d'un autre établissement.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">3</span>
                  Fonctionnement Hors-Ligne (PWA) & Synchronisation Cloud
                </h4>
                <p>
                  Afin de garantir la continuité du travail des secrétariats scolaires même en cas de coupure d'électricité ou d'internet, SukuPass utilise un stockage local sécurisé sur l'appareil de l'établissement, synchronisé automatiquement via connexion chiffrée HTTPS/TLS avec notre base de données cloud dès le rétablissement de la connexion.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">4</span>
                  Conservation et suppression des données
                </h4>
                <p>
                  Le chef d'établissement peut à tout moment modifier, exporter en CSV ou supprimer individuellement ou en masse les fiches élèves depuis son espace. En cas de clôture de compte, l'intégralité des données élèves, photos et archives associées est définitivement purgée de nos serveurs.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'cgu' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <FileText className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-amber-950 text-sm">
                    Conditions Générales d'Utilisation (CGU) & Modalités d'Abonnement
                  </h3>
                  <p className="text-xs text-amber-800 mt-1">
                    Règles d'utilisation du service SaaS SukuPass Togo pour l'édition officielle de cartes scolaires.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">1. Objet du Service</h4>
                <p>
                  SukuPass Togo fournit aux établissements scolaires une plateforme clé en main permettant de concevoir, gérer et imprimer des cartes d'identité scolaires normalisées (format ISO CR80 85×54mm sur planches A4 Recto/Verso) dotées d'un QR Code et d'un code-barres de contrôle.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">2. Période d'Essai Gratuit de 14 Jours (15 Élèves max)</h4>
                <p>
                  Tout nouvel établissement inscrit bénéficie automatiquement d'un <strong>Essai Gratuit de 14 jours calendaires</strong> à compter de la création de son compte, dans la limite de <strong>15 élèves maximum</strong>.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 pl-2">
                  <li>Pendant ces 14 jours, l'école peut tester la personnalisation complète des couleurs, du logo, du cachet et l'export PDF A4 jusqu'à 15 cartes.</li>
                  <li>Au terme des 14 jours (ou dès que le seuil de 15 élèves est atteint), l'ajout de nouveaux élèves et l'export PDF sont mis en pause jusqu'à l'activation du <strong>Plan PRO Annuel</strong>.</li>
                  <li>Aucune donnée saisie pendant l'essai gratuit n'est perdue lors du passage au Plan PRO.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">3. Activation du Plan PRO Annuel & Paiements Mobile Money</h4>
                <p>
                  Le Plan PRO Annuel débloque l'édition et l'impression d'un <strong>nombre illimité d'élèves et de classes</strong> pour une durée de 365 jours :
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-600 pl-2">
                  <li>Le règlement s'effectue par <strong>T-Money (Togocom/Yas)</strong>, <strong>Moov Money (Flooz)</strong> ou via une clé de licence officielle délivrée par l'administration SukuPass.</li>
                  <li>L'activation du compte PRO s'effectue en temps réel (sans même avoir besoin de rafraîchir la page) dès validation de la transaction ou saisie de la clé de licence.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">4. Responsabilité de l'Établissement</h4>
                <p>
                  L'établissement utilisateur certifie disposer des droits légitimes pour émettre les cartes scolaires au nom de l'institution qu'il représente et demeure responsable de l'exactitude des informations nominatives saisies ainsi que de la confidentialité de ses identifiants de connexion.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'data_protection' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-emerald-950 text-sm">
                    Conformité Loi Togolaise n° 2019-014 & Protection des Mineurs
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Respect des dispositions de l'Instance de Protection des Données à Caractère Personnel (IPDCP - République Togolaise) et des standards internationaux RGPD.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase">
                    <Database className="w-4 h-4 text-emerald-600" />
                    Chiffrement de bout en bout
                  </div>
                  <p className="text-xs text-slate-600">
                    Toutes les communications entre le navigateur de l'école et nos serveurs sont protégées par chiffrement TLS 1.3 et stockage chiffré AES-256.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase">
                    <EyeOff className="w-4 h-4 text-emerald-600" />
                    Zéro Publicité & Zéro Profilage
                  </div>
                  <p className="text-xs text-slate-600">
                    Les données des élèves mineurs et majeurs ne font l'objet d'aucun traitement commercial, publicitaire ou algorithmique tiers.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Droits d'Accès & Rectification
                  </div>
                  <p className="text-xs text-slate-600">
                    Chaque parent d'élève ou élève peut demander à son établissement la rectification immédiate d'une erreur sur sa carte ou le retrait de sa photo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Cloisonnement par École
                  </div>
                  <p className="text-xs text-slate-600">
                    Chaque compte établissement dispose d'un identifiant cryptographique unique empêchant tout accès croisé entre établissements.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="text-sm font-black text-slate-900">Déconnexion automatique de sécurité</h4>
                <p>
                  Pour éviter tout accès non autorisé sur un ordinateur de secrétariat laissé ouvert, SukuPass Togo intègre un mécanisme de <strong>verrouillage automatique après 10 minutes d'inactivité</strong> avec alerte préalable.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3">
                <Scale className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Mentions Légales & Coordonnées Officielles
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Informations relatives à l'éditeur de la solution SukuPass Togo et au support technique.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">Édition & Exploitation</h4>
                  <p className="text-xs sm:text-sm text-slate-700">
                    <strong>SukuPass Togo</strong> — Solution numérique dédiée à la modernisation administrative des établissements scolaires de la République Togolaise et de l'espace UEMOA.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">Propriété Intellectuelle</h4>
                  <p className="text-xs sm:text-sm text-slate-700">
                    L'architecture logicielle, le moteur de mise en page A4, le système de vérification QR Code et l'identité graphique SukuPass sont protégés par le droit de la propriété intellectuelle. Les armoiries, logos et cachets importés par chaque école restent la propriété exclusive de leurs établissements respectifs.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">Contact & Assistance DPO / Support</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Lomé, République Togolaise</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>support@sukupass.tg</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Assistance WhatsApp & Mobile</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
            🔒 Conforme à la Loi n° 2019-014 relative à la protection des données personnelles au Togo.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
          >
            J'ai compris & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
