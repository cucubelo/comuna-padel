-- Script para probar si la política INSERT de notifications funciona correctamente
-- Ya que la política existe, vamos a probar directamente

-- 1. Verificar políticas existentes para notifications
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
ORDER BY cmd, policyname;

-- 2. Obtener un usuario real para la prueba
SELECT id, email FROM auth.users LIMIT 1;

-- 3. Probar la creación de una notificación de prueba usando un usuario específico
-- Reemplaza 'USER_ID_AQUI' con un ID real de la consulta anterior
INSERT INTO notifications (
  recipient_id,
  sender_id,
  type,
  title,
  content,
  data
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'system_message',
  'Test Notification - Policy Check',
  'This is a test notification to verify the INSERT policy works correctly',
  '{"test": true}'::jsonb
);

-- 4. Verificar que la notificación se creó correctamente
SELECT 
  id,
  recipient_id,
  sender_id,
  type,
  title,
  content,
  data,
  created_at
FROM notifications 
WHERE title = 'Test Notification - Policy Check'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Limpiar la notificación de prueba
DELETE FROM notifications 
WHERE title = 'Test Notification - Policy Check';

-- 6. Confirmar que se eliminó
SELECT COUNT(*) as remaining_test_notifications
FROM notifications 
WHERE title = 'Test Notification - Policy Check';