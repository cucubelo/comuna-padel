"use client";

import React, { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import GroupCard from "@/components/dashboard/GroupCard";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import { Tables } from "@/lib/types/supabase";

type GroupType = Tables<'groups'>['Row']['group_type'];

interface Group {
  id: string;
  name: string;
  description?: string;
  current_members?: number;
  city?: string;
  country?: string;
  country_code?: string;
  postal_code?: string;
  place_name?: string;
  group_type: GroupType;
  creator_name?: string;
  user_role?: "admin" | "member";
}

interface GroupWithProfile {
  id: string;
  name: string;
  description?: string;
  city?: string;
  country?: string;
  country_code?: string;
  postal_code?: string;
  place_name?: string;
  group_type: GroupType;
  profiles:
    | {
        full_name: string;
      }[]
    | null;
}

interface GroupMemberWithGroup {
  role: "admin" | "member";
  groups: {
    id: string;
    name: string;
    description?: string;
    city?: string;
    country?: string;
    country_code?: string;
    postal_code?: string;
    place_name?: string;
    group_type: GroupType;
    profiles:
      | {
          full_name: string;
        }[]
      | null;
  };
}

export default function GroupsPage() {
  const { user, profile } = useAuth();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my-groups" | "recommended">(
    "my-groups"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [groupTypeFilter, setGroupTypeFilter] = useState<GroupType | "">("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tabParam = searchParams.get("tab");

    if (
      tabParam === "recommended" ||
      tabParam === "discover" ||
      tabParam === "my-groups"
    ) {
      // Map old 'recommended' to new 'recommended' for backward compatibility
      const mappedTab = tabParam === "discover" ? "recommended" : tabParam;
      setActiveTab(mappedTab as "recommended" | "my-groups");
    }
  }, [searchParams, router]);

  const fetchUserGroups = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = (await supabase
        .from("group_members")
        .select(
          `
          role,
          groups (
            id,
            name,
            description,
            city,
            country,
            country_code,
            postal_code,
            place_name,
            group_type,
            profiles!groups_creator_id_fkey (
              full_name
            )
          )
        `
        )
        .eq("user_id", user.id)) as {
        data: GroupMemberWithGroup[] | null;
        error: Error | null;
      };

      if (error) {
        console.warn("Error fetching user groups:", error);
        setUserGroups([]);
        return;
      }

      if (!data || data.length === 0) {
        setUserGroups([]);
        return;
      }

      // Get member counts for all groups
      const groupIds = data
        .map((item) => item.groups?.id)
        .filter(Boolean) as string[];

      let memberCountMap: Record<string, number> = {};

      if (groupIds.length > 0) {
        const { data: memberCounts, error: memberError } = await supabase
          .from("group_members")
          .select("group_id")
          .in("group_id", groupIds);

        if (memberError) {
          console.warn("Error fetching member counts:", memberError);
        } else if (memberCounts) {
          memberCountMap =
            memberCounts.reduce((acc, member) => {
              acc[member.group_id] = (acc[member.group_id] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
        }
      }

      const groups: Group[] = data
        ?.map((item: GroupMemberWithGroup) => {
          const group = item.groups;
          if (!group) return null;

          return {
            id: group.id || "",
            name: group.name || "",
            description: group.description || undefined,
            current_members: memberCountMap[group.id || ""] || 0,
            city: group.city || undefined,
            country: group.country || undefined,
            country_code: group.country_code || undefined,
            postal_code: group.postal_code || undefined,
            place_name: group.place_name || undefined,
            group_type: group.group_type || "private",
            creator_name: group.profiles?.[0]?.full_name || undefined,
            user_role: item.role,
          };
        })
        .filter(Boolean) as Group[];

      setUserGroups(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      setUserGroups([]);
    }
  }, [user]);

  const fetchRecommendedGroups = useCallback(async () => {
    if (!user || !profile) return;

    try {
      // Get groups user is not a member of
      const { data: userGroupIds } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      const excludeIds = userGroupIds?.map((item) => item.group_id) || [];

      let query = supabase.from("groups").select(`
          id,
          name,
          description,
          city,
          country,
          country_code,
          postal_code,
          place_name,
          group_type,
          profiles!groups_creator_id_fkey (
            full_name
          )
        `);

      if (excludeIds.length > 0) {
        const excludeList = `(${excludeIds.map((id) => `"${id}"`).join(",")})`;
        query = query.not("id", "in", excludeList);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }

      // Apply city filter
      if (cityFilter) {
        query = query.eq("city", cityFilter);
      }

      // Apply group type filter
      if (groupTypeFilter) {
        query = query.eq("group_type", groupTypeFilter);
      }

      // Note: Skill level filtering removed as skill_level_required column doesn't exist
      // This can be re-implemented when skill level requirements are added to groups

      const { data, error } = (await query.limit(12)) as {
        data: GroupWithProfile[] | null;
        error: Error | null;
      };

      if (error) {
        console.warn("Error fetching recommended groups:", error);
        setRecommendedGroups([]);
        return;
      }

      if (!data || data.length === 0) {
        setRecommendedGroups([]);
        return;
      }

      // Get member counts
      const groupIds = data?.map((group) => group.id) || [];

      let memberCountMap: Record<string, number> = {};

      if (groupIds.length > 0) {
        const { data: memberCounts } = await supabase
          .from("group_members")
          .select("group_id")
          .in("group_id", groupIds);

        memberCountMap =
          memberCounts?.reduce((acc, member) => {
            acc[member.group_id] = (acc[member.group_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};
      }

      const groups: Group[] =
        data?.map((group: GroupWithProfile) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          current_members: memberCountMap[group.id || ""] || 0,
          city: group.city || undefined,
          country: group.country || undefined,
          country_code: group.country_code || undefined,
          postal_code: group.postal_code || undefined,
          place_name: group.place_name || undefined,
          group_type: group.group_type || "private",
          creator_name: group.profiles?.[0]?.full_name || undefined,
        })) || [];

      setRecommendedGroups(groups);
    } catch (error) {
      console.error("Error fetching recommended groups:", error);
      setRecommendedGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, searchQuery, cityFilter, groupTypeFilter]);

  useEffect(() => {
    if (user) {
      fetchUserGroups();
      fetchRecommendedGroups();
    }
  }, [user, fetchUserGroups, fetchRecommendedGroups]);

  // Fetch available cities for filter
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data } = await supabase
          .from("groups")
          .select("city")
          .not("city", "is", null);

        const cities = [
          ...new Set(data?.map((group) => group.city).filter(Boolean)),
        ] as string[];
        setAvailableCities(cities.sort());
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  // Función legacy para crear grupos (no utilizada actualmente)
  // const handleCreateGroup = async (groupData: Group) => {
  //   // This function is no longer needed as we use a separate page
  //   // Keeping for backward compatibility if needed
  // }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;

      // Refresh groups
      await fetchUserGroups();
      await fetchRecommendedGroups();
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Refresh groups
      await fetchUserGroups();
      await fetchRecommendedGroups();
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-secondary">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-main font-montserrat">
                  Gestión de Grupos
                </h1>
                <p className="text-text-secondary font-open-sans mt-1 sm:mt-2 text-sm sm:text-base">
                  Administra tus grupos y descubre nuevas comunidades de padel
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/groups/create")}
                className="bg-accent-primary text-bg-main px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-accent-primary/90 transition-colors font-open-sans flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto cursor-pointer"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
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
                <span className="sm:inline">Crear Grupo</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b border-border">
              <nav className="-mb-px flex">
                <button
                  onClick={() => {
                    setActiveTab("my-groups");
                    router.replace("/dashboard/groups?tab=my-groups");
                  }}
                  className={`flex-1 sm:flex-none py-3 sm:py-2 px-1 border-b-2 font-medium text-xs sm:text-sm font-open-sans transition-colors text-center cursor-pointer ${
                    activeTab === "my-groups"
                      ? "border-accent-primary text-accent-primary"
                      : "border-transparent text-text-secondary hover:text-text-main hover:border-border"
                  }`}
                >
                  <span className="block sm:inline">Mis Grupos</span>
                  <span className="block sm:inline sm:ml-1">
                    ({userGroups.length})
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("recommended");
                    router.replace("/dashboard/groups?tab=discover");
                  }}
                  className={`flex-1 sm:flex-none py-3 sm:py-2 px-1 border-b-2 font-medium text-xs sm:text-sm font-open-sans transition-colors text-center cursor-pointer ${
                    activeTab === "recommended"
                      ? "border-accent-primary text-accent-primary"
                      : "border-transparent text-text-secondary hover:text-text-main hover:border-border"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <svg
                      className="h-3 w-3 sm:h-4 sm:w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <span className="block sm:inline">Descubrir</span>
                    <span className="block sm:inline sm:ml-1">
                      ({recommendedGroups.length})
                    </span>
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Search and Filters for Recommended Groups */}
          {activeTab === "recommended" && (
            <div className="mb-4 sm:mb-6">
              {/* Prominent Search Section */}
              <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl border-2 border-accent-primary/20 p-4 sm:p-6 mb-4">
                <div className="text-center mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-text-main font-open-sans mb-1 sm:mb-2">
                    🔍 Encuentra tu grupo ideal
                  </h3>
                  <p className="text-text-secondary text-xs sm:text-sm font-open-sans">
                    Busca y filtra entre todos los grupos disponibles para
                    encontrar el perfecto para ti
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4">
                  {/* Search Bar */}
                  <div className="relative sm:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-accent-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar grupos por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border-2 border-accent-primary/30 rounded-lg bg-white text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary font-open-sans text-sm sm:text-base shadow-sm"
                    />
                  </div>

                  {/* Quick Filter Button */}
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        const filtersSection =
                          document.getElementById("advanced-filters");
                        if (filtersSection) {
                          filtersSection.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="w-full bg-accent-primary hover:bg-accent-primary/90 text-bg-main px-4 py-2.5 sm:py-3 rounded-lg font-medium font-open-sans transition-colors flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base cursor-pointer"
                    >
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                        />
                      </svg>
                      Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Section */}
              <div
                id="advanced-filters"
                className="bg-bg-main rounded-xl border border-border p-3 sm:p-4"
              >
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  <h4 className="font-medium text-text-main font-open-sans text-sm sm:text-base">
                    Filtros avanzados
                  </h4>
                </div>

                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4">
                  {/* City Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 font-open-sans">
                      Ciudad
                    </label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent font-open-sans text-sm"
                    >
                      <option value="">Todas las ciudades</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Group Type Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 font-open-sans">
                      Tipo de grupo
                    </label>
                    <select
                      value={groupTypeFilter}
                      onChange={(e) => setGroupTypeFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent font-open-sans text-sm"
                    >
                      <option value="">Todos los tipos</option>
                      <option value="public">Público</option>
                      <option value="private">Privado</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery || cityFilter || groupTypeFilter) && (
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-xs sm:text-sm text-text-secondary font-open-sans text-center sm:text-left">
                      {recommendedGroups.length} grupos encontrados
                    </span>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCityFilter("");
                        setGroupTypeFilter("");
                      }}
                      className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors font-open-sans flex items-center gap-1 font-medium cursor-pointer"
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
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          ) : (
            <div>
              {activeTab === "my-groups" && (
                <div>
                  {userGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {userGroups.map((group) => (
                        <GroupCard
                          key={group.id}
                          group={group}
                          onLeave={handleLeaveGroup}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg
                        className="h-12 w-12 text-text-secondary mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-text-main font-montserrat mb-2">
                        No tienes grupos aún
                      </h3>
                      <p className="text-text-secondary font-open-sans mb-4">
                        Crea tu primer grupo o únete a uno existente
                      </p>
                      <button
                        onClick={() => router.push("/dashboard/groups/create")}
                        className="bg-accent-primary text-bg-main px-6 py-2 rounded-lg font-medium hover:bg-accent-primary/90 transition-colors font-open-sans cursor-pointer"
                      >
                        Crear Grupo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "recommended" && (
                <div>
                  {recommendedGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {recommendedGroups.map((group) => (
                        <GroupCard
                          key={group.id}
                          group={group}
                          showJoinButton={true}
                          onJoin={handleJoinGroup}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg
                        className="h-12 w-12 text-text-secondary mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-text-main font-montserrat mb-2">
                        No hay grupos recomendados
                      </h3>
                      <p className="text-text-secondary font-open-sans">
                        Completa tu perfil para obtener mejores recomendaciones
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
