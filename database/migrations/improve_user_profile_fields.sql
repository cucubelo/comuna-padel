-- Migración para mejorar los campos de perfil de usuario
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar campos first_name y last_name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Agregar campo birth_date
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 3. Asegurar que username tenga índice único para prevenir duplicados
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON profiles(username);

-- 4. Migrar datos existentes de full_name a first_name y last_name
-- Solo para registros que tengan full_name pero no tengan first_name/last_name
UPDATE profiles 
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL AND last_name IS NULL AND full_name IS NOT NULL;

-- 5. Comentarios para documentar los nuevos campos
COMMENT ON COLUMN profiles.first_name IS 'Nombre del usuario';
COMMENT ON COLUMN profiles.last_name IS 'Apellido del usuario';
COMMENT ON COLUMN profiles.birth_date IS 'Fecha de nacimiento del usuario';
COMMENT ON INDEX profiles_username_unique IS 'Índice único para garantizar usernames únicos';

-- 6. Función para validar username (solo letras, números y guiones bajos)
CREATE OR REPLACE FUNCTION validate_username(username_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Username debe tener entre 3 y 30 caracteres
  -- Solo puede contener letras, números y guiones bajos
  -- Debe empezar con letra o número
  RETURN username_input ~ '^[a-zA-Z0-9][a-zA-Z0-9_]{2,29}$';
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para validar username antes de insert/update
CREATE OR REPLACE FUNCTION check_username_validity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NOT NULL AND NOT validate_username(NEW.username) THEN
    RAISE EXCEPTION 'Username inválido. Debe tener 3-30 caracteres, solo letras, números y guiones bajos, y empezar con letra o número.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS validate_username_trigger ON profiles;
CREATE TRIGGER validate_username_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_username_validity();