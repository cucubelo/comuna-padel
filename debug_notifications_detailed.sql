-- Script detallado para investigar el problema de notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Ver TODAS las notificaciones (sin filtro de tiempo)
SELECT 
    id,
    recipient_id,
    sender_id,
    type,
    title,
    content,
    data,
    is_read,
    created_at,
    expires_at
FROM notifications 
ORDER BY created_at DESC
LIMIT 20;

-- 2. Contar TODAS las notificaciones en la tabla
SELECT COUNT(*) as total_notifications FROM notifications;

-- 3. Ver las últimas 10 notificaciones con información de usuarios
SELECT 
    n.id,
    n.recipient_id,
    u.email as recipient_email,
    n.sender_id,
    s.email as sender_email,
    n.type,
    n.title,
    n.content,
    n.created_at
FROM notifications n
LEFT JOIN auth.users u ON n.recipient_id = u.id
LEFT JOIN auth.users s ON n.sender_id = s.id
ORDER BY n.created_at DESC
LIMIT 10;

-- 4. Verificar si hay notificaciones para cada usuario específico
SELECT 
    'diegocurbelocaffarena@gmail.com' as user_email,
    COUNT(*) as notification_count
FROM notifications n
WHERE n.recipient_id = '4a89a30e-c293-4d3d-8c85-39cf8f0eaeaa'

UNION ALL

SELECT 
    'diegomartincurbelo@gmail.com' as user_email,
    COUNT(*) as notification_count
FROM notifications n
WHERE n.recipient_id = 'ffc971f8-de65-4622-99c2-cb86473ca836';

-- 5. Ver la estructura de la tabla notifications
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 6. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';