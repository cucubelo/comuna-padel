"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthQuery } from "@/hooks/useAuth";
import { 
  getUserTimezone, 
  parseMatchDataForDisplay,
  getTimezoneName 
} from "@/lib/utils/timezoneUtils";

interface GroupMember {
  id: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    skill_level: number | null;
  } | null;
  role: "admin" | "member";
  joined_at: string;
}

interface GroupMatch {
  id: string;
  scheduled_at: string;
  timezone?: string;
  location_name: string;
  status: "scheduled" | "confirmed" | "completed" | "canceled";
  creator_id: string | null;
  group_id: string;
  is_public: boolean;
  latitude: number | null;
  longitude: number | null;
  required_skill_level: number | null;
  team1_score: number | null;
  team2_score: number | null;
  created_at: string;
  match_participants?: Array<{
    user_id: string;
    status: string | null;
  }>;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  group_type: "public" | "private" | "premium";
  created_at: string;
  creator_id: string;
  creator_name?: string | null;
  admin_code1: string | null;
  admin_code2: string | null;
  admin_code3: string | null;
  admin_name1: string | null;
  admin_name2: string | null;
  admin_name3: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
  postal_code: string | null;
  slug: string;
}

// Keys para las queries
const groupKeys = {
  detail: (id: string) => ["group", "detail", id] as const,
  members: (id: string) => ["group", "members", id] as const,
  matches: (id: string) => ["group", "matches", id] as const,
  userRole: (groupId: string, userId: string) =>
    ["group", "userRole", groupId, userId] as const,
  pendingRequest: (groupId: string, userId: string) =>
    ["group", "pendingRequest", groupId, userId] as const,
};

// Funciones de fetch
const fetchGroupDetails = async (groupId: string): Promise<Group | null> => {
  const { data, error } = await supabase
    .from("groups")
    .select(
      `
      *,
      profiles!groups_creator_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .eq("id", groupId)
    .single();

  if (error) {
    console.error("Error fetching group:", error);
    return null;
  }

  // Handle the response structure correctly
  const profileData = data.profiles as {
    first_name: string | null;
    last_name: string | null;
  } | null;

  // Construct full name from first_name and last_name
  const creator_name = profileData
    ? [profileData.first_name, profileData.last_name]
        .filter(Boolean)
        .join(" ") || null
    : null;

  return {
    ...data,
    creator_name,
  };
};

const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  const { data, error } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      role,
      joined_at,
      profiles!group_members_user_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url,
        skill_level
      )
    `
    )
    .eq("group_id", groupId);

  if (error) {
    console.error("Error fetching group members:", error);
    return [];
  }

  return data.map((member) => ({
    id: member.user_id,
    profiles: member.profiles
      ? {
          id: member.profiles.id,
          full_name:
            [member.profiles.first_name, member.profiles.last_name]
              .filter(Boolean)
              .join(" ") || null,
          avatar_url: member.profiles.avatar_url,
          skill_level: member.profiles.skill_level,
        }
      : null,
    role: member.role,
    joined_at: member.joined_at,
  }));
};

const fetchGroupMatches = async (groupId: string): Promise<GroupMatch[]> => {
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      match_participants!inner (
        user_id,
        status
      )
    `
    )
    .eq("group_id", groupId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error fetching matches:", error);
    return [];
  }

  return data || [];
};

const fetchUserRole = async (
  groupId: string,
  userId: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  return data?.role || null;
};

// Componente de skeleton mejorado
function GroupDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-bg-secondary animate-pulse">
      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Back button skeleton */}
        <div className="mb-4">
          <div className="h-10 w-24 bg-bg-main rounded-lg"></div>
        </div>

        {/* Header skeleton */}
        <div className="bg-bg-main rounded-xl border border-border p-6 mb-6">
          <div className="h-8 w-64 bg-bg-secondary rounded mb-4"></div>
          <div className="h-4 w-full bg-bg-secondary rounded mb-2"></div>
          <div className="h-4 w-3/4 bg-bg-secondary rounded mb-4"></div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-bg-secondary rounded-full"></div>
            <div className="h-6 w-20 bg-bg-secondary rounded-full"></div>
          </div>
          <div className="h-10 w-32 bg-bg-secondary rounded-lg"></div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-24 bg-bg-main rounded-lg"></div>
          <div className="h-10 w-24 bg-bg-main rounded-lg"></div>
          <div className="h-10 w-24 bg-bg-main rounded-lg"></div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-bg-main rounded-xl"></div>
          <div className="h-32 bg-bg-main rounded-xl"></div>
          <div className="h-32 bg-bg-main rounded-xl"></div>
        </div>
      </main>
    </div>
  );
}

// Componente principal optimizado
interface OptimizedGroupDetailsProps {
  groupId: string;
}

export default function OptimizedGroupDetails({
  groupId,
}: OptimizedGroupDetailsProps) {
  const router = useRouter();
  const { user } = useAuthQuery();

  // Queries paralelas para mejor rendimiento
  const groupQuery = useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => fetchGroupDetails(groupId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const userRoleQuery = useQuery({
    queryKey: user?.id
      ? groupKeys.userRole(groupId, user.id)
      : ["group", "userRole", "none"],
    queryFn: () =>
      user?.id ? fetchUserRole(groupId, user.id) : Promise.resolve(null),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const membersQuery = useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => fetchGroupMembers(groupId),
    enabled:
      !!groupQuery.data &&
      (groupQuery.data.group_type === "public" || !!userRoleQuery.data),
    staleTime: 2 * 60 * 1000, // 2 minutos para datos más dinámicos
  });

  const matchesQuery = useQuery({
    queryKey: groupKeys.matches(groupId),
    queryFn: () => fetchGroupMatches(groupId),
    enabled:
      !!groupQuery.data &&
      (groupQuery.data.group_type === "public" || !!userRoleQuery.data),
    staleTime: 1 * 60 * 1000, // 1 minuto para partidos
  });

  // Estados derivados
  const group = groupQuery.data;
  const userRole = userRoleQuery.data;
  const members = membersQuery.data || [];
  const matches = matchesQuery.data || [];

  // Lógica mejorada para evitar parpadeo completamente
  const isLoadingGroup = groupQuery.isLoading;
  const isLoadingUserRole = user && userRoleQuery.isLoading;
  
  // Para grupos privados, necesitamos esperar tanto al grupo como al rol del usuario
  
  // Determinar si debemos mostrar el skeleton
  const shouldShowSkeleton = 
    isLoadingGroup || 
    (group?.group_type === "private" && user && isLoadingUserRole);

  // Determinar si el usuario puede ver contenido privado
  const canViewPrivateContent = 
    group?.group_type === "public" || 
    (group?.group_type === "private" && !!userRole);

  // Determinar si debemos mostrar el mensaje de grupo privado

  // Mostrar skeleton mientras carga
  if (shouldShowSkeleton) {
    return <GroupDetailsSkeleton />;
  }

  // Grupo no encontrado
  if (groupQuery.isError || (!groupQuery.isLoading && !group)) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-main mb-4">
            Grupo no encontrado
          </h2>
          <button
            onClick={() => router.push("/dashboard/groups")}
            className="bg-accent-primary text-bg-main px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            Volver a Grupos
          </button>
        </div>
      </div>
    );
  }

  // Early return if group is null to satisfy TypeScript
  if (!group) {
    return <GroupDetailsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/dashboard/groups")}
            className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors bg-bg-main px-4 py-2 rounded-lg border border-border hover:border-accent-primary/50"
          >
            <svg
              className="w-4 h-4"
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
        </div>

        {/* Group Header */}
        <div className="bg-bg-main rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-text-main font-montserrat mb-2">
                {group.name}
              </h1>

              {group.description && (
                <p className="text-text-secondary font-open-sans mb-4 leading-relaxed">
                  {group.description}
                </p>
              )}

              {/* Tags */}
              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {group.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Group Info */}
              <div className="flex flex-wrap gap-4 text-sm text-text-secondary mb-4">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {members.length}{" "}
                  {members.length === 1 ? "miembro" : "miembros"}
                  {group.max_members && ` / ${group.max_members}`}
                </span>

                {group.location && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
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
                    {group.location}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
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
                  {group.group_type === "public" ? "Público" : "Privado"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex gap-3">
              {/* Crear Partido Button - visible for members and admins */}
              {canViewPrivateContent && (
                <button
                  onClick={() =>
                    router.push(`/dashboard/matches/create?groupId=${group.id}`)
                  }
                  className="bg-accent-primary text-bg-main px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-semibold flex items-center gap-2 cursor-pointer"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Crear Partido
                </button>
              )}
              
              {/* Editar Grupo Button - only for admins */}
              {userRole === "admin" && (
                <button
                  onClick={() =>
                    router.push(`/dashboard/groups/edit/${group.id}`)
                  }
                  className="bg-accent-primary text-bg-main px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-semibold cursor-pointer"
                >
                  Editar Grupo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {canViewPrivateContent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-bg-main rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Miembros
                  </p>
                  <p className="text-2xl font-bold text-text-main">
                    {members.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent-primary/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-accent-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-bg-main rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Partidos
                  </p>
                  <p className="text-2xl font-bold text-text-main">
                    {matches.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-success"
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
                </div>
              </div>
            </div>

            <div className="bg-bg-main rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Actividad
                  </p>
                  <p className="text-2xl font-bold text-text-main">Alta</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-warning"
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content based on access */}
        {!canViewPrivateContent && group.group_type === "private" && (
          <div className="bg-bg-main rounded-xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-warning"
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
            </div>
            <h3 className="text-xl font-semibold text-text-main mb-2">
              Grupo Privado
            </h3>
            <p className="text-text-secondary mb-6">
              Este es un grupo privado. Necesitas ser miembro para ver el
              contenido.
            </p>
            <button className="bg-accent-primary text-bg-main px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-semibold">
              Solicitar Acceso
            </button>
          </div>
        )}

        {/* Members Section */}
        {canViewPrivateContent && (
          <div className="bg-bg-main rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-text-main mb-4">
              Miembros ({members.length})
            </h2>

            {/* Creator Info */}
            {group.creator_name && (
              <div className="mb-4 p-3 bg-accent-primary/5 rounded-lg border border-accent-primary/20">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-accent-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-text-main">
                    Creado por: {group.creator_name}
                  </span>
                </div>
              </div>
            )}

            {/* Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg"
                >
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {member.profiles?.avatar_url ? (
                      <Image
                        src={member.profiles.avatar_url}
                        alt={member.profiles.full_name || "Usuario"}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">
                      {member.profiles?.full_name || "Usuario sin nombre"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          member.role === "admin"
                            ? "bg-accent-primary/10 text-accent-primary"
                            : "bg-text-secondary/10 text-text-secondary"
                        }`}
                      >
                        {member.role === "admin" ? "Admin" : "Miembro"}
                      </span>
                      {member.profiles?.skill_level && (
                        <span className="text-xs text-text-secondary">
                          Nivel: {member.profiles.skill_level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-text-secondary mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-text-secondary">
                  No hay miembros en este grupo
                </p>
              </div>
            )}
          </div>
        )}

        {/* Matches Section */}
        {canViewPrivateContent && (
          <div className="bg-bg-main rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-text-main mb-4">
              Partidos ({matches.length})
            </h2>

            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.slice(0, 5).map((match) => {
                  const confirmedParticipants =
                    match.match_participants?.filter(
                      (p) => p.status === "confirmed"
                    ).length || 0;
                  const maxParticipants = 4; // Padel típicamente tiene 4 jugadores

                  // Parse match data for display in user's timezone
                  const userTimezone = getUserTimezone();
                  const matchTimezoneData = parseMatchDataForDisplay(
                    match.scheduled_at,
                    match.timezone || 'Europe/Madrid',
                    userTimezone
                  );

                  // Format the date string to avoid rendering Date object directly
                  const formattedDateString = matchTimezoneData.localDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  });
                  const formattedTimeString = matchTimezoneData.localDate.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-text-main">
                          Partido de Padel
                        </h3>
                        <div className="flex items-center text-sm text-text-secondary">
                          <span>
                            {formattedDateString} - {formattedTimeString}
                          </span>
                          {matchTimezoneData.showTimezone && (
                            <div className="flex items-center ml-2">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="text-xs">
                                {getTimezoneName(userTimezone)}
                              </span>
                            </div>
                          )}
                        </div>
                        {match.location_name && (
                          <p className="text-sm text-text-secondary">
                            {match.location_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-main">
                          {confirmedParticipants}/{maxParticipants}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            match.status === "scheduled"
                              ? "bg-success/10 text-success"
                              : match.status === "completed"
                              ? "bg-text-secondary/10 text-text-secondary"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {match.status === "scheduled"
                            ? "Programado"
                            : match.status === "completed"
                            ? "Completado"
                            : "Cancelado"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {matches.length > 5 && (
                  <div className="text-center pt-4">
                    <button className="text-accent-primary hover:text-accent-primary/80 text-sm font-medium">
                      Ver todos los partidos ({matches.length})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-text-secondary mx-auto mb-4"
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
                <p className="text-text-secondary">
                  No hay partidos programados
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}