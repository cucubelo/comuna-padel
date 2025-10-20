export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string | null
          id: number
          match_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id?: string | null
          id?: number
          match_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string | null
          id?: number
          match_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          flag_emoji: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_access_requests: {
        Row: {
          admin_response: string | null
          created_at: string | null
          group_id: string
          id: string
          message: string | null
          requested_at: string | null
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          message?: string | null
          requested_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          message?: string | null
          requested_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_access_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_access_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_access_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          points: number
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          admin_code1: string | null
          admin_code2: string | null
          admin_code3: string | null
          admin_name1: string | null
          admin_name2: string | null
          admin_name3: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          creator_id: string
          description: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          place_name: string | null
          postal_code: string | null
          slug: string
        }
        Insert: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          place_name?: string | null
          postal_code?: string | null
          slug?: string | null
        }
        Update: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          place_name?: string | null
          postal_code?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_participants: {
        Row: {
          joined_at: string
          match_id: string
          status: string | null
          team_number: number | null
          user_id: string
        }
        Insert: {
          joined_at?: string
          match_id: string
          status?: string | null
          team_number?: number | null
          user_id: string
        }
        Update: {
          joined_at?: string
          match_id?: string
          status?: string | null
          team_number?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sets: {
        Row: {
          created_at: string
          id: string
          is_tiebreak: boolean
          match_id: string
          set_number: number
          team1_score: number
          team2_score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_tiebreak?: boolean
          match_id: string
          set_number: number
          team1_score: number
          team2_score: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_tiebreak?: boolean
          match_id?: string
          set_number?: number
          team1_score?: number
          team2_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_sets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_teams: {
        Row: {
          created_at: string
          id: string
          match_id: string
          player1_id: string
          player2_id: string
          team_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          player1_id: string
          player2_id: string
          team_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          player1_id?: string
          player2_id?: string
          team_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_teams_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_teams_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_teams_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          creator_id: string | null
          group_id: string
          id: string
          is_public: boolean
          latitude: number | null
          location_name: string
          longitude: number | null
          required_skill_level: number | null
          scheduled_at: string
          status: Database["public"]["Enums"]["match_status"]
          team1_score: number | null
          team2_score: number | null
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          group_id: string
          id?: string
          is_public?: boolean
          latitude?: number | null
          location_name: string
          longitude?: number | null
          required_skill_level?: number | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["match_status"]
          team1_score?: number | null
          team2_score?: number | null
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          group_id?: string
          id?: string
          is_public?: boolean
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          required_skill_level?: number | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          team1_score?: number | null
          team2_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          match_id: string
          payment_provider_tx_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          match_id: string
          payment_provider_tx_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          match_id?: string
          payment_provider_tx_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postal_codes: {
        Row: {
          admin_code1: string | null
          admin_code2: string | null
          admin_code3: string | null
          admin_name1: string | null
          admin_name2: string | null
          admin_name3: string | null
          country_code: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          place_name: string
          postal_code: string
          search_count: number | null
          updated_at: string | null
        }
        Insert: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          country_code: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          place_name: string
          postal_code: string
          search_count?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          country_code?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          place_name?: string
          postal_code?: string
          search_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_code1: string | null
          admin_code2: string | null
          admin_code3: string | null
          admin_name1: string | null
          admin_name2: string | null
          admin_name3: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          latitude: number | null
          longitude: number | null
          matches_lost: number
          matches_played: number
          matches_won: number
          phone: string | null
          place_name: string | null
          postal_code: string | null
          preferred_position:
            | Database["public"]["Enums"]["preferred_position"]
            | null
          skill_level: number | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
          username: string
        }
        Insert: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          phone?: string | null
          place_name?: string | null
          postal_code?: string | null
          preferred_position?:
            | Database["public"]["Enums"]["preferred_position"]
            | null
          skill_level?: number | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          username: string
        }
        Update: {
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          phone?: string | null
          place_name?: string | null
          postal_code?: string | null
          preferred_position?:
            | Database["public"]["Enums"]["preferred_position"]
            | null
          skill_level?: number | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      sports_locations: {
        Row: {
          address: string
          category: string
          city: string | null
          country: string
          country_code: string
          created_at: string | null
          google_place_id: string | null
          google_types: string[] | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          price_level: number | null
          rating: number | null
          state: string | null
          updated_at: string | null
          usage_count: number | null
          website: string | null
        }
        Insert: {
          address: string
          category: string
          city?: string | null
          country: string
          country_code: string
          created_at?: string | null
          google_place_id?: string | null
          google_types?: string[] | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string | null
          usage_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string
          category?: string
          city?: string | null
          country?: string
          country_code?: string
          created_at?: string | null
          google_place_id?: string | null
          google_types?: string[] | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          price_level?: number | null
          rating?: number | null
          state?: string | null
          updated_at?: string | null
          usage_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_postal_code_search: {
        Args: {
          p_country_code: string
          p_place_name: string
          p_postal_code: string
        }
        Returns: undefined
      }
      increment_sports_location_usage: {
        Args: { location_id: string }
        Returns: undefined
      }
      validate_username: {
        Args: { username_input: string }
        Returns: boolean
      }
    }
    Enums: {
      group_type: "private" | "public" | "premium"
      match_status: "scheduled" | "confirmed" | "completed" | "canceled"
      preferred_position: "left" | "right" | "both"
      request_status: "pending" | "approved" | "rejected"
      subscription_status: "free" | "premium"
      user_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      group_type: ["private", "public", "premium"],
      match_status: ["scheduled", "confirmed", "completed", "canceled"],
      preferred_position: ["left", "right", "both"],
      request_status: ["pending", "approved", "rejected"],
      subscription_status: ["free", "premium"],
      user_role: ["admin", "member"],
    },
  },
} as const
