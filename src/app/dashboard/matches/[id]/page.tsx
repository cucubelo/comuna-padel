"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, X, Users, Trophy, UserPlus, Mail, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Tables } from "@/lib/types/supabase";
import {
  getUserTimezone,
  parseMatchDataForDisplay,
} from "@/lib/utils/timezoneUtils";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete";
import { SportsLocationResult } from "@/lib/sportsLocationService";
import {
  getGroupMembersForInvitation,
  sendMatchInvitations,
  GroupMemberForInvitation,
  getPendingInvitationsByMatch,
  getPendingInvitationsWithProfiles,
} from "@/lib/matchInvitations";

interface MatchParticipant extends Tables<"match_participants"> {
  profiles: Tables<"profiles"> | null;
}

interface MatchDetails extends Tables<"matches"> {
  groups: {
    id: string;
    name: string;
    slug: string;
  } | null;
  profiles: Tables<"profiles"> | null;
  match_participants: MatchParticipant[];
  sports_locations?: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    state: string | null;
    country: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  timezone?: string;
}

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [savingResults, setSavingResults] = useState(false);

  // Estados para diálogos de confirmación
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRemovePlayerDialog, setShowRemovePlayerDialog] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);

  // Estados para sistema avanzado de resultados
  const [showAdvancedResults, setShowAdvancedResults] = useState(false);
  const [sets, setSets] = useState<
    {
      set_number: number;
      team1_score: number;
      team2_score: number;
    }[]
  >([
    { set_number: 1, team1_score: 0, team2_score: 0 },
    { set_number: 2, team1_score: 0, team2_score: 0 },
    { set_number: 3, team1_score: 0, team2_score: 0 },
  ]);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | null>(null);

  // Estados para edición del partido
  const [isEditingMatch, setIsEditingMatch] = useState(false);
  const [editForm, setEditForm] = useState({
    scheduled_at: "",
    location_name: "",
    location_address: "",
    sports_location_id: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [selectedEditLocation, setSelectedEditLocation] =
    useState<SportsLocationResult | null>(null);

  // Estados para formación de equipos
  const [showTeamFormation, setShowTeamFormation] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [teams, setTeams] = useState<{
    team1: MatchParticipant[];
    team2: MatchParticipant[];
    unassigned: MatchParticipant[];
  }>({
    team1: [],
    team2: [],
    unassigned: [],
  });

  // Estados para sistema de invitaciones
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMemberForInvitation[]>(
    []
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState<string[]>([]);
  const [pendingInvitationsWithProfiles, setPendingInvitationsWithProfiles] = useState<GroupMemberForInvitation[]>([]);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails();

      // Suscripción en tiempo real para cambios en participantes
      const participantsSubscription = supabase
        .channel(`match_participants_${matchId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "match_participants",
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            console.log("Cambio en participantes:", payload);
            // Recargar los detalles del partido cuando hay cambios
            fetchMatchDetails();
          }
        )
        .subscribe();

      // Suscripción en tiempo real para cambios en el partido
      const matchSubscription = supabase
        .channel(`match_${matchId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "matches",
            filter: `id=eq.${matchId}`,
          },
          (payload) => {
            console.log("Cambio en partido:", payload);
            // Recargar los detalles del partido cuando hay cambios
            fetchMatchDetails();
          }
        )
        .subscribe();

      // Suscripción en tiempo real para cambios en invitaciones de partido
      const invitationsSubscription = supabase
        .channel(`match_invitations_${matchId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "match_invitations",
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            console.log("Cambio en invitaciones:", payload);
            // Recargar las invitaciones pendientes cuando hay cambios
            if (match?.group_id) {
              loadPendingInvitations(matchId);
            }
            // Mostrar notificación si se envió una nueva invitación
            if (payload.eventType === "INSERT" && payload.new) {
              showSuccess("Nueva invitación enviada");
            }
          }
        )
        .subscribe();

      // Cleanup function
      return () => {
        participantsSubscription.unsubscribe();
        matchSubscription.unsubscribe();
        invitationsSubscription.unsubscribe();
      };
    }
  }, [matchId, user]);

  // Inicializar formulario de edición cuando se carga el partido
  useEffect(() => {
    if (match && !isEditingMatch) {
      const scheduledDate = new Date(match.scheduled_at);
      const localDateTime = new Date(
        scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);

      setEditForm({
        scheduled_at: localDateTime,
        location_name: match.location_name || "",
        location_address: match.sports_locations?.address || "",
        sports_location_id: match.sports_location_id || null,
        latitude: match.latitude || null,
        longitude: match.longitude || null,
      });

      // Si hay una ubicación deportiva asociada, crear el objeto para selectedEditLocation
      if (match.sports_locations) {
        setSelectedEditLocation({
          id: match.sports_locations.id,
          name: match.sports_locations.name,
          address: match.sports_locations.address,
          city: match.sports_locations.city || "",
          state: match.sports_locations.state || "",
          country: match.sports_locations.country,
          country_code:
            match.sports_locations.country === "España" ? "ES" : "ES", // Asumimos ES por defecto
          latitude: match.sports_locations.latitude || 0,
          longitude: match.sports_locations.longitude || 0,
          source: "local" as const,
          category: "club_deportivo", // Categoría por defecto
          usage_count: 0,
        });
      } else {
        setSelectedEditLocation(null);
      }
    }
  }, [match, isEditingMatch]);

  // Inicializar equipos cuando se carga el partido
  useEffect(() => {
    if (match && match.match_participants) {
      const confirmedParticipants = match.match_participants.filter(
        (p) => p.status === "confirmed"
      );

      // Separar por equipos existentes o poner todos como no asignados
      const team1Players = confirmedParticipants.filter(
        (p) => p.team_number === 1
      );
      const team2Players = confirmedParticipants.filter(
        (p) => p.team_number === 2
      );
      const unassignedPlayers = confirmedParticipants.filter(
        (p) => !p.team_number
      );

      setTeams({
        team1: team1Players,
        team2: team2Players,
        unassigned: unassignedPlayers,
      });
    }
  }, [match]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(
          `
          *,
          groups (
            id,
            name,
            slug
          ),
          profiles!matches_creator_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          match_participants (
            *,
            profiles (
              id,
              first_name,
              last_name,
              avatar_url
            )
          ),
          sports_locations (
            id,
            name,
            address,
            city,
            state,
            country,
            latitude,
            longitude
          )
        `
        )
        .eq("id", matchId)
        .single();

      if (matchError) {
        throw matchError;
      }

      setMatch(matchData);

      // Obtener el estado del usuario actual en este partido
      if (user) {
        const userParticipant = matchData.match_participants.find(
          (p) => p.user_id === user.id
        );
        setUserStatus(userParticipant?.status || null);
      }

      // Cargar invitaciones pendientes automáticamente
      if (matchData.group_id) {
        await loadPendingInvitations(matchData.id);
      }
    } catch (err) {
      console.error("Error fetching match details:", err);
      setError("Error al cargar los detalles del partido");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar invitaciones pendientes
  const loadPendingInvitations = async (matchId: string) => {
    try {
      const pendingInvitationsWithProfiles = await getPendingInvitationsWithProfiles(matchId);
      setPendingInvitationsWithProfiles(pendingInvitationsWithProfiles);
    } catch (error) {
      console.error("Error loading pending invitations:", error);
    }
  };

  // Funciones para drag & drop
  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    setDraggedPlayer(playerId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent,
    targetTeam: "team1" | "team2" | "unassigned"
  ) => {
    e.preventDefault();

    if (!draggedPlayer) return;

    // Encontrar el jugador en cualquier equipo
    const findPlayerInTeams = () => {
      if (teams.team1.find((p) => p.user_id === draggedPlayer)) return "team1";
      if (teams.team2.find((p) => p.user_id === draggedPlayer)) return "team2";
      if (teams.unassigned.find((p) => p.user_id === draggedPlayer))
        return "unassigned";
      return null;
    };

    const sourceTeam = findPlayerInTeams();
    if (!sourceTeam || sourceTeam === targetTeam) {
      setDraggedPlayer(null);
      return;
    }

    // Verificar límites de equipo (máximo 2 jugadores por equipo)
    if (
      (targetTeam === "team1" || targetTeam === "team2") &&
      teams[targetTeam].length >= 2
    ) {
      showError("Cada equipo puede tener máximo 2 jugadores");
      setDraggedPlayer(null);
      return;
    }

    // Mover jugador
    const player = teams[sourceTeam].find((p) => p.user_id === draggedPlayer);
    if (!player) {
      setDraggedPlayer(null);
      return;
    }

    setTeams((prev) => ({
      ...prev,
      [sourceTeam]: prev[sourceTeam].filter((p) => p.user_id !== draggedPlayer),
      [targetTeam]: [...prev[targetTeam], player],
    }));

    setDraggedPlayer(null);
  };

  // Guardar formación de equipos
  const handleSaveTeamFormation = async () => {
    if (!user || !match || match.creator_id !== user.id) return;

    try {
      // Actualizar team_number para cada participante
      const updates = [
        ...teams.team1.map((p) => ({ user_id: p.user_id, team_number: 1 })),
        ...teams.team2.map((p) => ({ user_id: p.user_id, team_number: 2 })),
        ...teams.unassigned.map((p) => ({
          user_id: p.user_id,
          team_number: null,
        })),
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("match_participants")
          .update({ team_number: update.team_number })
          .eq("match_id", match.id)
          .eq("user_id", update.user_id);

        if (error) throw error;
      }

      // Actualizar estado local
      await fetchMatchDetails();
      setShowTeamFormation(false);
      showSuccess("Formación de equipos guardada exitosamente");
    } catch (error) {
      console.error("Error al guardar formación de equipos:", error);
      showError("Error al guardar la formación de equipos");
    }
  };

  // Función para calcular el ganador del partido basado en sets
  const calculateMatchWinner = (currentSets: typeof sets) => {
    let team1Sets = 0;
    let team2Sets = 0;

    currentSets.forEach((set) => {
      if (set.team1_score > set.team2_score) {
        team1Sets++;
      } else if (set.team2_score > set.team1_score) {
        team2Sets++;
      }
    });

    if (team1Sets > team2Sets) {
      return 1;
    } else if (team2Sets > team1Sets) {
      return 2;
    }
    return null;
  };

  // Función para actualizar puntuación de un set
  const updateSetScore = (
    setIndex: number,
    team: "team1" | "team2",
    score: number
  ) => {
    const newSets = [...sets];
    newSets[setIndex] = {
      ...newSets[setIndex],
      [`${team}_score`]: score,
    };
    setSets(newSets);
    setMatchWinner(calculateMatchWinner(newSets));
  };

  // Función para guardar resultados avanzados
  const handleSaveAdvancedResults = async () => {
    if (!user || !match || match.creator_id !== user.id || !matchWinner) return;

    try {
      setSavingResults(true);

      // Calcular puntuaciones totales para compatibilidad
      const team1TotalScore = sets.reduce(
        (sum, set) => sum + set.team1_score,
        0
      );
      const team2TotalScore = sets.reduce(
        (sum, set) => sum + set.team2_score,
        0
      );

      // Actualizar el partido con el resultado básico
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          team1_score: team1TotalScore,
          team2_score: team2TotalScore,
          status: "completed",
          winner_team: matchWinner,
        })
        .eq("id", match.id);

      if (matchError) throw matchError;

      // Guardar los sets detallados (cuando las tablas estén disponibles)
      // TODO: Implementar cuando se aplique la migración de match_sets
      /*
      for (const set of sets) {
        if (set.team1_score > 0 || set.team2_score > 0) {
          const { error: setError } = await supabase
            .from('match_sets')
            .insert({
              match_id: match.id,
              set_number: set.set_number,
              team1_score: set.team1_score,
              team2_score: set.team2_score
            });

          if (setError) throw setError;
        }
      }
      */

      await fetchMatchDetails();
      setShowAdvancedResults(false);
      showSuccess("Resultados guardados exitosamente");
    } catch (error) {
      console.error("Error al guardar resultados:", error);
      showError("Error al guardar los resultados");
    } finally {
      setSavingResults(false);
    }
  };

  // Función para editar el partido
  const handleEditMatch = async () => {
    if (!match || !user || match.creator_id !== user.id) return;

    try {
      setSavingResults(true);

      const { error } = await supabase
        .from("matches")
        .update({
          scheduled_at: editForm.scheduled_at,
          location_name: editForm.location_name,
          sports_location_id: editForm.sports_location_id,
          latitude: editForm.latitude,
          longitude: editForm.longitude,
        })
        .eq("id", match.id);

      if (error) throw error;

      await fetchMatchDetails();
      setIsEditingMatch(false);
      showSuccess("Partido actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar partido:", error);
      showError("Error al actualizar el partido");
    } finally {
      setSavingResults(false);
    }
  };

  // Función para manejar la selección de ubicación en edición
  const handleEditLocationSelect = (location: SportsLocationResult | null) => {
    setSelectedEditLocation(location);

    if (location) {
      setEditForm((prev) => ({
        ...prev,
        location_name: location.name,
        location_address: location.address,
        sports_location_id: location.source === "local" ? location.id : null,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        location_name: "",
        location_address: "",
        sports_location_id: null,
        latitude: null,
        longitude: null,
      }));
    }
  };

  // Función para obtener dirección desde coordenadas
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error("Error al obtener dirección:", error);
      return null;
    }
  };

  // Función para abrir en Google Maps
  const openInGoogleMaps = () => {
    if (!match) return;

    let url = "https://www.google.com/maps/search/";

    // Priorizar nombre y dirección completa para mejor búsqueda
    const locationName = match.sports_locations?.name || match.location_name;
    const address = match.sports_locations?.address;
    const city = match.sports_locations?.city;
    const state = match.sports_locations?.state;

    let searchQuery = "";

    if (locationName) {
      searchQuery = locationName;

      // Agregar dirección si está disponible
      if (address) {
        searchQuery += `, ${address}`;
      }

      // Agregar ciudad y estado si están disponibles
      if (city && state) {
        searchQuery += `, ${city}, ${state}`;
      } else if (city) {
        searchQuery += `, ${city}`;
      }
    }

    if (searchQuery) {
      url += encodeURIComponent(searchQuery);
    }

    window.open(url, "_blank");
  };

  // Cargar miembros del grupo para invitaciones
  const loadGroupMembers = async () => {
    if (!match?.group_id || !user) return;

    try {
      setLoadingMembers(true);
      
      // Cargar miembros del grupo y invitaciones pendientes en paralelo
      const [members, pendingIds, pendingWithProfiles] = await Promise.all([
        getGroupMembersForInvitation(match.group_id, user.id),
        getPendingInvitationsByMatch(match.id),
        getPendingInvitationsWithProfiles(match.id)
      ]);

      // Filtrar miembros que ya están en el partido
      const currentParticipantIds = match.match_participants.map(
        (p) => p.user_id
      );
      const availableMembers = members.filter(
        (member) => !currentParticipantIds.includes(member.user_id)
      );

      setGroupMembers(availableMembers);
      setPendingInvitations(pendingIds);
      setPendingInvitationsWithProfiles(pendingWithProfiles);
    } catch (error) {
      console.error("Error loading group members:", error);
      showError("Error al cargar los miembros del grupo");
    } finally {
      setLoadingMembers(false);
    }
  };

  // Enviar invitaciones
  const handleSendInvitations = async () => {
    if (!match || !user || selectedMembers.length === 0) return;

    try {
      setSendingInvitations(true);
      const result = await sendMatchInvitations(
        match.id,
        user.id,
        selectedMembers
      );

      if (result.success) {
        showSuccess(
          `Invitaciones enviadas exitosamente a ${result.invitationsSent} miembros`
        );
        
        // Actualizar las invitaciones pendientes localmente
        setPendingInvitations(prev => [...prev, ...selectedMembers]);
        
        // Recargar las invitaciones pendientes con perfiles completos
        await loadGroupMembers();
        
        setSelectedMembers([]);
        setSearchTerm("");
        // NO cerrar el modal automáticamente para permitir enviar más invitaciones
        // setShowInviteModal(false);
      } else {
        showError(result.error || "Error al enviar invitaciones");
      }
    } catch (error) {
      console.error("Error sending invitations:", error);
      showError("Error al enviar invitaciones");
    } finally {
      setSendingInvitations(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!user || !match) return;

    // Verificar si el partido es privado y el usuario no está invitado
    if (!match.is_public) {
      // Para partidos privados, verificar si el usuario ya tiene una invitación pendiente
      const existingParticipant = match.match_participants.find(
        (p) => p.user_id === user.id
      );
      if (!existingParticipant || existingParticipant.status !== "pending") {
        showError(
          "Este es un partido privado. Solo puedes unirte si has sido invitado."
        );
        return;
      }
    }

    try {
      const { error } = await supabase.from("match_participants").insert({
        match_id: match.id,
        user_id: user.id,
        status: "confirmed",
      });

      if (error) throw error;

      // Actualizar el estado local
      await fetchMatchDetails();
    } catch (err) {
      console.error("Error joining match:", err);
      showError("Error al unirse al partido");
    }
  };

  const handleLeaveMatch = async () => {
    if (!user || !match) return;

    try {
      const { error } = await supabase
        .from("match_participants")
        .delete()
        .eq("match_id", match.id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Actualizar el estado local
      await fetchMatchDetails();
    } catch (err) {
      console.error("Error leaving match:", err);
      showError("Error al salir del partido");
    }
  };

  const handleCancelMatch = async () => {
    if (!user || !match || match.creator_id !== user.id) return;
    setShowCancelDialog(true);
  };

  const confirmCancelMatch = async () => {
    setShowCancelDialog(false);

    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "canceled" })
        .eq("id", match.id);

      if (error) throw error;

      // Actualizar el estado local
      await fetchMatchDetails();
      showSuccess("Partido cancelado exitosamente");
    } catch (err) {
      console.error("Error cancelling match:", err);
      showError("Error al cancelar el partido");
    }
  };

  const handleSaveResults = async () => {
    if (!user || !match || match.creator_id !== user.id) return;

    setSavingResults(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          team1_score: team1Score,
          team2_score: team2Score,
        })
        .eq("id", match.id);

      if (error) throw error;

      // Actualizar el estado local
      await fetchMatchDetails();
      setShowResultsForm(false);
      showSuccess("Resultados guardados exitosamente");
    } catch (err) {
      console.error("Error saving results:", err);
      showError("Error al guardar los resultados");
    } finally {
      setSavingResults(false);
    }
  };

  // Función para expulsar un jugador
  const handleRemovePlayer = async (userId: string) => {
    setPlayerToRemove(userId);
    setShowRemovePlayerDialog(true);
  };

  const confirmRemovePlayer = async () => {
    if (!playerToRemove) return;

    setShowRemovePlayerDialog(false);

    try {
      const { error } = await supabase
        .from("match_participants")
        .delete()
        .eq("match_id", match.id)
        .eq("user_id", playerToRemove);

      if (error) throw error;

      // Actualizar el estado local
      setMatch((prev) => ({
        ...prev,
        match_participants: prev.match_participants.filter(
          (p) => p.user_id !== playerToRemove
        ),
      }));

      showSuccess("Jugador expulsado del partido");
    } catch (error) {
      console.error("Error al expulsar jugador:", error);
      showError("Error al expulsar jugador");
    } finally {
      setPlayerToRemove(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Parse match data for display in user's timezone
  const userTimezone = getUserTimezone();
  const matchTimezoneData = match
    ? parseMatchDataForDisplay(
        match.scheduled_at,
        match.timezone || "Europe/Madrid",
        userTimezone
      )
    : null;

  // Build local time text and timezone info
  const localTimeText = matchTimezoneData
    ? matchTimezoneData.localDate.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(match?.scheduled_at || "").toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

  const tzSuffixMatch =
    matchTimezoneData?.formattedDateTime.match(/\(([^)]+)\)$/);
  const timezoneInfo = {
    isDifferent: !(matchTimezoneData?.isOriginalTimezone ?? true),
    displayText: tzSuffixMatch ? `Hora original: ${tzSuffixMatch[1]}` : "",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-info/10 text-info border-info/20";
      case "completed":
        return "bg-success/10 text-success border-success/20";
      case "canceled":
        return "bg-error/10 text-error border-error/20";
      default:
        return "bg-text-secondary/10 text-text-secondary border-text-secondary/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Programado";
      case "confirmed":
        return "Confirmado";
      case "completed":
        return "Completado";
      case "canceled":
        return "Cancelado";
      default:
        return "Sin estado";
    }
  };

  const isExpired = match ? new Date(match.scheduled_at) < new Date() : false;
  const canJoin = match?.status === "scheduled" && !isExpired && !userStatus;
  const canLeave = userStatus === "confirmed" && match?.status === "scheduled";
  const canCancel =
    match?.creator_id === user?.id && match?.status === "scheduled";
  const isCreator = match?.creator_id === user?.id;

  // Función para formar equipos automáticamente
  const handleAutoFormTeams = () => {
    const confirmedParticipants =
      match?.match_participants.filter((p) => p.status === "confirmed") || [];

    if (confirmedParticipants.length < 4) {
      showError("Se necesitan al menos 4 jugadores para formar equipos");
      return;
    }

    // Mezclar jugadores aleatoriamente
    const shuffled = [...confirmedParticipants].sort(() => Math.random() - 0.5);

    setTeams({
      team1: shuffled.slice(0, 2),
      team2: shuffled.slice(2, 4),
      unassigned: shuffled.slice(4),
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-bg-secondary p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-bg-main rounded mb-6"></div>
              <div className="bg-bg-main rounded-lg p-6 mb-6">
                <div className="h-6 bg-bg-secondary rounded mb-4"></div>
                <div className="h-4 bg-bg-secondary rounded mb-2"></div>
                <div className="h-4 bg-bg-secondary rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !match) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-bg-secondary p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-bg-main rounded-lg p-6 text-center">
              <h1 className="text-2xl font-bold text-text-main mb-4">
                {error || "Partido no encontrado"}
              </h1>
              <button
                onClick={() => router.back()}
                className="bg-accent-primary text-bg-main px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-secondary p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-text-secondary hover:text-text-main transition-colors"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver
            </button>

            {isCreator && (
              <span className="px-3 py-1 text-sm font-medium bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20">
                Creador
              </span>
            )}
          </div>

          {/* Match Info Card */}
          <div className="bg-bg-main rounded-lg p-6 mb-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-text-main font-montserrat mb-2">
                  Partido {match.is_public ? "Público" : "Privado"}
                </h1>
                {match.groups && (
                  <p className="text-text-secondary font-open-sans">
                    Grupo: {match.groups.name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    match.status
                  )}`}
                >
                  {getStatusText(match.status)}
                </span>

                {/* Edit button next to status */}
                {user &&
                  match.creator_id === user.id &&
                  match.status !== "completed" &&
                  !isEditingMatch && (
                    <button
                      onClick={() => setIsEditingMatch(true)}
                      className="px-3 py-1.5 bg-accent-primary text-black rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </button>
                  )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-accent-primary mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2V12a2 2 0 002 2z"
                  />
                </svg>
                <div className="flex-1">
                  {!isEditingMatch ? (
                    <div>
                      <p className="text-sm text-text-secondary font-open-sans">
                        Fecha
                      </p>
                      <p className="text-text-main font-medium capitalize">
                        {matchTimezoneData
                          ? formatDate(matchTimezoneData.localDate)
                          : formatDate(new Date(match.scheduled_at))}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Fecha y Hora
                      </label>
                      <input
                        type="datetime-local"
                        value={editForm.scheduled_at}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            scheduled_at: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-accent-secondary mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  {!isEditingMatch ? (
                    <div>
                      <p className="text-sm text-text-secondary font-open-sans">
                        Hora
                      </p>
                      <p className="text-text-main font-medium">
                        {localTimeText}
                      </p>
                      {/* Timezone info */}
                      {timezoneInfo.isDifferent && (
                        <div className="flex items-center text-xs text-text-secondary font-open-sans mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{timezoneInfo.displayText}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-text-secondary font-open-sans">
                      Ajusta la fecha y hora en el campo de la izquierda
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            {(match.location_name ||
              match.sports_locations ||
              isEditingMatch) && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center flex-1">
                  <svg
                    className="h-5 w-5 text-accent-secondary mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    {!isEditingMatch ? (
                      <div>
                        <p className="text-sm text-text-secondary font-open-sans">
                          Ubicación
                        </p>
                        <p className="text-text-main font-medium">
                          {match.sports_locations?.name || match.location_name}
                        </p>
                        {match.sports_locations?.address && (
                          <p className="text-sm text-text-secondary mt-1">
                            {match.sports_locations.address}
                          </p>
                        )}
                        {match.sports_locations?.city &&
                          match.sports_locations?.state && (
                            <p className="text-xs text-text-secondary mt-1">
                              {match.sports_locations.city},{" "}
                              {match.sports_locations.state}
                            </p>
                          )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Ubicación
                        </label>
                        <LocationAutocomplete
                          value={selectedEditLocation?.name || ""}
                          onChange={handleEditLocationSelect}
                          placeholder="Buscar ubicación..."
                          className="w-full"
                          skipInitialSearch={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {!isEditingMatch &&
                  (match.location_name || match.sports_locations) && (
                    <button
                      onClick={openInGoogleMaps}
                      className="px-3 py-2 bg-accent-primary text-black text-sm rounded-md hover:bg-accent-primary/90 transition-colors flex items-center gap-2 font-medium ml-4"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      Ver en Maps
                    </button>
                  )}
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-accent-primary mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 002 2v6a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-text-secondary font-open-sans">
                    Participantes
                  </p>
                  <p className="text-text-main font-medium">
                    {
                      match.match_participants.filter(
                        (p) => p.status === "confirmed"
                      ).length
                    }{" "}
                    confirmados
                  </p>
                </div>
              </div>

              {match.required_skill_level && (
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-warning mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-text-secondary font-open-sans">
                      Nivel requerido
                    </p>
                    <p className="text-text-main font-medium">
                      {match.required_skill_level}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-info mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-text-secondary font-open-sans">
                    Tipo
                  </p>
                  <p className="text-text-main font-medium">
                    {match.is_public ? "Público" : "Privado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isEditingMatch && (
              <div className="bg-bg-secondary rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-text-main font-montserrat">
                    Acciones del Partido
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {canJoin && (
                    <button
                      onClick={handleJoinMatch}
                      className="bg-success text-white px-6 py-2 rounded-lg font-medium hover:bg-success/90 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Unirse al partido
                    </button>
                  )}

                  {canLeave && (
                    <button
                      onClick={handleLeaveMatch}
                      className="bg-error/10 text-error px-6 py-2 rounded-lg font-medium hover:bg-error/20 transition-colors border border-error/20 flex items-center gap-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Salir del partido
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={handleCancelMatch}
                      className="bg-error text-white px-6 py-2 rounded-lg font-medium hover:bg-error/90 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Cancelar partido
                    </button>
                  )}

                  {/* Botón para formar equipos */}
                  {isCreator &&
                    match.status === "confirmed" &&
                    match.match_participants.filter(
                      (p) => p.status === "confirmed"
                    ).length >= 4 && (
                      <button
                        onClick={() => setShowTeamFormation(true)}
                        className="bg-accent-secondary text-white px-6 py-2 rounded-lg font-medium hover:bg-accent-secondary/90 transition-colors flex items-center gap-2"
                      >
                        <Users size={16} />
                        Formar Equipos
                      </button>
                    )}

                  {/* Botón para registrar resultados */}
                  {isCreator &&
                    match.status === "completed" &&
                    !showResultsForm &&
                    !showAdvancedResults && (
                      <>
                        <button
                          onClick={() => setShowResultsForm(true)}
                          className="bg-accent-primary text-black px-6 py-2 rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Resultado Simple
                        </button>
                        <button
                          onClick={() => setShowAdvancedResults(true)}
                          className="bg-accent-secondary text-white px-6 py-2 rounded-lg font-medium hover:bg-accent-secondary/90 transition-colors flex items-center gap-2"
                        >
                          <Trophy size={16} />
                          Resultado por Sets
                        </button>
                      </>
                    )}

                  {userStatus === "confirmed" && (
                    <span className="bg-success/10 text-success px-6 py-2 rounded-lg font-medium border border-success/20 flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Confirmado
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Botones de edición del partido - aparecen en lugar de las acciones */}
            {user &&
              match.creator_id === user.id &&
              match.status !== "completed" &&
              isEditingMatch && (
                <div className="bg-bg-secondary rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-main font-montserrat">
                      Configuración del Partido
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleEditMatch}
                      disabled={savingResults}
                      className="px-6 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingResults ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditingMatch(false)}
                      className="px-6 py-2 bg-text-secondary/10 text-text-secondary rounded-lg font-medium hover:bg-text-secondary/20 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* Registro de Resultados por Sets */}
          {showAdvancedResults && isCreator && match.status === "completed" && (
            <div className="bg-bg-main rounded-lg p-6 mb-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-main font-montserrat">
                  Registrar Resultados por Sets
                </h2>
                <button
                  onClick={() => setShowAdvancedResults(false)}
                  className="bg-text-secondary/10 text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-text-secondary/20 transition-colors"
                >
                  Cancelar
                </button>
              </div>

              {/* Información de equipos */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-bg-secondary rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-accent-primary mb-3 text-center">
                    Equipo 1
                  </h3>
                  <div className="space-y-2">
                    {match.match_participants
                      .filter((p) => p.team_number === 1)
                      .map((participant) => (
                        <div
                          key={participant.user_id}
                          className="flex items-center"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-accent-primary/10 flex items-center justify-center mr-2">
                            {participant.profiles?.avatar_url ? (
                              <img
                                src={participant.profiles.avatar_url}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-accent-primary font-medium text-xs">
                                {participant.profiles?.first_name?.charAt(0) ||
                                  "?"}
                              </span>
                            )}
                          </div>
                          <span className="text-text-main text-sm">
                            {participant.profiles?.first_name}{" "}
                            {participant.profiles?.last_name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-bg-secondary rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-accent-secondary mb-3 text-center">
                    Equipo 2
                  </h3>
                  <div className="space-y-2">
                    {match.match_participants
                      .filter((p) => p.team_number === 2)
                      .map((participant) => (
                        <div
                          key={participant.user_id}
                          className="flex items-center"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-accent-secondary/10 flex items-center justify-center mr-2">
                            {participant.profiles?.avatar_url ? (
                              <img
                                src={participant.profiles.avatar_url}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-accent-secondary font-medium text-xs">
                                {participant.profiles?.first_name?.charAt(0) ||
                                  "?"}
                              </span>
                            )}
                          </div>
                          <span className="text-text-main text-sm">
                            {participant.profiles?.first_name}{" "}
                            {participant.profiles?.last_name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Registro de sets */}
              <div className="space-y-4 mb-6">
                {sets.map((set, index) => (
                  <div
                    key={set.set_number}
                    className="bg-bg-secondary rounded-lg p-4"
                  >
                    <h4 className="text-lg font-semibold text-text-main mb-4 text-center">
                      Set {set.set_number}
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <label className="block text-sm font-medium text-accent-primary mb-2">
                          Equipo 1
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="7"
                          value={set.team1_score}
                          onChange={(e) =>
                            updateSetScore(
                              index,
                              "team1",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 h-12 text-center text-xl font-bold bg-bg-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        />
                      </div>
                      <div className="text-center">
                        <label className="block text-sm font-medium text-accent-secondary mb-2">
                          Equipo 2
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="7"
                          value={set.team2_score}
                          onChange={(e) =>
                            updateSetScore(
                              index,
                              "team2",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 h-12 text-center text-xl font-bold bg-bg-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-secondary"
                        />
                      </div>
                    </div>
                    {set.team1_score > 0 || set.team2_score > 0 ? (
                      <div className="text-center mt-3">
                        <span
                          className={`text-sm font-medium ${
                            set.team1_score > set.team2_score
                              ? "text-accent-primary"
                              : set.team2_score > set.team1_score
                              ? "text-accent-secondary"
                              : "text-text-secondary"
                          }`}
                        >
                          {set.team1_score > set.team2_score
                            ? "Ganó Equipo 1"
                            : set.team2_score > set.team1_score
                            ? "Ganó Equipo 2"
                            : "Empate"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Resultado del partido */}
              {matchWinner && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-success mb-2">
                      🏆 Ganador del Partido
                    </h3>
                    <p
                      className={`text-xl font-bold ${
                        matchWinner === 1
                          ? "text-accent-primary"
                          : "text-accent-secondary"
                      }`}
                    >
                      Equipo {matchWinner}
                    </p>
                    <p className="text-sm text-text-secondary mt-2">
                      Sets ganados:{" "}
                      {
                        sets.filter((set) =>
                          matchWinner === 1
                            ? set.team1_score > set.team2_score
                            : set.team2_score > set.team1_score
                        ).length
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Botón guardar */}
              {matchWinner && (
                <button
                  onClick={handleSaveAdvancedResults}
                  disabled={savingResults}
                  className="w-full bg-success text-white py-3 rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingResults ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Trophy size={16} />
                      Guardar Resultados
                    </>
                  )}
                </button>
              )}

              {!matchWinner && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-warning text-sm text-center">
                    <strong>Nota:</strong> Ingresa las puntuaciones de los sets
                    para determinar el ganador del partido.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Formación de Equipos */}
          {showTeamFormation && isCreator && (
            <div className="bg-bg-main rounded-lg p-6 mb-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-main font-montserrat">
                  Formación de Equipos
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleAutoFormTeams}
                    className="bg-accent-secondary/10 text-accent-secondary px-4 py-2 rounded-lg font-medium hover:bg-accent-secondary/20 transition-colors border border-accent-secondary/20"
                  >
                    Formar Automáticamente
                  </button>
                  <button
                    onClick={() => setShowTeamFormation(false)}
                    className="bg-text-secondary/10 text-text-secondary px-4 py-2 rounded-lg font-medium hover:bg-text-secondary/20 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Equipo 1 */}
                <div
                  className="bg-bg-secondary rounded-lg p-4 min-h-[200px] border-2 border-dashed border-accent-primary/30"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "team1")}
                >
                  <h3 className="text-lg font-semibold text-accent-primary mb-4 text-center">
                    Equipo 1 ({teams.team1.length}/2)
                  </h3>
                  <div className="space-y-3">
                    {teams.team1.map((participant) => (
                      <div
                        key={participant.user_id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, participant.user_id)
                        }
                        className="flex items-center p-3 bg-bg-main rounded-lg cursor-move hover:shadow-md transition-shadow border border-accent-primary/20"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-primary/10 flex items-center justify-center mr-3">
                          {participant.profiles?.avatar_url ? (
                            <img
                              src={participant.profiles.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-accent-primary font-medium text-sm">
                              {participant.profiles?.first_name?.charAt(0) ||
                                "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-main font-medium text-sm">
                            {participant.profiles?.first_name}{" "}
                            {participant.profiles?.last_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipo 2 */}
                <div
                  className="bg-bg-secondary rounded-lg p-4 min-h-[200px] border-2 border-dashed border-accent-secondary/30"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "team2")}
                >
                  <h3 className="text-lg font-semibold text-accent-secondary mb-4 text-center">
                    Equipo 2 ({teams.team2.length}/2)
                  </h3>
                  <div className="space-y-3">
                    {teams.team2.map((participant) => (
                      <div
                        key={participant.user_id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, participant.user_id)
                        }
                        className="flex items-center p-3 bg-bg-main rounded-lg cursor-move hover:shadow-md transition-shadow border border-accent-secondary/20"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-secondary/10 flex items-center justify-center mr-3">
                          {participant.profiles?.avatar_url ? (
                            <img
                              src={participant.profiles.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-accent-secondary font-medium text-sm">
                              {participant.profiles?.first_name?.charAt(0) ||
                                "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-main font-medium text-sm">
                            {participant.profiles?.first_name}{" "}
                            {participant.profiles?.last_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jugadores sin asignar */}
                <div
                  className="bg-bg-secondary rounded-lg p-4 min-h-[200px] border-2 border-dashed border-text-secondary/30"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "unassigned")}
                >
                  <h3 className="text-lg font-semibold text-text-secondary mb-4 text-center">
                    Sin Asignar ({teams.unassigned.length})
                  </h3>
                  <div className="space-y-3">
                    {teams.unassigned.map((participant) => (
                      <div
                        key={participant.user_id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, participant.user_id)
                        }
                        className="flex items-center p-3 bg-bg-main rounded-lg cursor-move hover:shadow-md transition-shadow border border-text-secondary/20"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-text-secondary/10 flex items-center justify-center mr-3">
                          {participant.profiles?.avatar_url ? (
                            <img
                              src={participant.profiles.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-text-secondary font-medium text-sm">
                              {participant.profiles?.first_name?.charAt(0) ||
                                "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-main font-medium text-sm">
                            {participant.profiles?.first_name}{" "}
                            {participant.profiles?.last_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instrucciones y botón guardar */}
              <div className="mt-6">
                <div className="bg-info/10 border border-info/20 rounded-lg p-4 mb-4">
                  <p className="text-info text-sm">
                    <strong>Instrucciones:</strong> Arrastra los jugadores entre
                    los equipos. Cada equipo debe tener exactamente 2 jugadores
                    para poder guardar la formación.
                  </p>
                </div>

                {teams.team1.length === 2 && teams.team2.length === 2 && (
                  <button
                    onClick={handleSaveTeamFormation}
                    className="bg-success text-white px-6 py-2 rounded-lg font-medium hover:bg-success/90 transition-colors flex items-center gap-2"
                  >
                    <Trophy size={16} />
                    Guardar Formación de Equipos
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="bg-bg-main rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-main font-montserrat">
                Participantes (
                {
                  match.match_participants.filter(
                    (p) => p.status === "confirmed"
                  ).length
                }
                )
              </h2>

              {/* Botón para invitar miembros */}
              {isCreator &&
                !match.is_public &&
                match.status === "scheduled" && (
                  <button
                    onClick={() => {
                      setShowInviteModal(true);
                      loadGroupMembers();
                    }}
                    className="bg-accent-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-accent-primary/90 transition-colors flex items-center gap-2 text-sm"
                  >
                    <UserPlus size={16} />
                    Invitar
                  </button>
                )}
            </div>

            {/* Indicador de progreso para confirmación */}
            {match.status === "scheduled" && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">
                    {
                      match.match_participants.filter(
                        (p) => p.status === "confirmed"
                      ).length
                    }{" "}
                    de 4 jugadores necesarios
                  </span>
                  <span className="text-sm font-medium text-accent-primary">
                    {match.match_participants.filter(
                      (p) => p.status === "confirmed"
                    ).length >= 4
                      ? "Listo para confirmar"
                      : `Faltan ${
                          4 -
                          match.match_participants.filter(
                            (p) => p.status === "confirmed"
                          ).length
                        } jugadores`}
                  </span>
                </div>
                <div className="w-full bg-bg-secondary rounded-full h-2.5">
                  <div
                    className="bg-accent-primary h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (match.match_participants.filter(
                          (p) => p.status === "confirmed"
                        ).length /
                          4) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  El partido se confirmará automáticamente cuando haya 4
                  jugadores.
                </p>
              </div>
            )}

            {match.match_participants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {match.match_participants
                  .filter((p) => p.status === "confirmed")
                  .map((participant) => (
                    <div
                      key={`${participant.match_id}-${participant.user_id}`}
                      className="flex items-center p-3 bg-bg-secondary rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-accent-primary/10 flex items-center justify-center mr-3">
                        {participant.profiles?.avatar_url ? (
                          <img
                            src={participant.profiles.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-accent-primary font-medium">
                            {participant.profiles?.first_name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-text-main font-medium">
                          {participant.profiles?.first_name}{" "}
                          {participant.profiles?.last_name}
                        </p>
                        {participant.user_id === match.creator_id && (
                          <p className="text-xs text-accent-primary">
                            Organizador
                          </p>
                        )}
                      </div>
                      {/* Botón de expulsión para el creador */}
                      {isCreator &&
                        participant.user_id !== match.creator_id && (
                          <button
                            onClick={() =>
                              handleRemovePlayer(participant.user_id)
                            }
                            className="ml-2 p-1 text-error hover:bg-error/10 rounded-full transition-colors"
                            title="Expulsar jugador"
                          >
                            <X size={16} />
                          </button>
                        )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-text-secondary font-open-sans text-center py-8">
                Aún no hay participantes confirmados
              </p>
            )}
          </div>

          {/* Invitaciones Pendientes */}
          {pendingInvitationsWithProfiles.length > 0 && (
            <div className="bg-bg-main rounded-lg p-6 mb-6 border border-border">
              <h2 className="text-xl font-bold text-text-main font-montserrat mb-4 flex items-center">
                <Mail className="mr-2" size={20} />
                Invitaciones Pendientes ({pendingInvitationsWithProfiles.length})
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingInvitationsWithProfiles.map((invitation) => (
                  <div
                    key={invitation.user_id}
                    className="flex flex-col p-3 bg-bg-secondary rounded-lg border border-yellow-500/20"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-yellow-500/10 flex items-center justify-center mr-3">
                        {invitation.avatar_url ? (
                          <img
                            src={invitation.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-yellow-600 font-medium">
                            {invitation.first_name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-text-main font-medium">
                          {invitation.first_name} {invitation.last_name}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Invitación pendiente
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de Resultados */}
          {showResultsForm && isCreator && (
            <div className="bg-bg-main rounded-lg p-6 mb-6 border border-border">
              <h2 className="text-xl font-bold text-text-main font-montserrat mb-4">
                Registrar Resultados
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Equipo 1
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={team1Score}
                    onChange={(e) =>
                      setTeam1Score(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Equipo 2
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={team2Score}
                    onChange={(e) =>
                      setTeam2Score(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveResults}
                  disabled={savingResults}
                  className="bg-success text-white px-6 py-2 rounded-lg font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingResults ? "Guardando..." : "Guardar Resultados"}
                </button>

                <button
                  onClick={() => setShowResultsForm(false)}
                  className="bg-text-secondary/10 text-text-secondary px-6 py-2 rounded-lg font-medium hover:bg-text-secondary/20 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Mostrar Resultados si existen */}
          {match.status === "completed" &&
            (match.team1_score !== null || match.team2_score !== null) && (
              <div className="bg-bg-main rounded-lg p-6 mb-6 border border-border">
                <h2 className="text-xl font-bold text-text-main font-montserrat mb-4">
                  Resultados
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">Equipo 1</p>
                    <p className="text-3xl font-bold text-text-main">
                      {match.team1_score || 0}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">Equipo 2</p>
                    <p className="text-3xl font-bold text-text-main">
                      {match.team2_score || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Diálogos de confirmación */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={confirmCancelMatch}
        title="Cancelar Partido"
        message="¿Estás seguro de que quieres cancelar este partido?"
        confirmText="Cancelar Partido"
        cancelText="No, mantener"
        type="danger"
      />

      <ConfirmDialog
        isOpen={showRemovePlayerDialog}
        onClose={() => {
          setShowRemovePlayerDialog(false);
          setPlayerToRemove(null);
        }}
        onConfirm={confirmRemovePlayer}
        title="Expulsar Jugador"
        message="¿Estás seguro de que quieres expulsar a este jugador del partido?"
        confirmText="Expulsar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal para invitar miembros */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-main rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-main font-montserrat">
                Invitar Miembros al Partido
              </h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedMembers([]);
                  setSearchTerm("");
                }}
                className="text-text-secondary hover:text-text-main transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                <span className="ml-3 text-text-secondary">
                  Cargando miembros...
                </span>
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">
                  No hay miembros disponibles para invitar en este momento.
                </p>
              </div>
            ) : (
              <>
                {/* Campo de búsqueda */}
                <div className="mb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Buscar miembros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-bg-secondary text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-text-secondary mb-3">
                    Selecciona los miembros que quieres invitar al partido:
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {groupMembers
                      .filter((member) => {
                        if (!searchTerm) return true;
                        const fullName = `${member.first_name || ""} ${
                          member.last_name || ""
                        }`.toLowerCase();
                        return fullName.includes(searchTerm.toLowerCase());
                      })
                      .map((member) => {
                        const hasPendingInvitation = pendingInvitations.includes(member.user_id);
                        return (
                        <label
                          key={member.user_id}
                          className={`flex items-center p-3 rounded-lg border border-border transition-colors ${
                            hasPendingInvitation 
                              ? 'bg-black-50 cursor-not-allowed opacity-60' 
                              : 'hover:bg-bg-secondary cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.user_id)}
                            disabled={hasPendingInvitation}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers((prev) => [
                                  ...prev,
                                  member.user_id,
                                ]);
                              } else {
                                setSelectedMembers((prev) =>
                                  prev.filter((id) => id !== member.user_id)
                                );
                              }
                            }}
                            className="mr-3 h-4 w-4 text-accent-primary focus:ring-accent-primary border-border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <div className="flex items-center flex-1">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={`${member.first_name} ${member.last_name}`}
                                className="h-8 w-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-accent-primary/20 flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-accent-primary">
                                  {member.first_name?.[0]}
                                  {member.last_name?.[0]}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-text-main">
                                  {member.first_name} {member.last_name}
                                </p>
                                {pendingInvitations.includes(member.user_id) && (
                                  <span className="px-2 py-1 text-xs bg-warning/10 text-warning border border-warning/20 rounded-full">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                              {member.skill_level && (
                                <p className="text-xs text-text-secondary">
                                  Nivel: {member.skill_level}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                        );
                      })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSendInvitations}
                    disabled={
                      selectedMembers.length === 0 || sendingInvitations
                    }
                    className="flex-1 bg-accent-primary text-black px-4 py-2 rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sendingInvitations ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        Enviar Invitaciones ({selectedMembers.length})
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedMembers([]);
                      setSearchTerm("");
                    }}
                    className="px-4 py-2 rounded-lg font-medium border border-border text-text-secondary hover:bg-bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
