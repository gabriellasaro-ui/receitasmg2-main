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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      channel_goals: {
        Row: {
          ano_ref: number
          channel_id: string
          channel_name: string
          created_at: string
          id: string
          investimento_fixo: number
          mes_ref: number
          meta_contratos: number
          meta_leads: number
          meta_receita_onetime: number
          meta_receita_recorrente: number
          meta_receita_total: number
          meta_rm: number
          meta_roas: number
          meta_rr: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          ano_ref?: number
          channel_id: string
          channel_name: string
          created_at?: string
          id?: string
          investimento_fixo?: number
          mes_ref?: number
          meta_contratos?: number
          meta_leads?: number
          meta_receita_onetime?: number
          meta_receita_recorrente?: number
          meta_receita_total?: number
          meta_rm?: number
          meta_roas?: number
          meta_rr?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          ano_ref?: number
          channel_id?: string
          channel_name?: string
          created_at?: string
          id?: string
          investimento_fixo?: number
          mes_ref?: number
          meta_contratos?: number
          meta_leads?: number
          meta_receita_onetime?: number
          meta_receita_recorrente?: number
          meta_receita_total?: number
          meta_rm?: number
          meta_roas?: number
          meta_rr?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      closer_calls_detail: {
        Row: {
          closer_id: string
          created_at: string
          data_referencia: string
          id: string
          lead_nome: string | null
          resultado_call: Database["public"]["Enums"]["resultado_call"] | null
          submission_id: string
          temperatura_call: Database["public"]["Enums"]["temperatura"]
        }
        Insert: {
          closer_id: string
          created_at?: string
          data_referencia: string
          id?: string
          lead_nome?: string | null
          resultado_call?: Database["public"]["Enums"]["resultado_call"] | null
          submission_id: string
          temperatura_call?: Database["public"]["Enums"]["temperatura"]
        }
        Update: {
          closer_id?: string
          created_at?: string
          data_referencia?: string
          id?: string
          lead_nome?: string | null
          resultado_call?: Database["public"]["Enums"]["resultado_call"] | null
          submission_id?: string
          temperatura_call?: Database["public"]["Enums"]["temperatura"]
        }
        Relationships: [
          {
            foreignKeyName: "closer_calls_detail_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "closer_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      closer_proposals_detail: {
        Row: {
          canal_proposta: string | null
          closer_id: string
          created_at: string
          data_referencia: string
          id: string
          lead_nome: string
          observacao: string | null
          status_proposta: Database["public"]["Enums"]["status_proposta"] | null
          submission_id: string
          temperatura_proposta: Database["public"]["Enums"]["temperatura"]
          unit_id: string | null
          valor_proposta: number
        }
        Insert: {
          canal_proposta?: string | null
          closer_id: string
          created_at?: string
          data_referencia: string
          id?: string
          lead_nome: string
          observacao?: string | null
          status_proposta?:
            | Database["public"]["Enums"]["status_proposta"]
            | null
          submission_id: string
          temperatura_proposta?: Database["public"]["Enums"]["temperatura"]
          unit_id?: string | null
          valor_proposta?: number
        }
        Update: {
          canal_proposta?: string | null
          closer_id?: string
          created_at?: string
          data_referencia?: string
          id?: string
          lead_nome?: string
          observacao?: string | null
          status_proposta?:
            | Database["public"]["Enums"]["status_proposta"]
            | null
          submission_id?: string
          temperatura_proposta?: Database["public"]["Enums"]["temperatura"]
          unit_id?: string | null
          valor_proposta?: number
        }
        Relationships: [
          {
            foreignKeyName: "closer_proposals_detail_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "closer_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closer_proposals_detail_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      closer_sales_detail: {
        Row: {
          canal_venda: string
          churn_m0: number
          closer_id: string
          created_at: string
          data_referencia: string
          id: string
          lead_nome: string
          submission_id: string
          valor_onetime: number
          valor_recorrente: number
          valor_total: number
        }
        Insert: {
          canal_venda: string
          churn_m0?: number
          closer_id: string
          created_at?: string
          data_referencia: string
          id?: string
          lead_nome: string
          submission_id: string
          valor_onetime?: number
          valor_recorrente?: number
          valor_total?: number
        }
        Update: {
          canal_venda?: string
          churn_m0?: number
          closer_id?: string
          created_at?: string
          data_referencia?: string
          id?: string
          lead_nome?: string
          submission_id?: string
          valor_onetime?: number
          valor_recorrente?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "closer_sales_detail_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "closer_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      closer_submissions: {
        Row: {
          calls_realizadas: number
          churn_m0: number
          closer_id: string
          contratos_assinados: number
          created_at: string
          data_referencia: string
          id: string
          no_show: number
          observacoes: string | null
          propostas_realizadas: number
          unit_id: string | null
          valor_contrato_total: number
          valor_onetime: number
          valor_recorrente: number
        }
        Insert: {
          calls_realizadas?: number
          churn_m0?: number
          closer_id: string
          contratos_assinados?: number
          created_at?: string
          data_referencia: string
          id?: string
          no_show?: number
          observacoes?: string | null
          propostas_realizadas?: number
          unit_id?: string | null
          valor_contrato_total?: number
          valor_onetime?: number
          valor_recorrente?: number
        }
        Update: {
          calls_realizadas?: number
          churn_m0?: number
          closer_id?: string
          contratos_assinados?: number
          created_at?: string
          data_referencia?: string
          id?: string
          no_show?: number
          observacoes?: string | null
          propostas_realizadas?: number
          unit_id?: string | null
          valor_contrato_total?: number
          valor_onetime?: number
          valor_recorrente?: number
        }
        Relationships: [
          {
            foreignKeyName: "closer_submissions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          ano_ref: number
          booking_medio_meses: number
          cpl_medio: number
          created_at: string
          dias_uteis_total: number
          id: string
          investimento_total: number
          label: string
          mes_ref: number
          meta_caixa_60pct: number
          meta_churn_m0_max: number
          meta_conexoes: number
          meta_contratos: number
          meta_leads: number
          meta_receita_liquida: number
          meta_receita_onetime: number
          meta_receita_recorrente: number
          meta_receita_total: number
          meta_rm: number
          meta_rr: number
          meta_stake: number
          ticket_medio: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          ano_ref?: number
          booking_medio_meses?: number
          cpl_medio?: number
          created_at?: string
          dias_uteis_total?: number
          id?: string
          investimento_total?: number
          label?: string
          mes_ref?: number
          meta_caixa_60pct?: number
          meta_churn_m0_max?: number
          meta_conexoes?: number
          meta_contratos?: number
          meta_leads?: number
          meta_receita_liquida?: number
          meta_receita_onetime?: number
          meta_receita_recorrente?: number
          meta_receita_total?: number
          meta_rm?: number
          meta_rr?: number
          meta_stake?: number
          ticket_medio?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          ano_ref?: number
          booking_medio_meses?: number
          cpl_medio?: number
          created_at?: string
          dias_uteis_total?: number
          id?: string
          investimento_total?: number
          label?: string
          mes_ref?: number
          meta_caixa_60pct?: number
          meta_churn_m0_max?: number
          meta_conexoes?: number
          meta_contratos?: number
          meta_leads?: number
          meta_receita_liquida?: number
          meta_receita_onetime?: number
          meta_receita_recorrente?: number
          meta_receita_total?: number
          meta_rm?: number
          meta_rr?: number
          meta_stake?: number
          ticket_medio?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["approval_status"]
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_booked_calls_detail: {
        Row: {
          canal: string | null
          created_at: string
          data_referencia: string
          id: string
          lead_nome: string
          punch: string | null
          pv_id: string
          submission_id: string
          tipo_lead: string | null
          unit_id: string | null
        }
        Insert: {
          canal?: string | null
          created_at?: string
          data_referencia: string
          id?: string
          lead_nome: string
          punch?: string | null
          pv_id: string
          submission_id: string
          tipo_lead?: string | null
          unit_id?: string | null
        }
        Update: {
          canal?: string | null
          created_at?: string
          data_referencia?: string
          id?: string
          lead_nome?: string
          punch?: string | null
          pv_id?: string
          submission_id?: string
          tipo_lead?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pv_booked_calls_detail_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pv_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_booked_calls_detail_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_contracts_detail: {
        Row: {
          canal: string | null
          churn_m0: number
          created_at: string
          data_referencia: string
          id: string
          lead_nome: string
          pv_id: string
          submission_id: string
          valor_onetime: number
          valor_recorrente: number
          valor_total: number
        }
        Insert: {
          canal?: string | null
          churn_m0?: number
          created_at?: string
          data_referencia: string
          id?: string
          lead_nome: string
          pv_id: string
          submission_id: string
          valor_onetime?: number
          valor_recorrente?: number
          valor_total?: number
        }
        Update: {
          canal?: string | null
          churn_m0?: number
          created_at?: string
          data_referencia?: string
          id?: string
          lead_nome?: string
          pv_id?: string
          submission_id?: string
          valor_onetime?: number
          valor_recorrente?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pv_contracts_detail_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pv_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_realized_calls_detail: {
        Row: {
          created_at: string
          data_referencia: string
          id: string
          lead_nome: string
          observacao: string | null
          pv_id: string
          submission_id: string
          tipo_lead: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          data_referencia: string
          id?: string
          lead_nome: string
          observacao?: string | null
          pv_id: string
          submission_id: string
          tipo_lead?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          data_referencia?: string
          id?: string
          lead_nome?: string
          observacao?: string | null
          pv_id?: string
          submission_id?: string
          tipo_lead?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pv_realized_calls_detail_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pv_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_realized_calls_detail_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_submissions: {
        Row: {
          calls_marcadas: number
          calls_realizadas: number
          churn_m0: number
          contratos_assinados: number
          created_at: string
          data_referencia: string
          id: string
          no_show: number
          observacoes: string | null
          pv_id: string
          reagendamentos: number
          unit_id: string | null
          valor_contrato_total: number
          valor_onetime: number
          valor_recorrente: number
        }
        Insert: {
          calls_marcadas?: number
          calls_realizadas?: number
          churn_m0?: number
          contratos_assinados?: number
          created_at?: string
          data_referencia: string
          id?: string
          no_show?: number
          observacoes?: string | null
          pv_id: string
          reagendamentos?: number
          unit_id?: string | null
          valor_contrato_total?: number
          valor_onetime?: number
          valor_recorrente?: number
        }
        Update: {
          calls_marcadas?: number
          calls_realizadas?: number
          churn_m0?: number
          contratos_assinados?: number
          created_at?: string
          data_referencia?: string
          id?: string
          no_show?: number
          observacoes?: string | null
          pv_id?: string
          reagendamentos?: number
          unit_id?: string | null
          valor_contrato_total?: number
          valor_onetime?: number
          valor_recorrente?: number
        }
        Relationships: [
          {
            foreignKeyName: "pv_submissions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
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
      get_user_unit_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "closer" | "sdr" | "gerente_unidade"
      approval_status: "pending" | "approved" | "rejected"
      resultado_call: "avancou_proposta" | "follow_up" | "sem_fit" | "perdido"
      status_proposta: "aberta" | "fechada" | "perdida"
      temperatura: "frio" | "morno" | "quente"
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
      app_role: ["admin", "closer", "sdr", "gerente_unidade"],
      approval_status: ["pending", "approved", "rejected"],
      resultado_call: ["avancou_proposta", "follow_up", "sem_fit", "perdido"],
      status_proposta: ["aberta", "fechada", "perdida"],
      temperatura: ["frio", "morno", "quente"],
    },
  },
} as const
