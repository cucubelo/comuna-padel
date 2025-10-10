-- Crear tabla de códigos postales basada en la API de GeoNames
CREATE TABLE postal_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    postal_code VARCHAR(20) NOT NULL,
    country_code CHAR(2) NOT NULL,
    place_name VARCHAR(200) NOT NULL,
    admin_name1 VARCHAR(200), -- Comunidad/Estado/Provincia
    admin_name2 VARCHAR(200), -- Provincia/Condado
    admin_name3 VARCHAR(200), -- Municipio/Ciudad
    admin_code1 VARCHAR(20),  -- Código de Comunidad/Estado
    admin_code2 VARCHAR(20),  -- Código de Provincia
    admin_code3 VARCHAR(20),  -- Código de Municipio
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    search_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índice único compuesto para evitar duplicados
    UNIQUE(postal_code, country_code, place_name)
);

-- Crear índices para búsquedas eficientes
CREATE INDEX idx_postal_codes_postal_country ON postal_codes (postal_code, country_code);
CREATE INDEX idx_postal_codes_country ON postal_codes (country_code);
CREATE INDEX idx_postal_codes_place_name ON postal_codes (place_name);
CREATE INDEX idx_postal_codes_search_count ON postal_codes (search_count DESC);
CREATE INDEX idx_postal_codes_admin1 ON postal_codes (admin_name1);
CREATE INDEX idx_postal_codes_admin2 ON postal_codes (admin_name2);
CREATE INDEX idx_postal_codes_admin3 ON postal_codes (admin_name3);

-- Comentarios para documentar la estructura
COMMENT ON TABLE postal_codes IS 'Códigos postales obtenidos de la API de GeoNames';
COMMENT ON COLUMN postal_codes.postal_code IS 'Código postal';
COMMENT ON COLUMN postal_codes.country_code IS 'Código ISO del país (2 letras)';
COMMENT ON COLUMN postal_codes.place_name IS 'Nombre del lugar/localidad';
COMMENT ON COLUMN postal_codes.admin_name1 IS 'Nombre de la división administrativa nivel 1 (Comunidad/Estado)';
COMMENT ON COLUMN postal_codes.admin_name2 IS 'Nombre de la división administrativa nivel 2 (Provincia)';
COMMENT ON COLUMN postal_codes.admin_name3 IS 'Nombre de la división administrativa nivel 3 (Municipio)';
COMMENT ON COLUMN postal_codes.admin_code1 IS 'Código de la división administrativa nivel 1';
COMMENT ON COLUMN postal_codes.admin_code2 IS 'Código de la división administrativa nivel 2';
COMMENT ON COLUMN postal_codes.admin_code3 IS 'Código de la división administrativa nivel 3';
COMMENT ON COLUMN postal_codes.latitude IS 'Latitud del lugar';
COMMENT ON COLUMN postal_codes.longitude IS 'Longitud del lugar';
COMMENT ON COLUMN postal_codes.search_count IS 'Número de veces que se ha buscado este código postal';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_postal_codes_updated_at 
    BEFORE UPDATE ON postal_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();