-- Migration pour ajouter le champ expiration_date à la table students
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Ajouter la colonne expiration_date si elle n'existe pas déjà
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS expiration_date text;

-- Commentaire pour documenter la migration
COMMENT ON COLUMN public.students.expiration_date IS 'Date d''expiration de la carte scolaire';