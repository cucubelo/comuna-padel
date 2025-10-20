-- Script para corregir las políticas RLS de match_invitations
-- Este script se puede ejecutar múltiples veces de forma segura

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can create invitations for their matches" ON match_invitations;
DROP POLICY IF EXISTS "Users can upsert invitations for their matches" ON match_invitations;
DROP POLICY IF EXISTS "Invitees can update invitation status" ON match_invitations;
DROP POLICY IF EXISTS "Users can update invitations" ON match_invitations;

-- Recrear la política de INSERT (sin cambios)
CREATE POLICY "Users can create invitations for their matches" ON match_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE id = match_id AND creator_id = auth.uid()
    )
  );

-- Crear política unificada para UPDATE que permite tanto upsert como actualización de estado
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