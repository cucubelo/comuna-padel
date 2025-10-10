-- Migración para agregar las columnas faltantes en la tabla profiles
-- Ejecutar en Supabase SQL Editor

-- Agregar columna phone (teléfono del usuario)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Agregar columna preferred_position (posición preferida en padel)
-- Primero verificar si el enum existe, si no, crearlo
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preferred_position') THEN
        CREATE TYPE preferred_position AS ENUM ('left', 'right', 'both');
    END IF;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_position preferred_position DEFAULT 'both';

-- Agregar columnas que faltan para ubicación
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN profiles.phone IS 'Número de teléfono del usuario';
COMMENT ON COLUMN profiles.preferred_position IS 'Posición preferida del usuario en padel (left, right, both)';
COMMENT ON COLUMN profiles.city IS 'Ciudad del usuario';
COMMENT ON COLUMN profiles.country IS 'País del usuario';