-- Script para verificar las notificaciones en la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las notificaciones recientes (últimas 24 horas)
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
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 2. Ver usuarios existentes para verificar IDs
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar si hay notificaciones para usuarios específicos
SELECT 
    n.id,
    n.recipient_id,
    u.email as recipient_email,
    n.sender_id,
    s.email as sender_email,
    n.type,
    n.title,
    n.created_at
FROM notifications n
LEFT JOIN auth.users u ON n.recipient_id = u.id
LEFT JOIN auth.users s ON n.sender_id = s.id
WHERE n.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC;

-- 4. Contar notificaciones por usuario
SELECT 
    recipient_id,
    u.email,
    COUNT(*) as notification_count
FROM notifications n
LEFT JOIN auth.users u ON n.recipient_id = u.id
WHERE n.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY recipient_id, u.email
ORDER BY notification_count DESC;