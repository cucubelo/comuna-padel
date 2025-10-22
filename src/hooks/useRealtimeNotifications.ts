'use client'

import { useEffect, useCallback, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { notificationService, NotificationType } from '@/lib/services/notificationService'

interface RealtimeNotification {
  id: string
  recipient_id: string
  sender_id: string | null
  type: NotificationType
  title: string
  content: string
  data?: any
  is_read: boolean
  created_at: string
  sender_profile?: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

interface RealtimeMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  message_type: 'text' | 'image' | 'file'
  sender_profile?: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

interface UseRealtimeNotificationsReturn {
  // Estados
  notifications: RealtimeNotification[]
  unreadNotificationsCount: number
  unreadMessagesCount: number
  isConnected: boolean
  
  // Funciones
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  
  // Eventos
  onNewNotification?: (notification: RealtimeNotification) => void
  onNewMessage?: (message: RealtimeMessage) => void
}

export function useRealtimeNotifications(options: {
  onNewNotification?: (notification: RealtimeNotification) => void
  onNewMessage?: (message: RealtimeMessage) => void
  showToastOnNew?: boolean
} = {}): UseRealtimeNotificationsReturn {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Cargar notificaciones iniciales
  const loadInitialNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      const notifications = await notificationService.getUserNotifications(user.id, {
        limit: 50,
        unreadOnly: false
      })
      
      setNotifications(notifications)
      
      const unreadCount = notifications.filter(n => !n.is_read).length
      setUnreadNotificationsCount(unreadCount)
      
    } catch (error) {
      console.error('Error loading initial notifications:', error)
    }
  }, [user?.id])

  // Cargar contador de mensajes no leídos
  const loadUnreadMessagesCount = useCallback(async () => {
    if (!user?.id) return

    try {
      // Primero obtenemos las conversaciones del usuario
      const { data: conversations } = await supabase
        .from('private_conversations')
        .select('id')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)

      if (!conversations || conversations.length === 0) {
        setUnreadMessagesCount(0)
        return
      }

      const conversationIds = conversations.map(c => c.id)

      // Luego contamos los mensajes no leídos en esas conversaciones
      const { count } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .in('conversation_id', conversationIds)

      setUnreadMessagesCount(count || 0)
    } catch (error) {
      console.error('Error loading unread messages count:', error)
    }
  }, [user?.id])

  // Manejar nueva notificación
  const handleNewNotification = useCallback((payload: any) => {
    const notification = payload.new as RealtimeNotification
    
    // Solo procesar si es para el usuario actual
    if (notification.recipient_id !== user?.id) return

    setNotifications(prev => [notification, ...prev])
    setUnreadNotificationsCount(prev => prev + 1)

    // Mostrar toast si está habilitado
    if (options.showToastOnNew !== false) {
      showToast(notification.title, 'info', {
        description: notification.content,
        duration: 5000
      })
    }

    // Llamar callback personalizado
    options.onNewNotification?.(notification)
  }, [user?.id, options, showToast])

  // Manejar actualización de notificación
  const handleNotificationUpdate = useCallback((payload: any) => {
    const updatedNotification = payload.new as RealtimeNotification
    
    if (updatedNotification.recipient_id !== user?.id) return

    setNotifications(prev => 
      prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
    )

    // Actualizar contador si cambió el estado de lectura
    if (payload.old.is_read !== updatedNotification.is_read) {
      setUnreadNotificationsCount(prev => 
        updatedNotification.is_read ? Math.max(0, prev - 1) : prev + 1
      )
    }
  }, [user?.id])

  // Manejar eliminación de notificación
  const handleNotificationDelete = useCallback((payload: any) => {
    const deletedNotification = payload.old as RealtimeNotification
    
    if (deletedNotification.recipient_id !== user?.id) return

    setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id))
    
    if (!deletedNotification.is_read) {
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1))
    }
  }, [user?.id])

  // Manejar nuevo mensaje privado
  const handleNewMessage = useCallback((payload: any) => {
    const message = payload.new as RealtimeMessage
    
    // Solo procesar si no es del usuario actual (para evitar notificarse a sí mismo)
    if (message.sender_id === user?.id) return

    // Verificar si el usuario es participante de la conversación
    supabase
      .from('private_conversations')
      .select('participant1_id, participant2_id')
      .eq('id', message.conversation_id)
      .single()
      .then(({ data: conversation }) => {
        if (conversation && 
            (conversation.participant1_id === user?.id || conversation.participant2_id === user?.id)) {
          
          setUnreadMessagesCount(prev => prev + 1)

          // Mostrar toast si está habilitado
          if (options.showToastOnNew !== false) {
            showToast('Nuevo mensaje privado', 'info', {
              description: message.content.length > 50 
                ? message.content.substring(0, 50) + '...' 
                : message.content,
              duration: 5000
            })
          }

          // Llamar callback personalizado
          options.onNewMessage?.(message)
        }
      })
  }, [user?.id, options, showToast])

  // Manejar actualización de mensaje (marcar como leído)
  const handleMessageUpdate = useCallback((payload: any) => {
    const updatedMessage = payload.new as RealtimeMessage
    const oldMessage = payload.old as RealtimeMessage
    
    // Si el mensaje cambió de no leído a leído y no es del usuario actual
    if (!oldMessage.is_read && updatedMessage.is_read && updatedMessage.sender_id !== user?.id) {
      // Verificar si el usuario es participante de la conversación
      supabase
        .from('private_conversations')
        .select('participant1_id, participant2_id')
        .eq('id', updatedMessage.conversation_id)
        .single()
        .then(({ data: conversation }) => {
          if (conversation && 
              (conversation.participant1_id === user?.id || conversation.participant2_id === user?.id)) {
            setUnreadMessagesCount(prev => Math.max(0, prev - 1))
          }
        })
    }
  }, [user?.id])

  // Configurar suscripciones en tiempo real
  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadNotificationsCount(0)
      setUnreadMessagesCount(0)
      setIsConnected(false)
      return
    }

    let isSubscribed = true
    let notificationsChannel: any = null
    let messagesChannel: any = null

    const setupRealtimeSubscriptions = async () => {
      try {
        console.log('🔄 Setting up realtime subscriptions for user:', user.id)

        // Verificar que el usuario esté autenticado
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          console.error('❌ No authenticated session for realtime subscriptions:', authError)
          setIsConnected(false)
          return
        }

        console.log('✅ Authenticated session found, setting up channels...')

        // Suscripción a notificaciones
        notificationsChannel = supabase
          .channel(`notifications-${user.id}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_id=eq.${user.id}`
            },
            (payload) => {
              console.log('🔔 New notification received:', payload)
              handleNewNotification(payload)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_id=eq.${user.id}`
            },
            (payload) => {
              console.log('📝 Notification updated:', payload)
              handleNotificationUpdate(payload)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_id=eq.${user.id}`
            },
            (payload) => {
              console.log('🗑️ Notification deleted:', payload)
              handleNotificationDelete(payload)
            }
          )
          .subscribe((status) => {
            console.log('📡 Notifications subscription status:', status)
            if (status === 'SUBSCRIBED') {
              console.log('✅ Notifications realtime subscription active')
              setIsConnected(true)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Notifications realtime subscription error')
              setIsConnected(false)
            } else if (status === 'TIMED_OUT') {
              console.error('⏰ Notifications realtime subscription timed out')
              setIsConnected(false)
            } else if (status === 'CLOSED') {
              console.log('🔒 Notifications realtime subscription closed')
              setIsConnected(false)
            }
          })

        // Suscripción a mensajes privados
        messagesChannel = supabase
          .channel(`private_messages-${user.id}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'private_messages'
            },
            handleNewMessage
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'private_messages'
            },
            handleMessageUpdate
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Messages realtime subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Messages realtime subscription error')
            }
          })

        // Cargar datos iniciales
        await loadInitialNotifications()
        await loadUnreadMessagesCount()

      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error)
        setIsConnected(false)
      }
    }

    setupRealtimeSubscriptions()

    // Cleanup
    return () => {
      isSubscribed = false
      if (notificationsChannel) {
        console.log('Cleaning up notifications channel')
        supabase.removeChannel(notificationsChannel)
      }
      if (messagesChannel) {
        console.log('Cleaning up messages channel')
        supabase.removeChannel(messagesChannel)
      }
      setIsConnected(false)
    }
  }, [user?.id]) // Solo depende del user.id

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      // El estado se actualizará automáticamente a través de la suscripción en tiempo real
    } catch (error) {
      console.error('Error marking notification as read:', error)
      showToast('Error al marcar como leída', 'error')
    }
  }, [showToast])

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      await notificationService.markAllAsRead(user.id)
      // El estado se actualizará automáticamente a través de la suscripción en tiempo real
      showToast('Todas las notificaciones marcadas como leídas', 'success')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      showToast('Error al marcar todas como leídas', 'error')
    }
  }, [user?.id, showToast])

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Encontrar la notificación que se va a eliminar
      const notificationToDelete = notifications.find(n => n.id === notificationId)
      
      // Actualizar el estado local inmediatamente para feedback instantáneo
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Si la notificación no estaba leída, decrementar el contador
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnreadNotificationsCount(prev => Math.max(0, prev - 1))
      }
      
      // Realizar la eliminación en la base de datos
      await notificationService.deleteNotification(notificationId)
      
      showToast('Notificación eliminada', 'success')
    } catch (error) {
      console.error('Error deleting notification:', error)
      
      // En caso de error, revertir los cambios locales
      if (notificationToDelete) {
        setNotifications(prev => [notificationToDelete, ...prev].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
        
        if (!notificationToDelete.is_read) {
          setUnreadNotificationsCount(prev => prev + 1)
        }
      }
      
      showToast('Error al eliminar la notificación', 'error')
    }
  }, [notifications, showToast])

  // Refrescar notificaciones manualmente
  const refreshNotifications = useCallback(async () => {
    await loadInitialNotifications()
    await loadUnreadMessagesCount()
  }, [loadInitialNotifications, loadUnreadMessagesCount])

  return {
    notifications,
    unreadNotificationsCount,
    unreadMessagesCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  }
}

export default useRealtimeNotifications