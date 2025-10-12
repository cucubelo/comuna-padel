-- Migración para crear tabla de solicitudes de acceso a grupos privados
-- Ejecutar en Supabase SQL Editor

-- Crear enum para el estado de las solicitudes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- Crear tabla de solicitudes de acceso
CREATE TABLE IF NOT EXISTS group_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  message TEXT, -- Mensaje opcional del usuario solicitante
  admin_response TEXT, -- Respuesta opcional del admin
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES profiles(id), -- Admin que respondió
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar solicitudes duplicadas pendientes
  CONSTRAINT unique_pending_request UNIQUE(group_id, user_id, status)
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_group_access_requests_group_id ON group_access_requests (group_id);
CREATE INDEX IF NOT EXISTS idx_group_access_requests_user_id ON group_access_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_group_access_requests_status ON group_access_requests (status);
CREATE INDEX IF NOT EXISTS idx_group_access_requests_requested_at ON group_access_requests (requested_at DESC);

-- Comentarios para documentar la tabla
COMMENT ON TABLE group_access_requests IS 'Solicitudes de acceso a grupos privados';
COMMENT ON COLUMN group_access_requests.group_id IS 'ID del grupo al que se solicita acceso';
COMMENT ON COLUMN group_access_requests.user_id IS 'ID del usuario que solicita acceso';
COMMENT ON COLUMN group_access_requests.status IS 'Estado de la solicitud (pending, approved, rejected)';
COMMENT ON COLUMN group_access_requests.message IS 'Mensaje opcional del usuario solicitante';
COMMENT ON COLUMN group_access_requests.admin_response IS 'Respuesta opcional del administrador';
COMMENT ON COLUMN group_access_requests.requested_at IS 'Fecha y hora de la solicitud';
COMMENT ON COLUMN group_access_requests.responded_at IS 'Fecha y hora de la respuesta del admin';
COMMENT ON COLUMN group_access_requests.responded_by IS 'ID del admin que respondió la solicitud';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_group_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_group_access_requests_updated_at
    BEFORE UPDATE ON group_access_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_group_access_requests_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE group_access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view their own requests" ON group_access_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden crear solicitudes para sí mismos
CREATE POLICY "Users can create their own requests" ON group_access_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Los admins de grupo pueden ver solicitudes de su grupo
CREATE POLICY "Group admins can view group requests" ON group_access_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_access_requests.group_id 
            AND group_members.user_id = auth.uid() 
            AND group_members.role = 'admin'
        )
    );

-- Policy: Los admins de grupo pueden actualizar solicitudes de su grupo
CREATE POLICY "Group admins can update group requests" ON group_access_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = group_access_requests.group_id 
            AND group_members.user_id = auth.uid() 
            AND group_members.role = 'admin'
        )
    );