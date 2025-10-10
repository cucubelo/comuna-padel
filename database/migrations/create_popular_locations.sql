-- Crear tabla de ubicaciones populares para España y Latinoamérica
CREATE TABLE popular_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- "Madrid", "Buenos Aires"
  display_name TEXT NOT NULL,   -- "Madrid, España", "Buenos Aires, Argentina"
  city TEXT,                    -- "Madrid"
  state TEXT,                   -- "Comunidad de Madrid", "Ciudad Autónoma de Buenos Aires"
  country TEXT NOT NULL,        -- "España", "Argentina"
  country_code TEXT NOT NULL,   -- "ES", "AR"
  latitude NUMERIC,             -- 40.4168
  longitude NUMERIC,            -- -3.7038
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  CONSTRAINT unique_location UNIQUE(name, country_code)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_popular_locations_search ON popular_locations 
USING GIN (to_tsvector('spanish', name || ' ' || display_name));

CREATE INDEX idx_popular_locations_country ON popular_locations (country_code);
CREATE INDEX idx_popular_locations_popularity ON popular_locations (search_count DESC);

-- Insertar datos iniciales de España y Latinoamérica
INSERT INTO popular_locations (name, display_name, city, state, country, country_code, latitude, longitude, search_count) VALUES
-- ESPAÑA
('Madrid', 'Madrid, España', 'Madrid', 'Comunidad de Madrid', 'España', 'ES', 40.4168, -3.7038, 100),
('Barcelona', 'Barcelona, España', 'Barcelona', 'Cataluña', 'España', 'ES', 41.3851, 2.1734, 95),
('Valencia', 'Valencia, España', 'Valencia', 'Comunidad Valenciana', 'España', 'ES', 39.4699, -0.3763, 80),
('Sevilla', 'Sevilla, España', 'Sevilla', 'Andalucía', 'España', 'ES', 37.3891, -5.9845, 75),
('Bilbao', 'Bilbao, España', 'Bilbao', 'País Vasco', 'España', 'ES', 43.2627, -2.9253, 70),
('Málaga', 'Málaga, España', 'Málaga', 'Andalucía', 'España', 'ES', 36.7213, -4.4214, 65),
('Zaragoza', 'Zaragoza, España', 'Zaragoza', 'Aragón', 'España', 'ES', 41.6488, -0.8891, 60),
('Murcia', 'Murcia, España', 'Murcia', 'Región de Murcia', 'España', 'ES', 37.9922, -1.1307, 55),
('Palma', 'Palma, Islas Baleares, España', 'Palma', 'Islas Baleares', 'España', 'ES', 39.5696, 2.6502, 50),
('Las Palmas', 'Las Palmas de Gran Canaria, España', 'Las Palmas', 'Canarias', 'España', 'ES', 28.1248, -15.4300, 45),

-- ARGENTINA
('Buenos Aires', 'Buenos Aires, Argentina', 'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Argentina', 'AR', -34.6118, -58.3960, 90),
('Córdoba', 'Córdoba, Argentina', 'Córdoba', 'Córdoba', 'Argentina', 'AR', -31.4201, -64.1888, 85),
('Rosario', 'Rosario, Santa Fe, Argentina', 'Rosario', 'Santa Fe', 'Argentina', 'AR', -32.9442, -60.6505, 80),
('Mendoza', 'Mendoza, Argentina', 'Mendoza', 'Mendoza', 'Argentina', 'AR', -32.8895, -68.8458, 75),
('La Plata', 'La Plata, Buenos Aires, Argentina', 'La Plata', 'Buenos Aires', 'Argentina', 'AR', -34.9215, -57.9545, 70),

-- MÉXICO
('Ciudad de México', 'Ciudad de México, México', 'Ciudad de México', 'Ciudad de México', 'México', 'MX', 19.4326, -99.1332, 95),
('Guadalajara', 'Guadalajara, Jalisco, México', 'Guadalajara', 'Jalisco', 'México', 'MX', 20.6597, -103.3496, 85),
('Monterrey', 'Monterrey, Nuevo León, México', 'Monterrey', 'Nuevo León', 'México', 'MX', 25.6866, -100.3161, 80),
('Puebla', 'Puebla, México', 'Puebla', 'Puebla', 'México', 'MX', 19.0414, -98.2063, 70),
('Tijuana', 'Tijuana, Baja California, México', 'Tijuana', 'Baja California', 'México', 'MX', 32.5149, -117.0382, 65),

-- COLOMBIA
('Bogotá', 'Bogotá, Colombia', 'Bogotá', 'Cundinamarca', 'Colombia', 'CO', 4.7110, -74.0721, 90),
('Medellín', 'Medellín, Antioquia, Colombia', 'Medellín', 'Antioquia', 'Colombia', 'CO', 6.2442, -75.5812, 85),
('Cali', 'Cali, Valle del Cauca, Colombia', 'Cali', 'Valle del Cauca', 'Colombia', 'CO', 3.4516, -76.5320, 80),
('Barranquilla', 'Barranquilla, Atlántico, Colombia', 'Barranquilla', 'Atlántico', 'Colombia', 'CO', 10.9685, -74.7813, 75),

-- CHILE
('Santiago', 'Santiago, Chile', 'Santiago', 'Región Metropolitana', 'Chile', 'CL', -33.4489, -70.6693, 90),
('Valparaíso', 'Valparaíso, Chile', 'Valparaíso', 'Valparaíso', 'Chile', 'CL', -33.0472, -71.6127, 75),
('Concepción', 'Concepción, Chile', 'Concepción', 'Biobío', 'Chile', 'CL', -36.8201, -73.0444, 70),

-- PERÚ
('Lima', 'Lima, Perú', 'Lima', 'Lima', 'Perú', 'PE', -12.0464, -77.0428, 85),
('Arequipa', 'Arequipa, Perú', 'Arequipa', 'Arequipa', 'Perú', 'PE', -16.4090, -71.5375, 70),
('Trujillo', 'Trujillo, La Libertad, Perú', 'Trujillo', 'La Libertad', 'Perú', 'PE', -8.1116, -79.0290, 65),

-- ECUADOR
('Quito', 'Quito, Ecuador', 'Quito', 'Pichincha', 'Ecuador', 'EC', -0.1807, -78.4678, 80),
('Guayaquil', 'Guayaquil, Ecuador', 'Guayaquil', 'Guayas', 'Ecuador', 'EC', -2.1709, -79.9224, 75),

-- VENEZUELA
('Caracas', 'Caracas, Venezuela', 'Caracas', 'Distrito Capital', 'Venezuela', 'VE', 10.4806, -66.9036, 80),
('Maracaibo', 'Maracaibo, Zulia, Venezuela', 'Maracaibo', 'Zulia', 'Venezuela', 'VE', 10.6666, -71.6124, 70),

-- URUGUAY
('Montevideo', 'Montevideo, Uruguay', 'Montevideo', 'Montevideo', 'Uruguay', 'UY', -34.9011, -56.1645, 75),

-- PARAGUAY
('Asunción', 'Asunción, Paraguay', 'Asunción', 'Asunción', 'Paraguay', 'PY', -25.2637, -57.5759, 70),

-- BOLIVIA
('La Paz', 'La Paz, Bolivia', 'La Paz', 'La Paz', 'Bolivia', 'BO', -16.5000, -68.1193, 70),
('Santa Cruz', 'Santa Cruz de la Sierra, Bolivia', 'Santa Cruz', 'Santa Cruz', 'Bolivia', 'BO', -17.7833, -63.1821, 65),

-- BRASIL (ciudades principales)
('São Paulo', 'São Paulo, Brasil', 'São Paulo', 'São Paulo', 'Brasil', 'BR', -23.5505, -46.6333, 95),
('Rio de Janeiro', 'Rio de Janeiro, Brasil', 'Rio de Janeiro', 'Rio de Janeiro', 'Brasil', 'BR', -22.9068, -43.1729, 90),
('Brasília', 'Brasília, Brasil', 'Brasília', 'Distrito Federal', 'Brasil', 'BR', -15.8267, -47.9218, 80),
('Salvador', 'Salvador, Bahía, Brasil', 'Salvador', 'Bahía', 'Brasil', 'BR', -12.9714, -38.5014, 75);