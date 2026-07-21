import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { onAuthStateChange, Session } from './lib/auth.ts';
import './index.css';

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

// Nettoyer le hash Supabase de l'URL (ex: #error=access_...+expired&sb=1)
if (window.location.hash && window.location.hash.includes('error=')) {
  window.history.replaceState(null, '', window.location.pathname);
}

function Root() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [ready, setReady] = useState(false);
  const prevSessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const { data: listener } = onAuthStateChange((s) => {
      setSession(s);
      if (s) {
        setPage('dashboard');
      } else {
        setPage('landing');
      }
      setReady(true);
    });

    const timeout = setTimeout(() => setReady(true), 3000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium font-sans">Chargement...</p>
      </div>
    );
  }

  if (page === 'landing' && !session) {
    return (
      <LandingPage 
        onStartAuth={(mode) => {
          setAuthMode(mode === 'signup' ? 'register' : 'login');
          setPage('auth');
        }} 
      />
    );
  }

  if (page === 'auth' && !session) {
    return (
      <AuthPage 
        onAuth={(s) => {
          setSession(s);
          setPage('dashboard');
        }}
        onBackToHome={() => setPage('landing')}
        initialMode={authMode}
      />
    );
  }

  // Fallback in case session is null but page states are mismatched
  if (!session) {
    return (
      <LandingPage 
        onStartAuth={(mode) => {
          setAuthMode(mode === 'signup' ? 'register' : 'login');
          setPage('auth');
        }} 
      />
    );
  }

  return (
    <div key={session.userId}>
      <App 
        session={session} 
        onLogout={() => {
          setSession(null);
          setPage('landing');
        }} 
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker enregistré avec succès !', reg.scope))
      .catch(err => console.error('Erreur d\'enregistrement du Service Worker:', err));
  });
}
