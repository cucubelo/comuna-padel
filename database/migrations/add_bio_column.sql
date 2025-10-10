-- Agregar columna bio a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN bio TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN profiles.bio IS 'Biografía del usuario, descripción personal y experiencia en padel';