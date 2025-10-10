-- Migración para agregar campos de código postal a la tabla groups
-- Ejecutar en Supabase SQL Editor

-- Agregar campos de código postal a la tabla groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS place_name VARCHAR(200);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_name1 VARCHAR(200); -- Comunidad/Estado/Provincia
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_name2 VARCHAR(200); -- Provincia/Condado  
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_name3 VARCHAR(200); -- Municipio/Ciudad
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_code1 VARCHAR(20);  -- Código de Comunidad/Estado
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_code2 VARCHAR(20);  -- Código de Provincia
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_code3 VARCHAR(20);  -- Código de Municipio
ALTER TABLE groups ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE groups ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_groups_postal_code ON groups (postal_code);
CREATE INDEX IF NOT EXISTS idx_groups_place_name ON groups (place_name);
CREATE INDEX IF NOT EXISTS idx_groups_admin1 ON groups (admin_name1);
CREATE INDEX IF NOT EXISTS idx_groups_location_coords ON groups (latitude, longitude);

-- Comentarios para documentar los campos
COMMENT ON COLUMN groups.postal_code IS 'Código postal del grupo';
COMMENT ON COLUMN groups.place_name IS 'Nombre del lugar/localidad del grupo';
COMMENT ON COLUMN groups.admin_name1 IS 'División administrativa nivel 1 (Comunidad/Estado)';
COMMENT ON COLUMN groups.admin_name2 IS 'División administrativa nivel 2 (Provincia)';
COMMENT ON COLUMN groups.admin_name3 IS 'División administrativa nivel 3 (Municipio)';
COMMENT ON COLUMN groups.admin_code1 IS 'Código de división administrativa nivel 1';
COMMENT ON COLUMN groups.admin_code2 IS 'Código de división administrativa nivel 2';
COMMENT ON COLUMN groups.admin_code3 IS 'Código de división administrativa nivel 3';
COMMENT ON COLUMN groups.latitude IS 'Latitud de la ubicación del grupo';
COMMENT ON COLUMN groups.longitude IS 'Longitud de la ubicación del grupo';