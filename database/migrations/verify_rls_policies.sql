-- Script para verificar el estado actual de las políticas RLS
-- Ejecutar en Supabase SQL Editor para diagnosticar los errores 406 y 403

-- 1. Verificar que las tablas existen
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('notifications', 'notification_preferences', 'private_conversations', 'private_messages')
ORDER BY tablename;

-- 2. Verificar políticas RLS para notifications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 3. Verificar políticas RLS para notification_preferences
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notification_preferences'
ORDER BY policyname;

-- 4. Verificar si hay datos en notification_preferences
SELECT COUNT(*) as "Total Preferences" FROM notification_preferences;

-- 5. Verificar estructura de la tabla notification_preferences
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- 6. Verificar estructura de la tabla notifications
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 7. Probar inserción en notifications (esto debería funcionar ahora)
-- Usando un ID de usuario real de tu base de datos
INSERT INTO notifications (
  recipient_id,
  sender_id,
  type,
  title,
  content,
  data
) VALUES (
  'ffc971f8-de65-4622-99c2-cb86473ca836',
  'ffc971f8-de65-4622-99c2-cb86473ca836',
  'system_message',
  'Test Notification',
  'This is a test notification to verify RLS policies',
  '{"test": true}'
);

-- 8. Verificar usuarios existentes para testing
SELECT id, email, created_at FROM auth.users LIMIT 5;