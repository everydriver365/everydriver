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
      domain_orders: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          currency: string
          domain_name: string
          godaddy_order_id: string | null
          id: string
          instructor_id: string
          order_type: string
          period_years: number
          price_amount: number
          status: string
          tld: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          currency?: string
          domain_name: string
          godaddy_order_id?: string | null
          id?: string
          instructor_id: string
          order_type: string
          period_years?: number
          price_amount: number
          status?: string
          tld: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          currency?: string
          domain_name?: string
          godaddy_order_id?: string | null
          id?: string
          instructor_id?: string
          order_type?: string
          period_years?: number
          price_amount?: number
          status?: string
          tld?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_orders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      driving_behavior_events: {
        Row: {
          event_type: string
          g_force: number | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          recorded_at: string
          sensor_source: string | null
          severity: string
          speed_at_event: number | null
          telematics_id: string
        }
        Insert: {
          event_type: string
          g_force?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          recorded_at?: string
          sensor_source?: string | null
          severity?: string
          speed_at_event?: number | null
          telematics_id: string
        }
        Update: {
          event_type?: string
          g_force?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          recorded_at?: string
          sensor_source?: string | null
          severity?: string
          speed_at_event?: number | null
          telematics_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driving_behavior_events_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_features: {
        Row: {
          created_at: string
          description: string
          detailed_content: string | null
          display_order: number
          icon_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          detailed_content?: string | null
          display_order?: number
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          detailed_content?: string | null
          display_order?: number
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_hero: {
        Row: {
          badge_text: string
          created_at: string
          headline_highlight: string
          headline_line1: string
          headline_line2: string
          headline_line3: string
          id: string
          is_active: boolean | null
          learners_count: string
          learners_label: string
          rating_value: string
          search_button_text: string
          search_placeholder: string
          subtext: string
          updated_at: string
        }
        Insert: {
          badge_text?: string
          created_at?: string
          headline_highlight?: string
          headline_line1?: string
          headline_line2?: string
          headline_line3?: string
          id?: string
          is_active?: boolean | null
          learners_count?: string
          learners_label?: string
          rating_value?: string
          search_button_text?: string
          search_placeholder?: string
          subtext?: string
          updated_at?: string
        }
        Update: {
          badge_text?: string
          created_at?: string
          headline_highlight?: string
          headline_line1?: string
          headline_line2?: string
          headline_line3?: string
          id?: string
          is_active?: boolean | null
          learners_count?: string
          learners_label?: string
          rating_value?: string
          search_button_text?: string
          search_placeholder?: string
          subtext?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          badge_text: string | null
          created_at: string
          display_order: number | null
          id: string
          is_visible: boolean | null
          section_key: string
          section_name: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section_key: string
          section_name: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          section_key?: string
          section_name?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_stats: {
        Row: {
          created_at: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean | null
          stat_label: string
          stat_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean | null
          stat_label: string
          stat_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean | null
          stat_label?: string
          stat_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_testimonials: {
        Row: {
          avatar_initials: string | null
          content: string
          course_type: string | null
          created_at: string
          display_order: number
          id: string
          image_key: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          photo_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_initials?: string | null
          content: string
          course_type?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_key?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          photo_url?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_initials?: string | null
          content?: string
          course_type?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_key?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      included_features: {
        Row: {
          created_at: string
          description: string
          detailed_content: string | null
          display_order: number
          icon_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          detailed_content?: string | null
          display_order?: number
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          detailed_content?: string | null
          display_order?: number
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_app_features: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_app_hero: {
        Row: {
          badge_text: string
          created_at: string
          demo_cta_link: string
          demo_cta_text: string
          headline_highlight: string
          headline_part1: string
          hero_image_url: string | null
          id: string
          is_active: boolean | null
          primary_cta_link: string
          primary_cta_text: string
          secondary_cta_link: string
          secondary_cta_text: string
          subtext: string
          trust_badge1: string
          trust_badge2: string
          updated_at: string
        }
        Insert: {
          badge_text?: string
          created_at?: string
          demo_cta_link?: string
          demo_cta_text?: string
          headline_highlight?: string
          headline_part1?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          primary_cta_link?: string
          primary_cta_text?: string
          secondary_cta_link?: string
          secondary_cta_text?: string
          subtext?: string
          trust_badge1?: string
          trust_badge2?: string
          updated_at?: string
        }
        Update: {
          badge_text?: string
          created_at?: string
          demo_cta_link?: string
          demo_cta_text?: string
          headline_highlight?: string
          headline_part1?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          primary_cta_link?: string
          primary_cta_text?: string
          secondary_cta_link?: string
          secondary_cta_text?: string
          subtext?: string
          trust_badge1?: string
          trust_badge2?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_app_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_visible: boolean | null
          section_key: string
          section_name: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean | null
          section_key: string
          section_name: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean | null
          section_key?: string
          section_name?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_app_testimonials: {
        Row: {
          content: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          rating: number
          role: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          rating?: number
          role: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          rating?: number
          role?: string
          updated_at?: string
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
          last_external_sync: string | null
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
          last_external_sync?: string | null
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
          last_external_sync?: string | null
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
          custom_features: string[] | null
          discounted_price: number | null
          id: string
          instructor_id: string
          is_active: boolean
        }
        Insert: {
          course_hours: number
          course_image_url?: string | null
          course_name: string
          created_at?: string
          custom_features?: string[] | null
          discounted_price?: number | null
          id?: string
          instructor_id: string
          is_active?: boolean
        }
        Update: {
          course_hours?: number
          course_image_url?: string | null
          course_name?: string
          created_at?: string
          custom_features?: string[] | null
          discounted_price?: number | null
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
      instructor_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          instructor_id: string
          receipt_url: string | null
          updated_at: string
          xero_sync_date: string | null
          xero_synced: boolean | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          instructor_id: string
          receipt_url?: string | null
          updated_at?: string
          xero_sync_date?: string | null
          xero_synced?: boolean | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          instructor_id?: string
          receipt_url?: string | null
          updated_at?: string
          xero_sync_date?: string | null
          xero_synced?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_expenses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_homepage_content: {
        Row: {
          created_at: string
          hero_image_url: string | null
          id: string
          is_active: boolean | null
          motivation_subtitle: string
          motivation_title: string
          progress_label: string | null
          promo_banners: Json | null
          quick_actions: Json | null
          secondary_promo_banners: Json | null
          show_progress_indicator: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          motivation_subtitle?: string
          motivation_title?: string
          progress_label?: string | null
          promo_banners?: Json | null
          quick_actions?: Json | null
          secondary_promo_banners?: Json | null
          show_progress_indicator?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          motivation_subtitle?: string
          motivation_title?: string
          progress_label?: string | null
          promo_banners?: Json | null
          quick_actions?: Json | null
          secondary_promo_banners?: Json | null
          show_progress_indicator?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      instructor_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          instructor_id: string
          plan_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          instructor_id: string
          plan_id: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          instructor_id?: string
          plan_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_subscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
      instructor_website_pages: {
        Row: {
          content_blocks: Json | null
          created_at: string
          display_order: number
          hero_heading: string | null
          hero_image_url: string | null
          hero_subheading: string | null
          id: string
          instructor_id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          page_title: string
          page_type: string
          updated_at: string
        }
        Insert: {
          content_blocks?: Json | null
          created_at?: string
          display_order?: number
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          instructor_id: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_title: string
          page_type: string
          updated_at?: string
        }
        Update: {
          content_blocks?: Json | null
          created_at?: string
          display_order?: number
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          instructor_id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          page_title?: string
          page_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_website_pages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
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
          app_slug: string | null
          auth_user_id: string | null
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
          logo_url: string | null
          name: string
          payment_link_base_url: string | null
          payment_qr_url: string | null
          personal_website_url: string | null
          phone: string | null
          preferred_lesson_length: number
          profile_image_url: string | null
          pupil_app_dark_mode: boolean | null
          pupil_app_enabled: boolean | null
          radius_miles: number
          school_skim_amount: number | null
          school_skim_percentage: number | null
          secondary_colour: string | null
          special_skills: string | null
          stripe_account_id: string | null
          twitter_url: string | null
          updated_at: string
          welcome_video_url: string | null
        }
        Insert: {
          adi_code_of_practice?: boolean | null
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          auth_user_id?: string | null
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
          logo_url?: string | null
          name: string
          payment_link_base_url?: string | null
          payment_qr_url?: string | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_lesson_length?: number
          profile_image_url?: string | null
          pupil_app_dark_mode?: boolean | null
          pupil_app_enabled?: boolean | null
          radius_miles?: number
          school_skim_amount?: number | null
          school_skim_percentage?: number | null
          secondary_colour?: string | null
          special_skills?: string | null
          stripe_account_id?: string | null
          twitter_url?: string | null
          updated_at?: string
          welcome_video_url?: string | null
        }
        Update: {
          adi_code_of_practice?: boolean | null
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          auth_user_id?: string | null
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
          logo_url?: string | null
          name?: string
          payment_link_base_url?: string | null
          payment_qr_url?: string | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_lesson_length?: number
          profile_image_url?: string | null
          pupil_app_dark_mode?: boolean | null
          pupil_app_enabled?: boolean | null
          radius_miles?: number
          school_skim_amount?: number | null
          school_skim_percentage?: number | null
          secondary_colour?: string | null
          special_skills?: string | null
          stripe_account_id?: string | null
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
      lesson_telematics: {
        Row: {
          avg_speed_kmh: number | null
          created_at: string
          damoov_acceleration_score: number | null
          damoov_braking_score: number | null
          damoov_cornering_score: number | null
          damoov_crash_detected: boolean | null
          damoov_crash_timestamp: string | null
          damoov_overall_score: number | null
          damoov_phone_score: number | null
          damoov_speeding_score: number | null
          damoov_trip_token: string | null
          ended_at: string | null
          id: string
          instructor_id: string
          lesson_id: string | null
          max_speed_kmh: number | null
          pupil_id: string | null
          started_at: string
          total_distance_km: number | null
        }
        Insert: {
          avg_speed_kmh?: number | null
          created_at?: string
          damoov_acceleration_score?: number | null
          damoov_braking_score?: number | null
          damoov_cornering_score?: number | null
          damoov_crash_detected?: boolean | null
          damoov_crash_timestamp?: string | null
          damoov_overall_score?: number | null
          damoov_phone_score?: number | null
          damoov_speeding_score?: number | null
          damoov_trip_token?: string | null
          ended_at?: string | null
          id?: string
          instructor_id: string
          lesson_id?: string | null
          max_speed_kmh?: number | null
          pupil_id?: string | null
          started_at?: string
          total_distance_km?: number | null
        }
        Update: {
          avg_speed_kmh?: number | null
          created_at?: string
          damoov_acceleration_score?: number | null
          damoov_braking_score?: number | null
          damoov_cornering_score?: number | null
          damoov_crash_detected?: boolean | null
          damoov_crash_timestamp?: string | null
          damoov_overall_score?: number | null
          damoov_phone_score?: number | null
          damoov_speeding_score?: number | null
          damoov_trip_token?: string | null
          ended_at?: string | null
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          max_speed_kmh?: number | null
          pupil_id?: string | null
          started_at?: string
          total_distance_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_telematics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_log: {
        Row: {
          created_at: string
          date: string
          distance_km: number | null
          end_odometer_km: number
          fuel_added_liters: number | null
          fuel_cost: number | null
          id: string
          instructor_id: string
          purpose: string | null
          start_odometer_km: number
          vehicle_health_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          distance_km?: number | null
          end_odometer_km: number
          fuel_added_liters?: number | null
          fuel_cost?: number | null
          id?: string
          instructor_id: string
          purpose?: string | null
          start_odometer_km: number
          vehicle_health_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          distance_km?: number | null
          end_odometer_km?: number
          fuel_added_liters?: number | null
          fuel_cost?: number | null
          id?: string
          instructor_id?: string
          purpose?: string | null
          start_odometer_km?: number
          vehicle_health_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_log_vehicle_health_id_fkey"
            columns: ["vehicle_health_id"]
            isOneToOne: false
            referencedRelation: "vehicle_health"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          instructor_id: string
          notes: string | null
          payment_method: string | null
          pupil_id: string
          recorded_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          instructor_id: string
          notes?: string | null
          payment_method?: string | null
          pupil_id: string
          recorded_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          payment_method?: string | null
          pupil_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_link_tracking: {
        Row: {
          amount_requested: number | null
          created_at: string
          id: string
          instructor_id: string
          link_code: string
          opened_at: string | null
          opened_count: number
          paid_amount: number | null
          paid_at: string | null
          pupil_id: string | null
          sent_at: string
          sent_via: string
          status: string
        }
        Insert: {
          amount_requested?: number | null
          created_at?: string
          id?: string
          instructor_id: string
          link_code: string
          opened_at?: string | null
          opened_count?: number
          paid_amount?: number | null
          paid_at?: string | null
          pupil_id?: string | null
          sent_at?: string
          sent_via?: string
          status?: string
        }
        Update: {
          amount_requested?: number | null
          created_at?: string
          id?: string
          instructor_id?: string
          link_code?: string
          opened_at?: string | null
          opened_count?: number
          paid_amount?: number | null
          paid_at?: string | null
          pupil_id?: string | null
          sent_at?: string
          sent_via?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_link_tracking_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_link_tracking_pupil_id_fkey"
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
      pupil_leaderboard: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          pupil_id: string
          rank: number | null
          updated_at: string
          week_start: string
          weekly_coins_earned: number | null
          weekly_score: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          pupil_id: string
          rank?: number | null
          updated_at?: string
          week_start: string
          weekly_coins_earned?: number | null
          weekly_score?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          pupil_id?: string
          rank?: number | null
          updated_at?: string
          week_start?: string
          weekly_coins_earned?: number | null
          weekly_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_leaderboard_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_leaderboard_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupils: {
        Row: {
          account_balance: number | null
          address: string
          course_type: string | null
          created_at: string
          current_streak: number | null
          damoov_device_token: string | null
          drive_coins: number | null
          email: string | null
          enquiry_id: string | null
          id: string
          instructor_id: string
          lessons_completed: number | null
          longest_streak: number | null
          name: string
          next_lesson: string | null
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          postcode: string
          prepaid_hours: number | null
          progress: number | null
          test_centre_id: string | null
          test_date: string | null
          test_time: string | null
          total_trips: number | null
          updated_at: string
          what3words: string | null
        }
        Insert: {
          account_balance?: number | null
          address: string
          course_type?: string | null
          created_at?: string
          current_streak?: number | null
          damoov_device_token?: string | null
          drive_coins?: number | null
          email?: string | null
          enquiry_id?: string | null
          id?: string
          instructor_id: string
          lessons_completed?: number | null
          longest_streak?: number | null
          name: string
          next_lesson?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          postcode: string
          prepaid_hours?: number | null
          progress?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_time?: string | null
          total_trips?: number | null
          updated_at?: string
          what3words?: string | null
        }
        Update: {
          account_balance?: number | null
          address?: string
          course_type?: string | null
          created_at?: string
          current_streak?: number | null
          damoov_device_token?: string | null
          drive_coins?: number | null
          email?: string | null
          enquiry_id?: string | null
          id?: string
          instructor_id?: string
          lessons_completed?: number | null
          longest_streak?: number | null
          name?: string
          next_lesson?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          postcode?: string
          prepaid_hours?: number | null
          progress?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_time?: string | null
          total_trips?: number | null
          updated_at?: string
          what3words?: string | null
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
      pwa_app_configs: {
        Row: {
          app_name: string
          app_type: string
          background_color: string
          created_at: string
          description: string | null
          icon_192_url: string | null
          icon_512_url: string | null
          id: string
          is_active: boolean | null
          short_name: string
          start_url: string
          theme_color: string
          updated_at: string
        }
        Insert: {
          app_name: string
          app_type: string
          background_color?: string
          created_at?: string
          description?: string | null
          icon_192_url?: string | null
          icon_512_url?: string | null
          id?: string
          is_active?: boolean | null
          short_name: string
          start_url: string
          theme_color?: string
          updated_at?: string
        }
        Update: {
          app_name?: string
          app_type?: string
          background_color?: string
          created_at?: string
          description?: string | null
          icon_192_url?: string | null
          icon_512_url?: string | null
          id?: string
          is_active?: boolean | null
          short_name?: string
          start_url?: string
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
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
          pickup_what3words: string | null
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
          pickup_what3words?: string | null
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
          pickup_what3words?: string | null
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
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          label: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          label: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          label?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_pupils: number | null
          name: string
          price_monthly: number
          price_yearly: number | null
          slug: string
          sms_credits_monthly: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_pupils?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number | null
          slug: string
          sms_credits_monthly?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_pupils?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
          sms_credits_monthly?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      telematics_gps_points: {
        Row: {
          accuracy_m: number | null
          altitude_m: number | null
          gps_accuracy_m: number | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed_kmh: number | null
          telematics_id: string
        }
        Insert: {
          accuracy_m?: number | null
          altitude_m?: number | null
          gps_accuracy_m?: number | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed_kmh?: number | null
          telematics_id: string
        }
        Update: {
          accuracy_m?: number | null
          altitude_m?: number | null
          gps_accuracy_m?: number | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed_kmh?: number | null
          telematics_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telematics_gps_points_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      vehicle_health: {
        Row: {
          created_at: string
          current_odometer_km: number
          fuel_efficiency_avg: number | null
          id: string
          instructor_id: string
          last_service_date: string | null
          next_service_due_date: string | null
          next_service_due_km: number | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_odometer_km?: number
          fuel_efficiency_avg?: number | null
          id?: string
          instructor_id: string
          last_service_date?: string | null
          next_service_due_date?: string | null
          next_service_due_km?: number | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_odometer_km?: number
          fuel_efficiency_avg?: number | null
          id?: string
          instructor_id?: string
          last_service_date?: string | null
          next_service_due_date?: string | null
          next_service_due_km?: number | null
          notes?: string | null
          updated_at?: string
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
      app_role: "instructor" | "admin" | "pupil"
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
      app_role: ["instructor", "admin", "pupil"],
    },
  },
} as const
