-- SQL para ejecutar en Supabase Dashboard
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
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  CONSTRAINT unique_location UNIQUE(name, country_code)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_popular_locations_search ON popular_locations 
USING GIN (to_tsvector('spanish', name || ' ' || display_name));

CREATE INDEX idx_popular_locations_country ON popular_locations (country_code);
CREATE INDEX idx_popular_locations_popularity ON popular_locations (search_count DESC);

-- Insertar datos iniciales
INSERT INTO popular_locations (name, display_name, city, state, country, country_code, latitude, longitude, search_count) VALUES

-- ESPAÑA - CIUDADES PRINCIPALES
('Madrid', 'Madrid, España', 'Madrid', 'Comunidad de Madrid', 'España', 'ES', 40.4168, -3.7038, 100),
('Barcelona', 'Barcelona, España', 'Barcelona', 'Cataluña', 'España', 'ES', 41.3851, 2.1734, 95),
('Valencia', 'Valencia, España', 'Valencia', 'Comunidad Valenciana', 'España', 'ES', 39.4699, -0.3763, 85),
('Sevilla', 'Sevilla, España', 'Sevilla', 'Andalucía', 'España', 'ES', 37.3891, -5.9845, 80),
('Zaragoza', 'Zaragoza, España', 'Zaragoza', 'Aragón', 'España', 'ES', 41.6488, -0.8891, 75),
('Málaga', 'Málaga, España', 'Málaga', 'Andalucía', 'España', 'ES', 36.7213, -4.4214, 70),
('Murcia', 'Murcia, España', 'Murcia', 'Región de Murcia', 'España', 'ES', 37.9922, -1.1307, 65),
('Palma', 'Palma, Islas Baleares, España', 'Palma', 'Islas Baleares', 'España', 'ES', 39.5696, 2.6502, 60),
('Las Palmas', 'Las Palmas de Gran Canaria, España', 'Las Palmas', 'Canarias', 'España', 'ES', 28.1248, -15.4300, 55),
('Bilbao', 'Bilbao, España', 'Bilbao', 'País Vasco', 'España', 'ES', 43.2627, -2.9253, 50),

-- COMUNIDAD VALENCIANA - LOCALIDADES ESPECÍFICAS
('Xàtiva', 'Xàtiva, Valencia, España', 'Xàtiva', 'Valencia', 'España', 'ES', 38.9879, -0.5180, 45),
('Gandia', 'Gandia, Valencia, España', 'Gandia', 'Valencia', 'España', 'ES', 38.9667, -0.1833, 40),
('Sagunto', 'Sagunto, Valencia, España', 'Sagunto', 'Valencia', 'España', 'ES', 39.6833, -0.2667, 35),
('Alzira', 'Alzira, Valencia, España', 'Alzira', 'Valencia', 'España', 'ES', 39.1500, -0.4333, 30),
('Cullera', 'Cullera, Valencia, España', 'Cullera', 'Valencia', 'España', 'ES', 39.1667, -0.2500, 25),
('Torrent', 'Torrent, Valencia, España', 'Torrent', 'Valencia', 'España', 'ES', 39.4333, -0.4667, 30),
('Paterna', 'Paterna, Valencia, España', 'Paterna', 'Valencia', 'España', 'ES', 39.5000, -0.4333, 25),
('Burjassot', 'Burjassot, Valencia, España', 'Burjassot', 'Valencia', 'España', 'ES', 39.5092, -0.4103, 20),
('Castellón de la Plana', 'Castellón de la Plana, Castellón, España', 'Castellón de la Plana', 'Castellón', 'España', 'ES', 39.9864, -0.0513, 50),
('Alicante', 'Alicante, España', 'Alicante', 'Alicante', 'España', 'ES', 38.3452, -0.4810, 60),
('Elche', 'Elche, Alicante, España', 'Elche', 'Alicante', 'España', 'ES', 38.2622, -0.7011, 45),
('Benidorm', 'Benidorm, Alicante, España', 'Benidorm', 'Alicante', 'España', 'ES', 38.5387, -0.1312, 40),
('Denia', 'Denia, Alicante, España', 'Denia', 'Alicante', 'España', 'ES', 38.8408, 0.1059, 35),

-- MADRID - LOCALIDADES Y BARRIOS
('Alcalá de Henares', 'Alcalá de Henares, Madrid, España', 'Alcalá de Henares', 'Madrid', 'España', 'ES', 40.4817, -3.3616, 40),
('Getafe', 'Getafe, Madrid, España', 'Getafe', 'Madrid', 'España', 'ES', 40.3058, -3.7325, 35),
('Leganés', 'Leganés, Madrid, España', 'Leganés', 'Madrid', 'España', 'ES', 40.3167, -3.7500, 30),
('Fuenlabrada', 'Fuenlabrada, Madrid, España', 'Fuenlabrada', 'Madrid', 'España', 'ES', 40.2833, -3.8000, 25),
('Móstoles', 'Móstoles, Madrid, España', 'Móstoles', 'Madrid', 'España', 'ES', 40.3167, -3.8667, 30),
('Las Rozas', 'Las Rozas de Madrid, Madrid, España', 'Las Rozas', 'Madrid', 'España', 'ES', 40.4928, -3.8736, 25),
('Majadahonda', 'Majadahonda, Madrid, España', 'Majadahonda', 'Madrid', 'España', 'ES', 40.4731, -3.8708, 20),

-- BARCELONA - LOCALIDADES Y BARRIOS
('Sabadell', 'Sabadell, Barcelona, España', 'Sabadell', 'Barcelona', 'España', 'ES', 41.5431, 2.1089, 40),
('Terrassa', 'Terrassa, Barcelona, España', 'Terrassa', 'Barcelona', 'España', 'ES', 41.5647, 2.0058, 35),
('Badalona', 'Badalona, Barcelona, España', 'Badalona', 'Barcelona', 'España', 'ES', 41.4500, 2.2472, 30),
('Hospitalet de Llobregat', 'L''Hospitalet de Llobregat, Barcelona, España', 'L''Hospitalet de Llobregat', 'Barcelona', 'España', 'ES', 41.3597, 2.1000, 35),
('Mataró', 'Mataró, Barcelona, España', 'Mataró', 'Barcelona', 'España', 'ES', 41.5333, 2.4500, 25),
('Sitges', 'Sitges, Barcelona, España', 'Sitges', 'Barcelona', 'España', 'ES', 41.2372, 1.8056, 30),

-- ANDALUCÍA - LOCALIDADES ESPECÍFICAS
('Jerez de la Frontera', 'Jerez de la Frontera, Cádiz, España', 'Jerez de la Frontera', 'Cádiz', 'España', 'ES', 36.6833, -6.1333, 45),
('Cádiz', 'Cádiz, España', 'Cádiz', 'Cádiz', 'España', 'ES', 36.5167, -6.2833, 40),
('Córdoba', 'Córdoba, España', 'Córdoba', 'Córdoba', 'España', 'ES', 37.8833, -4.7667, 50),
('Granada', 'Granada, España', 'Granada', 'Granada', 'España', 'ES', 37.1833, -3.6000, 55),
('Almería', 'Almería, España', 'Almería', 'Almería', 'España', 'ES', 36.8333, -2.4667, 35),
('Jaén', 'Jaén, España', 'Jaén', 'Jaén', 'España', 'ES', 37.7667, -3.7833, 30),
('Huelva', 'Huelva, España', 'Huelva', 'Huelva', 'España', 'ES', 37.2667, -6.9500, 25),
('Marbella', 'Marbella, Málaga, España', 'Marbella', 'Málaga', 'España', 'ES', 36.5167, -4.8833, 45),
('Estepona', 'Estepona, Málaga, España', 'Estepona', 'Málaga', 'España', 'ES', 36.4278, -5.1453, 30),

-- PAÍS VASCO - LOCALIDADES ESPECÍFICAS
('San Sebastián', 'San Sebastián, Gipuzkoa, España', 'San Sebastián', 'Gipuzkoa', 'España', 'ES', 43.3183, -1.9812, 45),
('Vitoria-Gasteiz', 'Vitoria-Gasteiz, Álava, España', 'Vitoria-Gasteiz', 'Álava', 'España', 'ES', 42.8467, -2.6716, 40),
('Barakaldo', 'Barakaldo, Bizkaia, España', 'Barakaldo', 'Bizkaia', 'España', 'ES', 43.2975, -2.9881, 25),

-- GALICIA - LOCALIDADES ESPECÍFICAS
('A Coruña', 'A Coruña, España', 'A Coruña', 'A Coruña', 'España', 'ES', 43.3623, -8.4115, 45),
('Vigo', 'Vigo, Pontevedra, España', 'Vigo', 'Pontevedra', 'España', 'ES', 42.2406, -8.7207, 50),
('Santiago de Compostela', 'Santiago de Compostela, A Coruña, España', 'Santiago de Compostela', 'A Coruña', 'España', 'ES', 42.8805, -8.5456, 40),
('Ourense', 'Ourense, España', 'Ourense', 'Ourense', 'España', 'ES', 42.3333, -7.8667, 30),

-- CASTILLA Y LEÓN - LOCALIDADES ESPECÍFICAS
('Valladolid', 'Valladolid, España', 'Valladolid', 'Valladolid', 'España', 'ES', 41.6500, -4.7167, 45),
('Salamanca', 'Salamanca, España', 'Salamanca', 'Salamanca', 'España', 'ES', 40.9667, -5.6667, 40),
('León', 'León, España', 'León', 'León', 'España', 'ES', 42.6000, -5.5667, 35),
('Burgos', 'Burgos, España', 'Burgos', 'Burgos', 'España', 'ES', 42.3500, -3.6833, 30),

-- ARGENTINA - CIUDADES PRINCIPALES
('Buenos Aires', 'Buenos Aires, Argentina', 'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Argentina', 'AR', -34.6118, -58.3960, 90),
('Córdoba', 'Córdoba, Argentina', 'Córdoba', 'Córdoba', 'Argentina', 'AR', -31.4201, -64.1888, 85),
('Rosario', 'Rosario, Santa Fe, Argentina', 'Rosario', 'Santa Fe', 'Argentina', 'AR', -32.9442, -60.6505, 80),
('Mendoza', 'Mendoza, Argentina', 'Mendoza', 'Mendoza', 'Argentina', 'AR', -32.8895, -68.8458, 75),
('La Plata', 'La Plata, Buenos Aires, Argentina', 'La Plata', 'Buenos Aires', 'Argentina', 'AR', -34.9215, -57.9545, 70),

-- ARGENTINA - GRAN BUENOS AIRES Y LOCALIDADES
('San Isidro', 'San Isidro, Buenos Aires, Argentina', 'San Isidro', 'Buenos Aires', 'Argentina', 'AR', -34.4708, -58.5133, 45),
('Vicente López', 'Vicente López, Buenos Aires, Argentina', 'Vicente López', 'Buenos Aires', 'Argentina', 'AR', -34.5267, -58.4775, 40),
('Tigre', 'Tigre, Buenos Aires, Argentina', 'Tigre', 'Buenos Aires', 'Argentina', 'AR', -34.4264, -58.5797, 35),
('San Fernando', 'San Fernando, Buenos Aires, Argentina', 'San Fernando', 'Buenos Aires', 'Argentina', 'AR', -34.4417, -58.5597, 30),
('Quilmes', 'Quilmes, Buenos Aires, Argentina', 'Quilmes', 'Buenos Aires', 'Argentina', 'AR', -34.7203, -58.2547, 40),
('Avellaneda', 'Avellaneda, Buenos Aires, Argentina', 'Avellaneda', 'Buenos Aires', 'Argentina', 'AR', -34.6622, -58.3642, 35),
('Lanús', 'Lanús, Buenos Aires, Argentina', 'Lanús', 'Buenos Aires', 'Argentina', 'AR', -34.7069, -58.3928, 30),
('Lomas de Zamora', 'Lomas de Zamora, Buenos Aires, Argentina', 'Lomas de Zamora', 'Buenos Aires', 'Argentina', 'AR', -34.7597, -58.4044, 25),
('Banfield', 'Banfield, Buenos Aires, Argentina', 'Banfield', 'Buenos Aires', 'Argentina', 'AR', -34.7453, -58.3906, 25),
('Temperley', 'Temperley, Buenos Aires, Argentina', 'Temperley', 'Buenos Aires', 'Argentina', 'AR', -34.7667, -58.3833, 20),

-- CÓRDOBA - LOCALIDADES
('Villa Carlos Paz', 'Villa Carlos Paz, Córdoba, Argentina', 'Villa Carlos Paz', 'Córdoba', 'Argentina', 'AR', -31.4242, -64.4978, 35),
('Río Cuarto', 'Río Cuarto, Córdoba, Argentina', 'Río Cuarto', 'Córdoba', 'Argentina', 'AR', -33.1306, -64.3497, 30),
('Villa María', 'Villa María, Córdoba, Argentina', 'Villa María', 'Córdoba', 'Argentina', 'AR', -32.4075, -63.2403, 25),

-- MÉXICO - CIUDADES PRINCIPALES
('Ciudad de México', 'Ciudad de México, México', 'Ciudad de México', 'Ciudad de México', 'México', 'MX', 19.4326, -99.1332, 95),
('Guadalajara', 'Guadalajara, Jalisco, México', 'Guadalajara', 'Jalisco', 'México', 'MX', 20.6597, -103.3496, 85),
('Monterrey', 'Monterrey, Nuevo León, México', 'Monterrey', 'Nuevo León', 'México', 'MX', 25.6866, -100.3161, 80),
('Puebla', 'Puebla, México', 'Puebla', 'Puebla', 'México', 'MX', 19.0414, -98.2063, 70),
('Tijuana', 'Tijuana, Baja California, México', 'Tijuana', 'Baja California', 'México', 'MX', 32.5149, -117.0382, 65),

-- MÉXICO - ZONA METROPOLITANA Y LOCALIDADES
('Naucalpan', 'Naucalpan de Juárez, Estado de México, México', 'Naucalpan', 'Estado de México', 'México', 'MX', 19.4736, -99.2386, 40),
('Tlalnepantla', 'Tlalnepantla de Baz, Estado de México, México', 'Tlalnepantla', 'Estado de México', 'México', 'MX', 19.5408, -99.1958, 35),
('Nezahualcóyotl', 'Ciudad Nezahualcóyotl, Estado de México, México', 'Nezahualcóyotl', 'Estado de México', 'México', 'MX', 19.4003, -99.0142, 45),
('Ecatepec', 'Ecatepec de Morelos, Estado de México, México', 'Ecatepec', 'Estado de México', 'México', 'MX', 19.6019, -99.0608, 40),
('Cuernavaca', 'Cuernavaca, Morelos, México', 'Cuernavaca', 'Morelos', 'México', 'MX', 18.9219, -99.2419, 35),
('Toluca', 'Toluca, Estado de México, México', 'Toluca', 'Estado de México', 'México', 'MX', 19.2889, -99.6556, 40),

-- JALISCO - LOCALIDADES
('Zapopan', 'Zapopan, Jalisco, México', 'Zapopan', 'Jalisco', 'México', 'MX', 20.7233, -103.3925, 35),
('Tlaquepaque', 'San Pedro Tlaquepaque, Jalisco, México', 'Tlaquepaque', 'Jalisco', 'México', 'MX', 20.6403, -103.2928, 30),
('Puerto Vallarta', 'Puerto Vallarta, Jalisco, México', 'Puerto Vallarta', 'Jalisco', 'México', 'MX', 20.6534, -105.2253, 45),

-- COLOMBIA - CIUDADES PRINCIPALES
('Bogotá', 'Bogotá, Colombia', 'Bogotá', 'Cundinamarca', 'Colombia', 'CO', 4.7110, -74.0721, 90),
('Medellín', 'Medellín, Antioquia, Colombia', 'Medellín', 'Antioquia', 'Colombia', 'CO', 6.2442, -75.5812, 85),
('Cali', 'Cali, Valle del Cauca, Colombia', 'Cali', 'Valle del Cauca', 'Colombia', 'CO', 3.4516, -76.5320, 80),
('Barranquilla', 'Barranquilla, Atlántico, Colombia', 'Barranquilla', 'Atlántico', 'Colombia', 'CO', 10.9685, -74.7813, 75),

-- COLOMBIA - ÁREA METROPOLITANA Y LOCALIDADES
('Envigado', 'Envigado, Antioquia, Colombia', 'Envigado', 'Antioquia', 'Colombia', 'CO', 6.1667, -75.5833, 35),
('Itagüí', 'Itagüí, Antioquia, Colombia', 'Itagüí', 'Antioquia', 'Colombia', 'CO', 6.1644, -75.5994, 30),
('Sabaneta', 'Sabaneta, Antioquia, Colombia', 'Sabaneta', 'Antioquia', 'Colombia', 'CO', 6.1511, -75.6167, 25),
('Bello', 'Bello, Antioquia, Colombia', 'Bello', 'Antioquia', 'Colombia', 'CO', 6.3369, -75.5558, 30),
('Soacha', 'Soacha, Cundinamarca, Colombia', 'Soacha', 'Cundinamarca', 'Colombia', 'CO', 4.5928, -74.2169, 35),
('Chía', 'Chía, Cundinamarca, Colombia', 'Chía', 'Cundinamarca', 'Colombia', 'CO', 4.8619, -74.0581, 25),
('Cajicá', 'Cajicá, Cundinamarca, Colombia', 'Cajicá', 'Cundinamarca', 'Colombia', 'CO', 4.9186, -74.0281, 20),
('Cartagena', 'Cartagena, Bolívar, Colombia', 'Cartagena', 'Bolívar', 'Colombia', 'CO', 10.3910, -75.4794, 60),
('Santa Marta', 'Santa Marta, Magdalena, Colombia', 'Santa Marta', 'Magdalena', 'Colombia', 'CO', 11.2408, -74.1990, 40),

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
('Salvador', 'Salvador, Bahía, Brasil', 'Salvador', 'Bahía', 'Brasil', 'BR', -12.9714, -38.5014, 75),

-- COSTA RICA
('San José', 'San José, Costa Rica', 'San José', 'San José', 'Costa Rica', 'CR', 9.9281, -84.0907, 65),

-- PANAMÁ
('Ciudad de Panamá', 'Ciudad de Panamá, Panamá', 'Ciudad de Panamá', 'Panamá', 'Panamá', 'PA', 8.9824, -79.5199, 60),

-- GUATEMALA
('Ciudad de Guatemala', 'Ciudad de Guatemala, Guatemala', 'Ciudad de Guatemala', 'Guatemala', 'Guatemala', 'GT', 14.6349, -90.5069, 55),

-- REPÚBLICA DOMINICANA
('Santo Domingo', 'Santo Domingo, República Dominicana', 'Santo Domingo', 'Distrito Nacional', 'República Dominicana', 'DO', 18.4861, -69.9312, 60),

-- CUBA
('La Habana', 'La Habana, Cuba', 'La Habana', 'La Habana', 'Cuba', 'CU', 23.1136, -82.3666, 55);

-- Habilitar RLS (Row Level Security) si es necesario
-- ALTER TABLE popular_locations ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
-- CREATE POLICY "Allow read access to popular_locations" ON popular_locations
--   FOR SELECT USING (auth.role() = 'authenticated');

-- Verificar que los datos se insertaron correctamente
-- SELECT country, COUNT(*) as total_cities 
-- FROM popular_locations 
-- GROUP BY country 
-- ORDER BY total_cities DESC;