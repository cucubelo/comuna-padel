-- Script final para limpiar completamente las políticas RLS de notifications
-- Ejecutar en Supabase SQL Editor

-- 1. DESHABILITAR RLS temporalmente para limpiar todo
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes (incluso las que no conocemos)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', policy_record.policyname);
    END LOOP;
END $$;

-- 3. Verificar que no hay políticas
SELECT COUNT(*) as policies_count FROM pg_policies WHERE tablename = 'notifications';

-- 4. Habilitar RLS nuevamente
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Crear SOLO las políticas necesarias con nombres únicos
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    recipient_id IS NOT NULL AND
    sender_id IS NOT NULL
  );

-- 6. Verificar las políticas finales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;