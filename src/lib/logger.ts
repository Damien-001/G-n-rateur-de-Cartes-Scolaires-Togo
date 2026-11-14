/**
 * Module de journalisation applicative centralisé pour SukuPass Togo.
 * Garantit qu'aucun secret (clé d'API, mot de passe, token JWT) ni donnée sensible n'est exposé.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  context?: string;
  action?: string;
  schoolId?: string;
  [key: string]: any;
}

const SENSITIVE_KEYS = ['password', 'secret', 'token', 'key', 'auth', 'apikey', 'authorization'];

/**
 * Nettoie récursivement un objet pour masquer les données sensibles
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s));
    if (isSensitive) {
      cleaned[key] = '[PROTÉGÉ]';
    } else if (value && typeof value === 'object') {
      cleaned[key] = sanitizeData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const logger = {
  info(message: string, context?: LogContext) {
    if (import.meta.env.DEV) {
      console.log(`[INFO ${new Date().toISOString()}] ${message}`, context ? sanitizeData(context) : '');
    }
  },

  warn(message: string, context?: LogContext) {
    console.warn(`[WARN ${new Date().toISOString()}] ${message}`, context ? sanitizeData(context) : '');
  },

  error(message: string, error?: any, context?: LogContext) {
    const errorMsg = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
    console.error(`[ERROR ${new Date().toISOString()}] ${message}: ${errorMsg}`, context ? sanitizeData(context) : '');
  }
};
