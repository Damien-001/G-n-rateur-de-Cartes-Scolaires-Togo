import { useState } from 'react';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

interface DataManagementProps {
  userId: string;
  userEmail: string;
}

export default function DataManagement({ userId, userEmail }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Exporter toutes les données de l'utilisateur
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Récupérer toutes les données de l'utilisateur
      const [studentsResult, schoolInfoResult, auditLogsResult] = await Promise.all([
        supabase.from('students').select('*').eq('user_id', userId),
        supabase.from('school_info').select('*').eq('user_id', userId).single(),
        supabase.from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user: {
          id: userId,
          email: userEmail,
        },
        students: studentsResult.data || [],
        school_info: schoolInfoResult.data || null,
        audit_logs: auditLogsResult.data || [],
      };

      // Créer un fichier JSON téléchargeable
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('User data exported successfully');
    } catch (error) {
      logger.error('Failed to export user data', { error });
      alert('Erreur lors de l\'export des données. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  // Supprimer le compte et toutes les données
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER MON COMPTE') {
      alert('Veuillez taper exactement "SUPPRIMER MON COMPTE" pour confirmer.');
      return;
    }

    setIsDeleting(true);
    try {
      // Supprimer toutes les données de l'utilisateur
      // Les données liées (students, school_info, audit_logs) seront supprimées automatiquement
      // grâce aux contraintes ON DELETE CASCADE dans la base de données

      // Supprimer le compte utilisateur via Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw error;
      }

      logger.info('User account deleted successfully');
      
      // Déconnecter l'utilisateur
      await supabase.auth.signOut();
      
      alert('Votre compte et toutes vos données ont été supprimés avec succès.');
      window.location.reload();
    } catch (error) {
      logger.error('Failed to delete user account', { error });
      alert('Erreur lors de la suppression du compte. Veuillez contacter le support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion de vos Données (RGPD)</h3>
        <p className="text-sm text-gray-600">
          Conformément au RGPD, vous pouvez exporter ou supprimer toutes vos données personnelles.
        </p>
      </div>

      {/* Export des données */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">Exporter mes données</h4>
            <p className="text-sm text-gray-600 mb-3">
              Téléchargez toutes vos données personnelles au format JSON (élèves, école, logs d'activité).
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exporter mes données
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Suppression du compte */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900 mb-1">Supprimer mon compte</h4>
            <p className="text-sm text-red-700 mb-3">
              <strong>Action irréversible :</strong> Toutes vos données (élèves, photos, paramètres) seront
              définitivement supprimées. Cette action ne peut pas être annulée.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer mon compte
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Pour confirmer, tapez : <strong>SUPPRIMER MON COMPTE</strong>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="SUPPRIMER MON COMPTE"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'SUPPRIMER MON COMPTE'}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Confirmer la suppression
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Les logs d'audit sont conservés pendant 90 jours maximum.</p>
        <p>• Après suppression, vos données sont définitivement effacées sous 30 jours.</p>
        <p>• Pour toute question, contactez : privacy@example.com</p>
      </div>
    </div>
  );
}
