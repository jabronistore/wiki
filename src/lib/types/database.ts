export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      discussion_upvotes: {
        Row: {
          created_at: string
          discussion_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discussion_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discussion_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_upvotes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          content: string
          created_at: string
          depth: number
          id: string
          parent_id: string | null
          peptide_id: string
          reply_count: number
          updated_at: string
          upvote_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          depth?: number
          id?: string
          parent_id?: string | null
          peptide_id: string
          reply_count?: number
          updated_at?: string
          upvote_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          depth?: number
          id?: string
          parent_id?: string | null
          peptide_id?: string
          reply_count?: number
          updated_at?: string
          upvote_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_concurrent_compounds: {
        Row: {
          compound_name: string
          created_at: string | null
          dose: string | null
          duration_context: string | null
          finding_id: string
          id: string
          started_timing: string | null
        }
        Insert: {
          compound_name: string
          created_at?: string | null
          dose?: string | null
          duration_context?: string | null
          finding_id: string
          id?: string
          started_timing?: string | null
        }
        Update: {
          compound_name?: string
          created_at?: string | null
          dose?: string | null
          duration_context?: string | null
          finding_id?: string
          id?: string
          started_timing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_concurrent_compounds_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_concurrent_compounds_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings_anonymous"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_custom_results: {
        Row: {
          confidence_attribution: number | null
          created_at: string | null
          effect_name: string
          finding_id: string
          id: string
          notes: string | null
          rating: number
          time_to_notice_days: number | null
          was_expected: boolean | null
        }
        Insert: {
          confidence_attribution?: number | null
          created_at?: string | null
          effect_name: string
          finding_id: string
          id?: string
          notes?: string | null
          rating: number
          time_to_notice_days?: number | null
          was_expected?: boolean | null
        }
        Update: {
          confidence_attribution?: number | null
          created_at?: string | null
          effect_name?: string
          finding_id?: string
          id?: string
          notes?: string | null
          rating?: number
          time_to_notice_days?: number | null
          was_expected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_custom_results_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_custom_results_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings_anonymous"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_dosing_phases: {
        Row: {
          dose: number
          dose_unit: string
          doses_per_week: number | null
          duration_weeks: number
          finding_id: string
          frequency: string
          hours_between_doses: number | null
          id: string
          is_break: boolean
          is_loading_dose: boolean | null
          meal_timing: string | null
          notes: string | null
          phase_order: number
          time_of_day: string | null
        }
        Insert: {
          dose: number
          dose_unit?: string
          doses_per_week?: number | null
          duration_weeks: number
          finding_id: string
          frequency: string
          hours_between_doses?: number | null
          id?: string
          is_break?: boolean
          is_loading_dose?: boolean | null
          meal_timing?: string | null
          notes?: string | null
          phase_order: number
          time_of_day?: string | null
        }
        Update: {
          dose?: number
          dose_unit?: string
          doses_per_week?: number | null
          duration_weeks?: number
          finding_id?: string
          frequency?: string
          hours_between_doses?: number | null
          id?: string
          is_break?: boolean
          is_loading_dose?: boolean | null
          meal_timing?: string | null
          notes?: string | null
          phase_order?: number
          time_of_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_dosing_phases_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_dosing_phases_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings_anonymous"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_results: {
        Row: {
          category: Database["public"]["Enums"]["result_category"]
          data: Json
          effect_persistence: string | null
          effectiveness_rating: number | null
          finding_id: string
          id: string
          notes: string | null
          time_to_notice_days: number | null
          time_to_peak_days: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["result_category"]
          data?: Json
          effect_persistence?: string | null
          effectiveness_rating?: number | null
          finding_id: string
          id?: string
          notes?: string | null
          time_to_notice_days?: number | null
          time_to_peak_days?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["result_category"]
          data?: Json
          effect_persistence?: string | null
          effectiveness_rating?: number | null
          finding_id?: string
          id?: string
          notes?: string | null
          time_to_notice_days?: number | null
          time_to_peak_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_results_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_results_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings_anonymous"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_side_effects: {
        Row: {
          finding_id: string
          id: string
          is_known_side_effect: boolean
          management_strategy: string | null
          notes: string | null
          onset_timing: string | null
          resolved: string | null
          severity: number | null
          side_effect_name: string
        }
        Insert: {
          finding_id: string
          id?: string
          is_known_side_effect?: boolean
          management_strategy?: string | null
          notes?: string | null
          onset_timing?: string | null
          resolved?: string | null
          severity?: number | null
          side_effect_name: string
        }
        Update: {
          finding_id?: string
          id?: string
          is_known_side_effect?: boolean
          management_strategy?: string | null
          notes?: string | null
          onset_timing?: string | null
          resolved?: string | null
          severity?: number | null
          side_effect_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "finding_side_effects_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_side_effects_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings_anonymous"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          administration_method:
            | Database["public"]["Enums"]["administration_method"]
            | null
          created_at: string
          currently_on_cycle: boolean | null
          cycle_length_weeks: number | null
          data_confidence: string | null
          days_since_reconstitution: number | null
          diet_adherence: string | null
          diluent_volume_ml: number | null
          dose_response_notes: string | null
          dose_response_noticed: boolean | null
          follow_up_consent: boolean | null
          id: string
          injection_doses_per_week: number | null
          injection_frequency: string | null
          injection_site: string | null
          is_repeat_cycle: string | null
          needle_gauge: string | null
          notes: string | null
          peptide_id: string
          pre_existing_conditions: string | null
          published_at: string | null
          recommend_score: number | null
          reconstitution_solution:
            | Database["public"]["Enums"]["reconstitution_solution"]
            | null
          reconstitution_solution_other: string | null
          same_batch: string | null
          sleep_quality: string | null
          source_type: string | null
          source_verified: string | null
          status: Database["public"]["Enums"]["submission_status"]
          storage_condition: string | null
          stress_level: string | null
          total_breaks_taken: number | null
          training_intensity: string | null
          updated_at: string
          user_id: string
          vial_size_mg: number | null
          why_stopped: string | null
          would_use_again: string | null
        }
        Insert: {
          administration_method?:
            | Database["public"]["Enums"]["administration_method"]
            | null
          created_at?: string
          currently_on_cycle?: boolean | null
          cycle_length_weeks?: number | null
          data_confidence?: string | null
          days_since_reconstitution?: number | null
          diet_adherence?: string | null
          diluent_volume_ml?: number | null
          dose_response_notes?: string | null
          dose_response_noticed?: boolean | null
          follow_up_consent?: boolean | null
          id?: string
          injection_doses_per_week?: number | null
          injection_frequency?: string | null
          injection_site?: string | null
          is_repeat_cycle?: string | null
          needle_gauge?: string | null
          notes?: string | null
          peptide_id: string
          pre_existing_conditions?: string | null
          published_at?: string | null
          recommend_score?: number | null
          reconstitution_solution?:
            | Database["public"]["Enums"]["reconstitution_solution"]
            | null
          reconstitution_solution_other?: string | null
          same_batch?: string | null
          sleep_quality?: string | null
          source_type?: string | null
          source_verified?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          storage_condition?: string | null
          stress_level?: string | null
          total_breaks_taken?: number | null
          training_intensity?: string | null
          updated_at?: string
          user_id: string
          vial_size_mg?: number | null
          why_stopped?: string | null
          would_use_again?: string | null
        }
        Update: {
          administration_method?:
            | Database["public"]["Enums"]["administration_method"]
            | null
          created_at?: string
          currently_on_cycle?: boolean | null
          cycle_length_weeks?: number | null
          data_confidence?: string | null
          days_since_reconstitution?: number | null
          diet_adherence?: string | null
          diluent_volume_ml?: number | null
          dose_response_notes?: string | null
          dose_response_noticed?: boolean | null
          follow_up_consent?: boolean | null
          id?: string
          injection_doses_per_week?: number | null
          injection_frequency?: string | null
          injection_site?: string | null
          is_repeat_cycle?: string | null
          needle_gauge?: string | null
          notes?: string | null
          peptide_id?: string
          pre_existing_conditions?: string | null
          published_at?: string | null
          recommend_score?: number | null
          reconstitution_solution?:
            | Database["public"]["Enums"]["reconstitution_solution"]
            | null
          reconstitution_solution_other?: string | null
          same_batch?: string | null
          sleep_quality?: string | null
          source_type?: string | null
          source_verified?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          storage_condition?: string | null
          stress_level?: string | null
          total_breaks_taken?: number | null
          training_intensity?: string | null
          updated_at?: string
          user_id?: string
          vial_size_mg?: number | null
          why_stopped?: string | null
          would_use_again?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "findings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          location: string | null
          newsletter_opt_in: boolean
          onboarding_completed: boolean
          terms_accepted_at: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          location?: string | null
          newsletter_opt_in?: boolean
          onboarding_completed?: boolean
          terms_accepted_at?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          newsletter_opt_in?: boolean
          onboarding_completed?: boolean
          terms_accepted_at?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_favorite_peptides: {
        Row: {
          created_at: string
          id: string
          peptide_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          peptide_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          peptide_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_peptides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      findings_anonymous: {
        Row: {
          administration_method:
            | Database["public"]["Enums"]["administration_method"]
            | null
          anonymous_id: string | null
          created_at: string | null
          currently_on_cycle: boolean | null
          cycle_length_weeks: number | null
          data_confidence: string | null
          days_since_reconstitution: number | null
          diet_adherence: string | null
          diluent_volume_ml: number | null
          dose_response_notes: string | null
          dose_response_noticed: boolean | null
          follow_up_consent: boolean | null
          id: string | null
          injection_doses_per_week: number | null
          injection_frequency: string | null
          injection_site: string | null
          is_repeat_cycle: string | null
          needle_gauge: string | null
          notes: string | null
          peptide_id: string | null
          published_at: string | null
          recommend_score: number | null
          reconstitution_solution:
            | Database["public"]["Enums"]["reconstitution_solution"]
            | null
          same_batch: string | null
          sleep_quality: string | null
          source_type: string | null
          source_verified: string | null
          status: Database["public"]["Enums"]["submission_status"] | null
          storage_condition: string | null
          stress_level: string | null
          total_breaks_taken: number | null
          training_intensity: string | null
          user_location: string | null
          vial_size_mg: number | null
          why_stopped: string | null
          would_use_again: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      administration_method:
        | "subq"
        | "nasal"
        | "oral"
        | "im"
        | "iv"
        | "topical"
        | "sublingual"
      reconstitution_solution:
        | "bac_water"
        | "sterile_water"
        | "saline"
        | "other"
      result_category:
        | "weight_loss"
        | "healing"
        | "growth_hormone"
        | "cognitive"
        | "sexual_health"
        | "skin"
        | "sleep"
        | "immune"
        | "metabolic"
        | "longevity"
        | "other"
      submission_status: "draft" | "published"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      administration_method: [
        "subq",
        "nasal",
        "oral",
        "im",
        "iv",
        "topical",
        "sublingual",
      ],
      reconstitution_solution: [
        "bac_water",
        "sterile_water",
        "saline",
        "other",
      ],
      result_category: [
        "weight_loss",
        "healing",
        "growth_hormone",
        "cognitive",
        "sexual_health",
        "skin",
        "sleep",
        "immune",
        "metabolic",
        "longevity",
        "other",
      ],
      submission_status: ["draft", "published"],
    },
  },
} as const

