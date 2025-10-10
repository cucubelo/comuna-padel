-- Migración para agregar campos de país a la tabla groups
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas de país y código de país a la tabla groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN groups.country IS 'País del grupo';
COMMENT ON COLUMN groups.country_code IS 'Código ISO del país (2 letras)';

-- Crear índice para búsquedas por país
CREATE INDEX IF NOT EXISTS idx_groups_country_code ON groups (country_code);

-- Actualizar grupos existentes con datos de España por defecto (si es necesario)
-- Solo para grupos que tienen ciudad pero no país
UPDATE groups 
SET country = 'España', country_code = 'ES' 
WHERE city IS NOT NULL 
  AND country IS NULL 
  AND country_code IS NULL;