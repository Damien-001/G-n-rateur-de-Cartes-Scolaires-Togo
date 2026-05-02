-- Migration pour corriger les doublons dans school_info
-- À exécuter dans Supabase Dashboard > SQL Editor

-- 1. Supprimer les doublons en gardant le plus récent
DELETE FROM public.school_info a
USING public.school_info b
WHERE a.user_id = b.user_id
  AND a.updated_at < b.updated_at;

-- 2. S'assurer que la contrainte unique existe
ALTER TABLE public.school_info 
DROP CONSTRAINT IF EXISTS school_info_user_id_key;

ALTER TABLE public.school_info 
ADD CONSTRAINT school_info_user_id_key UNIQUE (user_id);

-- 3. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS school_info_user_id_idx ON public.school_info(user_id);

-- Vérification
SELECT user_id, COUNT(*) as count
FROM public.school_info
GROUP BY user_id
HAVING COUNT(*) > 1;
-- Cette requête devrait retourner 0 lignes
