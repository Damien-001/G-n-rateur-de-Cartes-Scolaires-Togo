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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Cookie className="w-6 h-6 text-blue-600" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Utilisation des Cookies
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Nous utilisons uniquement des cookies essentiels pour l'authentification et le fonctionnement
              de l'application. Aucun cookie de tracking, analytique ou publicitaire n'est utilisé.
              Ces cookies sont nécessaires pour vous permettre de vous connecter et d'utiliser l'application.
            </p>
            <div className="text-xs text-gray-500 mb-4">
              <strong>Cookies utilisés :</strong>
              <ul className="list-disc list-inside mt-1 ml-2">
                <li>Cookies de session Supabase (authentification)</li>
                <li>Préférences locales (localStorage)</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            >
              Accepter
            </button>
            <button
              onClick={handleReject}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Refuser
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={handleReject}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 mt-3 ml-10">
          En refusant, certaines fonctionnalités de l'application peuvent ne pas fonctionner correctement.
          Pour plus d'informations, consultez notre{' '}
          <button className="text-blue-600 hover:underline">
            politique de confidentialité
          </button>
          .
        </p>
      </div>
    </div>
  );
}
