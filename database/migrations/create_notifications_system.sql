-- Sistema completo de notificaciones
-- Incluye: notificaciones generales, mensajes privados, mensajes del sistema

-- 1. Tabla principal de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL para mensajes del sistema
  type TEXT NOT NULL CHECK (type IN (
    'match_invitation',
    'group_request', 
    'private_message',
    'system_message',
    'match_reminder',
    'group_activity',
    'match_result',
    'achievement'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB, -- Datos adicionales específicos del tipo de notificación
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Para notificaciones temporales
  
  -- Índices para mejorar rendimiento
  CONSTRAINT notifications_recipient_type_idx UNIQUE (id, recipient_id, type)
);

-- 2. Tabla para conversaciones privadas
CREATE TABLE IF NOT EXISTS private_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar conversaciones duplicadas
  CONSTRAINT unique_conversation CHECK (participant1_id < participant2_id),
  UNIQUE(participant1_id, participant2_id)
);

-- 3. Tabla para mensajes privados
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadatos adicionales
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url TEXT, -- Para archivos adjuntos
  reply_to_id UUID REFERENCES private_messages(id) ON DELETE SET NULL -- Para respuestas
);

-- 4. Tabla para configuración de notificaciones por usuario
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notificaciones por email
  email_match_invitations BOOLEAN DEFAULT TRUE,
  email_private_messages BOOLEAN DEFAULT TRUE,
  email_group_activity BOOLEAN DEFAULT TRUE,
  email_system_messages BOOLEAN DEFAULT TRUE,
  email_match_reminders BOOLEAN DEFAULT TRUE,
  
  -- Notificaciones push
  push_match_invitations BOOLEAN DEFAULT TRUE,
  push_private_messages BOOLEAN DEFAULT TRUE,
  push_group_activity BOOLEAN DEFAULT FALSE,
  push_system_messages BOOLEAN DEFAULT TRUE,
  push_match_reminders BOOLEAN DEFAULT TRUE,
  
  -- Configuración de frecuencia
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')),
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_private_conversations_participants ON private_conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_private_conversations_updated ON private_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON private_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created ON private_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_unread ON private_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_private_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_private_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_message_at en conversaciones
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE private_conversations 
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_update_private_conversations_updated_at
  BEFORE UPDATE ON private_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_private_conversations_updated_at();

CREATE TRIGGER trigger_update_private_messages_updated_at
  BEFORE UPDATE ON private_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_private_messages_updated_at();

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON private_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- RLS (Row Level Security) policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Políticas para private_conversations
CREATE POLICY "Users can view their conversations" ON private_conversations
  FOR SELECT USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

CREATE POLICY "Users can create conversations" ON private_conversations
  FOR INSERT WITH CHECK (participant1_id = auth.uid() OR participant2_id = auth.uid());

CREATE POLICY "Users can update their conversations" ON private_conversations
  FOR UPDATE USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- Políticas para private_messages
CREATE POLICY "Users can view messages in their conversations" ON private_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_conversations 
      WHERE id = conversation_id 
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON private_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM private_conversations 
      WHERE id = conversation_id 
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON private_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Políticas para notification_preferences
CREATE POLICY "Users can manage their notification preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Comentarios para documentación
COMMENT ON TABLE notifications IS 'Tabla principal para todas las notificaciones del sistema';
COMMENT ON TABLE private_conversations IS 'Conversaciones privadas entre dos usuarios';
COMMENT ON TABLE private_messages IS 'Mensajes dentro de conversaciones privadas';
COMMENT ON TABLE notification_preferences IS 'Preferencias de notificación por usuario';

COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: match_invitation, group_request, private_message, system_message, etc.';
COMMENT ON COLUMN notifications.data IS 'Datos adicionales en formato JSON específicos del tipo de notificación';
COMMENT ON COLUMN private_conversations.participant1_id IS 'ID del primer participante (debe ser menor que participant2_id)';
COMMENT ON COLUMN private_messages.message_type IS 'Tipo de mensaje: text, image, file';