-- Crear tabla de países
CREATE TABLE countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code CHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    flag_emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar países principales (enfoque en países hispanohablantes y otros relevantes)
INSERT INTO countries (country_code, country_name, flag_emoji) VALUES
('ES', 'España', '🇪🇸'),
('AR', 'Argentina', '🇦🇷'),
('MX', 'México', '🇲🇽'),
('CO', 'Colombia', '🇨🇴'),
('CL', 'Chile', '🇨🇱'),
('PE', 'Perú', '🇵🇪'),
('EC', 'Ecuador', '🇪🇨'),
('UY', 'Uruguay', '🇺🇾'),
('BR', 'Brasil', '🇧🇷'),
('VE', 'Venezuela', '🇻🇪'),
('BO', 'Bolivia', '🇧🇴'),
('PY', 'Paraguay', '🇵🇾'),
('CR', 'Costa Rica', '🇨🇷'),
('PA', 'Panamá', '🇵🇦'),
('GT', 'Guatemala', '🇬🇹'),
('HN', 'Honduras', '🇭🇳'),
('SV', 'El Salvador', '🇸🇻'),
('NI', 'Nicaragua', '🇳🇮'),
('CU', 'Cuba', '🇨🇺'),
('DO', 'República Dominicana', '🇩🇴'),
('PR', 'Puerto Rico', '🇵🇷'),
('US', 'Estados Unidos', '🇺🇸'),
('CA', 'Canadá', '🇨🇦'),
('FR', 'Francia', '🇫🇷'),
('IT', 'Italia', '🇮🇹'),
('PT', 'Portugal', '🇵🇹'),
('DE', 'Alemania', '🇩🇪'),
('GB', 'Reino Unido', '🇬🇧'),
('NL', 'Países Bajos', '🇳🇱'),
('BE', 'Bélgica', '🇧🇪'),
('CH', 'Suiza', '🇨🇭'),
('AT', 'Austria', '🇦🇹'),
('SE', 'Suecia', '🇸🇪'),
('NO', 'Noruega', '🇳🇴'),
('DK', 'Dinamarca', '🇩🇰'),
('FI', 'Finlandia', '🇫🇮'),
('PL', 'Polonia', '🇵🇱'),
('CZ', 'República Checa', '🇨🇿'),
('HU', 'Hungría', '🇭🇺'),
('RO', 'Rumania', '🇷🇴'),
('BG', 'Bulgaria', '🇧🇬'),
('HR', 'Croacia', '🇭🇷'),
('SI', 'Eslovenia', '🇸🇮'),
('SK', 'Eslovaquia', '🇸🇰'),
('EE', 'Estonia', '🇪🇪'),
('LV', 'Letonia', '🇱🇻'),
('LT', 'Lituania', '🇱🇹'),
('IE', 'Irlanda', '🇮🇪'),
('IS', 'Islandia', '🇮🇸'),
('MT', 'Malta', '🇲🇹'),
('CY', 'Chipre', '🇨🇾'),
('LU', 'Luxemburgo', '🇱🇺'),
('MC', 'Mónaco', '🇲🇨'),
('AD', 'Andorra', '🇦🇩'),
('SM', 'San Marino', '🇸🇲'),
('VA', 'Ciudad del Vaticano', '🇻🇦'),
('LI', 'Liechtenstein', '🇱🇮');

-- Crear índices
CREATE INDEX idx_countries_country_code ON countries (country_code);
CREATE INDEX idx_countries_country_name ON countries (country_name);

-- Comentarios
COMMENT ON TABLE countries IS 'Tabla de países con códigos ISO y banderas';
COMMENT ON COLUMN countries.country_code IS 'Código ISO 3166-1 alpha-2 del país';
COMMENT ON COLUMN countries.country_name IS 'Nombre del país en español';
COMMENT ON COLUMN countries.flag_emoji IS 'Emoji de la bandera del país';