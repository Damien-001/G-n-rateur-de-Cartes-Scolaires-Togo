// Déconnexion automatique après 1h d'inactivité
// Avertissement à 59 minutes

const TIMEOUT_MS = 60 * 60 * 1000;  // 1 heure
const WARNING_MS = 59 * 60 * 1000;  // 59 minutes

let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimer: ReturnType<typeof setTimeout> | null = null;
let onTimeoutCb: (() => void) | null = null;
let onWarningCb: (() => void) | null = null;

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

function reset() {
  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (warningTimer) clearTimeout(warningTimer);

  // ✅ SÉCURITÉ : Mettre à jour le timestamp de dernière activité
  localStorage.setItem('last_activity', Date.now().toString());

  warningTimer = setTimeout(() => {
    if (onWarningCb) onWarningCb();
  }, WARNING_MS);

  timeoutTimer = setTimeout(() => {
    if (onTimeoutCb) onTimeoutCb();
  }, TIMEOUT_MS);
}

export function startInactivityTimer(
  onTimeout: () => void,
  onWarning?: () => void
) {
  onTimeoutCb = onTimeout;
  onWarningCb = onWarning ?? null;
  EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));
  reset();
}

export function stopInactivityTimer() {
  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (warningTimer) clearTimeout(warningTimer);
  timeoutTimer = null;
  warningTimer = null;
  onTimeoutCb = null;
  onWarningCb = null;
  EVENTS.forEach(e => window.removeEventListener(e, reset));
}
