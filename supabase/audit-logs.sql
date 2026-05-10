-- ═══════════════════════════════════════════════════════════════════════════
-- Table audit_logs pour tracer toutes les actions sensibles
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer la table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Commentaires pour documentation
COMMENT ON TABLE audit_logs IS 'Trace toutes les actions sensibles effectuées par les utilisateurs';
COMMENT ON COLUMN audit_logs.user_id IS 'ID de l''utilisateur ayant effectué l''action';
COMMENT ON COLUMN audit_logs.action IS 'Type d''action (CREATE_STUDENT, UPDATE_STUDENT, DELETE_STUDENT, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type de ressource affectée (student, school_info, image)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID de la ressource affectée (optionnel)';
COMMENT ON COLUMN audit_logs.details IS 'Détails supplémentaires au format JSON';
COMMENT ON COLUMN audit_logs.ip_address IS 'Adresse IP de l''utilisateur';
COMMENT ON COLUMN audit_logs.user_agent IS 'User-Agent du navigateur';

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Activer RLS sur la table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres logs
CREATE POLICY "Users can create their own audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Personne ne peut modifier ou supprimer les logs (immutabilité)
-- Les logs sont en lecture seule après création pour garantir l'intégrité de l'audit trail

-- ═══════════════════════════════════════════════════════════════════════════
-- Fonction de nettoyage automatique (Politique de rétention RGPD)
-- ═══════════════════════════════════════════════════════════════════════════

-- Fonction pour supprimer les logs de plus de 90 jours (conformité RGPD)
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
  RAISE NOTICE 'Logs de plus de 90 jours supprimés';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire sur la fonction
COMMENT ON FUNCTION delete_old_audit_logs() IS 'Supprime les logs de plus de 90 jours pour conformité RGPD. À exécuter via un cron job Supabase.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Instructions de configuration
-- ═══════════════════════════════════════════════════════════════════════════

-- Pour configurer un cron job automatique dans Supabase:
-- 1. Aller dans Database > Extensions
-- 2. Activer l'extension "pg_cron"
-- 3. Exécuter la commande suivante pour créer un job quotidien:
--
-- SELECT cron.schedule(
--   'delete-old-audit-logs',
--   '0 2 * * *', -- Tous les jours à 2h du matin
--   'SELECT delete_old_audit_logs();'
-- );

-- ═══════════════════════════════════════════════════════════════════════════
-- Vérification de l'installation
-- ═══════════════════════════════════════════════════════════════════════════

-- Vérifier que la table a été créée correctement
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    RAISE NOTICE '✅ Table audit_logs créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Erreur: La table audit_logs n''a pas été créée';
  END IF;
END $$;
