-- Crear sistema avanzado de resultados para partidos de pádel
-- Este sistema permite formar equipos mediante drag & drop y registrar múltiples sets

-- Tabla para almacenar los equipos formados en cada partido
CREATE TABLE IF NOT EXISTS match_teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
    player1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Asegurar que cada partido tenga máximo 2 equipos
    UNIQUE(match_id, team_number),
    -- Asegurar que un jugador no esté en ambos equipos del mismo partido
    CONSTRAINT unique_player_per_match EXCLUDE (match_id WITH =, player1_id WITH =),
    CONSTRAINT unique_player_per_match_2 EXCLUDE (match_id WITH =, player2_id WITH =)
);

-- Tabla para almacenar los sets individuales
CREATE TABLE IF NOT EXISTS match_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL CHECK (set_number > 0),
    team1_score INTEGER NOT NULL CHECK (team1_score >= 0 AND team1_score <= 99),
    team2_score INTEGER NOT NULL CHECK (team2_score >= 0 AND team2_score <= 99),
    is_tiebreak BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Asegurar que cada set sea único por partido
    UNIQUE(match_id, set_number)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_match_teams_match_id ON match_teams(match_id);
CREATE INDEX IF NOT EXISTS idx_match_teams_players ON match_teams(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_match_sets_match_id ON match_sets(match_id);
CREATE INDEX IF NOT EXISTS idx_match_sets_set_number ON match_sets(match_id, set_number);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_match_teams_updated_at 
    BEFORE UPDATE ON match_teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_sets_updated_at 
    BEFORE UPDATE ON match_sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar las tablas
COMMENT ON TABLE match_teams IS 'Almacena la formación de equipos para cada partido';
COMMENT ON COLUMN match_teams.team_number IS 'Número del equipo (1 o 2)';
COMMENT ON COLUMN match_teams.player1_id IS 'ID del primer jugador del equipo';
COMMENT ON COLUMN match_teams.player2_id IS 'ID del segundo jugador del equipo';

COMMENT ON TABLE match_sets IS 'Almacena los resultados de cada set individual';
COMMENT ON COLUMN match_sets.set_number IS 'Número del set (1, 2, 3, etc.)';
COMMENT ON COLUMN match_sets.team1_score IS 'Puntuación del equipo 1 en este set';
COMMENT ON COLUMN match_sets.team2_score IS 'Puntuación del equipo 2 en este set';
COMMENT ON COLUMN match_sets.is_tiebreak IS 'Indica si este set fue un tiebreak';