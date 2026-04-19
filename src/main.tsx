import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { onAuthStateChange, Session } from './lib/auth.ts';
import './index.css';

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
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
