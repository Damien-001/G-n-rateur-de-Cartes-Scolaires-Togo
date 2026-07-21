import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  Shield, 
  QrCode, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  HelpCircle,
  Activity,
  Layers,
  FileDown
} from 'lucide-react';
import { IDCard } from './IDCard';
import { IDCardBack } from './IDCardBack';

interface LandingPageProps {
  onStartAuth: (mode: 'signup' | 'signin') => void;
  onAdminLogin?: () => void;
}

const dummyStudent = {
  id: 'preview',
  firstName: 'Amavi',
  lastName: 'KOSSI',
  matricule: 'TG-LOM-2026-981A',
  className: '1ère C',
  schoolYear: '2025-2026',
  birthDate: '2008-09-12',
  birthPlace: 'Kpalimé',
  examCenter: 'Lycée de Tokoin',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

const dummySchool = {
  name: 'LYCÉE SCIENTIFIQUE DE LOMÉ',
  logoUrl: '',
  cardColors: {
    headerBg: '#047857',
    headerText: '#ffffff',
    footerBar: '#059669',
    matriculeText: '#065f46',
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAuth, onAdminLogin }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white border border-emerald-400/20 shadow-sm shadow-emerald-800/10">
            <span className="font-extrabold text-lg">C</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">CardSchool SaaS</h1>
            <p className="text-[9px] text-emerald-800 font-extrabold uppercase tracking-[0.12em] mt-0.5">Togo & UEMOA</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors">Fonctionnalités</a>
          <a href="#how-it-works" className="text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors">Comment ça marche</a>
          <a href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors">Tarifs</a>
          <a href="#faq" className="text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onStartAuth('signin')}
            className="text-sm font-bold text-gray-700 hover:text-emerald-700 transition-colors px-4 py-2 cursor-pointer"
          >
            Connexion
          </button>
          <button 
            onClick={() => onStartAuth('signup')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-200 active:scale-95 cursor-pointer"
          >
            Créer un compte
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100/50">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Solution SaaS Éducation 2026</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Générez les cartes scolaires de vos élèves <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">en quelques clics</span>.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed font-medium">
            Plateforme tout-en-un pour les directeurs et secrétariats. Importation de listes Excel/CSV, prise de vue par webcam intégrée, impression Recto/Verso automatisée et QR codes de sécurité dynamiques.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              onClick={() => onStartAuth('signup')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              Essai Gratuit 14 Jours
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#how-it-works"
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-base font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Voir la Démo
            </a>
          </div>
          {/* Mobile Money Visuals */}
          <div className="pt-6 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Paiements Locaux UEMOA Supportés</p>
            <div className="flex items-center gap-4 opacity-75">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100/50">
                <Smartphone className="w-4 h-4 text-emerald-600" /> T-Money (Togo)
              </span>
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100/50">
                <Smartphone className="w-4 h-4 text-emerald-600" /> Flooz / Moov (Togo)
              </span>
            </div>
          </div>
        </div>

        {/* Card Visual Previews */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col gap-5">
            {/* Front Card */}
            <div className="flex flex-col gap-1.5 items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recto (Face)</span>
              <div className="shadow-xl shadow-gray-200 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-200 bg-white">
                <IDCard student={dummyStudent} schoolInfo={dummySchool} showCuttingMarks={false} />
              </div>
            </div>

            {/* Back Card */}
            <div className="flex flex-col gap-1.5 items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verso (Dos)</span>
              <div className="shadow-xl shadow-gray-200 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-200 bg-white">
                <IDCardBack student={dummyStudent} schoolInfo={dummySchool} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900">Une suite complète d'outils professionnels</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Conçu pour répondre aux exigences administratives togolaises en simplifiant le travail quotidien des secrétariats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-emerald-600/30 hover:bg-gray-50/50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 border border-emerald-100/50">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Importation Excel/CSV</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Importez les listes de classes entières depuis vos fichiers administratifs en 3 secondes. Les données se formatent automatiquement.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-emerald-600/30 hover:bg-gray-50/50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 border border-emerald-100/50">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">QR Codes Dynamiques</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Générez des QR Codes de sécurité uniques à partir du matricule de l'élève pour simplifier la vérification de l'authenticité de la carte.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-emerald-600/30 hover:bg-gray-50/50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 border border-emerald-100/50">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Fonds Anti-Falsification</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Appliquez des motifs Guillochés géométriques ou des filigranes nationaux transparents aux couleurs de l'école ou du Togo.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-emerald-600/30 hover:bg-gray-50/50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 border border-emerald-100/50">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Imagerie et Webcam</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Prenez la photo des élèves directement sur place avec la webcam intégrée et recadrez-la au ratio d'identité standard en un clic.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-emerald-600/30 hover:bg-gray-50/50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 border border-emerald-100/50">
                <FileDown className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">PDF Haute Résolution</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Téléchargez des planches d'impression A4 prêtes au découpage. Ajustez la densité (8 ou 10 cartes par page) selon vos besoins.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-emerald-600/30 hover:bg-gray-50/50 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 border border-emerald-100/50">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Mode Hors-Ligne</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Poursuivez la saisie et les captures de photos même en cas de coupure internet. L'application stocke les données localement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900">Un flux de travail ultra-rapide</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Moins de 10 minutes pour configurer votre école et sortir vos premières planches de cartes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md shadow-emerald-200">
                1
              </div>
              <h3 className="font-bold text-lg text-gray-900">Identité de l'École</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium">
                Configurez le nom de l'établissement, le logo, le cachet et la signature du proviseur dans le tableau de bord.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md shadow-emerald-200">
                2
              </div>
              <h3 className="font-bold text-lg text-gray-900">Ajout des élèves</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium">
                Importez une liste CSV de vos élèves ou ajoutez-les manuellement. Associez les photos via la webcam ou en glissant les fichiers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md shadow-emerald-200">
                3
              </div>
              <h3 className="font-bold text-lg text-gray-900">Impression A4</h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium">
                Choisissez le mode (Recto Seul ou Recto/Verso), puis téléchargez la planche PDF. Découpez au massicot et plastifiez.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900">Des tarifs transparents, adaptés à votre école</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Pas de frais cachés. Choisissez l'abonnement qui correspond à la taille de votre établissement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            {/* Plan Gratuit */}
            <div className="p-8 rounded-3xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Découverte</span>
                <h3 className="text-2xl font-bold text-gray-900">Plan Gratuit</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Pour tester les fonctionnalités avant l'année scolaire.</p>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-gray-900">0 F CFA</span>
                  <span className="text-sm text-gray-400"> / à vie</span>
                </div>
                <ul className="space-y-2.5 pt-4 text-xs font-semibold text-gray-600">
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Limité à 15 élèves</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Thèmes de couleurs basiques</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Filigrane CardSchool au dos</li>
                </ul>
              </div>
              <button 
                onClick={() => onStartAuth('signup')}
                className="mt-8 w-full py-3 border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Commencer gratuitement
              </button>
            </div>

            {/* Plan Établissement (Conseillé) */}
            <div className="p-8 rounded-3xl border-2 border-emerald-600 bg-white flex flex-col justify-between relative shadow-xl shadow-emerald-950/5">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Recommandé
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">Établissement</span>
                <h3 className="text-2xl font-bold text-gray-900">Plan Annuel</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Cartes illimitées pour toute l'année scolaire de votre école.</p>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-emerald-600">30 000 F CFA</span>
                  <span className="text-sm text-gray-400"> / an</span>
                </div>
                <ul className="space-y-2.5 pt-4 text-xs font-semibold text-gray-600">
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Cartes illimitées</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Aucun filigrane de plateforme</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Fonds Guillochés & Togo</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Cachet & Signature proviseur</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Support direct par WhatsApp</li>
                </ul>
              </div>
              <button 
                onClick={() => onStartAuth('signup')}
                className="mt-8 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer text-sm"
              >
                S'abonner maintenant
              </button>
            </div>

            {/* Plan Inspecteur / Groupe */}
            <div className="p-8 rounded-3xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Groupe</span>
                <h3 className="text-2xl font-bold text-gray-900">Inspection / Multi-écoles</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Idéal pour les complexes scolaires ou les inspections régionales.</p>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-gray-900">Sur Mesure</span>
                </div>
                <ul className="space-y-2.5 pt-4 text-xs font-semibold text-gray-600">
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Gestion multi-établissements</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Comptes opérateurs secrétaires distincts</li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Statistiques globales de l'inspection</li>
                </ul>
              </div>
              <button 
                onClick={() => window.open('https://wa.me/22890000000', '_blank')}
                className="mt-8 w-full py-3 border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Nous contacter sur WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900">Questions Fréquentes</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Toutes les réponses à vos interrogations sur la plateforme.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Quel papier utiliser pour imprimer les planches ?",
                a: "Nous recommandons d'utiliser du papier bristol épais (180g ou 220g) ou du papier couché mat. Après impression, découpez les cartes et insérez-les dans des pochettes de plastification thermique de 125 microns pour une solidité optimale."
              },
              {
                q: "Comment payer mon abonnement au Togo ?",
                a: "Vous pouvez régler votre abonnement annuel directement par T-Money ou Moov Money (Flooz). Dès que le paiement est validé en quelques secondes sur notre passerelle locale, votre compte passe instantanément en illimité."
              },
              {
                q: "Les photos des élèves sont-elles en sécurité ?",
                a: "Oui, la sécurité est notre priorité absolue. Les photos et les données scolaires sont stockées de manière chiffrée sur notre cloud sécurisé (Supabase) et sont isolées par établissement. Seules les personnes autorisées par votre école ont accès à vos élèves."
              },
              {
                q: "Que se passe-t-il si la connexion internet coupe ?",
                a: "Grâce à notre technologie de cache hors-ligne (PWA), vous pouvez continuer d'ajouter des élèves, de prendre des photos avec la webcam et de configurer vos cartes sans interruption. Les modifications seront automatiquement synchronisées sur le serveur Supabase dès le retour de votre connexion internet."
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-gray-900 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronRight 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-350 ${
                      faqOpen === i ? 'rotate-90 text-emerald-600' : ''
                    }`} 
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5 text-sm text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-gray-800 pb-8">
          <div>
            <span className="font-extrabold text-xl text-emerald-400">CardSchool SaaS</span>
            <p className="text-xs text-gray-400 mt-2 font-medium">Simplifier l'administration scolaire au Togo.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400 font-medium justify-center md:justify-start">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="text-xs text-gray-500 text-center md:text-right font-medium flex flex-col items-end gap-2">
            <span>&copy; 2026 CardSchool. Tous droits réservés.</span>
            {onAdminLogin && (
              <button
                onClick={onAdminLogin}
                className="text-[10px] text-gray-700 hover:text-gray-500 transition-colors font-mono tracking-widest cursor-pointer uppercase"
                title="Accès administration système"
              >
                ⬡ Portail Admin
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
