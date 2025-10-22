-- Script final para corregir las políticas RLS de notifications
-- Problema: La política actual es muy restrictiva

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Recrear políticas más permisivas
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Política más permisiva para INSERT
-- Permite que cualquier usuario autenticado pueda crear notificaciones para cualquier usuario
CREATE POLICY "Authenticated users can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    -- Solo requiere que el usuario esté autenticado
    auth.uid() IS NOT NULL AND
    -- Y que los IDs sean válidos (no nulos)
    recipient_id IS NOT NULL AND
    sender_id IS NOT NULL
  );

-- Verificar que RLS esté habilitado
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Comentario para documentar
COMMENT ON POLICY "Authenticated users can create notifications" ON notifications IS 'Permite que cualquier usuario autenticado cree notificaciones para cualquier usuario';