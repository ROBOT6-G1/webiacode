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
      admin_gemini_keys: {
        Row: {
          active: boolean
          cooldown_until: string | null
          created_at: string
          error_count: number
          id: string
          key_value: string
          label: string
          last_used_at: string | null
          provider: string
          request_count: number
          tokens_used: number
        }
        Insert: {
          active?: boolean
          cooldown_until?: string | null
          created_at?: string
          error_count?: number
          id?: string
          key_value: string
          label: string
          last_used_at?: string | null
          provider?: string
          request_count?: number
          tokens_used?: number
        }
        Update: {
          active?: boolean
          cooldown_until?: string | null
          created_at?: string
          error_count?: number
          id?: string
          key_value?: string
          label?: string
          last_used_at?: string | null
          provider?: string
          request_count?: number
          tokens_used?: number
        }
        Relationships: []
      }
      custom_domains: {
        Row: {
          created_at: string
          dns_instructions: Json | null
          domain: string
          id: string
          project_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dns_instructions?: Json | null
          domain: string
          id?: string
          project_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dns_instructions?: Json | null
          domain?: string
          id?: string
          project_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          credits_used: number
          id: string
          project_id: string
          role: Database["public"]["Enums"]["message_role"]
          tokens_used: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          credits_used?: number
          id?: string
          project_id: string
          role: Database["public"]["Enums"]["message_role"]
          tokens_used?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          credits_used?: number
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["message_role"]
          tokens_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_ar: number
          created_at: string
          credits: number
          id: string
          kind: string
          notes: string | null
          proof_url: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount_ar: number
          created_at?: string
          credits?: number
          id?: string
          kind: string
          notes?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount_ar?: number
          created_at?: string
          credits?: number
          id?: string
          kind?: string
          notes?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_sub_expires_at: string | null
          created_at: string
          credits: number
          display_name: string | null
          email: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
          plan_expires_at: string | null
          referral_code: string
          referred_by: string | null
          storage_used_bytes: number
          updated_at: string
        }
        Insert: {
          ai_sub_expires_at?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          email?: string | null
          id: string
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_expires_at?: string | null
          referral_code?: string
          referred_by?: string | null
          storage_used_bytes?: number
          updated_at?: string
        }
        Update: {
          ai_sub_expires_at?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_expires_at?: string | null
          referral_code?: string
          referred_by?: string | null
          storage_used_bytes?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_supabase_anon_key: string | null
          client_supabase_url: string | null
          created_at: string
          css_content: string
          custom_domain: string | null
          files: Json
          github_repo: string | null
          html_content: string
          id: string
          js_content: string
          name: string
          pwa_enabled: boolean
          site_type: string
          updated_at: string
          user_id: string
          vercel_project_id: string | null
          vercel_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          client_supabase_anon_key?: string | null
          client_supabase_url?: string | null
          created_at?: string
          css_content?: string
          custom_domain?: string | null
          files?: Json
          github_repo?: string | null
          html_content?: string
          id?: string
          js_content?: string
          name?: string
          pwa_enabled?: boolean
          site_type?: string
          updated_at?: string
          user_id: string
          vercel_project_id?: string | null
          vercel_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          client_supabase_anon_key?: string | null
          client_supabase_url?: string | null
          created_at?: string
          css_content?: string
          custom_domain?: string | null
          files?: Json
          github_repo?: string | null
          html_content?: string
          id?: string
          js_content?: string
          name?: string
          pwa_enabled?: boolean
          site_type?: string
          updated_at?: string
          user_id?: string
          vercel_project_id?: string | null
          vercel_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_granted: boolean
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_granted?: boolean
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_granted?: boolean
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          image_url: string | null
          message: string
          status: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message: string
          status?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          ai_api_key: string | null
          ai_provider: string | null
          created_at: string
          github_token: string | null
          github_username: string | null
          id: string
          supabase_anon_key: string | null
          supabase_service_role_key: string | null
          supabase_url: string | null
          updated_at: string
          user_id: string
          vercel_team_id: string | null
          vercel_token: string | null
        }
        Insert: {
          ai_api_key?: string | null
          ai_provider?: string | null
          created_at?: string
          github_token?: string | null
          github_username?: string | null
          id?: string
          supabase_anon_key?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          updated_at?: string
          user_id: string
          vercel_team_id?: string | null
          vercel_token?: string | null
        }
        Update: {
          ai_api_key?: string | null
          ai_provider?: string | null
          created_at?: string
          github_token?: string | null
          github_username?: string | null
          id?: string
          supabase_anon_key?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          updated_at?: string
          user_id?: string
          vercel_team_id?: string | null
          vercel_token?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      add_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      consume_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      exec_sql: { Args: { query: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      message_role: "user" | "assistant" | "system"
      payment_status: "pending" | "validated" | "rejected"
      plan_type: "free" | "pro"
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
      app_role: ["admin", "user"],
      message_role: ["user", "assistant", "system"],
      payment_status: ["pending", "validated", "rejected"],
      plan_type: ["free", "pro"],
    },
  },
} as const
