-- Script para deshabilitar completamente RLS en notifications
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar TODAS las políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', policy_record.policyname);
        RAISE NOTICE 'Eliminada política: %', policy_record.policyname;
    END LOOP;
END $$;

-- 2. DESHABILITAR RLS completamente
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que no hay políticas y RLS está deshabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    COUNT(*) OVER() as total_policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.tablename = 'notifications' AND t.schemaname = 'public';

-- 4. Verificar que no quedan políticas
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename = 'notifications';

-- Mensaje de confirmación
SELECT 'RLS deshabilitado completamente para la tabla notifications' as status;