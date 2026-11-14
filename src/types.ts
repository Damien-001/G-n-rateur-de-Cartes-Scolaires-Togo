export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender?: 'M' | 'F' | 'Masculin' | 'Féminin' | string;
  matricule: string;
  className: string;
  schoolYear: string;
  birthDate?: string;
  birthPlace?: string;
  examCenter?: string;
  photoUrl?: string;
  expirationDate?: string;
}

export interface CardColors {
  headerBg: string;    // Header background
  headerText: string;  // Header text
  footerBar: string;   // Bottom accent bar
  matriculeText: string; // Matricule color
  bgTemplate?: 'guilloche' | 'flag' | 'geometric' | 'minimal';
  bgOpacity?: number;   // 0 to 100 (percentage)
}

export interface SchoolInfo {
  name: string;
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  cardColors?: CardColors;
  schoolType?: string;
  location?: string;
  phone?: string;
  subscriptionPlan?: 'free' | 'pro' | 'suspended';
  subscriptionExpiresAt?: string;
  trialExpiresAt?: string;
  region?: string;
  customQuota?: number;
}

export const FREE_TRIAL_DURATION_DAYS = 14;

export function computeDefaultTrialExpiresAt(baseDateMs: number = Date.now()): string {
  const safeBase = Number.isFinite(baseDateMs) && baseDateMs > 0 ? baseDateMs : Date.now();
  const d = new Date(safeBase + FREE_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

export function getSchoolTrialInfo(schoolInfo?: Partial<SchoolInfo> | null): {
  isTrialActive: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
  expiresAtDate: string;
} {
  if (!schoolInfo) {
    const exp = computeDefaultTrialExpiresAt();
    return { isTrialActive: true, isTrialExpired: false, daysRemaining: FREE_TRIAL_DURATION_DAYS, expiresAtDate: exp };
  }
  const isPro = schoolInfo.subscriptionPlan === 'pro' &&
    (!schoolInfo.subscriptionExpiresAt || new Date(schoolInfo.subscriptionExpiresAt).getTime() >= Date.now());
  if (isPro || schoolInfo.subscriptionPlan === 'suspended') {
    return {
      isTrialActive: false,
      isTrialExpired: false,
      daysRemaining: 0,
      expiresAtDate: schoolInfo.trialExpiresAt || ''
    };
  }
  const expStr = schoolInfo.trialExpiresAt || computeDefaultTrialExpiresAt();
  const expEndMs = new Date(`${expStr}T23:59:59`).getTime();
  const safeExpEndMs = Number.isFinite(expEndMs) ? expEndMs : (Date.now() + FREE_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const diffMs = safeExpEndMs - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isTrialExpired = diffMs < 0;
  return {
    isTrialActive: !isTrialExpired,
    isTrialExpired,
    daysRemaining,
    expiresAtDate: expStr
  };
}

export interface LicenseKey {
  id: string;
  code: string;
  plan: 'pro';
  durationMonths: number;
  targetSchoolName?: string; // Nom de l'école ciblée
  targetSchoolId?: string;   // ID du compte de l'école ciblée
  targetSchoolEmail?: string;
  targetSchoolPhone?: string;
  autoAssigned?: boolean;    // Générée automatiquement à l'inscription
  isUsed: boolean;
  isSuspended?: boolean;     // Clé désactivée / suspendue par l'admin
  usedBySchoolId?: string;
  usedBySchoolName?: string;
  usedAt?: string;
  createdAt: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  schoolId: string;
  schoolName: string;
  senderRole: 'school' | 'admin';
  message: string;
  attachmentUrl?: string; // Preuve de paiement / Capture Flooz / T-Money
  createdAt: string;
  status: 'sent' | 'read' | 'validated';
}

export const TOGO_REGIONS = [
  "Grand Lomé",
  "Région Maritime",
  "Région des Plateaux",
  "Région Centrale",
  "Région de la Kara",
  "Région des Savanes"
];

export const DEFAULT_CARD_COLORS: CardColors = {
  headerBg: '#047857',
  headerText: '#ffffff',
  footerBar: '#059669',
  matriculeText: '#065f46',
};

export const COLOR_PRESETS: { name: string; colors: CardColors }[] = [
  { name: 'Vert', colors: { headerBg: '#047857', headerText: '#ffffff', footerBar: '#059669', matriculeText: '#065f46' } },
  { name: 'Bleu', colors: { headerBg: '#1d4ed8', headerText: '#ffffff', footerBar: '#3b82f6', matriculeText: '#1e40af' } },
  { name: 'Rouge', colors: { headerBg: '#b91c1c', headerText: '#ffffff', footerBar: '#ef4444', matriculeText: '#991b1b' } },
  { name: 'Violet', colors: { headerBg: '#6d28d9', headerText: '#ffffff', footerBar: '#8b5cf6', matriculeText: '#5b21b6' } },
  { name: 'Orange', colors: { headerBg: '#c2410c', headerText: '#ffffff', footerBar: '#f97316', matriculeText: '#9a3412' } },
  { name: 'Ardoise', colors: { headerBg: '#334155', headerText: '#ffffff', footerBar: '#64748b', matriculeText: '#1e293b' } },
  { name: 'Rose', colors: { headerBg: '#be185d', headerText: '#ffffff', footerBar: '#ec4899', matriculeText: '#9d174d' } },
  { name: 'Cyan', colors: { headerBg: '#0e7490', headerText: '#ffffff', footerBar: '#06b6d4', matriculeText: '#155e75' } },
];

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: "ÉCOLE NATIONALE DU TOGO",
  cardColors: {
    headerBg: '#047857',
    headerText: '#ffffff',
    footerBar: '#059669',
    matriculeText: '#065f46',
  },
};

export const PRINT_CONFIG = {
  paperWidth: 210, // mm
  paperHeight: 297, // mm
  margin: 10, // mm
  spacing: 5, // mm
  cols: 2,
  rows: 5,
};

export const CLASSES_LIST = [
  "CP1", "CP2", "CE1", "CE2", "CM1", "CM2",
  "6ème", "5ème", "4ème", "3ème",
  "2nde A4", "2nde C", "2nde S",
  "1ère A4", "1ère C", "1ère D", "1ère G1", "1ère G2", "1ère G3",
  "Tle A4", "Tle C", "Tle D", "Tle G1", "Tle G2", "Tle G3"
];

export const SCHOOL_YEARS = [
  "2023-2024", "2024-2025", "2025-2026", "2026-2027", "2027-2028"
];

export interface LandingPricingPlan {
  id: string;
  badge?: string;
  name: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  buttonText: string;
  buttonAction: 'signup' | 'contact' | 'custom_url';
  buttonUrl?: string;
  isPopular?: boolean;
  enabled?: boolean;
}

export const DEFAULT_PRICING_PLANS: LandingPricingPlan[] = [
  {
    id: 'free',
    badge: 'Essai 14 Jours',
    name: 'Plan Gratuit',
    description: "Pour tester gratuitement les fonctionnalités pendant 14 jours.",
    price: '0 F CFA',
    period: '/ 14 jours',
    features: [
      'Essai gratuit valable 14 jours',
      'Limité à 15 élèves maximum',
      'Thèmes de couleurs basiques',
      'Filigrane SukuPass au dos'
    ],
    buttonText: 'Essai gratuit 14 jours',
    buttonAction: 'signup',
    buttonUrl: '',
    isPopular: false,
    enabled: true
  },
  {
    id: 'annual',
    badge: 'Établissement',
    name: 'Plan Annuel',
    description: "Cartes illimitées pour toute l'année scolaire de votre école.",
    price: '30 000 F CFA',
    period: '/ an',
    features: [
      'Cartes illimitées',
      'Aucun filigrane de plateforme',
      'Fonds Guillochés & Togo',
      'Cachet & Signature proviseur',
      'Support direct par WhatsApp'
    ],
    buttonText: "S'abonner maintenant",
    buttonAction: 'signup',
    buttonUrl: '',
    isPopular: true,
    enabled: true
  },
  {
    id: 'custom',
    badge: 'Groupe',
    name: 'Inspection / Multi-écoles',
    description: "Idéal pour les complexes scolaires ou les inspections régionales.",
    price: 'Sur Mesure',
    period: '',
    features: [
      'Gestion multi-établissements',
      'Comptes opérateurs secrétaires distincts',
      "Statistiques globales de l'inspection"
    ],
    buttonText: 'Nous contacter sur WhatsApp',
    buttonAction: 'contact',
    buttonUrl: 'https://wa.me/22890000000',
    isPopular: false,
    enabled: true
  }
];

export interface PlatformSettings {
  // Coordonnées de paiement Mobile Money manuel
  tmoneyNumber: string;
  tmoneyHolder: string;
  floozNumber: string;
  floozHolder: string;
  annualPriceCFA: number;

  // Contacts Administrateur & Support
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  officeAddress?: string;

  // Passerelle de paiement automatique FedaPay (T-Money, Flooz, Cartes)
  fedapayEnabled?: boolean;
  fedapayPublicKey?: string;
  fedapayEnvironment?: 'sandbox' | 'live';

  // Consignes et messages d'aide
  paymentInstructions?: string;
  supportNotice?: string;

  // Vidéo de présentation / Démonstration sur la Landing Page
  demoVideoUrl?: string;
  demoVideoTitle?: string;
  demoVideoPoster?: string;

  // Tarifs & Offres de la Landing Page
  pricingEnabled?: boolean;
  pricingTitle?: string;
  pricingSubtitle?: string;
  pricingPlans?: LandingPricingPlan[];

  updatedAt?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  tmoneyNumber: '+228 90 00 00 00',
  tmoneyHolder: 'SukuPass Togo',
  floozNumber: '+228 95 00 00 00',
  floozHolder: 'SukuPass Togo',
  annualPriceCFA: 30000,
  supportEmail: 'contact@sukupass.tg',
  supportPhone: '+228 90 00 00 00',
  whatsappNumber: '+228 90 00 00 00',
  officeAddress: 'Lomé, Togo',
  fedapayEnabled: false,
  fedapayPublicKey: '',
  fedapayEnvironment: 'sandbox',
  paymentInstructions: "Effectuez votre transfert T-Money ou Flooz. Téléversez ensuite votre capture d'écran dans le chat support pour validation immédiate par l'administrateur.",
  supportNotice: "Notre équipe administrative est disponible du Lundi au Samedi de 8h à 18h pour toute assistance technique ou activation de compte.",
  demoVideoUrl: 'https://ptmigsqqamaizizjkspo.supabase.co/storage/v1/object/public/school-assets/platform/videos/sukupass-demo.mp4',
  demoVideoTitle: 'Découvrez SukuPass en action — Les badges scolaires en quelques clics',
  demoVideoPoster: 'https://ptmigsqqamaizizjkspo.supabase.co/storage/v1/object/public/school-assets/platform/posters/sukupass-demo-poster.jpg',
  pricingEnabled: true,
  pricingTitle: 'Des tarifs transparents, adaptés à votre école',
  pricingSubtitle: "Pas de frais cachés. Choisissez l'abonnement qui correspond à la taille de votre établissement.",
  pricingPlans: DEFAULT_PRICING_PLANS
};
