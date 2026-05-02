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
  qrCodeData?: string;
  expirationDate?: string;
}

export interface CardColors {
  headerBg: string;    // Header background
  headerText: string;  // Header text
  footerBar: string;   // Bottom accent bar
  matriculeText: string; // Matricule color
}

export interface SchoolInfo {
  name: string;
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  cardColors?: CardColors;
}

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

