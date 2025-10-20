-- Migración para completar la transición de full_name a first_name/last_name
-- Ejecutar DESPUÉS de improve_user_profile_fields.sql

-- 1. Migrar cualquier dato restante de full_name que no se haya migrado
UPDATE profiles 
SET 
  first_name = CASE 
    WHEN (first_name IS NULL OR first_name = '') AND full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN split_part(full_name, ' ', 1)
    WHEN (first_name IS NULL OR first_name = '') AND full_name IS NOT NULL
    THEN full_name
    ELSE first_name
  END,
  last_name = CASE 
    WHEN (last_name IS NULL OR last_name = '') AND full_name IS NOT NULL AND position(' ' in full_name) > 0 
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE last_name
  END
WHERE full_name IS NOT NULL;

-- 2. Crear una función para obtener el nombre completo cuando sea necesario
CREATE OR REPLACE FUNCTION get_full_name(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
      first_name || ' ' || last_name
    WHEN first_name IS NOT NULL THEN 
      first_name
    WHEN last_name IS NOT NULL THEN 
      last_name
    ELSE 
      NULL
  END;
END;
$$ LANGUAGE plpgsql;

-- 3. Comentario para la función
COMMENT ON FUNCTION get_full_name(TEXT, TEXT) IS 'Función para concatenar first_name y last_name en un nombre completo';

-- 4. Eliminar la vista que depende de full_name (si existe)
DROP VIEW IF EXISTS profiles_with_full_name;

-- 5. Verificar que los datos han sido migrados correctamente
-- Mostrar registros donde full_name no coincide con la concatenación de first_name y last_name
SELECT 
  id, 
  full_name, 
  first_name, 
  last_name,
  get_full_name(first_name, last_name) as computed_full_name
FROM profiles 
WHERE full_name IS NOT NULL 
  AND full_name != get_full_name(first_name, last_name)
LIMIT 10;

-- 6. Eliminar la columna full_name (CUIDADO: esto es irreversible)
-- Ejecutar solo después de verificar que todos los datos han sido migrados correctamente
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;

-- 7. Crear una vista opcional para compatibilidad (usando los nuevos campos)
CREATE OR REPLACE VIEW profiles_with_full_name AS
SELECT 
  *,
  get_full_name(first_name, last_name) as full_name_computed
FROM profiles;