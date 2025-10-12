"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AccessRequestsModal from "./AccessRequestsModal";

interface GroupMember {
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  points: number;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    skill_level: number | null;
    preferred_position: "left" | "right" | "both" | null;
    city: string | null;
    country: string | null;
  };
}

interface GroupMatch {
  id: string;
  scheduled_at: string;
  location_name: string;
  status: string;
  team1_score: number | null;
  team2_score: number | null;
  participants_count: number;
}

interface Group {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  postal_code?: string | null;
  place_name?: string | null;
  group_type: "private" | "public" | "premium";
  creator_id: string;
  created_at: string;
}

interface GroupDetailsProps {
  groupId: string;
}

export default function GroupDetails({ groupId }: GroupDetailsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [matches, setMatches] = useState<GroupMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "matches"
  >("overview");
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [showAccessRequestsModal, setShowAccessRequestsModal] = useState(false);

  const fetchGroupDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      setGroup(groupData);

      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select(
          `
          user_id,
          role,
          joined_at,
          points,
          profiles (
            full_name,
            avatar_url,
            skill_level,
            preferred_position,
            city,
            country
          )
        `
        )
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      if (membersError) throw membersError;

      const formattedMembers = membersData?.map((member) => ({
        ...member,
        profiles: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles,
      }));

      setMembers(formattedMembers || []);

      // Check user role
      const userMember = membersData?.find(
        (member) => member.user_id === user?.id
      );
      setUserRole(userMember?.role || null);

      // Fetch recent matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(
          `
          id,
          scheduled_at,
          location_name,
          status,
          team1_score,
          team2_score,
          match_participants (count)
        `
        )
        .eq("group_id", groupId)
        .order("scheduled_at", { ascending: false })
        .limit(5);

      if (matchesError) throw matchesError;

      const formattedMatches = matchesData?.map(match => {
        const participantsCount = Array.isArray(match.match_participants) ? match.match_participants[0]?.count ?? 0 : 0;
        return {
          ...match,
          participants_count: participantsCount,
        };
      }) || [];

      setMatches(formattedMatches);
    } catch (error) {
      console.error("Error fetching group details:", error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId, fetchGroupDetails]);

  const handleJoinGroup = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;

      // Refresh data
      fetchGroupDetails();
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      router.push("/dashboard/groups");
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const getSkillLevelText = (level: number | null) => {
    if (!level) return "No especificado";
    if (level <= 2) return "Principiante";
    if (level <= 4) return "Intermedio";
    if (level <= 6) return "Avanzado";
    return "Profesional";
  };

  const getPositionText = (position: string | null) => {
    switch (position) {
      case "left":
        return "Izquierda";
      case "right":
        return "Derecha";
      case "both":
        return "Ambas";
      default:
        return "No especificada";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-main rounded mb-4"></div>
            <div className="h-64 bg-bg-main rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-bg-secondary p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-text-main mb-2">
              Grupo no encontrado
            </h2>
            <p className="text-text-secondary mb-4">
              El grupo que buscas no existe o no tienes permisos para verlo.
            </p>
            <button
              onClick={() => router.push("/dashboard/groups")}
              className="bg-accent-primary text-bg-main px-4 py-2 rounded-lg font-medium"
            >
              Volver a grupos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text-main mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
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

          <div className="bg-bg-main rounded-xl border border-border p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-text-main font-montserrat mb-2">
                  {group.name}
                </h1>
                <p className="text-text-secondary font-open-sans mb-4">
                  {group.description || "Sin descripción disponible"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    {group.group_type === "public" ? "Público" : "Privado"}
                  </span>
                  {userRole === "admin" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning/10 text-warning border border-warning/20">
                      Administrador
                    </span>
                  )}
                  {userRole === "member" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-success border border-success/20">
                      Miembro
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!userRole && (
                  <button
                    onClick={handleJoinGroup}
                    className="bg-accent-primary hover:bg-accent-primary/90 text-bg-main px-6 py-3 rounded-lg font-medium font-open-sans transition-colors"
                  >
                    Unirse al grupo
                  </button>
                )}

                {userRole === "member" && (
                  <button
                    onClick={handleLeaveGroup}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-3 rounded-lg font-medium font-open-sans transition-colors"
                  >
                    Abandonar grupo
                  </button>
                )}

                {userRole === "admin" && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/groups/edit/${groupId}`)
                      }
                      className="bg-bg-secondary hover:bg-border text-text-main border border-border px-6 py-3 rounded-lg font-medium font-open-sans transition-colors"
                    >
                      Editar grupo
                    </button>
                    
                    {group?.group_type === 'private' && (
                      <button
                        onClick={() => setShowAccessRequestsModal(true)}
                        className="bg-accent-secondary/10 hover:bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/20 px-6 py-3 rounded-lg font-medium font-open-sans transition-colors"
                      >
                        Solicitudes de Acceso
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-bg-main rounded-xl border border-border p-2">
            <nav className="flex space-x-1">
              {[
                { id: "overview", label: "Resumen", icon: "📊" },
                {
                  id: "members",
                  label: `Miembros (${members.length})`,
                  icon: "👥",
                },
                {
                  id: "matches",
                  label: `Partidos (${matches.length})`,
                  icon: "🎾",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "overview" | "members" | "matches")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium font-open-sans transition-all ${
                    activeTab === tab.id
                      ? "bg-accent-primary text-bg-main shadow-sm"
                      : "text-text-secondary hover:text-text-main hover:bg-bg-secondary"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Group Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-bg-main rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-text-main font-montserrat mb-4">
                    Información del Grupo
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-accent-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-accent-secondary"
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
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Ubicación</p>
                        <p className="text-text-main font-medium">
                          {group.city && group.country
                            ? `${group.city}, ${group.country}`
                            : "No especificada"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-accent-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Creado</p>
                        <p className="text-text-main font-medium">
                          {formatDate(group.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-6">
                <div className="bg-bg-main rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-text-main font-montserrat mb-4">
                    Estadísticas
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-accent-primary">
                        {members.length}
                      </div>
                      <div className="text-sm text-text-secondary">
                        Miembros
                      </div>
                    </div>
                    <div className="text-center p-4 bg-bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-accent-secondary">
                        {matches.length}
                      </div>
                      <div className="text-sm text-text-secondary">
                        Partidos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="bg-bg-main rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-text-main font-montserrat mb-6">
                Miembros del Grupo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="bg-bg-secondary/50 rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        {member.profiles.avatar_url ? (
                          <Image
                            src={member.profiles.avatar_url}
                            alt={member.profiles.full_name || "Usuario"}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-accent-primary font-semibold">
                            {member.profiles.full_name
                              ?.charAt(0)
                              ?.toUpperCase() || "👤"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text-main truncate">
                          {member.profiles.full_name || "Usuario sin nombre"}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              member.role === "admin"
                                ? "bg-warning/10 text-warning border border-warning/20"
                                : "bg-success/10 text-success border border-success/20"
                            }`}
                          >
                            {member.role === "admin" ? "Admin" : "Miembro"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Nivel:</span>
                        <span className="text-text-main">
                          {getSkillLevelText(member.profiles.skill_level)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Posición:</span>
                        <span className="text-text-main">
                          {getPositionText(member.profiles.preferred_position)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Puntos:</span>
                        <span className="text-accent-primary font-medium">
                          {member.points}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "matches" && (
            <div className="bg-bg-main rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-text-main font-montserrat mb-6">
                Partidos Recientes
              </h3>
              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">
                    No hay partidos registrados aún.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="bg-bg-secondary/50 rounded-lg p-4 border border-border"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-text-main mb-1">
                            {match.location_name}
                          </h4>
                          <p className="text-sm text-text-secondary">
                            {formatDate(match.scheduled_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-text-secondary">
                              Participantes:{" "}
                            </span>
                            <span className="text-text-main font-medium">
                              {match.participants_count}
                            </span>
                          </div>

                          {match.status === "completed" &&
                            match.team1_score !== null &&
                            match.team2_score !== null && (
                              <div className="text-sm font-medium text-accent-primary">
                                {match.team1_score} - {match.team2_score}
                              </div>
                            )}

                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              match.status === "completed"
                                ? "bg-success/10 text-success border border-success/20"
                                : match.status === "scheduled"
                                ? "bg-info/10 text-info border border-info/20"
                                : match.status === "in_progress"
                                ? "bg-warning/10 text-warning border border-warning/20"
                                : "bg-error/10 text-error border border-error/20"
                            }`}
                          >
                            {match.status === "completed"
                              ? "Completado"
                              : match.status === "scheduled"
                              ? "Programado"
                              : match.status === "in_progress"
                              ? "En curso"
                              : "Cancelado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de solicitudes de acceso */}
      {showAccessRequestsModal && group && (
        <AccessRequestsModal
          groupId={groupId}
          groupName={group.name}
          isOpen={showAccessRequestsModal}
          onClose={() => setShowAccessRequestsModal(false)}
        />
      )}
    </div>
  );
}
