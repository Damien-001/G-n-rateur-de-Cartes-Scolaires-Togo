import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté les cookies
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50">
      <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-start gap-3 mb-3">
          <Cookie className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-white mb-1">Cookies essentiels</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Nous utilisons uniquement des cookies nécessaires à l'authentification. Aucun tracking ni publicité.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAccept}
            className="flex-1 px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-semibold hover:bg-gray-100 active:scale-95 transition-all">
            Accepter
          </button>
          <button onClick={handleReject}
            className="px-3 py-1.5 border border-white/20 text-gray-400 rounded-lg text-xs font-medium hover:text-white hover:border-white/40 transition-all">
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
