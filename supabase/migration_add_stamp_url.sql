-- Migration pour ajouter le champ stamp_url à la table school_info
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Ajouter la colonne stamp_url si elle n'existe pas déjà
ALTER TABLE public.school_info 
ADD COLUMN IF NOT EXISTS stamp_url text;

-- Commentaire pour documenter la migration
COMMENT ON COLUMN public.school_info.stamp_url IS 'URL du cachet de l''école (ajouté pour séparer signature et cachet)';