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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          data: Json | null
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          messages: Json | null
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_time: string
          confirmation_code: string | null
          created_at: string
          created_by: string
          id: string
          method: string
          notes: string | null
          party_size: number
          place_id: string | null
          reservation_url: string | null
          status: string
          triff_id: string
          updated_at: string
          venue_name: string
          venue_phone: string | null
        }
        Insert: {
          booking_time: string
          confirmation_code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          method?: string
          notes?: string | null
          party_size: number
          place_id?: string | null
          reservation_url?: string | null
          status?: string
          triff_id: string
          updated_at?: string
          venue_name: string
          venue_phone?: string | null
        }
        Update: {
          booking_time?: string
          confirmation_code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          method?: string
          notes?: string | null
          party_size?: number
          place_id?: string | null
          reservation_url?: string | null
          status?: string
          triff_id?: string
          updated_at?: string
          venue_name?: string
          venue_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_triff_id_fkey"
            columns: ["triff_id"]
            isOneToOne: false
            referencedRelation: "triffs"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_messages: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          message: string
          recipient_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          target_audience: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          message: string
          recipient_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          message?: string
          recipient_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          target_audience?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorite_places: {
        Row: {
          created_at: string
          id: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_places_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          google_place_id: string | null
          google_url: string | null
          id: string
          is_open: boolean | null
          lat: number | null
          lng: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          photos: Json | null
          price_level: number | null
          rating: number | null
          reviews: Json | null
          types: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          google_place_id?: string | null
          google_url?: string | null
          id?: string
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          photos?: Json | null
          price_level?: number | null
          rating?: number | null
          reviews?: Json | null
          types?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          google_place_id?: string | null
          google_url?: string | null
          id?: string
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          photos?: Json | null
          price_level?: number | null
          rating?: number | null
          reviews?: Json | null
          types?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_notes: string | null
          account_status: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          country: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_account_active: boolean | null
          is_active: boolean
          is_location_shared: boolean | null
          last_login: string | null
          last_violation: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          login_count: number | null
          phone: string | null
          region: string | null
          role: string
          social_instagram: string | null
          social_tiktok: string | null
          status: string | null
          strikes_count: number | null
          suspended_until: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
          username: string | null
          vibe: string | null
        }
        Insert: {
          account_notes?: string | null
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_account_active?: boolean | null
          is_active?: boolean
          is_location_shared?: boolean | null
          last_login?: string | null
          last_violation?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          login_count?: number | null
          phone?: string | null
          region?: string | null
          role?: string
          social_instagram?: string | null
          social_tiktok?: string | null
          status?: string | null
          strikes_count?: number | null
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          vibe?: string | null
        }
        Update: {
          account_notes?: string | null
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_account_active?: boolean | null
          is_active?: boolean
          is_location_shared?: boolean | null
          last_login?: string | null
          last_violation?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          login_count?: number | null
          phone?: string | null
          region?: string | null
          role?: string
          social_instagram?: string | null
          social_tiktok?: string | null
          status?: string | null
          strikes_count?: number | null
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          vibe?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          content_type: string
          content_url: string | null
          created_at: string
          expires_at: string
          id: string
          likes_count: number | null
          place_id: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string
          expires_at: string
          id?: string
          likes_count?: number | null
          place_id?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          likes_count?: number | null
          place_id?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_requests: {
        Row: {
          category: string | null
          contact_email: string | null
          created_at: string
          id: string
          kind: string
          message: string
          metadata: Json
          priority: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          kind: string
          message: string
          metadata?: Json
          priority?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          metadata?: Json
          priority?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          status?: string | null
        }
        Relationships: []
      }
      triff_participants: {
        Row: {
          checked_in_at: string | null
          created_at: string
          id: string
          joined_at: string | null
          status: string
          triff_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          status?: string
          triff_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          status?: string
          triff_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "triff_participants_triff_id_fkey"
            columns: ["triff_id"]
            isOneToOne: false
            referencedRelation: "triffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triff_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      triffs: {
        Row: {
          created_at: string
          creator_id: string
          custom_lat: number | null
          custom_lng: number | null
          custom_location: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          invite_code: string
          is_public: boolean | null
          max_participants: number | null
          place_id: string | null
          scheduled_for: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          custom_lat?: number | null
          custom_lng?: number | null
          custom_location?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          invite_code?: string
          is_public?: boolean | null
          max_participants?: number | null
          place_id?: string | null
          scheduled_for?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          custom_lat?: number | null
          custom_lng?: number | null
          custom_location?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          invite_code?: string
          is_public?: boolean | null
          max_participants?: number | null
          place_id?: string | null
          scheduled_for?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "triffs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "triffs_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          aura_level: number
          aura_xp: number
          created_at: string
          current_streak: number
          explorer_level: number
          explorer_xp: number
          id: string
          level: number
          longest_streak: number
          organizer_level: number
          organizer_xp: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aura_level?: number
          aura_xp?: number
          created_at?: string
          current_streak?: number
          explorer_level?: number
          explorer_xp?: number
          id?: string
          level?: number
          longest_streak?: number
          organizer_level?: number
          organizer_xp?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aura_level?: number
          aura_xp?: number
          created_at?: string
          current_streak?: number
          explorer_level?: number
          explorer_xp?: number
          id?: string
          level?: number
          longest_streak?: number
          organizer_level?: number
          organizer_xp?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_seen: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          notification_preferences: Json | null
          privacy_settings: Json | null
          system_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          system_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          system_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      username_changes: {
        Row: {
          changed_at: string
          id: string
          new_username: string
          old_username: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_username: string
          old_username?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_username?: string
          old_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      conversations: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          friend_id: string | null
          last_message: string | null
          last_message_time: string | null
          unread_count: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_xp: {
        Args: { category: string; user_id_param: string; xp_amount: number }
        Returns: undefined
      }
      calculate_level_from_xp: { Args: { xp: number }; Returns: number }
      can_change_username: { Args: { user_id_param: string }; Returns: boolean }
      can_user_access_triff: {
        Args: { triff_id_param: string; user_id_param: string }
        Returns: boolean
      }
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      get_triff_invite: {
        Args: { p_code: string }
        Returns: {
          going_count: number
          host_avatar: string
          host_name: string
          location: string
          scheduled_for: string
          status: string
          title: string
          triff_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      join_triff_by_code: { Args: { p_code: string }; Returns: string }
      notify_triff_participants: {
        Args: {
          p_message: string
          p_title: string
          p_triff_id: string
          p_type: string
        }
        Returns: number
      }
      promote_first_admin: { Args: { _user_id: string }; Returns: boolean }
      promote_to_admin: { Args: { p_user_id: string }; Returns: undefined }
      update_username_with_tracking: {
        Args: {
          new_username: string
          old_username: string
          user_id_param: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "support" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "support", "user"],
    },
  },
} as const
