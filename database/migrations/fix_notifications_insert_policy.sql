-- Script para agregar la política RLS faltante para INSERT en notifications
-- Esta política permite que cualquier usuario autenticado pueda crear notificaciones

-- Verificar políticas existentes
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

-- Agregar la política faltante para INSERT
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    -- Permitir inserción si el usuario está autenticado
    auth.uid() IS NOT NULL
  );

-- Verificar que la política se creó correctamente
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
WHERE tablename = 'notifications' AND cmd = 'INSERT'
ORDER BY policyname;

-- Probar la creación de una notificación de prueba
INSERT INTO notifications (
  recipient_id,
  sender_id,
  type,
  title,
  content,
  data
) VALUES (
  auth.uid(),
  auth.uid(),
  'system_message',
  'Test Notification',
  'This is a test notification to verify the INSERT policy works',
  '{"test": true}'
);

-- Verificar que la notificación se creó
SELECT 
  id,
  recipient_id,
  type,
  title,
  content,
  created_at
FROM notifications 
WHERE title = 'Test Notification'
ORDER BY created_at DESC
LIMIT 1;