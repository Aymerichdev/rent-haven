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
      amenities: {
        Row: {
          bookable: boolean
          building_id: string
          capacity: number | null
          description: string | null
          icon: string
          id: string
          name: string
          photo_url: string | null
          schedule: Json | null
        }
        Insert: {
          bookable?: boolean
          building_id: string
          capacity?: number | null
          description?: string | null
          icon?: string
          id?: string
          name: string
          photo_url?: string | null
          schedule?: Json | null
        }
        Update: {
          bookable?: boolean
          building_id?: string
          capacity?: number | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          photo_url?: string | null
          schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "amenities_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_bookings: {
        Row: {
          amenity_id: string
          date: string
          end_time: string
          id: string
          notes: string | null
          owner_id: string
          owner_note: string | null
          start_time: string
          status: string
          tenant_id: string
        }
        Insert: {
          amenity_id: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          owner_id: string
          owner_note?: string | null
          start_time: string
          status?: string
          tenant_id: string
        }
        Update: {
          amenity_id?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          owner_id?: string
          owner_note?: string | null
          start_time?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_bookings_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string
          city: string
          description: string | null
          id: string
          images: string[]
          name: string
          owner_id: string
        }
        Insert: {
          address: string
          city: string
          description?: string | null
          id?: string
          images?: string[]
          name: string
          owner_id: string
        }
        Update: {
          address?: string
          city?: string
          description?: string | null
          id?: string
          images?: string[]
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_photo_url: string | null
          deposit: number
          end_date: string
          id: string
          monthly_rent: number
          owner_id: string
          start_date: string
          status: string
          tenant_id: string | null
          unit_id: string
        }
        Insert: {
          contract_photo_url?: string | null
          deposit?: number
          end_date: string
          id?: string
          monthly_rent: number
          owner_id: string
          start_date: string
          status?: string
          tenant_id?: string | null
          unit_id: string
        }
        Update: {
          contract_photo_url?: string | null
          deposit?: number
          end_date?: string
          id?: string
          monthly_rent?: number
          owner_id?: string
          start_date?: string
          status?: string
          tenant_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          date: string
          id: string
          reading: number
          type: string
          unit_id: string
        }
        Insert: {
          date?: string
          id?: string
          reading: number
          type: string
          unit_id: string
        }
        Update: {
          date?: string
          id?: string
          reading?: number
          type?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          contract_id: string
          id: string
          month: string
          owner_note: string | null
          paid_at: string | null
          receipt_name: string | null
          receipt_type: string | null
          receipt_uploaded_at: string | null
          receipt_url: string | null
          reviewed_at: string | null
          status: string
          tenant_id: string
          utilities: number
        }
        Insert: {
          amount: number
          contract_id: string
          id?: string
          month: string
          owner_note?: string | null
          paid_at?: string | null
          receipt_name?: string | null
          receipt_type?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          reviewed_at?: string | null
          status?: string
          tenant_id: string
          utilities?: number
        }
        Update: {
          amount?: number
          contract_id?: string
          id?: string
          month?: string
          owner_note?: string | null
          paid_at?: string | null
          receipt_name?: string | null
          receipt_type?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          reviewed_at?: string | null
          status?: string
          tenant_id?: string
          utilities?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      tenant_profiles: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          national_id: string
          occupation: string
          phone: string
          profile_photo_url: string
          recommendations: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id: string
          national_id: string
          occupation: string
          phone: string
          profile_photo_url: string
          recommendations?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          national_id?: string
          occupation?: string
          phone?: string
          profile_photo_url?: string
          recommendations?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_profiles: {
        Row: {
          bio: string | null
          company_name: string | null
          created_at: string
          id: string
          phone: string
          profile_photo_url: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          company_name?: string | null
          created_at?: string
          id: string
          phone: string
          profile_photo_url?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          phone?: string
          profile_photo_url?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          owner_id: string
          owner_response: string | null
          phone: string
          status: string
          tenant_id: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          owner_id: string
          owner_response?: string | null
          phone?: string
          status?: string
          tenant_id: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          owner_id?: string
          owner_response?: string | null
          phone?: string
          status?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_clicks: {
        Row: {
          created_at: string
          id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_clicks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address_override: string | null
          area: number
          bathrooms: number
          bedrooms: number
          building_id: string | null
          city_override: string | null
          description: string
          featured: boolean
          id: string
          images: string[]
          number: string
          owner_id: string
          rent: number
          status: string
          tenant_id: string | null
          title: string
          type: string
        }
        Insert: {
          address_override?: string | null
          area?: number
          bathrooms?: number
          bedrooms?: number
          building_id?: string | null
          city_override?: string | null
          description?: string
          featured?: boolean
          id?: string
          images?: string[]
          number?: string
          owner_id: string
          rent?: number
          status?: string
          tenant_id?: string | null
          title: string
          type: string
        }
        Update: {
          address_override?: string | null
          area?: number
          bathrooms?: number
          bedrooms?: number
          building_id?: string | null
          city_override?: string | null
          description?: string
          featured?: boolean
          id?: string
          images?: string[]
          number?: string
          owner_id?: string
          rent?: number
          status?: string
          tenant_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "tenant"
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
      app_role: ["admin", "owner", "tenant"],
    },
  },
} as const
