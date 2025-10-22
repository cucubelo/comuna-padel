"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";
import useRealtimeNotifications from "@/hooks/useRealtimeNotifications";
import InvitationModal from "@/components/ui/InvitationModal";
import {
  Bell,
  MessageCircle,
  Settings,
  X,
  Check,
  Trash2,
  Search,
  User,
  Calendar,
  Trophy,
  AlertCircle,
  Mail,
  RefreshCw,
} from "lucide-react";

// Tipos de notificaciones
type NotificationType =
  | "match_invitation"
  | "group_request"
  | "private_message"
  | "system_message"
  | "match_reminder"
  | "group_activity"
  | "match_result"
  | "achievement";

interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: NotificationType;
  title: string;
  content: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  sender_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface PrivateConversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  other_participant?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  unread_count?: number;
}

interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type: "text" | "image" | "file";
  file_url?: string;
  reply_to_id?: string;
  sender_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

type TabType = "notifications" | "messages" | "settings";

export default function NotificationCenter() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Hook de notificaciones en tiempo real - USAR DIRECTAMENTE SUS DATOS
  const {
    notifications,
    unreadNotificationsCount,
    unreadMessagesCount,
    isConnected,
    markAsRead: realtimeMarkAsRead,
    markAllAsRead,
    deleteNotification: realtimeDeleteNotification,
    refreshNotifications,
  } = useRealtimeNotifications({
    showToastOnNew: true, // Habilitar toasts automáticos
  });

  // Estados principales
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("notifications");
  const [loading, setLoading] = useState(false);

  // Estados para el modal de invitaciones
  const [invitationModal, setInvitationModal] = useState({
    isOpen: false,
    notification: null as Notification | null,
    loading: false,
  });

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Estados para mensajes
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Obtener conversaciones
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("private_conversations")
        .select(
          `
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
        `
        )
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return;
      }

      // Procesar conversaciones para obtener el otro participante
      const processedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          const isParticipant1 = conv.participant1_id === user.id;
          const otherParticipant = isParticipant1
            ? conv.participant2_profile
            : conv.participant1_profile;

          // Contar mensajes no leídos
          const { count } = await supabase
            .from("private_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            other_participant: otherParticipant,
            unread_count: count || 0,
          };
        })
      );

      setConversations(processedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, [user?.id]);

  // Obtener mensajes de una conversación
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("private_messages")
          .select(
            `
          *,
          sender_profile:profiles!private_messages_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }

        setMessages(data || []);

        // Marcar mensajes como leídos
        await supabase
          .from("private_messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("is_read", false);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    [user?.id]
  );

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await realtimeMarkAsRead(notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Manejar clic en notificación de invitación
  const handleNotificationClick = async (notification: Notification) => {
    if (
      notification.type === "match_invitation" &&
      notification.data?.matchId
    ) {
      // Marcar la notificación como leída primero
      await markAsRead(notification.id);
      
      // Navegar al detalle del partido en lugar de abrir el modal
      window.location.href = `/dashboard/matches/${notification.data.matchId}`;
    } else {
      // Para otros tipos de notificación, solo marcar como leída
      await markAsRead(notification.id);
    }
  };

  // Manejar aceptación de invitación
  const handleAcceptInvitation = async () => {
    if (!invitationModal.notification || !user?.id) return;

    try {
      setInvitationModal(prev => ({ ...prev, loading: true }));

      // Importar dinámicamente la función para aceptar invitaciones
      const { respondToInvitation } = await import("@/lib/matchInvitations");

      // Buscar la invitación en la base de datos
      const { data: invitations, error } = await supabase
        .from("match_invitations")
        .select("id")
        .eq("match_id", invitationModal.notification.data.matchId)
        .eq("invitee_id", user.id)
        .eq("status", "pending")
        .single();

      if (error || !invitations) {
        showToast(
          "No se encontró la invitación o ya fue procesada",
          "error"
        );
        return;
      }

      // Aceptar la invitación
      await respondToInvitation(invitations.id, "accepted");

      // Marcar la notificación como leída
      await markAsRead(invitationModal.notification.id);

      showToast(
        "¡Invitación aceptada! Te has unido al partido.",
        "success"
      );

      // Cerrar el modal
      setInvitationModal({
        isOpen: false,
        notification: null,
        loading: false,
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      showToast("Error al aceptar la invitación", "error");
    } finally {
      setInvitationModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Manejar rechazo de invitación
  const handleRejectInvitation = async () => {
    if (!invitationModal.notification || !user?.id) return;

    try {
      setInvitationModal(prev => ({ ...prev, loading: true }));

      // Importar dinámicamente la función para rechazar invitaciones
      const { respondToInvitation } = await import("@/lib/matchInvitations");

      // Buscar la invitación en la base de datos
      const { data: invitations, error } = await supabase
        .from("match_invitations")
        .select("id")
        .eq("match_id", invitationModal.notification.data.matchId)
        .eq("invitee_id", user.id)
        .eq("status", "pending")
        .single();

      if (error || !invitations) {
        showToast(
          "No se encontró la invitación o ya fue procesada",
          "error"
        );
        return;
      }

      // Rechazar la invitación
      await respondToInvitation(invitations.id, "declined");

      // Marcar la notificación como leída
      await markAsRead(invitationModal.notification.id);

      showToast(
        "Invitación rechazada correctamente.",
        "info"
      );

      // Cerrar el modal
      setInvitationModal({
        isOpen: false,
        notification: null,
        loading: false,
      });
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      showToast("Error al rechazar la invitación", "error");
    } finally {
      setInvitationModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Enviar mensaje privado
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !user?.id) return;

    try {
      const { error } = await supabase.from("private_messages").insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: newMessage.trim(),
        message_type: "text",
      });

      if (error) {
        console.error("Error sending message:", error);
        showToast("Error al enviar el mensaje", "error");
        return;
      }

      setNewMessage("");
      fetchMessages(selectedConversation);
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Error al enviar el mensaje", "error");
    }
  };

  // Efectos
  useEffect(() => {
    if (user?.id && isOpen) {
      fetchConversations();
    }
  }, [user?.id, isOpen, fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "match_invitation":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "group_request":
        return <User className="w-5 h-5 text-green-500" />;
      case "private_message":
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case "system_message":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "match_reminder":
        return <Bell className="w-5 h-5 text-yellow-500" />;
      case "group_activity":
        return <User className="w-5 h-5 text-indigo-500" />;
      case "match_result":
        return <Trophy className="w-5 h-5 text-gold-500" />;
      case "achievement":
        return <Trophy className="w-5 h-5 text-gold-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Filtrar notificaciones por búsqueda
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por tiempo
    const matchesTimeFilter = (() => {
      if (timeFilter === "all") return true;
      
      const notificationDate = new Date(notification.created_at);
      const now = new Date();
      
      switch (timeFilter) {
        case "today":
          return notificationDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return notificationDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return notificationDate >= monthAgo;
        default:
          return true;
      }
    })();

    const matchesType =
      typeFilter === "all" ||
      notification.type === typeFilter;

    return matchesSearch && matchesTimeFilter && matchesType;
  });

  // Filtrar conversaciones por búsqueda
  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipantName = [
      conversation.other_participant?.first_name,
      conversation.other_participant?.last_name,
    ]
      .filter(Boolean)
      .join(" ");
    return otherParticipantName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  const totalUnreadCount = unreadNotificationsCount + unreadMessagesCount;

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-text-main transition-colors"
      >
        <Bell className="w-6 h-6" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Modal de invitación */}
        <InvitationModal
          isOpen={invitationModal.isOpen}
          onClose={() => setInvitationModal({ isOpen: false, notification: null, loading: false })}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
          invitation={{
            title: invitationModal.notification?.title || "",
            content: invitationModal.notification?.content || "",
            matchDate: invitationModal.notification?.data?.matchDate,
            location: invitationModal.notification?.data?.location,
            matchId: invitationModal.notification?.data?.matchId,
          }}
          loading={invitationModal.loading}
        />

        {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-bg-main border border-border rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm">
          {/* Header mejorado */}
          <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border-b border-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-accent-primary" />
                </div>
                <h3 className="text-lg font-bold text-text-main font-heading">
                  Centro de Notificaciones
                </h3>
                {totalUnreadCount > 0 && (
                  <div className="w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-bg-main">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-text-secondary hover:text-text-main hover:bg-bg-secondary/50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs mejorados */}
            <div className="flex border-t border-border/30">
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === "notifications"
                    ? "text-accent-primary bg-accent-primary/5"
                    : "text-text-secondary hover:text-text-main hover:bg-bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>Notificaciones</span>
                  {unreadNotificationsCount > 0 && (
                    <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-bg-main">
                        {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                      </span>
                    </div>
                  )}
                </div>
                {activeTab === "notifications" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === "messages"
                    ? "text-accent-primary bg-accent-primary/5"
                    : "text-text-secondary hover:text-text-main hover:bg-bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Mensajes</span>
                  {unreadMessagesCount > 0 && (
                    <div className="w-5 h-5 bg-accent-secondary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-bg-main">
                        {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                      </span>
                    </div>
                  )}
                </div>
                {activeTab === "messages" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-text-secondary hover:text-text-main hover:bg-bg-secondary/30 transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === "notifications" && (
              <div className="p-2">
                {/* Filtros y búsqueda mejorados */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar notificaciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary/50 border border-border/50 rounded-lg text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-secondary/50 border border-border/50 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                      >
                        <option value="all">📅 Todas</option>
                        <option value="today">🌅 Hoy</option>
                        <option value="week">📊 Esta semana</option>
                        <option value="month">📆 Este mes</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-secondary/50 border border-border/50 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all text-sm"
                      >
                        <option value="all">🔔 Todos los tipos</option>
                        <option value="match_invitation">🎾 Invitaciones</option>
                        <option value="match_reminder">⏰ Recordatorios</option>
                        <option value="system">⚙️ Sistema</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Acciones rápidas mejoradas */}
                {filteredNotifications.length > 0 && (
                  <div className="mb-4 flex justify-between items-center pt-2 border-t border-border/30">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-error"}`} />
                      <span className="text-sm text-text-secondary">
                        {filteredNotifications.length} notificación
                        {filteredNotifications.length !== 1 ? "es" : ""}
                        {unreadNotificationsCount > 0 &&
                          ` (${unreadNotificationsCount} sin leer)`}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs px-3 py-1.5 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-all font-medium"
                        >
                          Marcar todas como leídas
                        </button>
                      )}
                      <button
                        onClick={refreshNotifications}
                        className="text-xs px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-lg hover:bg-bg-secondary/80 hover:text-text-main transition-all font-medium flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Actualizar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de notificaciones mejorada */}
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-text-secondary" />
                    </div>
                    <p className="text-text-secondary text-sm">
                      {searchTerm ||
                      timeFilter !== "all" ||
                      typeFilter !== "all"
                        ? "No se encontraron notificaciones con los filtros aplicados"
                        : "No tienes notificaciones"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md ${
                          !notification.is_read
                            ? "bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 border-accent-primary/20 shadow-sm"
                            : "bg-bg-secondary/30 border-border/50 hover:bg-bg-secondary/50"
                        }`}
                      >
                        {/* Indicador de no leído */}
                        {!notification.is_read && (
                          <div className="absolute top-3 left-3 w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                        )}

                        {/* Contenido principal */}
                        <div className="flex items-start space-x-3 ml-4">
                          {/* Icono de tipo */}
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent-primary/10">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`text-sm font-semibold mb-1 ${
                                  !notification.is_read ? "text-text-main" : "text-text-secondary"
                                }`}>
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                  {notification.content}
                                </p>
                              </div>
                              
                              {/* Acciones */}
                              <div className="flex items-center space-x-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.is_read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      realtimeMarkAsRead(notification.id);
                                    }}
                                    className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-all"
                                    title="Marcar como leída"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    realtimeDeleteNotification(notification.id);
                                  }}
                                  className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                  title="Eliminar notificación"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                              <span className="text-xs text-text-secondary">
                                {new Date(
                                  notification.created_at
                                ).toLocaleString("es-ES")}
                              </span>
                              {notification.type === "match_invitation" && (
                                <span className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-1 rounded-full font-medium">
                                  Click para aceptar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="h-96">
                {!selectedConversation ? (
                  <div>
                    {/* Búsqueda de conversaciones */}
                    <div className="p-4 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                          type="text"
                          placeholder="Buscar conversaciones..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Lista de conversaciones */}
                    <div className="divide-y divide-border">
                      {filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-text-secondary">
                          No hay conversaciones
                        </div>
                      ) : (
                        filteredConversations.map((conversation) => {
                          const otherParticipantName =
                            [
                              conversation.other_participant?.first_name,
                              conversation.other_participant?.last_name,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Usuario";

                          return (
                            <button
                              key={conversation.id}
                              onClick={() =>
                                setSelectedConversation(conversation.id)
                              }
                              className="w-full p-4 text-left hover:bg-bg-secondary transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                {conversation.other_participant?.avatar_url ? (
                                  <img
                                    src={
                                      conversation.other_participant.avatar_url
                                    }
                                    alt={otherParticipantName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                                    <span className="text-sm font-medium text-accent-primary">
                                      {otherParticipantName
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-text-main truncate">
                                      {otherParticipantName}
                                    </p>
                                    {conversation.unread_count &&
                                      conversation.unread_count > 0 && (
                                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                          {conversation.unread_count}
                                        </span>
                                      )}
                                  </div>
                                  <p className="text-xs text-text-secondary">
                                    {new Date(
                                      conversation.last_message_at
                                    ).toLocaleString("es-ES")}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Header de conversación */}
                    <div className="p-4 border-b border-border flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="text-text-secondary hover:text-text-main"
                      >
                        ←
                      </button>
                      <div className="flex-1">
                        {(() => {
                          const conversation = conversations.find(
                            (c) => c.id === selectedConversation
                          );
                          const otherParticipantName =
                            [
                              conversation?.other_participant?.first_name,
                              conversation?.other_participant?.last_name,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Usuario";

                          return (
                            <p className="text-sm font-medium text-text-main">
                              {otherParticipantName}
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isOwn ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs px-3 py-2 rounded-lg ${
                                isOwn
                                  ? "bg-accent-primary text-white"
                                  : "bg-bg-secondary text-text-main"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwn
                                    ? "text-white/70"
                                    : "text-text-secondary"
                                }`}
                              >
                                {new Date(
                                  message.created_at
                                ).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Input para nuevo mensaje */}
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Escribe un mensaje..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="p-4">
                <div className="text-center text-text-secondary">
                  <Settings className="w-12 h-12 mx-auto mb-2 text-text-secondary" />
                  <p>Configuración de notificaciones</p>
                  <p className="text-sm mt-1">Próximamente disponible</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de invitación */}
      <InvitationModal
        isOpen={invitationModal.isOpen}
        onClose={() => setInvitationModal({ isOpen: false, notification: null, loading: false })}
        onAccept={handleAcceptInvitation}
        onReject={handleRejectInvitation}
        invitation={{
          title: invitationModal.notification?.title || "",
          content: invitationModal.notification?.content || "",
          matchDate: invitationModal.notification?.data?.matchDate,
          location: invitationModal.notification?.data?.location,
          matchId: invitationModal.notification?.data?.matchId,
        }}
        loading={invitationModal.loading}
      />
    </div>
  );
}
