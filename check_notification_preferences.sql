-- Script para verificar las preferencias de notificación
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las preferencias de notificación
SELECT * FROM notification_preferences ORDER BY created_at DESC;

-- 2. Contar usuarios con preferencias configuradas
SELECT COUNT(*) as users_with_preferences FROM notification_preferences;

-- 3. Verificar preferencias específicas para nuestros usuarios de prueba
SELECT 
    user_id,
    match_invitations,
    group_requests,
    private_messages,
    system_messages,
    created_at
FROM notification_preferences 
WHERE user_id IN (
    '4a89a30e-c293-4d3d-8c85-39cf8f0eaeaa',
    'ffc971f8-de65-4622-99c2-cb86473ca836'
);

-- 4. Ver la estructura de la tabla notification_preferences
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_preferences' 
ORDER BY ordinal_position;

-- 5. Verificar si la tabla notification_preferences existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'notification_preferences'
) as table_exists;