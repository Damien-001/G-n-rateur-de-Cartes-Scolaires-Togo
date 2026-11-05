import React, { useState, useEffect } from 'react';
import { recordPageView } from '../lib/analytics';
import { 
  Users, 
  Sparkles, 
  Shield, 
  QrCode, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Activity,
  Layers,
  FileDown,
  ArrowUp,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { IDCard } from './IDCard';
import { IDCardBack } from './IDCardBack';
import { LandingVideoSection } from './LandingVideoSection';
import { PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '../types';
import { fetchPlatformSettings } from '../lib/db';

interface LandingPageProps {
  onStartAuth: (mode: 'signup' | 'signin') => void;
  onStartOfflineMode?: () => void;
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

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAuth, onStartOfflineMode }) => {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Framer Motion scroll progress spring
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    recordPageView('/landing');
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  const features = [
    {
      icon: Users,
      title: "Importation Excel/CSV",
      description: "Importez les listes de classes entières depuis vos fichiers administratifs en 3 secondes. Les données se formatent automatiquement."
    },
    {
      icon: QrCode,
      title: "QR Codes Dynamiques",
      description: "Générez des QR Codes de sécurité uniques à partir du matricule de l'élève pour simplifier la vérification de l'authenticité de la carte."
    },
    {
      icon: Shield,
      title: "Fonds Anti-Falsification",
      description: "Appliquez des motifs Guillochés géométriques ou des filigranes nationaux transparents aux couleurs de l'école ou du Togo."
    },
    {
      icon: Layers,
      title: "Imagerie et Webcam",
      description: "Prenez la photo des élèves directement sur place avec la webcam intégrée et recadrez-la au ratio d'identité standard en un clic."
    },
    {
      icon: FileDown,
      title: "PDF Haute Résolution",
      description: "Téléchargez des planches d'impression A4 prêtes au découpage. Ajustez la densité (8 ou 10 cartes par page) selon vos besoins."
    },
    {
      icon: Activity,
      title: "Mode Hors-Ligne",
      description: "Poursuivez la saisie et les captures de photos même en cas de coupure internet. L'application stocke les données localement."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-emerald-600 selection:text-white relative">
      {/* Scroll Progress Bar at very top */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 z-[100] origin-left shadow-sm shadow-emerald-500/20"
        style={{ scaleX }}
      />

      {/* Dynamic Glass Navigation Header */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 h-16 sm:h-20 z-50 px-4 sm:px-8 flex items-center justify-between transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-xl border-b border-emerald-100/80 shadow-md shadow-gray-900/5' 
            : 'bg-white/80 backdrop-blur-md border-b border-gray-100/80'
        }`}
      >
        {/* Brand / Logo */}
        <div 
          onClick={scrollToTop}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white border border-emerald-400/20 shadow-md shadow-emerald-800/10 shrink-0"
          >
            <span className="font-extrabold text-base sm:text-lg">S</span>
          </motion.div>
          <div>
            <span className="text-xs sm:text-base font-black text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors uppercase tracking-tight block">SukuPass</span>
            <p className="text-[8px] sm:text-[9px] text-emerald-700 font-extrabold uppercase tracking-[0.12em] mt-0.5">Togo & UEMOA</p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-7">
          <button 
            onClick={scrollToTop} 
            className="text-xs font-bold text-gray-600 hover:text-emerald-700 transition-colors relative group py-1 cursor-pointer bg-transparent border-0 uppercase tracking-wide"
          >
            Accueil
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
          </button>
          <a href="#features" className="text-xs font-bold text-gray-600 hover:text-emerald-700 transition-colors relative group py-1 uppercase tracking-wide">
            Fonctionnalités
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#how-it-works" className="text-xs font-bold text-gray-600 hover:text-emerald-700 transition-colors relative group py-1 uppercase tracking-wide">
            Comment ça marche
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#pricing" className="text-xs font-bold text-gray-600 hover:text-emerald-700 transition-colors relative group py-1 uppercase tracking-wide">
            Tarifs
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#faq" className="text-xs font-bold text-gray-600 hover:text-emerald-700 transition-colors relative group py-1 uppercase tracking-wide">
            FAQ
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-300 group-hover:w-full" />
          </a>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button 
            onClick={() => onStartAuth('signin')}
            className="text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            Connexion
          </button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStartAuth('signup')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Créer un compte</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
          </motion.button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer ml-0.5"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer Navigation for Landing Page */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 w-72 bg-white shadow-2xl p-6 flex flex-col justify-between border-l border-slate-100 overflow-y-auto"
            >
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</p>
                <div className="space-y-1">
                  {[
                    { label: 'Accueil', href: '#hero', onClick: () => { scrollToTop(); setMobileMenuOpen(false); } },
                    { label: 'Fonctionnalités', href: '#features', onClick: () => setMobileMenuOpen(false) },
                    { label: 'Comment ça marche', href: '#how-it-works', onClick: () => setMobileMenuOpen(false) },
                    { label: 'Tarifs & Abonnements', href: '#pricing', onClick: () => setMobileMenuOpen(false) },
                    { label: 'Foire Aux Questions', href: '#faq', onClick: () => setMobileMenuOpen(false) },
                  ].map((link, idx) => (
                    <a
                      key={idx}
                      href={link.href}
                      onClick={link.onClick}
                      className="block px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

                {onStartOfflineMode && (
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => { onStartOfflineMode(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200"
                    >
                      <Activity className="w-4 h-4 text-emerald-600" />
                      Mode Hors-Ligne (Sans Connexion)
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => { onStartAuth('signin'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center font-bold text-xs text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl"
                >
                  Se Connecter
                </button>
                <button
                  onClick={() => { onStartAuth('signup'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  Créer un compte école
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative overflow-hidden">
        {/* Subtle Background Parallax Glow Blobs */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl -z-10 pointer-events-none"
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 right-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl -z-10 pointer-events-none"
        />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 space-y-6"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200/60 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">SukuPass Togo • Éducation 2026</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.12]">
            SukuPass — Les badges scolaires <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">en quelques clics</span>.
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed font-medium">
            Plateforme tout-en-un pour les directeurs et secrétariats. Importation de listes Excel/CSV, prise de vue par webcam intégrée, impression Recto/Verso automatisée et QR codes de sécurité dynamiques.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3.5 pt-4">
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartAuth('signup')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-200/80 flex items-center justify-center gap-2 cursor-pointer group"
            >
              Essai Gratuit 14 Jours
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
            {onStartOfflineMode ? (
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartOfflineMode}
                className="bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-base font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Accès Immédiat
              </motion.button>
            ) : (
              <motion.a 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="#how-it-works"
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-base font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                Voir la Démo
              </motion.a>
            )}
          </motion.div>

          {/* Mobile Money Visuals */}
          <motion.div variants={itemVariants} className="pt-6 space-y-2.5">
            <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Paiements Locaux UEMOA Supportés</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-emerald-300 transition-colors">
                <Smartphone className="w-4 h-4 text-emerald-600" /> T-Money (Togo)
              </span>
              <span className="text-sm font-bold text-gray-700 flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-emerald-300 transition-colors">
                <Smartphone className="w-4 h-4 text-emerald-600" /> Flooz / Moov (Togo)
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Card Visual Previews */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 flex flex-col items-center justify-center gap-6"
        >
          {/* Cards Showcase Container */}
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col gap-5 items-center"
          >
            {/* Front Card */}
            <motion.div 
              whileHover={{ scale: 1.03, y: -4 }}
              className="shadow-2xl shadow-emerald-950/10 rounded-2xl overflow-hidden bg-white transition-all duration-300 border border-gray-100"
            >
              <IDCard student={dummyStudent} schoolInfo={dummySchool} showCuttingMarks={false} />
            </motion.div>

            {/* Back Card */}
            <motion.div 
              whileHover={{ scale: 1.03, y: -4 }}
              className="shadow-2xl shadow-emerald-950/10 rounded-2xl overflow-hidden bg-white transition-all duration-300 border border-gray-100"
            >
              <IDCardBack student={dummyStudent} schoolInfo={dummySchool} />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid with Scroll Reveal */}
      <section id="features" className="py-24 bg-white border-y border-gray-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto space-y-4"
          >
            <div className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Fonctionnalités avancées
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Une suite complète d'outils professionnels
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Conçu pour répondre aux exigences administratives togolaises en simplifiant le travail quotidien des secrétariats.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {features.map((item, index) => {
              const IconComp = item.icon;
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="p-8 bg-gray-50/70 rounded-3xl border border-gray-100/90 hover:border-emerald-500/30 hover:bg-white hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 group cursor-default"
                >
                  <div className="w-13 h-13 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100/80 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2.5 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works (Workflow Scroll Reveal) */}
      <section id="how-it-works" className="py-24 bg-gray-50/70 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto space-y-4"
          >
            <div className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Guide rapide
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Un flux de travail ultra-rapide
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Moins de 10 minutes pour configurer votre école et sortir vos premières planches de cartes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16 relative">
            {[
              {
                step: "1",
                title: "Identité de l'École",
                desc: "Configurez le nom de l'établissement, le logo, le cachet et la signature du proviseur dans le tableau de bord."
              },
              {
                step: "2",
                title: "Ajout des élèves",
                desc: "Importez une liste CSV de vos élèves ou ajoutez-les manuellement. Associez les photos via la webcam ou en glissant les fichiers."
              },
              {
                step: "3",
                title: "Impression A4",
                desc: "Choisissez le mode (Recto Seul ou Recto/Verso), puis téléchargez la planche PDF. Découpez au massicot et plastifiez."
              }
            ].map((stepItem, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center space-y-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm shadow-gray-200/50 hover:shadow-md transition-all"
              >
                <motion.div 
                  whileInView={{ scale: [0.8, 1.15, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.2 + 0.2 }}
                  className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-200 border border-emerald-400/30"
                >
                  {stepItem.step}
                </motion.div>
                <h3 className="font-bold text-xl text-gray-900">{stepItem.title}</h3>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium">
                  {stepItem.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto space-y-4"
          >
            <div className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Offres & Abonnements
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Des tarifs transparents, adaptés à votre école
            </h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Pas de frais cachés. Choisissez l'abonnement qui correspond à la taille de votre établissement.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto items-stretch">
            {/* Plan Gratuit */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl border border-gray-100 bg-gray-50 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Découverte</span>
                <h3 className="text-2xl font-bold text-gray-900">Plan Gratuit</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Pour tester les fonctionnalités avant l'année scolaire.</p>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-gray-900">0 F CFA</span>
                  <span className="text-sm text-gray-400"> / à vie</span>
                </div>
                <ul className="space-y-3 pt-4 text-xs font-semibold text-gray-600">
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Limité à 15 élèves</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Thèmes de couleurs basiques</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Filigrane SukuPass au dos</li>
                </ul>
              </div>
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={() => onStartAuth('signup')}
                className="mt-8 w-full py-3.5 border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Commencer gratuitement
              </motion.button>
            </motion.div>

            {/* Plan Établissement (Conseillé) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8 }}
              className="p-8 rounded-3xl border-2 border-emerald-600 bg-white flex flex-col justify-between relative shadow-xl shadow-emerald-950/10 scale-105 z-10"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
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
                <ul className="space-y-3 pt-4 text-xs font-semibold text-gray-600">
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Cartes illimitées</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Aucun filigrane de plateforme</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Fonds Guillochés & Togo</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Cachet & Signature proviseur</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Support direct par WhatsApp</li>
                </ul>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onStartAuth('signup')}
                className="mt-8 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer text-sm"
              >
                S'abonner maintenant
              </motion.button>
            </motion.div>

            {/* Plan Inspecteur / Groupe */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl border border-gray-100 bg-gray-50 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Groupe</span>
                <h3 className="text-2xl font-bold text-gray-900">Inspection / Multi-écoles</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Idéal pour les complexes scolaires ou les inspections régionales.</p>
                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-gray-900">Sur Mesure</span>
                </div>
                <ul className="space-y-3 pt-4 text-xs font-semibold text-gray-600">
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Gestion multi-établissements</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Comptes opérateurs secrétaires distincts</li>
                  <li className="flex gap-2.5 items-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Statistiques globales de l'inspection</li>
                </ul>
              </div>
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={() => window.open('https://wa.me/22890000000', '_blank')}
                className="mt-8 w-full py-3.5 border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Nous contacter sur WhatsApp
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50/70 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-16"
          >
            <div className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Aide & Support
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Questions Fréquentes</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
              Toutes les réponses à vos interrogations sur la plateforme.
            </p>
          </motion.div>

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
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:border-emerald-200 transition-all"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-gray-900 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <motion.div
                    animate={{ rotate: faqOpen === i ? 90 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronRight className={`w-5 h-5 ${faqOpen === i ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-14 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-gray-800 pb-10">
          <div>
            <span className="font-extrabold text-xl text-emerald-400">SukuPass</span>
            <p className="text-xs text-gray-400 mt-2 font-medium">Les badges scolaires en quelques clics au Togo.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400 font-medium justify-center md:justify-start">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="text-xs text-gray-500 text-center md:text-right font-medium">
            <span>&copy; 2026 SukuPass Togo. Tous droits réservés.</span>
          </div>
        </div>
      </footer>

      {/* Floating Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-950/20 z-50 cursor-pointer border border-emerald-400/30"
            aria-label="Retour en haut"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
