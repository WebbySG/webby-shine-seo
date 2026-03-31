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
      activity_log: {
        Row: {
          action: string
          actor_name: string | null
          client_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata_json: Json | null
          summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          client_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata_json?: Json | null
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          client_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata_json?: Json | null
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_evidence: {
        Row: {
          audit_issue_id: string
          created_at: string | null
          evidence_type: string
          expected_value: string | null
          id: string
          key: string
          value: string | null
        }
        Insert: {
          audit_issue_id: string
          created_at?: string | null
          evidence_type: string
          expected_value?: string | null
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          audit_issue_id?: string
          created_at?: string | null
          evidence_type?: string
          expected_value?: string | null
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_evidence_audit_issue_id_fkey"
            columns: ["audit_issue_id"]
            isOneToOne: false
            referencedRelation: "audit_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_issues: {
        Row: {
          affected_url: string
          audit_run_id: string
          category: string | null
          client_id: string | null
          created_at: string | null
          description: string
          first_seen_at: string | null
          fix_instruction: string | null
          id: string
          issue_type: string
          last_checked_at: string | null
          provider: string | null
          recheck_count: number | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status: Database["public"]["Enums"]["issue_status"] | null
          why_it_matters: string | null
        }
        Insert: {
          affected_url: string
          audit_run_id: string
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description: string
          first_seen_at?: string | null
          fix_instruction?: string | null
          id?: string
          issue_type: string
          last_checked_at?: string | null
          provider?: string | null
          recheck_count?: number | null
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"] | null
          why_it_matters?: string | null
        }
        Update: {
          affected_url?: string
          audit_run_id?: string
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string
          first_seen_at?: string | null
          fix_instruction?: string | null
          id?: string
          issue_type?: string
          last_checked_at?: string | null
          provider?: string | null
          recheck_count?: number | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"] | null
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_issues_audit_run_id_fkey"
            columns: ["audit_run_id"]
            isOneToOne: false
            referencedRelation: "audit_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_issues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_pages: {
        Row: {
          audit_run_id: string
          created_at: string | null
          id: string
          issues_count: number | null
          load_time_ms: number | null
          meta_description: string | null
          status_code: number | null
          title: string | null
          url: string
          word_count: number | null
        }
        Insert: {
          audit_run_id: string
          created_at?: string | null
          id?: string
          issues_count?: number | null
          load_time_ms?: number | null
          meta_description?: string | null
          status_code?: number | null
          title?: string | null
          url: string
          word_count?: number | null
        }
        Update: {
          audit_run_id?: string
          created_at?: string | null
          id?: string
          issues_count?: number | null
          load_time_ms?: number | null
          meta_description?: string | null
          status_code?: number | null
          title?: string | null
          url?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_pages_audit_run_id_fkey"
            columns: ["audit_run_id"]
            isOneToOne: false
            referencedRelation: "audit_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_rechecks: {
        Row: {
          audit_issue_id: string
          checked_at: string | null
          diff_summary: string | null
          id: string
          new_evidence: Json | null
          new_status: string | null
          previous_evidence: Json | null
          previous_status: string | null
          provider: string | null
        }
        Insert: {
          audit_issue_id: string
          checked_at?: string | null
          diff_summary?: string | null
          id?: string
          new_evidence?: Json | null
          new_status?: string | null
          previous_evidence?: Json | null
          previous_status?: string | null
          provider?: string | null
        }
        Update: {
          audit_issue_id?: string
          checked_at?: string | null
          diff_summary?: string | null
          id?: string
          new_evidence?: Json | null
          new_status?: string | null
          previous_evidence?: Json | null
          previous_status?: string | null
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_rechecks_audit_issue_id_fkey"
            columns: ["audit_issue_id"]
            isOneToOne: false
            referencedRelation: "audit_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_runs: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          critical_count: number | null
          domain: string | null
          id: string
          info_count: number | null
          pages_crawled: number | null
          pages_limit: number | null
          provider: string | null
          scope: string | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["audit_status"] | null
          total_issues: number | null
          warning_count: number | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          critical_count?: number | null
          domain?: string | null
          id?: string
          info_count?: number | null
          pages_crawled?: number | null
          pages_limit?: number | null
          provider?: string | null
          scope?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"] | null
          total_issues?: number | null
          warning_count?: number | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          critical_count?: number | null
          domain?: string | null
          id?: string
          info_count?: number | null
          pages_crawled?: number | null
          pages_limit?: number | null
          provider?: string | null
          scope?: string | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"] | null
          total_issues?: number | null
          warning_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_runs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
      opportunities: {
        Row: {
          article_id: string | null
          brief_id: string | null
          client_id: string
          confidence: number | null
          created_at: string | null
          current_position: number | null
          draft_id: string | null
          evidence_text: string | null
          expected_impact: string | null
          id: string
          keyword: string | null
          next_action: string | null
          priority: Database["public"]["Enums"]["opportunity_priority"] | null
          recommended_action: string
          sources: string[] | null
          status: Database["public"]["Enums"]["opportunity_status"] | null
          target_url: string | null
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string | null
        }
        Insert: {
          article_id?: string | null
          brief_id?: string | null
          client_id: string
          confidence?: number | null
          created_at?: string | null
          current_position?: number | null
          draft_id?: string | null
          evidence_text?: string | null
          expected_impact?: string | null
          id?: string
          keyword?: string | null
          next_action?: string | null
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          recommended_action: string
          sources?: string[] | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          target_url?: string | null
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string | null
        }
        Update: {
          article_id?: string | null
          brief_id?: string | null
          client_id?: string
          confidence?: number | null
          created_at?: string | null
          current_position?: number | null
          draft_id?: string | null
          evidence_text?: string | null
          expected_impact?: string | null
          id?: string
          keyword?: string | null
          next_action?: string | null
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          recommended_action?: string
          sources?: string[] | null
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          target_url?: string | null
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
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
      seo_articles: {
        Row: {
          brief_id: string | null
          client_id: string
          cms_post_id: string | null
          cms_post_url: string | null
          content: string | null
          created_at: string | null
          id: string
          meta_description: string | null
          publish_date: string | null
          slug: string | null
          status: Database["public"]["Enums"]["article_status"] | null
          target_keyword: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          brief_id?: string | null
          client_id: string
          cms_post_id?: string | null
          cms_post_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          publish_date?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          target_keyword?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          brief_id?: string | null
          client_id?: string
          cms_post_id?: string | null
          cms_post_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          publish_date?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          target_keyword?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_articles_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "seo_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_articles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_brief_drafts: {
        Row: {
          brief_id: string
          client_id: string | null
          content: string | null
          created_at: string | null
          id: string
          internal_link_suggestions: Json | null
          meta_description: string | null
          review_checks: Json | null
          slug: string | null
          status: Database["public"]["Enums"]["draft_status"] | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          brief_id: string
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          internal_link_suggestions?: Json | null
          meta_description?: string | null
          review_checks?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["draft_status"] | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          brief_id?: string
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          internal_link_suggestions?: Json | null
          meta_description?: string | null
          review_checks?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["draft_status"] | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_brief_drafts_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "seo_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_brief_drafts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_briefs: {
        Row: {
          audit_context: string[] | null
          client_id: string
          competitor_context: string[] | null
          created_at: string | null
          cta_angle: string | null
          entities: string[] | null
          evidence: Json | null
          faq: Json | null
          headings: Json | null
          id: string
          internal_links: Json | null
          keyword: string
          meta_description: string | null
          page_goal: string | null
          page_type: string | null
          priority: Database["public"]["Enums"]["opportunity_priority"] | null
          recommended_slug: string | null
          search_intent: string | null
          secondary_keywords: string[] | null
          sections: Json | null
          source_mapping_id: string | null
          status: Database["public"]["Enums"]["brief_status"] | null
          suggested_h1: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audit_context?: string[] | null
          client_id: string
          competitor_context?: string[] | null
          created_at?: string | null
          cta_angle?: string | null
          entities?: string[] | null
          evidence?: Json | null
          faq?: Json | null
          headings?: Json | null
          id?: string
          internal_links?: Json | null
          keyword: string
          meta_description?: string | null
          page_goal?: string | null
          page_type?: string | null
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          recommended_slug?: string | null
          search_intent?: string | null
          secondary_keywords?: string[] | null
          sections?: Json | null
          source_mapping_id?: string | null
          status?: Database["public"]["Enums"]["brief_status"] | null
          suggested_h1?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audit_context?: string[] | null
          client_id?: string
          competitor_context?: string[] | null
          created_at?: string | null
          cta_angle?: string | null
          entities?: string[] | null
          evidence?: Json | null
          faq?: Json | null
          headings?: Json | null
          id?: string
          internal_links?: Json | null
          keyword?: string
          meta_description?: string | null
          page_goal?: string | null
          page_type?: string | null
          priority?: Database["public"]["Enums"]["opportunity_priority"] | null
          recommended_slug?: string | null
          search_intent?: string | null
          secondary_keywords?: string[] | null
          sections?: Json | null
          source_mapping_id?: string | null
          status?: Database["public"]["Enums"]["brief_status"] | null
          suggested_h1?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_briefs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      workspace_state: {
        Row: {
          entity_focus: Json | null
          filters: Json | null
          id: string
          last_route: string | null
          module_key: string | null
          selected_client_id: string | null
          ui_state: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          entity_focus?: Json | null
          filters?: Json | null
          id?: string
          last_route?: string | null
          module_key?: string | null
          selected_client_id?: string | null
          ui_state?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          entity_focus?: Json | null
          filters?: Json | null
          id?: string
          last_route?: string | null
          module_key?: string | null
          selected_client_id?: string | null
          ui_state?: Json | null
          updated_at?: string | null
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
