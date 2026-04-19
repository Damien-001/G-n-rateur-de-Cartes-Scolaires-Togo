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
}

export interface SchoolInfo {
  name: string;
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
}

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: "ÉCOLE NATIONALE DU TOGO",
  logoUrl: "https://picsum.photos/seed/togo-logo/200/200",
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

