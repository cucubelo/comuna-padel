-- Script para diagnosticar el problema de creación de notificaciones
-- Este script simula exactamente lo que hace la aplicación

-- 1. Verificar el usuario actual autenticado
SELECT 
  'Usuario actual:' as info,
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'NO AUTENTICADO'
    ELSE 'AUTENTICADO'
  END as auth_status;

-- 2. Verificar que existen usuarios en la base de datos
SELECT 
  'Usuarios disponibles:' as info,
  COUNT(*) as total_users
FROM auth.users;

-- 3. Obtener información de un usuario específico para la prueba
SELECT 
  'Usuario de prueba:' as info,
  id,
  email,
  created_at
FROM auth.users 
LIMIT 1;

-- 4. Verificar las políticas RLS para notifications
SELECT 
  'Políticas RLS para notifications:' as info,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- 5. Verificar notification_preferences para el usuario
SELECT 
  'Preferencias de notificación:' as info,
  np.*
FROM notification_preferences np
WHERE np.user_id = (SELECT id FROM auth.users LIMIT 1);

-- 6. Intentar crear una notificación como lo haría la aplicación
-- Usando los mismos datos que usa createMatchInvitationNotification
DO $$
DECLARE
  test_user_id UUID;
  notification_id UUID;
BEGIN
  -- Obtener un usuario de prueba
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'ERROR: No hay usuarios en la base de datos';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Intentando crear notificación para usuario: %', test_user_id;
  
  -- Intentar insertar la notificación
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    title,
    content,
    data,
    expires_at
  ) VALUES (
    test_user_id,
    test_user_id,
    'match_invitation',
    'Nueva invitación a partido',
    'Te han invitado a un partido el lunes, 13 de enero de 2025, 20:00 en Argentum Padel Indoor',
    '{"matchId": "test-match-id", "matchDate": "lunes, 13 de enero de 2025, 20:00", "location": "Argentum Padel Indoor"}'::jsonb,
    (NOW() + INTERVAL '7 days')::timestamp with time zone
  ) RETURNING id INTO notification_id;
  
  RAISE NOTICE 'Notificación creada exitosamente con ID: %', notification_id;
  
  -- Verificar que se creó
  IF notification_id IS NOT NULL THEN
    RAISE NOTICE 'SUCCESS: La notificación se creó correctamente';
  ELSE
    RAISE NOTICE 'ERROR: La notificación no se pudo crear';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR al crear notificación: % - %', SQLSTATE, SQLERRM;
END $$;

-- 7. Verificar si la notificación se creó
SELECT 
  'Notificación creada:' as info,
  id,
  recipient_id,
  sender_id,
  type,
  title,
  created_at
FROM notifications 
WHERE title = 'Nueva invitación a partido'
ORDER BY created_at DESC
LIMIT 1;

-- 8. Limpiar la notificación de prueba
DELETE FROM notifications 
WHERE title = 'Nueva invitación a partido';

SELECT 'Limpieza completada' as info;