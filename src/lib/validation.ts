import { z } from 'zod';

// ─── Student Validation Schema ────────────────────────────────────────────────

export const StudentSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères')
    .trim(),
  lastName: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  matricule: z.string()
    .min(1, 'Le matricule est requis')
    .max(50, 'Le matricule ne peut pas dépasser 50 caractères')
    .trim(),
  className: z.string()
    .min(1, 'La classe est requise')
    .max(20, 'La classe ne peut pas dépasser 20 caractères'),
  schoolYear: z.string()
    .regex(/^\d{4}-\d{4}$/, 'Format année scolaire invalide (ex: 2025-2026)'),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(100, 'Le lieu de naissance ne peut pas dépasser 100 caractères').optional(),
  examCenter: z.string().max(200, 'Le centre d\'examen ne peut pas dépasser 200 caractères').optional(),
  photoUrl: z.string().url('URL de photo invalide').optional().or(z.literal('')),
  expirationDate: z.string().optional(),
});

export type ValidatedStudent = z.infer<typeof StudentSchema>;

// ─── School Info Validation Schema ────────────────────────────────────────────

export const CardColorsSchema = z.object({
  headerBg: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide'),
  headerText: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide'),
  footerBar: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide'),
  matriculeText: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide'),
});

export const SchoolInfoSchema = z.object({
  name: z.string()
    .min(1, 'Le nom de l\'établissement est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  logoUrl: z.string().url('URL de logo invalide').optional().or(z.literal('')),
  signatureUrl: z.string().url('URL de signature invalide').optional().or(z.literal('')),
  stampUrl: z.string().url('URL de cachet invalide').optional().or(z.literal('')),
  cardColors: CardColorsSchema.optional(),
});

export type ValidatedSchoolInfo = z.infer<typeof SchoolInfoSchema>;

// ─── File Upload Validation ───────────────────────────────────────────────────

export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB par défaut
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
});

export function validateFileUpload(file: File, maxSize: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
  // Vérifier la taille
  if (file.size > maxSize) {
    return { valid: false, error: `Le fichier est trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)` };
  }

  // Vérifier le type MIME
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' };
  }

  // Vérifier l'extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Extension de fichier non autorisée.' };
  }

  return { valid: true };
}

// ─── Sanitization Helpers ─────────────────────────────────────────────────────

export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}
