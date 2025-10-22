-- Script de diagnóstico simplificado
-- Ejecutar cada consulta por separado en Supabase SQL Editor

-- PASO 1: Verificar si las tablas existen
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'notification_preferences');

-- PASO 2: Verificar RLS habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('notifications', 'notification_preferences');

-- PASO 3: Contar registros en cada tabla
SELECT 'notifications' as tabla, COUNT(*) as registros FROM notifications
UNION ALL
SELECT 'notification_preferences' as tabla, COUNT(*) as registros FROM notification_preferences;

-- PASO 4: Verificar políticas para notifications
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'notifications';

-- PASO 5: Verificar políticas para notification_preferences  
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'notification_preferences';