-- Crear trigger para actualizar automáticamente updated_at en la tabla profiles
-- Este trigger se ejecutará cada vez que se actualice un registro en la tabla profiles

-- Crear o reemplazar la función que actualiza updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear el trigger para la tabla profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentario para documentar el trigger
COMMENT ON TRIGGER update_profiles_updated_at ON profiles IS 'Actualiza automáticamente el campo updated_at cuando se modifica un perfil';