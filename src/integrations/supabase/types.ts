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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string | null
          domain: string
          health_score: number | null
          id: string
          max_competitors: number | null
          max_keywords: number | null
          name: string
          status: Database["public"]["Enums"]["client_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          health_score?: number | null
          id?: string
          max_competitors?: number | null
          max_keywords?: number | null
          name: string
          status?: Database["public"]["Enums"]["client_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          health_score?: number | null
          id?: string
          max_competitors?: number | null
          max_keywords?: number | null
          name?: string
          status?: Database["public"]["Enums"]["client_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      competitors: {
        Row: {
          client_id: string
          confirmed: boolean | null
          created_at: string | null
          domain: string
          id: string
          label: string | null
          source: string | null
        }
        Insert: {
          client_id: string
          confirmed?: boolean | null
          created_at?: string | null
          domain: string
          id?: string
          label?: string | null
          source?: string | null
        }
        Update: {
          client_id?: string
          confirmed?: boolean | null
          created_at?: string | null
          domain?: string
          id?: string
          label?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          locale: string | null
          location: string | null
          search_engine: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          locale?: string | null
          location?: string | null
          search_engine?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          locale?: string | null
          location?: string | null
          search_engine?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keywords_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      rank_snapshots: {
        Row: {
          client_id: string
          created_at: string | null
          domain: string
          id: string
          keyword: string | null
          keyword_id: string
          position: number | null
          previous_position: number | null
          provider: string | null
          snapshot_date: string
          url: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          domain: string
          id?: string
          keyword?: string | null
          keyword_id: string
          position?: number | null
          previous_position?: number | null
          provider?: string | null
          snapshot_date?: string
          url?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          domain?: string
          id?: string
          keyword?: string | null
          keyword_id?: string
          position?: number | null
          previous_position?: number | null
          provider?: string | null
          snapshot_date?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rank_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_snapshots_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "manager"
        | "seo"
        | "content"
        | "designer"
        | "ads"
        | "client_admin"
        | "client_user"
        | "viewer"
      article_status: "draft" | "review" | "approved" | "published"
      audit_status: "pending" | "running" | "completed" | "failed"
      brief_status:
        | "draft"
        | "approved"
        | "published"
        | "under_review"
        | "changes_requested"
        | "rejected"
        | "ready_for_publishing"
      client_status: "active" | "paused" | "archived"
      draft_status:
        | "draft"
        | "under_review"
        | "changes_requested"
        | "approved"
        | "rejected"
        | "ready_for_publishing"
      issue_severity: "critical" | "warning" | "info"
      issue_status: "open" | "in_progress" | "fixed" | "ignored" | "regressed"
      opportunity_priority: "high" | "medium" | "low"
      opportunity_status: "open" | "in_progress" | "done" | "dismissed"
      opportunity_type:
        | "near_win"
        | "content_gap"
        | "page_expansion"
        | "technical_fix"
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
      app_role: [
        "owner",
        "admin",
        "manager",
        "seo",
        "content",
        "designer",
        "ads",
        "client_admin",
        "client_user",
        "viewer",
      ],
      article_status: ["draft", "review", "approved", "published"],
      audit_status: ["pending", "running", "completed", "failed"],
      brief_status: [
        "draft",
        "approved",
        "published",
        "under_review",
        "changes_requested",
        "rejected",
        "ready_for_publishing",
      ],
      client_status: ["active", "paused", "archived"],
      draft_status: [
        "draft",
        "under_review",
        "changes_requested",
        "approved",
        "rejected",
        "ready_for_publishing",
      ],
      issue_severity: ["critical", "warning", "info"],
      issue_status: ["open", "in_progress", "fixed", "ignored", "regressed"],
      opportunity_priority: ["high", "medium", "low"],
      opportunity_status: ["open", "in_progress", "done", "dismissed"],
      opportunity_type: [
        "near_win",
        "content_gap",
        "page_expansion",
        "technical_fix",
      ],
    },
  },
} as const
