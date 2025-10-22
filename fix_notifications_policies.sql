-- Ejecutar este script en Supabase SQL Editor
-- Para corregir las políticas RLS de notifications

-- 1. Eliminar todas las políticas existentes que puedan estar en conflicto
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;

-- 2. Crear políticas nuevas y más permisivas
CREATE POLICY "view_own_notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "update_own_notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- 3. Política muy permisiva para INSERT (temporal para debugging)
CREATE POLICY "allow_all_inserts" ON notifications
  FOR INSERT WITH CHECK (true);

-- 4. Verificar que RLS esté habilitado
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';