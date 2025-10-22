-- Script para corregir las políticas RLS de notifications
-- Agregar política faltante para INSERT

-- Eliminar políticas existentes si existen para recrearlas
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Recrear políticas para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Política para permitir la creación de notificaciones
-- Permite que cualquier usuario autenticado pueda crear notificaciones
-- (necesario para que el sistema pueda crear notificaciones para otros usuarios)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    -- Permitir inserción si el usuario está autenticado
    auth.uid() IS NOT NULL
  );

-- Comentario para documentar la política
COMMENT ON POLICY "System can create notifications" ON notifications IS 'Permite que el sistema cree notificaciones para cualquier usuario autenticado';