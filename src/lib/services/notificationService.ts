import { supabase } from '@/lib/supabase'

export type NotificationType = 
  | 'match_invitation'
  | 'group_request'
  | 'private_message'
  | 'system_message'
  | 'match_reminder'
  | 'group_activity'
  | 'match_result'
  | 'achievement'

export interface CreateNotificationData {
  recipient_id: string
  sender_id: string
  type: NotificationType
  title: string
  content: string
  data?: any
  expires_at?: string
}

export interface NotificationPreferences {
  user_id: string
  email_match_invitations: boolean
  email_private_messages: boolean
  email_group_activity: boolean
  email_system_messages: boolean
  email_match_reminders: boolean
  push_match_invitations: boolean
  push_private_messages: boolean
  push_group_activity: boolean
  push_system_messages: boolean
  push_match_reminders: boolean
  digest_frequency: string
  quiet_hours_start: string
  quiet_hours_end: string
  created_at: string
  updated_at: string
}

class NotificationService {
  // Crear una nueva notificación
  async createNotification(data: CreateNotificationData) {
    try {
      console.log('🔔 Creando notificación:', {
        recipient_id: data.recipient_id,
        sender_id: data.sender_id,
        type: data.type,
        title: data.title
      })

      // Verificar que el usuario esté autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Error de autenticación al crear notificación:', authError)
        throw new Error('Usuario no autenticado')
      }

      console.log('✅ Usuario autenticado:', user.id)

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating notification:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('✅ Notificación creada exitosamente:', notification.id)
      return notification
    } catch (error) {
      console.error('❌ Error in createNotification:', error)
      throw error
    }
  }

  // Crear múltiples notificaciones
  async createBulkNotifications(notifications: CreateNotificationData[]) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) {
        console.error('Error creating bulk notifications:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createBulkNotifications:', error)
      throw error
    }
  }

  // Obtener notificaciones de un usuario
  async getUserNotifications(
    userId: string, 
    options: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
      type?: NotificationType
    } = {}
  ) {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender_profile:profiles!notifications_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      if (options.unreadOnly) {
        query = query.eq('is_read', false)
      }

      if (options.type) {
        query = query.eq('type', options.type)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching notifications:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserNotifications:', error)
      throw error
    }
  }

  // Contar notificaciones no leídas
  async getUnreadCount(userId: string, type?: NotificationType) {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (type) {
        query = query.eq('type', type)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error counting unread notifications:', error)
        throw error
      }

      return count || 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      throw error
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in markAsRead:', error)
      throw error
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(userId: string, type?: NotificationType) {
    try {
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (type) {
        query = query.eq('type', type)
      }

      const { error } = await query

      if (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
      throw error
    }
  }

  // Eliminar notificación
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in deleteNotification:', error)
      throw error
    }
  }

  // Limpiar notificaciones expiradas
  async cleanupExpiredNotifications() {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Error cleaning up expired notifications:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error in cleanupExpiredNotifications:', error)
      throw error
    }
  }

  // Obtener preferencias de notificación
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching notification preferences:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getNotificationPreferences:', error)
      throw error
    }
  }

  // Actualizar preferencias de notificación
  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating notification preferences:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error)
      throw error
    }
  }

  // Verificar si el usuario tiene habilitado un tipo de notificación
  async isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(userId)
      
      if (!preferences) {
        // Si no hay preferencias, asumir que todas están habilitadas por defecto
        return true
      }

      switch (type) {
        case 'match_invitation':
          return preferences.push_match_invitations
        case 'group_request':
          return preferences.push_group_activity
        case 'private_message':
          return preferences.push_private_messages
        case 'system_message':
          return preferences.push_system_messages
        case 'match_reminder':
          return preferences.push_match_reminders
        case 'group_activity':
          return preferences.push_group_activity
        case 'match_result':
          return preferences.push_match_reminders // Usar match_reminders como fallback
        case 'achievement':
          return preferences.push_system_messages // Usar system_messages como fallback
        default:
          return true
      }
    } catch (error) {
      console.error('Error checking notification enabled:', error)
      return true // En caso de error, permitir la notificación
    }
  }

  // Crear notificación solo si está habilitada
  async createNotificationIfEnabled(data: CreateNotificationData) {
    try {
      const isEnabled = await this.isNotificationEnabled(data.recipient_id, data.type)
      
      if (!isEnabled) {
        console.log(`Notification type ${data.type} is disabled for user ${data.recipient_id}`)
        return null
      }

      return await this.createNotification(data)
    } catch (error) {
      console.error('Error in createNotificationIfEnabled:', error)
      throw error
    }
  }

  // Métodos específicos para diferentes tipos de notificaciones

  // Notificación de invitación a partido
  async createMatchInvitationNotification(
    recipientId: string, 
    senderId: string, 
    matchData: { matchId: string; matchDate: string; location: string }
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'match_invitation',
      title: 'Nueva invitación a partido',
      content: `Te han invitado a un partido el ${matchData.matchDate} en ${matchData.location}`,
      data: matchData,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expira en 7 días
    })
  }

  // Notificación de solicitud de grupo
  async createGroupRequestNotification(
    recipientId: string, 
    senderId: string, 
    groupData: { groupId: string; groupName: string }
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'group_request',
      title: 'Nueva solicitud de grupo',
      content: `Solicitud para unirse al grupo "${groupData.groupName}"`,
      data: groupData
    })
  }

  // Notificación de mensaje privado
  async createPrivateMessageNotification(
    recipientId: string, 
    senderId: string, 
    messageData: { conversationId: string; preview: string }
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'private_message',
      title: 'Nuevo mensaje privado',
      content: messageData.preview,
      data: messageData
    })
  }

  // Notificación del sistema
  async createSystemNotification(
    recipientId: string, 
    title: string, 
    content: string, 
    data?: any
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: null,
      type: 'system_message',
      title,
      content,
      data
    })
  }

  // Notificación de recordatorio de partido
  async createMatchReminderNotification(
    recipientId: string, 
    matchData: { matchId: string; matchDate: string; location: string }
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: null,
      type: 'match_reminder',
      title: 'Recordatorio de partido',
      content: `Tu partido es mañana a las ${matchData.matchDate} en ${matchData.location}`,
      data: matchData
    })
  }

  // Notificación de actividad de grupo
  async createGroupActivityNotification(
    recipientId: string, 
    senderId: string, 
    activityData: { groupId: string; groupName: string; activity: string }
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: senderId,
      type: 'group_activity',
      title: 'Actividad en grupo',
      content: `${activityData.activity} en el grupo "${activityData.groupName}"`,
      data: activityData
    })
  }

  // Notificación de resultado de partido
  async createMatchResultNotification(
    recipientId: string, 
    matchData: { matchId: string; result: string; opponent: string }
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: null,
      type: 'match_result',
      title: 'Resultado de partido',
      content: `Resultado: ${matchData.result} vs ${matchData.opponent}`,
      data: matchData
    })
  }

  // Notificación de logro
  async createAchievementNotification(
    recipientId: string, 
    achievementData: { achievement: string; description: string }
  ) {
    return this.createNotificationIfEnabled({
      recipient_id: recipientId,
      sender_id: null,
      type: 'achievement',
      title: '¡Nuevo logro desbloqueado!',
      content: `${achievementData.achievement}: ${achievementData.description}`,
      data: achievementData
    })
  }
}

export const notificationService = new NotificationService()
export default notificationService