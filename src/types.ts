export interface Student {
  id: string;
  firstName: string;
  lastName: string;
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
  region?: string;
  customQuota?: number;
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
  updatedAt?: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  tmoneyNumber: '+228 90 00 00 00',
  tmoneyHolder: 'CardSchool Togo',
  floozNumber: '+228 95 00 00 00',
  floozHolder: 'CardSchool Togo',
  annualPriceCFA: 30000,
  supportEmail: 'contact@cardschool.tg',
  supportPhone: '+228 90 00 00 00',
  whatsappNumber: '+228 90 00 00 00',
  officeAddress: 'Lomé, Togo',
  fedapayEnabled: false,
  fedapayPublicKey: '',
  fedapayEnvironment: 'sandbox',
  paymentInstructions: "Effectuez votre transfert T-Money ou Flooz. Téléversez ensuite votre capture d'écran dans le chat support pour validation immédiate par l'administrateur.",
  supportNotice: "Notre équipe administrative est disponible du Lundi au Samedi de 8h à 18h pour toute assistance technique ou activation de compte."
};
