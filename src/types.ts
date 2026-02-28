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
