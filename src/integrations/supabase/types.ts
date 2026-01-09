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
      calendar_events: {
        Row: {
          event_type: string
          google_event_id: string
          id: string
          instructor_id: string
          lesson_id: string | null
          synced_at: string
        }
        Insert: {
          event_type?: string
          google_event_id: string
          id?: string
          instructor_id: string
          lesson_id?: string | null
          synced_at?: string
        }
        Update: {
          event_type?: string
          google_event_id?: string
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enquiries: {
        Row: {
          additional_notes: string | null
          address: string
          assigned_instructor_id: string | null
          course_type: string
          created_at: string
          id: string
          name: string
          postcode: string
          preferred_timing: string
          requested_hours: number | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          address: string
          assigned_instructor_id?: string | null
          course_type: string
          created_at?: string
          id?: string
          name: string
          postcode: string
          preferred_timing: string
          requested_hours?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          address?: string
          assigned_instructor_id?: string | null
          course_type?: string
          created_at?: string
          id?: string
          name?: string
          postcode?: string
          preferred_timing?: string
          requested_hours?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enquiries_assigned_instructor_id_fkey"
            columns: ["assigned_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_hours: number
          created_at: string
          id: string
          instructor_id: string
          is_verified: boolean | null
          is_visible: boolean | null
          rating: number
          review_date: string | null
          review_text: string
          reviewer_name: string
        }
        Insert: {
          course_hours: number
          created_at?: string
          id?: string
          instructor_id: string
          is_verified?: boolean | null
          is_visible?: boolean | null
          rating: number
          review_date?: string | null
          review_text: string
          reviewer_name: string
        }
        Update: {
          course_hours?: number
          created_at?: string
          id?: string
          instructor_id?: string
          is_verified?: boolean | null
          is_visible?: boolean | null
          rating?: number
          review_date?: string | null
          review_text?: string
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      course_templates: {
        Row: {
          course_hours: number
          course_name: string
          created_at: string
          default_image_url: string | null
          display_order: number | null
          driving_test_details: string | null
          explainer_video_url: string | null
          features: string[] | null
          full_description: string | null
          id: string
          is_active: boolean | null
          is_intensive: boolean | null
          is_popular: boolean | null
          payment_terms: string | null
          prerequisites: string[] | null
          short_description: string | null
          terms_conditions: string | null
          theory_test_details: string | null
          updated_at: string
          what_to_bring: string[] | null
        }
        Insert: {
          course_hours: number
          course_name: string
          created_at?: string
          default_image_url?: string | null
          display_order?: number | null
          driving_test_details?: string | null
          explainer_video_url?: string | null
          features?: string[] | null
          full_description?: string | null
          id?: string
          is_active?: boolean | null
          is_intensive?: boolean | null
          is_popular?: boolean | null
          payment_terms?: string | null
          prerequisites?: string[] | null
          short_description?: string | null
          terms_conditions?: string | null
          theory_test_details?: string | null
          updated_at?: string
          what_to_bring?: string[] | null
        }
        Update: {
          course_hours?: number
          course_name?: string
          created_at?: string
          default_image_url?: string | null
          display_order?: number | null
          driving_test_details?: string | null
          explainer_video_url?: string | null
          features?: string[] | null
          full_description?: string | null
          id?: string
          is_active?: boolean | null
          is_intensive?: boolean | null
          is_popular?: boolean | null
          payment_terms?: string | null
          prerequisites?: string[] | null
          short_description?: string | null
          terms_conditions?: string | null
          theory_test_details?: string | null
          updated_at?: string
          what_to_bring?: string[] | null
        }
        Relationships: []
      }
      instructor_calendar_events: {
        Row: {
          end_time: string
          google_event_id: string
          id: string
          instructor_id: string
          is_busy: boolean
          start_time: string
          synced_at: string
          title: string | null
        }
        Insert: {
          end_time: string
          google_event_id: string
          id?: string
          instructor_id: string
          is_busy?: boolean
          start_time: string
          synced_at?: string
          title?: string | null
        }
        Update: {
          end_time?: string
          google_event_id?: string
          id?: string
          instructor_id?: string
          is_busy?: boolean
          start_time?: string
          synced_at?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_calendar_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          id: string
          instructor_id: string
          refresh_token: string
          token_expiry: string
          updated_at: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          refresh_token: string
          token_expiry: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          refresh_token?: string
          token_expiry?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_calendar_tokens_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_courses: {
        Row: {
          course_hours: number
          course_image_url: string | null
          course_name: string
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
        }
        Insert: {
          course_hours: number
          course_image_url?: string | null
          course_name: string
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
        }
        Update: {
          course_hours?: number
          course_image_url?: string | null
          course_name?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "instructor_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_date_overrides: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          instructor_id: string
          is_available: boolean
          override_date: string
          override_end_date: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          instructor_id: string
          is_available?: boolean
          override_date: string
          override_end_date?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          instructor_id?: string
          is_available?: boolean
          override_date?: string
          override_end_date?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_date_overrides_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_test_centres: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          test_centre_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          test_centre_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          test_centre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_test_centres_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_test_centres_test_centre_id_fkey"
            columns: ["test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          instructor_id: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_working_hours_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          adi_code_of_practice: boolean | null
          allowed_lesson_lengths: number[] | null
          available_from: string | null
          bio: string | null
          bonus_earned: number | null
          booking_advance_days: number | null
          brand_colour: string | null
          buffer_minutes: number
          cancellation_charge_percent: number | null
          cancellation_policy_hours: number | null
          cancellation_policy_text: string | null
          car_image_url: string | null
          car_make: string | null
          car_model: string | null
          car_type: string
          cpd_certified: boolean | null
          created_at: string
          custom_branding_enabled: boolean | null
          email: string | null
          extra_info: string | null
          facebook_url: string | null
          google_access_token: string | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          home_address: string | null
          home_postcode: string
          hourly_rate: number | null
          id: string
          instagram_url: string | null
          instructor_grade: string | null
          is_active: boolean
          last_calendar_sync: string | null
          linkedin_url: string | null
          name: string
          payment_qr_url: string | null
          personal_website_url: string | null
          phone: string | null
          preferred_lesson_length: number
          profile_image_url: string | null
          radius_miles: number
          school_skim_percentage: number | null
          special_skills: string | null
          twitter_url: string | null
          updated_at: string
          welcome_video_url: string | null
        }
        Insert: {
          adi_code_of_practice?: boolean | null
          allowed_lesson_lengths?: number[] | null
          available_from?: string | null
          bio?: string | null
          bonus_earned?: number | null
          booking_advance_days?: number | null
          brand_colour?: string | null
          buffer_minutes?: number
          cancellation_charge_percent?: number | null
          cancellation_policy_hours?: number | null
          cancellation_policy_text?: string | null
          car_image_url?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type: string
          cpd_certified?: boolean | null
          created_at?: string
          custom_branding_enabled?: boolean | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          home_address?: string | null
          home_postcode: string
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          instructor_grade?: string | null
          is_active?: boolean
          last_calendar_sync?: string | null
          linkedin_url?: string | null
          name: string
          payment_qr_url?: string | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_lesson_length?: number
          profile_image_url?: string | null
          radius_miles?: number
          school_skim_percentage?: number | null
          special_skills?: string | null
          twitter_url?: string | null
          updated_at?: string
          welcome_video_url?: string | null
        }
        Update: {
          adi_code_of_practice?: boolean | null
          allowed_lesson_lengths?: number[] | null
          available_from?: string | null
          bio?: string | null
          bonus_earned?: number | null
          booking_advance_days?: number | null
          brand_colour?: string | null
          buffer_minutes?: number
          cancellation_charge_percent?: number | null
          cancellation_policy_hours?: number | null
          cancellation_policy_text?: string | null
          car_image_url?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string
          cpd_certified?: boolean | null
          created_at?: string
          custom_branding_enabled?: boolean | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          home_address?: string | null
          home_postcode?: string
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          instructor_grade?: string | null
          is_active?: boolean
          last_calendar_sync?: string | null
          linkedin_url?: string | null
          name?: string
          payment_qr_url?: string | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_lesson_length?: number
          profile_image_url?: string | null
          radius_miles?: number
          school_skim_percentage?: number | null
          special_skills?: string | null
          twitter_url?: string | null
          updated_at?: string
          welcome_video_url?: string | null
        }
        Relationships: []
      }
      lesson_history: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          instructor_id: string
          lesson_date: string
          notes: string | null
          pupil_id: string
          rating: number | null
          skills_practiced: string[] | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          instructor_id: string
          lesson_date: string
          notes?: string | null
          pupil_id: string
          rating?: number | null
          skills_practiced?: string[] | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          instructor_id?: string
          lesson_date?: string
          notes?: string | null
          pupil_id?: string
          rating?: number | null
          skills_practiced?: string[] | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_history_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_messages: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      pupils: {
        Row: {
          account_balance: number | null
          address: string
          course_type: string | null
          created_at: string
          email: string | null
          enquiry_id: string | null
          id: string
          instructor_id: string
          lessons_completed: number | null
          name: string
          next_lesson: string | null
          notes: string | null
          phone: string | null
          postcode: string
          prepaid_hours: number | null
          progress: number | null
          test_centre_id: string | null
          test_date: string | null
          test_time: string | null
          updated_at: string
        }
        Insert: {
          account_balance?: number | null
          address: string
          course_type?: string | null
          created_at?: string
          email?: string | null
          enquiry_id?: string | null
          id?: string
          instructor_id: string
          lessons_completed?: number | null
          name: string
          next_lesson?: string | null
          notes?: string | null
          phone?: string | null
          postcode: string
          prepaid_hours?: number | null
          progress?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_time?: string | null
          updated_at?: string
        }
        Update: {
          account_balance?: number | null
          address?: string
          course_type?: string | null
          created_at?: string
          email?: string | null
          enquiry_id?: string | null
          id?: string
          instructor_id?: string
          lessons_completed?: number | null
          name?: string
          next_lesson?: string | null
          notes?: string | null
          phone?: string | null
          postcode?: string
          prepaid_hours?: number | null
          progress?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupils_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "course_enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupils_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupils_test_centre_id_fkey"
            columns: ["test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          instructor_id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          instructor_id: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          instructor_id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_lessons: {
        Row: {
          amount_due: number | null
          created_at: string
          duration_minutes: number
          id: string
          instructor_id: string
          lesson_date: string
          lesson_type: string
          notes: string | null
          payment_status: string
          pickup_location: string | null
          pickup_postcode: string | null
          prepaid_hours_used: number | null
          pupil_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_due?: number | null
          created_at?: string
          duration_minutes?: number
          id?: string
          instructor_id: string
          lesson_date: string
          lesson_type?: string
          notes?: string | null
          payment_status?: string
          pickup_location?: string | null
          pickup_postcode?: string | null
          prepaid_hours_used?: number | null
          pupil_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_due?: number | null
          created_at?: string
          duration_minutes?: number
          id?: string
          instructor_id?: string
          lesson_date?: string
          lesson_type?: string
          notes?: string | null
          payment_status?: string
          pickup_location?: string | null
          pickup_postcode?: string | null
          prepaid_hours_used?: number | null
          pupil_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_lessons_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      site_images: {
        Row: {
          alt_text: string | null
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_key: string
          image_url: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_key: string
          image_url: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_key?: string
          image_url?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      test_centres: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          postcode: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          postcode?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          postcode?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
