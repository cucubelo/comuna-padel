-- Script para verificar y corregir slugs después de la migración
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar grupos sin slug
SELECT 
    id, 
    name, 
    slug,
    CASE 
        WHEN slug IS NULL THEN 'SIN SLUG'
        WHEN slug = '' THEN 'SLUG VACÍO'
        ELSE 'OK'
    END as status
FROM groups 
ORDER BY created_at DESC;

-- 2. Generar slugs para grupos que no los tienen
UPDATE groups 
SET slug = generate_slug(name, id) 
WHERE slug IS NULL OR slug = '';

-- 3. Verificar duplicados de slug (no debería haber por el índice único)
SELECT slug, COUNT(*) as count
FROM groups 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- 4. Mostrar algunos ejemplos de grupos con sus slugs
SELECT 
    id,
    name,
    slug,
    created_at
FROM groups 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Verificar que la función generate_slug funciona correctamente
SELECT 
    id,
    name,
    slug,
    generate_slug(name, id) as new_slug_test
FROM groups 
LIMIT 5;