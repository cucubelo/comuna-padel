-- Agregar campos de código postal a la tabla profiles (estructura completa de GeoNames)
ALTER TABLE profiles 
ADD COLUMN postal_code VARCHAR(20),
ADD COLUMN place_name VARCHAR(200),
ADD COLUMN admin_name1 VARCHAR(200), -- Comunidad/Estado/Provincia
ADD COLUMN admin_name2 VARCHAR(200), -- Provincia/Condado  
ADD COLUMN admin_name3 VARCHAR(200), -- Municipio/Ciudad
ADD COLUMN admin_code1 VARCHAR(20),  -- Código de Comunidad/Estado
ADD COLUMN admin_code2 VARCHAR(20),  -- Código de Provincia
ADD COLUMN admin_code3 VARCHAR(20),  -- Código de Municipio
ADD COLUMN country_code CHAR(2),
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Mantener campos legacy por compatibilidad (pueden ser removidos después)
-- city y country ya existen como location, los mantenemos por ahora

-- Crear índices para búsquedas eficientes
CREATE INDEX idx_profiles_postal_code ON profiles (postal_code);
CREATE INDEX idx_profiles_country_code ON profiles (country_code);
CREATE INDEX idx_profiles_place_name ON profiles (place_name);
CREATE INDEX idx_profiles_admin1 ON profiles (admin_name1);
CREATE INDEX idx_profiles_location_coords ON profiles (latitude, longitude);

-- Comentarios para documentar los campos
COMMENT ON COLUMN profiles.postal_code IS 'Código postal del usuario';
COMMENT ON COLUMN profiles.place_name IS 'Nombre del lugar/localidad seleccionado';
COMMENT ON COLUMN profiles.admin_name1 IS 'División administrativa nivel 1 (Comunidad/Estado)';
COMMENT ON COLUMN profiles.admin_name2 IS 'División administrativa nivel 2 (Provincia)';
COMMENT ON COLUMN profiles.admin_name3 IS 'División administrativa nivel 3 (Municipio)';
COMMENT ON COLUMN profiles.admin_code1 IS 'Código de división administrativa nivel 1';
COMMENT ON COLUMN profiles.admin_code2 IS 'Código de división administrativa nivel 2';
COMMENT ON COLUMN profiles.admin_code3 IS 'Código de división administrativa nivel 3';
COMMENT ON COLUMN profiles.country_code IS 'Código ISO del país (2 letras)';
COMMENT ON COLUMN profiles.latitude IS 'Latitud de la ubicación del usuario';
COMMENT ON COLUMN profiles.longitude IS 'Longitud de la ubicación del usuario';