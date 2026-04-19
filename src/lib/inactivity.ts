// Déconnexion automatique après 10 minutes d'inactivité
// Avertissement à 9 minutes

const TIMEOUT_MS = 10 * 60 * 1000;  // 10 minutes
const WARNING_MS =  9 * 60 * 1000;  //  9 minutes

let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimer: ReturnType<typeof setTimeout> | null = null;
let onTimeoutCb: (() => void) | null = null;
let onWarningCb: (() => void) | null = null;

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

function reset() {
  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (warningTimer) clearTimeout(warningTimer);

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
