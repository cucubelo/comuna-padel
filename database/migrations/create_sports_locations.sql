-- Crear tabla de ubicaciones deportivas (clubes, gimnasios, etc.)
CREATE TABLE sports_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE,          -- ID único de Google Places
  name TEXT NOT NULL,                   -- "Club de Tenis Las Rozas"
  address TEXT NOT NULL,                -- "Calle Mayor 123, Las Rozas, Madrid"
  city TEXT,                           -- "Las Rozas"
  state TEXT,                          -- "Comunidad de Madrid"
  country TEXT NOT NULL,               -- "España"
  country_code TEXT NOT NULL,          -- "ES"
  latitude NUMERIC,                    -- 40.4168
  longitude NUMERIC,                   -- -3.7038
  phone TEXT,                          -- "+34 91 123 45 67"
  website TEXT,                        -- "https://clubtenis.com"
  rating NUMERIC(2,1),                 -- 4.5
  price_level INTEGER,                 -- 1-4 (Google Places price level)
  
  -- Categorización deportiva
  category TEXT NOT NULL CHECK (category IN (
    'club_tenis', 'club_padel', 'club_deportivo', 'gimnasio', 
    'polideportivo', 'centro_fitness', 'piscina', 'campo_futbol'
  )),
  
  -- Tipos de Google Places (array)
  google_types TEXT[],                 -- ['gym', 'sports_club', 'establishment']
  
  -- Metadatos de uso
  usage_count INTEGER DEFAULT 1,       -- Cuántas veces se ha seleccionado
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Validación y moderación
  is_verified BOOLEAN DEFAULT FALSE,   -- Verificado por admin o usuarios
  is_active BOOLEAN DEFAULT TRUE,      -- Activo/inactivo
  
  -- Constraint para evitar duplicados por nombre y ciudad
  CONSTRAINT unique_sports_location UNIQUE(name, city, country_code)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_sports_locations_search ON sports_locations 
USING GIN (to_tsvector('spanish', name || ' ' || address));

CREATE INDEX idx_sports_locations_country ON sports_locations (country_code);
CREATE INDEX idx_sports_locations_category ON sports_locations (category);
CREATE INDEX idx_sports_locations_popularity ON sports_locations (usage_count DESC);
CREATE INDEX idx_sports_locations_google_place_id ON sports_locations (google_place_id);
CREATE INDEX idx_sports_locations_location ON sports_locations (latitude, longitude);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_sports_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sports_locations_updated_at
    BEFORE UPDATE ON sports_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_sports_locations_updated_at();

-- Función para incrementar contador de uso
CREATE OR REPLACE FUNCTION increment_sports_location_usage(location_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE sports_locations 
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = location_id;
END;
$$ LANGUAGE plpgsql;

-- Insertar algunos datos iniciales de ejemplo (clubes conocidos en España)
INSERT INTO sports_locations (
  name, address, city, state, country, country_code, 
  latitude, longitude, category, google_types, usage_count, is_verified
) VALUES
-- Madrid
('Club de Campo Villa de Madrid', 'Carretera de Castilla, Km 2, 28040 Madrid', 'Madrid', 'Comunidad de Madrid', 'España', 'ES', 40.4500, -3.7500, 'club_deportivo', ARRAY['sports_club', 'establishment'], 50, TRUE),
('Real Club de Tenis Chamartín', 'Federico Salmón, 2, 28036 Madrid', 'Madrid', 'Comunidad de Madrid', 'España', 'ES', 40.4600, -3.6800, 'club_tenis', ARRAY['sports_club', 'establishment'], 45, TRUE),
('Club de Tenis Las Rozas', 'Av. de Atenas, 28232 Las Rozas de Madrid', 'Las Rozas', 'Comunidad de Madrid', 'España', 'ES', 40.4900, -3.8700, 'club_tenis', ARRAY['sports_club', 'establishment'], 40, TRUE),

-- Barcelona
('Real Club de Tenis Barcelona', 'Bosch i Gimpera, 5, 08034 Barcelona', 'Barcelona', 'Cataluña', 'España', 'ES', 41.3900, 2.1400, 'club_tenis', ARRAY['sports_club', 'establishment'], 48, TRUE),
('Club de Tenis Vall Parc', 'Carretera de la Rabassada, 79, 08035 Barcelona', 'Barcelona', 'Cataluña', 'España', 'ES', 41.4200, 2.1300, 'club_tenis', ARRAY['sports_club', 'establishment'], 42, TRUE),

-- Valencia
('Club de Tenis Valencia', 'Av. de los Naranjos, 46023 Valencia', 'Valencia', 'Comunidad Valenciana', 'España', 'ES', 39.4800, -0.3600, 'club_tenis', ARRAY['sports_club', 'establishment'], 38, TRUE),

-- Sevilla
('Real Club de Tenis Betis', 'Av. de Heliópolis, 41012 Sevilla', 'Sevilla', 'Andalucía', 'España', 'ES', 37.3600, -5.9700, 'club_tenis', ARRAY['sports_club', 'establishment'], 35, TRUE);