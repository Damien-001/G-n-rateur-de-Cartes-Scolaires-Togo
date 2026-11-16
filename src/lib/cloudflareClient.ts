// ============================================================
// Client API Cloudflare D1 & Auth pour Sukupass Togo
// ============================================================

export const CLOUDFLARE_API_URL = import.meta.env.VITE_CLOUDFLARE_API_URL || 'https://cartes-scolaires-api.fanoukomladamien.workers.dev';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('cardschool_auth_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('cardschool_auth_token', token);
    } else {
      localStorage.removeItem('cardschool_auth_token');
    }
  } catch { }
}

export async function cfFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${CLOUDFLARE_API_URL}${path.startsWith('/') ? path : '/' + path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Erreur serveur Cloudflare HTTP ${response.status}`);
  }

  return data;
}
