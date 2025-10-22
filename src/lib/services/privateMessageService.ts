import { supabase } from '@/lib/supabase'
import { notificationService } from './notificationService'

export interface PrivateConversation {
  id: string
  participant1_id: string
  participant2_id: string
  created_at: string
  updated_at: string
  last_message_at: string
}

export interface PrivateMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  reply_to_id?: string
}

export interface CreateMessageData {
  conversation_id: string
  sender_id: string
  content: string
  message_type?: 'text' | 'image' | 'file'
  file_url?: string
  reply_to_id?: string
}

class PrivateMessageService {
  // Crear o obtener conversación entre dos usuarios
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    try {
      // Buscar conversación existente
      const { data: existingConversation, error: searchError } = await supabase
        .from('private_conversations')
        .select('*')
        .or(`and(participant1_id.eq.${user1Id},participant2_id.eq.${user2Id}),and(participant1_id.eq.${user2Id},participant2_id.eq.${user1Id})`)
        .single()

      if (existingConversation) {
        return existingConversation
      }

      // Si no existe, crear nueva conversación
      const { data: newConversation, error: createError } = await supabase
        .from('private_conversations')
        .insert({
          participant1_id: user1Id,
          participant2_id: user2Id,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating conversation:', createError)
        throw createError
      }

      return newConversation
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error)
      throw error
    }
  }

  // Obtener conversaciones de un usuario
  async getUserConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('private_conversations')
        .select(`
          *,
          participant1_profile:profiles!private_conversations_participant1_id_fkey (
            first_name,
            last_name,
            avatar_url
          ),
          participant2_profile:profiles!private_conversations_participant2_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        throw error
      }

      // Procesar conversaciones para obtener el otro participante y contar mensajes no leídos
      const processedConversations = await Promise.all((data || []).map(async (conv) => {
        const isParticipant1 = conv.participant1_id === userId
        const otherParticipant = isParticipant1 ? conv.participant2_profile : conv.participant1_profile
        
        // Contar mensajes no leídos
        const { count } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId)

        return {
          ...conv,
          other_participant: otherParticipant,
          unread_count: count || 0
        }
      }))

      return processedConversations
    } catch (error) {
      console.error('Error in getUserConversations:', error)
      throw error
    }
  }

  // Obtener mensajes de una conversación
  async getConversationMessages(conversationId: string, options: {
    limit?: number
    offset?: number
  } = {}) {
    try {
      let query = supabase
        .from('private_messages')
        .select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          ),
          reply_to_message:private_messages!private_messages_reply_to_id_fkey (
            id,
            content,
            sender_profile:profiles!private_messages_sender_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getConversationMessages:', error)
      throw error
    }
  }

  // Enviar mensaje
  async sendMessage(messageData: CreateMessageData) {
    try {
      // Crear el mensaje
      const { data: message, error: messageError } = await supabase
        .from('private_messages')
        .insert({
          ...messageData,
          message_type: messageData.message_type || 'text'
        })
        .select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single()

      if (messageError) {
        console.error('Error sending message:', messageError)
        throw messageError
      }

      // Actualizar la conversación con la fecha del último mensaje
      const { error: updateError } = await supabase
        .from('private_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', messageData.conversation_id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }

      // Obtener información de la conversación para crear notificación
      const { data: conversation } = await supabase
        .from('private_conversations')
        .select('participant1_id, participant2_id')
        .eq('id', messageData.conversation_id)
        .single()

      if (conversation) {
        // Determinar el destinatario de la notificación
        const recipientId = conversation.participant1_id === messageData.sender_id 
          ? conversation.participant2_id 
          : conversation.participant1_id

        // Crear notificación de mensaje privado
        await notificationService.createPrivateMessageNotification(
          recipientId,
          messageData.sender_id,
          {
            conversationId: messageData.conversation_id,
            preview: messageData.content.length > 50 
              ? messageData.content.substring(0, 50) + '...' 
              : messageData.content
          }
        )
      }

      return message
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    }
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking messages as read:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error)
      throw error
    }
  }

  // Eliminar mensaje
  async deleteMessage(messageId: string, userId: string) {
    try {
      // Verificar que el usuario es el remitente del mensaje
      const { data: message, error: fetchError } = await supabase
        .from('private_messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

      if (fetchError) {
        console.error('Error fetching message:', fetchError)
        throw fetchError
      }

      if (message.sender_id !== userId) {
        throw new Error('No tienes permisos para eliminar este mensaje')
      }

      const { error } = await supabase
        .from('private_messages')
        .delete()
        .eq('id', messageId)

      if (error) {
        console.error('Error deleting message:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteMessage:', error)
      throw error
    }
  }

  // Buscar conversaciones
  async searchConversations(userId: string, searchTerm: string) {
    try {
      const conversations = await this.getUserConversations(userId)
      
      return conversations.filter(conversation => {
        const otherParticipantName = [
          conversation.other_participant?.first_name,
          conversation.other_participant?.last_name
        ].filter(Boolean).join(' ').toLowerCase()
        
        return otherParticipantName.includes(searchTerm.toLowerCase())
      })
    } catch (error) {
      console.error('Error in searchConversations:', error)
      throw error
    }
  }

  // Buscar mensajes en una conversación
  async searchMessages(conversationId: string, searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender_profile:profiles!private_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .ilike('content', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error searching messages:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in searchMessages:', error)
      throw error
    }
  }

  // Obtener estadísticas de mensajes
  async getMessageStats(userId: string) {
    try {
      // Contar conversaciones totales
      const { count: totalConversations } = await supabase
        .from('private_conversations')
        .select('*', { count: 'exact', head: true })
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)

      // Primero obtenemos las conversaciones del usuario
      const { data: conversations } = await supabase
        .from('private_conversations')
        .select('id')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)

      let unreadMessages = 0
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id)
        
        // Contar mensajes no leídos en esas conversaciones
        const { count } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', userId)
          .in('conversation_id', conversationIds)

        unreadMessages = count || 0
      }

      // Contar mensajes enviados hoy
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: messagesSentToday } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .gte('created_at', today.toISOString())

      return {
        totalConversations: totalConversations || 0,
        unreadMessages: unreadMessages,
        messagesSentToday: messagesSentToday || 0
      }
    } catch (error) {
      console.error('Error in getMessageStats:', error)
      throw error
    }
  }

  // Subir archivo para mensaje
  async uploadMessageFile(file: File, conversationId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `message-files/${conversationId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('private-messages')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('private-messages')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error in uploadMessageFile:', error)
      throw error
    }
  }

  // Eliminar conversación
  async deleteConversation(conversationId: string, userId: string) {
    try {
      // Verificar que el usuario es participante de la conversación
      const { data: conversation, error: fetchError } = await supabase
        .from('private_conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single()

      if (fetchError) {
        console.error('Error fetching conversation:', fetchError)
        throw fetchError
      }

      if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
        throw new Error('No tienes permisos para eliminar esta conversación')
      }

      // Eliminar todos los mensajes de la conversación
      const { error: deleteMessagesError } = await supabase
        .from('private_messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (deleteMessagesError) {
        console.error('Error deleting messages:', deleteMessagesError)
        throw deleteMessagesError
      }

      // Eliminar la conversación
      const { error: deleteConversationError } = await supabase
        .from('private_conversations')
        .delete()
        .eq('id', conversationId)

      if (deleteConversationError) {
        console.error('Error deleting conversation:', deleteConversationError)
        throw deleteConversationError
      }

      return true
    } catch (error) {
      console.error('Error in deleteConversation:', error)
      throw error
    }
  }
}

export const privateMessageService = new PrivateMessageService()
export default privateMessageService