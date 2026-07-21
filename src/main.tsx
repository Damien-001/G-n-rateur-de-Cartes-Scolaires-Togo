import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthPage } from './components/AuthPage.tsx';
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
  const [ready, setReady] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const prevSessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const { data: listener } = onAuthStateChange((s) => {
      const wasLoggedIn = prevSessionRef.current !== null;
      const isLoggedIn = s !== null;
      prevSessionRef.current = s;

      // Si on passe de connecté → déconnecté → reconnecté,
      // on attend un tick pour laisser le DOM se stabiliser
      // avant de monter App (évite le crash insertBefore)
      if (wasLoggedIn && isLoggedIn) {
        // Reconnexion après déconnexion : attendre que le DOM soit propre
        setTransitioning(true);
        setTimeout(() => {
          setSession(s);
          setReady(true);
          setTransitioning(false);
        }, 50);
      } else {
        setSession(s);
        setReady(true);
      }
    });

    const timeout = setTimeout(() => setReady(true), 3000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (!ready || transitioning) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuth={(s) => setSession(s)} />;
  }

  return (
    <div key={session.userId}>
      <App session={session} onLogout={() => setSession(null)} />
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
