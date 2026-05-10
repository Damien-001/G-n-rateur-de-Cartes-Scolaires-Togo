// ─── Secure Logging Utility ───────────────────────────────────────────────────

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEVELOPMENT = import.meta.env.DEV;

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // En production, logger uniquement ERROR et WARN
    if (IS_PRODUCTION) {
      return level === LogLevel.ERROR || level === LogLevel.WARN;
    }
    // En développement, logger tout
    return true;
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    // Supprimer les données sensibles
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
    };

    // En production, envoyer les logs à un service externe (ex: Sentry, LogRocket)
    if (IS_PRODUCTION) {
      // TODO: Intégrer avec un service de logging externe
      if (level === LogLevel.ERROR) {
        console.error(`[${entry.timestamp}] ${entry.message}`, entry.context);
      } else if (level === LogLevel.WARN) {
        console.warn(`[${entry.timestamp}] ${entry.message}`, entry.context);
      }
    } else {
      // En développement, logger dans la console
      const logFn = {
        [LogLevel.ERROR]: console.error,
        [LogLevel.WARN]: console.warn,
        [LogLevel.INFO]: console.info,
        [LogLevel.DEBUG]: console.log,
      }[level];

      logFn(`[${level}] ${message}`, context || '');
    }
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
}

export const logger = new Logger();

// ─── Audit Trail Logger ───────────────────────────────────────────────────────

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export async function logAuditTrail(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // En développement, logger dans la console
  if (IS_DEVELOPMENT) {
    logger.debug('Audit trail', auditEntry);
  }

  // En production et développement, envoyer à Supabase
  try {
    const { supabase } = await import('./supabase');
    
    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      created_at: auditEntry.timestamp,
    });

    if (error) {
      logger.error('Failed to log audit trail to Supabase', { error: error.message });
    }
  } catch (error) {
    logger.error('Failed to log audit trail', { error });
  }
}
