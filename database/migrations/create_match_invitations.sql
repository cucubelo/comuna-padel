-- Tabla para las invitaciones de partidos
CREATE TABLE IF NOT EXISTS match_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar invitaciones duplicadas activas (permite reinvitaciones)
  UNIQUE(match_id, invitee_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_match_invitations_match_id ON match_invitations(match_id);
CREATE INDEX IF NOT EXISTS idx_match_invitations_invitee_id ON match_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_match_invitations_status ON match_invitations(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_match_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_match_invitations_updated_at
  BEFORE UPDATE ON match_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_match_invitations_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE match_invitations ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver las invitaciones donde son el invitado o el invitador
CREATE POLICY "Users can view their own invitations" ON match_invitations
  FOR SELECT USING (
    auth.uid() = inviter_id OR 
    auth.uid() = invitee_id
  );

-- Solo el invitador puede crear invitaciones
CREATE POLICY "Users can create invitations for their matches" ON match_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE id = match_id AND creator_id = auth.uid()
    )
  );

-- Política unificada para UPDATE que permite tanto upsert como actualización de estado
CREATE POLICY "Users can update invitations" ON match_invitations
  FOR UPDATE USING (
    -- El invitador puede hacer upsert (reinvitaciones)
    (auth.uid() = inviter_id AND
     EXISTS (
       SELECT 1 FROM matches 
       WHERE id = match_id AND creator_id = auth.uid()
     )) OR
    -- El invitado puede actualizar el estado
    auth.uid() = invitee_id
  )
  WITH CHECK (
    -- El invitador puede hacer upsert (reinvitaciones)
    (auth.uid() = inviter_id AND
     EXISTS (
       SELECT 1 FROM matches 
       WHERE id = match_id AND creator_id = auth.uid()
     )) OR
    -- El invitado puede actualizar el estado
    auth.uid() = invitee_id
  );

-- Solo el invitador puede eliminar invitaciones pendientes
CREATE POLICY "Inviters can delete pending invitations" ON match_invitations
  FOR DELETE USING (
    auth.uid() = inviter_id AND 
    status = 'pending'
  );