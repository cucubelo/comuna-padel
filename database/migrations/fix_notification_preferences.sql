-- Script para crear registros de notification_preferences para usuarios existentes
-- Esto solucionará el error 406 que ocurre cuando la aplicación no encuentra preferencias

-- Insertar preferencias por defecto para todos los usuarios que no las tienen
INSERT INTO notification_preferences (
  user_id,
  email_match_invitations,
  email_private_messages,
  email_group_activity,
  email_system_messages,
  email_match_reminders,
  push_match_invitations,
  push_private_messages,
  push_group_activity,
  push_system_messages,
  push_match_reminders,
  digest_frequency,
  quiet_hours_start,
  quiet_hours_end
)
SELECT 
  u.id,
  true,   -- email_match_invitations
  true,   -- email_private_messages
  true,   -- email_group_activity
  true,   -- email_system_messages
  true,   -- email_match_reminders
  true,   -- push_match_invitations
  true,   -- push_private_messages
  false,  -- push_group_activity
  true,   -- push_system_messages
  true,   -- push_match_reminders
  'daily', -- digest_frequency
  '22:00', -- quiet_hours_start
  '08:00'  -- quiet_hours_end
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM notification_preferences np 
  WHERE np.user_id = u.id
);

-- Verificar que se crearon correctamente
SELECT 
  'notification_preferences' as tabla,
  COUNT(*) as total_registros
FROM notification_preferences;

-- Mostrar algunos registros creados
SELECT 
  np.user_id,
  u.email,
  np.email_match_invitations,
  np.push_match_invitations,
  np.digest_frequency,
  np.created_at
FROM notification_preferences np
JOIN auth.users u ON u.id = np.user_id
ORDER BY np.created_at DESC
LIMIT 5;