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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string | null
          excerpt: string
          featured_image: string | null
          id: string
          published_at: string | null
          read_minutes: number | null
          slug: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string | null
          excerpt: string
          featured_image?: string | null
          id?: string
          published_at?: string | null
          read_minutes?: number | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string | null
          excerpt?: string
          featured_image?: string | null
          id?: string
          published_at?: string | null
          read_minutes?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          member_id: string
          revoke_reason: string | null
          revoked: boolean
          revoked_at: string | null
          user_id: string
          verification_token: string
        }
        Insert: {
          certificate_number: string
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          member_id: string
          revoke_reason?: string | null
          revoked?: boolean
          revoked_at?: string | null
          user_id: string
          verification_token: string
        }
        Update: {
          certificate_number?: string
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          member_id?: string
          revoke_reason?: string | null
          revoked?: boolean
          revoked_at?: string | null
          user_id?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          artistic_discipline: string
          bio: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          institution_name: string | null
          membership_category_id: string
          membership_expires_at: string | null
          membership_started_at: string | null
          nrc_number: string
          phone_number: string
          province: string
          status: string
          tpin: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          artistic_discipline: string
          bio?: string | null
          city: string
          created_at?: string
          full_name: string
          id?: string
          institution_name?: string | null
          membership_category_id: string
          membership_expires_at?: string | null
          membership_started_at?: string | null
          nrc_number: string
          phone_number: string
          province: string
          status?: string
          tpin?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          artistic_discipline?: string
          bio?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          institution_name?: string | null
          membership_category_id?: string
          membership_expires_at?: string | null
          membership_started_at?: string | null
          nrc_number?: string
          phone_number?: string
          province?: string
          status?: string
          tpin?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "members_membership_category_id_fkey"
            columns: ["membership_category_id"]
            isOneToOne: false
            referencedRelation: "membership_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_categories: {
        Row: {
          annual_fee_zmw: number
          created_at: string
          description: string
          id: string
          name: string
          requires_institution: boolean
          sort_order: number
        }
        Insert: {
          annual_fee_zmw: number
          created_at?: string
          description: string
          id: string
          name: string
          requires_institution?: boolean
          sort_order?: number
        }
        Update: {
          annual_fee_zmw?: number
          created_at?: string
          description?: string
          id?: string
          name?: string
          requires_institution?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          admin_id: string
          admin_name: string
          content: string
          created_at: string | null
          id: string
          member_id: string
          member_name: string
          read_at: string | null
          subject: string
        }
        Insert: {
          admin_id: string
          admin_name: string
          content: string
          created_at?: string | null
          id?: string
          member_id: string
          member_name: string
          read_at?: string | null
          subject: string
        }
        Update: {
          admin_id?: string
          admin_name?: string
          content?: string
          created_at?: string | null
          id?: string
          member_id?: string
          member_name?: string
          read_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_zmw: number
          created_at: string
          id: string
          member_id: string | null
          membership_category_id: string
          paid_at: string | null
          phone_number: string | null
          provider: string
          status: string
          transaction_reference: string
          user_id: string
        }
        Insert: {
          amount_zmw: number
          created_at?: string
          id?: string
          member_id?: string | null
          membership_category_id: string
          paid_at?: string | null
          phone_number?: string | null
          provider: string
          status?: string
          transaction_reference: string
          user_id: string
        }
        Update: {
          amount_zmw?: number
          created_at?: string
          id?: string
          member_id?: string | null
          membership_category_id?: string
          paid_at?: string | null
          phone_number?: string | null
          provider?: string
          status?: string
          transaction_reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_category_id_fkey"
            columns: ["membership_category_id"]
            isOneToOne: false
            referencedRelation: "membership_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_issue_certificate: { Args: { _member_id: string }; Returns: string }
      admin_revoke_certificate: {
        Args: { _cert_id: string; _reason: string }
        Returns: boolean
      }
      admin_set_member_status: {
        Args: { _member_id: string; _status: string }
        Returns: boolean
      }
      claim_first_admin: { Args: never; Returns: boolean }
      expire_lapsed_memberships: { Args: never; Returns: number }
      grant_admin: { Args: { _target: string }; Returns: boolean }
      grant_superadmin: { Args: { _target: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_admins: {
        Args: never
        Returns: {
          email: string
          granted_at: string
          is_superadmin: boolean
          user_id: string
        }[]
      }
      log_audit: {
        Args: {
          _action: string
          _details: Json
          _entity_id: string
          _entity_type: string
        }
        Returns: undefined
      }
      public_member_registry: {
        Args: never
        Returns: {
          artistic_discipline: string
          certificate_number: string
          expires_at: string
          full_name: string
          issued_at: string
          membership_category_id: string
          province: string
        }[]
      }
      revoke_admin: { Args: { _target: string }; Returns: boolean }
      verify_certificate: {
        Args: { _token: string }
        Returns: {
          artistic_discipline: string
          certificate_number: string
          expires_at: string
          full_name: string
          issued_at: string
          membership_category_id: string
          province: string
          revoked: boolean
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "member" | "superadmin"
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
      app_role: ["admin", "member", "superadmin"],
    },
  },
} as const
