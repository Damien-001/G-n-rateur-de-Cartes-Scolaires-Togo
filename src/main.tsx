import React, { useState, useEffect, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { onAuthStateChange, getSession, logout, Session } from './lib/auth.ts';
import { getCachedSession, setCachedSession } from './lib/offlineStorage.ts';
import { recordPageView } from './lib/analytics.ts';
import './index.css';

// Lazy loading des pages principales pour réduire drastiquement la taille du bundle initial sur mobile
const LandingPage = lazy(() => import('./components/LandingPage.tsx').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./components/AuthPage.tsx').then(m => ({ default: m.AuthPage })));
const AdminLoginPage = lazy(() => import('./components/AdminLoginPage.tsx').then(m => ({ default: m.AdminLoginPage })));
const App = lazy(() => import('./App.tsx'));

const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
    <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs text-slate-500 font-medium">Chargement...</p>
  </div>
);

// Monkey-patch global Node DOM methods to prevent browser extensions (like translation tools or password managers) from crashing React.
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      console.warn('Prevented removeChild crash: child node is not a child of this parent.', child, this);
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      console.warn('Prevented insertBefore crash: reference node is not a child of this parent.', referenceNode, this);
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

// Debug - disponible dans la console avec window.debugDatabase()
import './debug-db.ts';

// Nettoyer le hash Supabase d'erreur éventuelle (ex: #error=access_...+expired&sb=1)
if (window.location.hash && window.location.hash.includes('error=')) {
  window.history.replaceState(null, '', window.location.pathname);
}

// Détection de l'accès à la route /admin
function checkIsAdminRoute(): boolean {
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    hash === '#admin' ||
    hash.startsWith('#/admin') ||
    hash.startsWith('#admin') ||
    search === '?admin' ||
    search.includes('admin=true') ||
    search.includes('page=admin')
  );
}

function Root() {
  const [session, setSession] = useState<Session | null>(() => getCachedSession());
  const [page, setPage] = useState<'landing' | 'auth' | 'admin-login' | 'dashboard'>(() => {
    const cached = getCachedSession();
    if (cached) return 'dashboard';
    if (checkIsAdminRoute()) return 'admin-login';
    return 'landing';
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  // ready est initialisé à true immédiatement pour ne pas bloquer l'interface sur mobile
  const [ready, setReady] = useState(() => {
    // Si on a un cache ou qu'on est sur une page publique (landing, auth), on affiche tout de suite
    return true;
  });

  // Tracking universel d'audience des visiteurs
  useEffect(() => {
    const routePath = page === 'dashboard' ? '/app' : (page === 'auth' ? '/auth' : (page === 'admin-login' ? '/admin' : '/'));
    recordPageView(routePath);
  }, [page]);

  useEffect(() => {
    let isMounted = true;

    // Écoute des changements d'URL (ex: l'administrateur navigue vers /admin ou utilise l'historique)
    const handleUrlChange = () => {
      const cached = getCachedSession();
      if (cached) {
        setSession(cached);
        setPage('dashboard');
        return;
      }
      if (checkIsAdminRoute()) {
        setPage('admin-login');
      } else {
        setPage('landing');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // 1. Récupération immédiate de la session (locale ou distante)
    getSession().then((initialSession) => {
      if (!isMounted) return;
      const active = initialSession || getCachedSession();
      if (active) {
        setSession(active);
        setCachedSession(active);
        setPage('dashboard');
      } else if (checkIsAdminRoute()) {
        setPage('admin-login');
      } else {
        setPage('landing');
      }
      setReady(true);
    }).catch(() => {
      if (isMounted) setReady(true);
    });

    // 2. Écoute des changements d'authentification Supabase
    const { data: listener } = onAuthStateChange((s) => {
      if (!isMounted) return;
      const active = s || getCachedSession();
      if (active) {
        setSession(active);
        setCachedSession(active);
        setPage('dashboard');
      } else {
        setSession(null);
        if (checkIsAdminRoute()) {
          setPage('admin-login');
        } else {
          setPage('landing');
        }
      }
      setReady(true);
    });

    const timeout = setTimeout(() => {
      if (isMounted) setReady(true);
    }, 1500);

    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleStartOfflineDemo = () => {
    const demoSession: Session = {
      userId: 'local-offline-user',
      email: 'demo@cardschool.local',
      fullName: 'Mode Démo / Hors-Ligne',
      schoolName: 'LYCÉE SCIENTIFIQUE DE LOMÉ',
      schoolType: 'Lycée',
      location: 'Lomé - Togo',
      phone: '+228 90 00 00 00',
      isOfflineGuest: true,
    };
    setCachedSession(demoSession);
    setSession(demoSession);
    setPage('dashboard');
  };

  if (!ready) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {page === 'landing' && !session && (
        <LandingPage 
          onStartAuth={(mode) => {
            setAuthMode(mode === 'signup' ? 'register' : 'login');
            setPage('auth');
          }}
          onStartOfflineMode={handleStartOfflineDemo}
        />
      )}

      {page === 'admin-login' && !session && (
        <AdminLoginPage
          onAuth={(s) => {
            setCachedSession(s);
            setSession(s);
            setPage('dashboard');
          }}
          onBackToLanding={() => {
            window.history.pushState(null, '', '/');
            setPage('landing');
          }}
        />
      )}

      {page === 'auth' && !session && (
        <AuthPage 
          onAuth={(s) => {
            setCachedSession(s);
            setSession(s);
            setPage('dashboard');
          }}
          onBackToHome={() => setPage('landing')}
          initialMode={authMode}
        />
      )}

      {session && (
        <div key={session.userId}>
          <App 
            session={session} 
            onLogout={async () => {
              await logout();
              setSession(null);
              window.history.pushState(null, '', '/');
              setPage('landing');
            }} 
          />
        </div>
      )}
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>,
);

// Enregistrement du Service Worker pour support PWA et hors-ligne (en production uniquement)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          reg.update().catch(() => {});
          console.log('✅ Service Worker enregistré avec succès (Scope:', reg.scope, ')');
        })
        .catch((err) => {
          console.warn('Erreur d\'enregistrement du Service Worker:', err);
        });
    });
  } else {
    // En développement, désactiver les anciens Service Workers pour assurer un HMR Vite fluide et éviter les rechargements
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('🧹 Ancien Service Worker désactivé en mode dev');
      }
    }).catch(() => {});
  }
}
