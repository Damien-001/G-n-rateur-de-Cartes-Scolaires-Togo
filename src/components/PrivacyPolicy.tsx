import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Politique de Confidentialité</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <section>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
            </p>
            <p className="text-gray-700">
              Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons
              vos données personnelles dans le cadre de l'utilisation du Générateur de Cartes Scolaires Togo.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Données Collectées</h3>
            <p className="text-gray-700 mb-2">Nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Données d'authentification :</strong> Email, mot de passe (chiffré)</li>
              <li><strong>Données des élèves :</strong> Nom, prénom, matricule, date de naissance, classe, photo</li>
              <li><strong>Données de l'école :</strong> Nom de l'établissement, logo, couleurs de carte</li>
              <li><strong>Données techniques :</strong> Adresse IP, User-Agent, logs d'activité</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Utilisation des Données</h3>
            <p className="text-gray-700 mb-2">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Générer et gérer les cartes scolaires des élèves</li>
              <li>Authentifier et sécuriser votre compte</li>
              <li>Améliorer la sécurité et prévenir les abus</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Sécurité des Données</h3>
            <p className="text-gray-700">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger
              vos données contre tout accès non autorisé, perte ou destruction :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Chiffrement des mots de passe (bcrypt)</li>
              <li>Contrôle d'accès strict (Row Level Security)</li>
              <li>Audit trail de toutes les actions sensibles</li>
              <li>Validation et sanitization des données</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Vos Droits (RGPD)</h3>
            <p className="text-gray-700 mb-2">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Droit d'accès :</strong> Consulter vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> Supprimer votre compte et vos données</li>
              <li><strong>Droit à la portabilité :</strong> Exporter vos données au format JSON</li>
              <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Conservation des Données</h3>
            <p className="text-gray-700">
              Vos données sont conservées tant que votre compte est actif. Les logs d'audit sont conservés
              pendant 90 jours maximum, conformément aux exigences RGPD. Après suppression de votre compte,
              toutes vos données sont définitivement effacées sous 30 jours.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Partage des Données</h3>
            <p className="text-gray-700">
              Nous ne vendons ni ne partageons vos données personnelles avec des tiers, sauf :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Avec votre consentement explicite</li>
              <li>Pour respecter une obligation légale</li>
              <li>Avec nos prestataires de services (Supabase) sous contrat de confidentialité</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h3>
            <p className="text-gray-700">
              Nous utilisons uniquement des cookies essentiels pour l'authentification et le fonctionnement
              de l'application. Aucun cookie de tracking ou publicitaire n'est utilisé.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h3>
            <p className="text-gray-700">
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
              contactez-nous à : <strong>privacy@example.com</strong>
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Modifications</h3>
            <p className="text-gray-700">
              Nous nous réservons le droit de modifier cette politique de confidentialité. Toute modification
              sera publiée sur cette page avec une nouvelle date de mise à jour.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
