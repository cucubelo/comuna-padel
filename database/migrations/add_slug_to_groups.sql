-- Migración: Agregar campo slug a la tabla groups para URLs amigables
-- Fecha: 2024-12-17

-- 1. Agregar columna slug a la tabla groups
ALTER TABLE groups ADD COLUMN slug TEXT;

-- 2. Crear índice único para el slug
CREATE UNIQUE INDEX idx_groups_slug ON groups(slug);

-- 3. Función para generar slug desde el nombre
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT, group_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    short_id TEXT;
BEGIN
    -- Obtener los primeros 6 caracteres del UUID
    short_id := SUBSTRING(group_id::text, 1, 6);
    
    -- Generar slug base desde el nombre
    base_slug := LOWER(input_text);
    
    -- Reemplazar caracteres especiales españoles
    base_slug := REPLACE(base_slug, 'á', 'a');
    base_slug := REPLACE(base_slug, 'à', 'a');
    base_slug := REPLACE(base_slug, 'ä', 'a');
    base_slug := REPLACE(base_slug, 'â', 'a');
    base_slug := REPLACE(base_slug, 'é', 'e');
    base_slug := REPLACE(base_slug, 'è', 'e');
    base_slug := REPLACE(base_slug, 'ë', 'e');
    base_slug := REPLACE(base_slug, 'ê', 'e');
    base_slug := REPLACE(base_slug, 'í', 'i');
    base_slug := REPLACE(base_slug, 'ì', 'i');
    base_slug := REPLACE(base_slug, 'ï', 'i');
    base_slug := REPLACE(base_slug, 'î', 'i');
    base_slug := REPLACE(base_slug, 'ó', 'o');
    base_slug := REPLACE(base_slug, 'ò', 'o');
    base_slug := REPLACE(base_slug, 'ö', 'o');
    base_slug := REPLACE(base_slug, 'ô', 'o');
    base_slug := REPLACE(base_slug, 'ú', 'u');
    base_slug := REPLACE(base_slug, 'ù', 'u');
    base_slug := REPLACE(base_slug, 'ü', 'u');
    base_slug := REPLACE(base_slug, 'û', 'u');
    base_slug := REPLACE(base_slug, 'ñ', 'n');
    base_slug := REPLACE(base_slug, 'ç', 'c');
    
    -- Reemplazar espacios y caracteres especiales con guiones
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9]', '-', 'g');
    
    -- Eliminar guiones múltiples
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    
    -- Eliminar guiones al inicio y final
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Limitar longitud del slug base a 50 caracteres
    IF LENGTH(base_slug) > 50 THEN
        base_slug := SUBSTRING(base_slug, 1, 50);
        base_slug := TRIM(TRAILING '-' FROM base_slug);
    END IF;
    
    -- Crear slug final con ID corto
    final_slug := base_slug || '-' || short_id;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 4. Generar slugs para todos los grupos existentes
UPDATE groups 
SET slug = generate_slug(name, id) 
WHERE slug IS NULL;

-- 5. Hacer el campo slug NOT NULL después de generar los valores
ALTER TABLE groups ALTER COLUMN slug SET NOT NULL;

-- 6. Función trigger para generar slug automáticamente en nuevos grupos
CREATE OR REPLACE FUNCTION trigger_generate_group_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo generar slug si no se proporciona uno o está vacío
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para nuevos grupos
CREATE TRIGGER groups_generate_slug_trigger
    BEFORE INSERT OR UPDATE OF name ON groups
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_group_slug();

-- 8. Comentarios para documentación
COMMENT ON COLUMN groups.slug IS 'URL-friendly slug generated from group name + short ID for SEO and user-friendly URLs';
COMMENT ON FUNCTION generate_slug(TEXT, UUID) IS 'Generates a URL-friendly slug from group name and ID';
COMMENT ON FUNCTION trigger_generate_group_slug() IS 'Automatically generates slug for new groups or when name changes';