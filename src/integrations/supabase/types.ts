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
      admin_conversations: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          last_message_at: string | null
          last_message_preview: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "admin_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_section_notes: {
        Row: {
          content: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          note_type: string
          section_key: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          note_type?: string
          section_key: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          note_type?: string
          section_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_todos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_completed: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_websites_needed: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_completed: boolean
          notes: string | null
          password: string | null
          title: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          notes?: string | null
          password?: string | null
          title: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_completed?: boolean
          notes?: string | null
          password?: string | null
          title?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      booking_upsells: {
        Row: {
          badge_text: string | null
          created_at: string
          display_order: number | null
          full_description: string | null
          highlight_color: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          refund_policy: string | null
          short_description: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          display_order?: number | null
          full_description?: string | null
          highlight_color?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          refund_policy?: string | null
          short_description: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          display_order?: number | null
          full_description?: string | null
          highlight_color?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          refund_policy?: string | null
          short_description?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      compliance_reminders: {
        Row: {
          days_before: number
          expiry_date: string
          id: string
          instructor_id: string
          reminder_type: string
          sent_at: string
          sent_via: string
        }
        Insert: {
          days_before: number
          expiry_date: string
          id?: string
          instructor_id: string
          reminder_type: string
          sent_at?: string
          sent_via: string
        }
        Update: {
          days_before?: number
          expiry_date?: string
          id?: string
          instructor_id?: string
          reminder_type?: string
          sent_at?: string
          sent_via?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reminders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          instructor_id: string
          last_message_at: string | null
          last_message_preview: string | null
          pupil_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructor_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          pupil_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instructor_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          pupil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
      cpd_log_entries: {
        Row: {
          activity_type: string
          certificate_url: string | null
          created_at: string
          date: string
          description: string | null
          hours: number
          id: string
          instructor_id: string
          provider: string | null
          title: string
        }
        Insert: {
          activity_type: string
          certificate_url?: string | null
          created_at?: string
          date?: string
          description?: string | null
          hours: number
          id?: string
          instructor_id: string
          provider?: string | null
          title: string
        }
        Update: {
          activity_type?: string
          certificate_url?: string | null
          created_at?: string
          date?: string
          description?: string | null
          hours?: number
          id?: string
          instructor_id?: string
          provider?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpd_log_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_mini_website: {
        Row: {
          badge_text: string | null
          content_blocks: Json | null
          cpd_certified: boolean | null
          created_at: string
          cta_button_text: string | null
          cta_heading: string | null
          cta_phone_text: string | null
          cta_subtext: string | null
          display_order: number | null
          headline_highlight: string | null
          headline_line1: string | null
          headline_line2: string | null
          headline_line3: string | null
          hero_heading: string | null
          hero_image_url: string | null
          hero_subheading: string | null
          id: string
          instructor_grade: string | null
          instructor_name: string | null
          instructor_phone: string | null
          instructor_postcode: string | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          page_title: string
          page_type: string
          rating_value: string | null
          search_button_text: string | null
          search_placeholder: string | null
          show_finance_badges: boolean | null
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          content_blocks?: Json | null
          cpd_certified?: boolean | null
          created_at?: string
          cta_button_text?: string | null
          cta_heading?: string | null
          cta_phone_text?: string | null
          cta_subtext?: string | null
          display_order?: number | null
          headline_highlight?: string | null
          headline_line1?: string | null
          headline_line2?: string | null
          headline_line3?: string | null
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          instructor_grade?: string | null
          instructor_name?: string | null
          instructor_phone?: string | null
          instructor_postcode?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_title: string
          page_type: string
          rating_value?: string | null
          search_button_text?: string | null
          search_placeholder?: string | null
          show_finance_badges?: boolean | null
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          content_blocks?: Json | null
          cpd_certified?: boolean | null
          created_at?: string
          cta_button_text?: string | null
          cta_heading?: string | null
          cta_phone_text?: string | null
          cta_subtext?: string | null
          display_order?: number | null
          headline_highlight?: string | null
          headline_line1?: string | null
          headline_line2?: string | null
          headline_line3?: string | null
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          instructor_grade?: string | null
          instructor_name?: string | null
          instructor_phone?: string | null
          instructor_postcode?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_title?: string
          page_type?: string
          rating_value?: string | null
          search_button_text?: string | null
          search_placeholder?: string | null
          show_finance_badges?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          applies_to: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          times_used: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          times_used?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          times_used?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      domain_orders: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          currency: string
          dns_records: Json | null
          domain_name: string
          godaddy_order_id: string | null
          id: string
          instructor_id: string
          mini_website_linked: boolean | null
          order_type: string
          period_years: number
          price_amount: number
          ssl_expires_at: string | null
          ssl_provisioned_at: string | null
          ssl_status: string | null
          status: string
          tld: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          currency?: string
          dns_records?: Json | null
          domain_name: string
          godaddy_order_id?: string | null
          id?: string
          instructor_id: string
          mini_website_linked?: boolean | null
          order_type: string
          period_years?: number
          price_amount: number
          ssl_expires_at?: string | null
          ssl_provisioned_at?: string | null
          ssl_status?: string | null
          status?: string
          tld: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          currency?: string
          dns_records?: Json | null
          domain_name?: string
          godaddy_order_id?: string | null
          id?: string
          instructor_id?: string
          mini_website_linked?: boolean | null
          order_type?: string
          period_years?: number
          price_amount?: number
          ssl_expires_at?: string | null
          ssl_provisioned_at?: string | null
          ssl_status?: string | null
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
          dismissed_at: string | null
          dismissed_by: string | null
          dismissed_reason: string | null
          event_type: string
          g_force: number | null
          id: string
          is_dismissed: boolean | null
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
          dismissed_at?: string | null
          dismissed_by?: string | null
          dismissed_reason?: string | null
          event_type: string
          g_force?: number | null
          id?: string
          is_dismissed?: boolean | null
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
          dismissed_at?: string | null
          dismissed_by?: string | null
          dismissed_reason?: string | null
          event_type?: string
          g_force?: number | null
          id?: string
          is_dismissed?: boolean | null
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
      driving_test_results: {
        Row: {
          adi_cert_no: string | null
          application_ref: string | null
          cat_type: string | null
          created_at: string
          debrief_activity_code: string | null
          eta_code: string | null
          examiner_id: string | null
          examiner_took_action: boolean
          faults: Json
          id: string
          instructor_id: string
          is_mock: boolean
          notes: string | null
          pupil_id: string
          result: string
          survey_answers: Json | null
          test_centre_id: string | null
          test_date: string
          test_time: string | null
          total_dangerous_faults: number
          total_minor_faults: number
          total_serious_faults: number
          updated_at: string
        }
        Insert: {
          adi_cert_no?: string | null
          application_ref?: string | null
          cat_type?: string | null
          created_at?: string
          debrief_activity_code?: string | null
          eta_code?: string | null
          examiner_id?: string | null
          examiner_took_action?: boolean
          faults?: Json
          id?: string
          instructor_id: string
          is_mock?: boolean
          notes?: string | null
          pupil_id: string
          result: string
          survey_answers?: Json | null
          test_centre_id?: string | null
          test_date: string
          test_time?: string | null
          total_dangerous_faults?: number
          total_minor_faults?: number
          total_serious_faults?: number
          updated_at?: string
        }
        Update: {
          adi_cert_no?: string | null
          application_ref?: string | null
          cat_type?: string | null
          created_at?: string
          debrief_activity_code?: string | null
          eta_code?: string | null
          examiner_id?: string | null
          examiner_took_action?: boolean
          faults?: Json
          id?: string
          instructor_id?: string
          is_mock?: boolean
          notes?: string | null
          pupil_id?: string
          result?: string
          survey_answers?: Json | null
          test_centre_id?: string | null
          test_date?: string
          test_time?: string | null
          total_dangerous_faults?: number
          total_minor_faults?: number
          total_serious_faults?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driving_test_results_examiner_id_fkey"
            columns: ["examiner_id"]
            isOneToOne: false
            referencedRelation: "examiners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driving_test_results_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driving_test_results_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driving_test_results_test_centre_id_fkey"
            columns: ["test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiry_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          enquiry_id: string
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          enquiry_id: string
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          enquiry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_notes_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "course_enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      examiners: {
        Row: {
          created_at: string
          dvsa_staff_number: string | null
          id: string
          instructor_id: string | null
          is_active: boolean
          name: string
          notes: string | null
          test_centre_id: string | null
        }
        Insert: {
          created_at?: string
          dvsa_staff_number?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          test_centre_id?: string | null
        }
        Update: {
          created_at?: string
          dvsa_staff_number?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          test_centre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "examiners_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examiners_test_centre_id_fkey"
            columns: ["test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      favourite_locations: {
        Row: {
          address: string | null
          category: string
          created_at: string
          id: string
          instructor_id: string
          is_favorite: boolean | null
          latitude: number
          longitude: number
          name: string
          notes: string | null
          postcode: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string
          created_at?: string
          id?: string
          instructor_id: string
          is_favorite?: boolean | null
          latitude: number
          longitude: number
          name: string
          notes?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_favorite?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          notes?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourite_locations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_offers: {
        Row: {
          created_at: string
          discount_type: string | null
          discount_value: number | null
          id: string
          instructor_id: string
          pupil_id: string
          pupil_phone: string
          responded_at: string | null
          response_message: string | null
          slot_date: string
          slot_end_time: string
          slot_start_time: string
          status: string
          twilio_message_sid: string | null
        }
        Insert: {
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          instructor_id: string
          pupil_id: string
          pupil_phone: string
          responded_at?: string | null
          response_message?: string | null
          slot_date: string
          slot_end_time: string
          slot_start_time: string
          status?: string
          twilio_message_sid?: string | null
        }
        Update: {
          created_at?: string
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          instructor_id?: string
          pupil_id?: string
          pupil_phone?: string
          responded_at?: string | null
          response_message?: string | null
          slot_date?: string
          slot_end_time?: string
          slot_start_time?: string
          status?: string
          twilio_message_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_offers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_offers_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
      hosting_orders: {
        Row: {
          billing_period: string
          created_at: string
          currency: string
          domain_name: string
          expires_at: string | null
          id: string
          instructor_id: string
          package_id: string
          package_name: string
          price_amount: number
          provider_package_ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          currency?: string
          domain_name: string
          expires_at?: string | null
          id?: string
          instructor_id: string
          package_id: string
          package_name: string
          price_amount: number
          provider_package_ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          currency?: string
          domain_name?: string
          expires_at?: string | null
          id?: string
          instructor_id?: string
          package_id?: string
          package_name?: string
          price_amount?: number
          provider_package_ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_orders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
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
          external_event_id: string
          id: string
          instructor_id: string
          is_busy: boolean
          start_time: string
          synced_at: string
          title: string | null
        }
        Insert: {
          end_time: string
          external_event_id: string
          id?: string
          instructor_id: string
          is_busy?: boolean
          start_time: string
          synced_at?: string
          title?: string | null
        }
        Update: {
          end_time?: string
          external_event_id?: string
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
      instructor_calendar_shares: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          is_enabled: boolean
          share_token: string
          show_blocks: boolean
          show_external_events: boolean
          show_lesson_details: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          is_enabled?: boolean
          share_token: string
          show_blocks?: boolean
          show_external_events?: boolean
          show_lesson_details?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          is_enabled?: boolean
          share_token?: string
          show_blocks?: boolean
          show_external_events?: boolean
          show_lesson_details?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_calendar_shares_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
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
          email: string | null
          id: string
          instructor_id: string
          last_external_sync: string | null
          provider: string | null
          refresh_token: string
          token_expiry: string
          updated_at: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instructor_id: string
          last_external_sync?: string | null
          provider?: string | null
          refresh_token: string
          token_expiry: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instructor_id?: string
          last_external_sync?: string | null
          provider?: string | null
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
      instructor_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_published: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_google_service_calendar: {
        Row: {
          calendar_id: string
          created_at: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
          last_sync: string | null
          sync_error: string | null
          updated_at: string | null
        }
        Insert: {
          calendar_id: string
          created_at?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          last_sync?: string | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Update: {
          calendar_id?: string
          created_at?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          last_sync?: string | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_google_service_calendar_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
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
      instructor_manual_blocks: {
        Row: {
          block_type: string
          created_at: string
          end_datetime: string
          id: string
          instructor_id: string
          notes: string | null
          start_datetime: string
          title: string
          updated_at: string
        }
        Insert: {
          block_type?: string
          created_at?: string
          end_datetime: string
          id?: string
          instructor_id: string
          notes?: string | null
          start_datetime: string
          title: string
          updated_at?: string
        }
        Update: {
          block_type?: string
          created_at?: string
          end_datetime?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_manual_blocks_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_standards_check: {
        Row: {
          avg_minor_faults: number
          avg_serious_faults: number
          calculated_at: string
          id: string
          instructor_id: string
          pass_rate_percentage: number
          period_end: string
          period_start: string
          physical_action_percentage: number
          total_tests: number
          trigger_details: Json
          triggers_met: number
        }
        Insert: {
          avg_minor_faults?: number
          avg_serious_faults?: number
          calculated_at?: string
          id?: string
          instructor_id: string
          pass_rate_percentage?: number
          period_end: string
          period_start: string
          physical_action_percentage?: number
          total_tests?: number
          trigger_details?: Json
          triggers_met?: number
        }
        Update: {
          avg_minor_faults?: number
          avg_serious_faults?: number
          calculated_at?: string
          id?: string
          instructor_id?: string
          pass_rate_percentage?: number
          period_end?: string
          period_start?: string
          physical_action_percentage?: number
          total_tests?: number
          trigger_details?: Json
          triggers_met?: number
        }
        Relationships: [
          {
            foreignKeyName: "instructor_standards_check_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          gocardless_customer_id: string | null
          gocardless_mandate_id: string | null
          gocardless_subscription_id: string | null
          id: string
          instructor_id: string
          plan_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          gocardless_customer_id?: string | null
          gocardless_mandate_id?: string | null
          gocardless_subscription_id?: string | null
          id?: string
          instructor_id: string
          plan_id: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          gocardless_customer_id?: string | null
          gocardless_mandate_id?: string | null
          gocardless_subscription_id?: string | null
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
      instructor_terms_conditions: {
        Row: {
          content: string
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "instructor_terms_conditions_instructor_id_fkey"
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
      instructor_vehicles: {
        Row: {
          created_at: string | null
          current_odometer_km: number | null
          id: string
          image_url: string | null
          instructor_id: string
          insurance_expiry: string | null
          is_active: boolean | null
          is_primary: boolean | null
          last_service_date: string | null
          make: string | null
          model: string | null
          mot_expiry: string | null
          next_service_due_km: number | null
          notes: string | null
          registration: string
          tax_expiry: string | null
          transmission: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          current_odometer_km?: number | null
          id?: string
          image_url?: string | null
          instructor_id: string
          insurance_expiry?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          mot_expiry?: string | null
          next_service_due_km?: number | null
          notes?: string | null
          registration: string
          tax_expiry?: string | null
          transmission?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          current_odometer_km?: number | null
          id?: string
          image_url?: string | null
          instructor_id?: string
          insurance_expiry?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          mot_expiry?: string | null
          next_service_due_km?: number | null
          notes?: string | null
          registration?: string
          tax_expiry?: string | null
          transmission?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_vehicles_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
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
          adi_badge_expiry: string | null
          adi_badge_number: string | null
          adi_certificate_url: string | null
          adi_code_of_practice: boolean | null
          allowed_lesson_lengths: number[] | null
          app_slug: string | null
          auth_user_id: string | null
          available_from: string | null
          bio: string | null
          bonus_earned: number | null
          booking_advance_days: number | null
          booking_mode: string | null
          brand_colour: string | null
          buffer_minutes: number
          calendar_colors: Json | null
          cancellation_charge_percent: number | null
          cancellation_policy_hours: number | null
          cancellation_policy_text: string | null
          car_image_url: string | null
          car_insurance_expiry: string | null
          car_make: string | null
          car_model: string | null
          car_mot_expiry: string | null
          car_tax_expiry: string | null
          car_type: string
          cpd_certified: boolean | null
          cpd_hours_logged: number | null
          cpd_year_target: number | null
          created_at: string
          custom_branding_enabled: boolean | null
          custom_domain: string | null
          custom_domain_verified: boolean | null
          dark_mode_enabled: boolean | null
          dbs_certificate_expiry: string | null
          deposit_amount: number | null
          deposit_deadline_days: number | null
          deposit_enabled: boolean | null
          email: string | null
          extra_info: string | null
          facebook_url: string | null
          fuel_cost_per_litre: number | null
          google_access_token: string | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          hero_image_url: string | null
          home_address: string | null
          home_postcode: string
          hourly_rate: number | null
          id: string
          instagram_url: string | null
          instructor_grade: string | null
          is_active: boolean
          is_online: boolean | null
          last_calendar_sync: string | null
          last_compliance_reminder_sent: string | null
          last_seen_at: string | null
          linkedin_url: string | null
          logo_url: string | null
          mini_website_domain_id: string | null
          name: string
          payment_link_base_url: string | null
          payment_qr_url: string | null
          personal_website_url: string | null
          phone: string | null
          preferred_language: string | null
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
          tax_code: string | null
          twitter_url: string | null
          updated_at: string
          vehicle_mpg: number | null
          website_button_color: string | null
          website_font: string | null
          website_footer_bg: string | null
          website_header_style: string | null
          website_heading_color: string | null
          website_menu_text_color: string | null
          website_text_color: string | null
          website_theme: string | null
          welcome_video_url: string | null
          xero_connected: boolean | null
          xero_tenant_id: string | null
        }
        Insert: {
          adi_badge_expiry?: string | null
          adi_badge_number?: string | null
          adi_certificate_url?: string | null
          adi_code_of_practice?: boolean | null
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          auth_user_id?: string | null
          available_from?: string | null
          bio?: string | null
          bonus_earned?: number | null
          booking_advance_days?: number | null
          booking_mode?: string | null
          brand_colour?: string | null
          buffer_minutes?: number
          calendar_colors?: Json | null
          cancellation_charge_percent?: number | null
          cancellation_policy_hours?: number | null
          cancellation_policy_text?: string | null
          car_image_url?: string | null
          car_insurance_expiry?: string | null
          car_make?: string | null
          car_model?: string | null
          car_mot_expiry?: string | null
          car_tax_expiry?: string | null
          car_type: string
          cpd_certified?: boolean | null
          cpd_hours_logged?: number | null
          cpd_year_target?: number | null
          created_at?: string
          custom_branding_enabled?: boolean | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          dark_mode_enabled?: boolean | null
          dbs_certificate_expiry?: string | null
          deposit_amount?: number | null
          deposit_deadline_days?: number | null
          deposit_enabled?: boolean | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          fuel_cost_per_litre?: number | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          hero_image_url?: string | null
          home_address?: string | null
          home_postcode: string
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          instructor_grade?: string | null
          is_active?: boolean
          is_online?: boolean | null
          last_calendar_sync?: string | null
          last_compliance_reminder_sent?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          mini_website_domain_id?: string | null
          name: string
          payment_link_base_url?: string | null
          payment_qr_url?: string | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_language?: string | null
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
          tax_code?: string | null
          twitter_url?: string | null
          updated_at?: string
          vehicle_mpg?: number | null
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_style?: string | null
          website_heading_color?: string | null
          website_menu_text_color?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          welcome_video_url?: string | null
          xero_connected?: boolean | null
          xero_tenant_id?: string | null
        }
        Update: {
          adi_badge_expiry?: string | null
          adi_badge_number?: string | null
          adi_certificate_url?: string | null
          adi_code_of_practice?: boolean | null
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          auth_user_id?: string | null
          available_from?: string | null
          bio?: string | null
          bonus_earned?: number | null
          booking_advance_days?: number | null
          booking_mode?: string | null
          brand_colour?: string | null
          buffer_minutes?: number
          calendar_colors?: Json | null
          cancellation_charge_percent?: number | null
          cancellation_policy_hours?: number | null
          cancellation_policy_text?: string | null
          car_image_url?: string | null
          car_insurance_expiry?: string | null
          car_make?: string | null
          car_model?: string | null
          car_mot_expiry?: string | null
          car_tax_expiry?: string | null
          car_type?: string
          cpd_certified?: boolean | null
          cpd_hours_logged?: number | null
          cpd_year_target?: number | null
          created_at?: string
          custom_branding_enabled?: boolean | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          dark_mode_enabled?: boolean | null
          dbs_certificate_expiry?: string | null
          deposit_amount?: number | null
          deposit_deadline_days?: number | null
          deposit_enabled?: boolean | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          fuel_cost_per_litre?: number | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          hero_image_url?: string | null
          home_address?: string | null
          home_postcode?: string
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          instructor_grade?: string | null
          is_active?: boolean
          is_online?: boolean | null
          last_calendar_sync?: string | null
          last_compliance_reminder_sent?: string | null
          last_seen_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          mini_website_domain_id?: string | null
          name?: string
          payment_link_base_url?: string | null
          payment_qr_url?: string | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_language?: string | null
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
          tax_code?: string | null
          twitter_url?: string | null
          updated_at?: string
          vehicle_mpg?: number | null
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_style?: string | null
          website_heading_color?: string | null
          website_menu_text_color?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          welcome_video_url?: string | null
          xero_connected?: boolean | null
          xero_tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_mini_website_domain_id_fkey"
            columns: ["mini_website_domain_id"]
            isOneToOne: false
            referencedRelation: "domain_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_cancellation_requests: {
        Row: {
          charge_amount: number | null
          charge_applied: boolean | null
          created_at: string | null
          id: string
          instructor_id: string
          instructor_notes: string | null
          lesson_id: string
          pupil_id: string
          reason: string | null
          requested_at: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          charge_amount?: number | null
          charge_applied?: boolean | null
          created_at?: string | null
          id?: string
          instructor_id: string
          instructor_notes?: string | null
          lesson_id: string
          pupil_id: string
          reason?: string | null
          requested_at?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          charge_amount?: number | null
          charge_applied?: boolean | null
          created_at?: string | null
          id?: string
          instructor_id?: string
          instructor_notes?: string | null
          lesson_id?: string
          pupil_id?: string
          reason?: string | null
          requested_at?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_cancellation_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_cancellation_requests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_cancellation_requests_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
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
          scheduled_lesson_id: string | null
          skills_practiced: string[] | null
          start_time: string | null
          telematics_session_id: string | null
          updated_at: string
          vehicle_id: string | null
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
          scheduled_lesson_id?: string | null
          skills_practiced?: string[] | null
          start_time?: string | null
          telematics_session_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
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
          scheduled_lesson_id?: string | null
          skills_practiced?: string[] | null
          start_time?: string | null
          telematics_session_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
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
          {
            foreignKeyName: "lesson_history_scheduled_lesson_id_fkey"
            columns: ["scheduled_lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_history_telematics_session_id_fkey"
            columns: ["telematics_session_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
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
          harsh_brake_count: number | null
          id: string
          instructor_id: string
          lesson_id: string | null
          local_score: number | null
          max_speed_kmh: number | null
          max_speed_over_limit_kmh: number | null
          pupil_id: string | null
          speeding_events_count: number | null
          speeding_total_seconds: number | null
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
          harsh_brake_count?: number | null
          id?: string
          instructor_id: string
          lesson_id?: string | null
          local_score?: number | null
          max_speed_kmh?: number | null
          max_speed_over_limit_kmh?: number | null
          pupil_id?: string | null
          speeding_events_count?: number | null
          speeding_total_seconds?: number | null
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
          harsh_brake_count?: number | null
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          local_score?: number | null
          max_speed_kmh?: number | null
          max_speed_over_limit_kmh?: number | null
          pupil_id?: string | null
          speeding_events_count?: number | null
          speeding_total_seconds?: number | null
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
      lesson_waitlist: {
        Row: {
          created_at: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
          max_duration_mins: number | null
          min_duration_mins: number | null
          notes: string | null
          preferred_days: string[] | null
          preferred_times: string[] | null
          pupil_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          max_duration_mins?: number | null
          min_duration_mins?: number | null
          notes?: string | null
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          pupil_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          max_duration_mins?: number | null
          min_duration_mins?: number | null
          notes?: string | null
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          pupil_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_waitlist_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_waitlist_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_sessions: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          id: string
          instructor_id: string | null
          session_type: string
          source_page: string | null
          status: string
          updated_at: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          instructor_id?: string | null
          session_type: string
          source_page?: string | null
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          instructor_id?: string | null
          session_type?: string
          source_page?: string | null
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_typing: {
        Row: {
          id: string
          is_typing: boolean
          session_id: string
          updated_at: string
          user_id: string | null
          user_type: string
        }
        Insert: {
          id?: string
          is_typing?: boolean
          session_id: string
          updated_at?: string
          user_id?: string | null
          user_type: string
        }
        Update: {
          id?: string
          is_typing?: boolean
          session_id?: string
          updated_at?: string
          user_id?: string | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_typing_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_pupil_positions: {
        Row: {
          accuracy: number | null
          created_at: string
          heading: number | null
          id: string
          instructor_id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          pupil_id: string
          speed_kmh: number | null
          telematics_session_id: string | null
          trip_status: string | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          pupil_id: string
          speed_kmh?: number | null
          telematics_session_id?: string | null
          trip_status?: string | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          pupil_id?: string
          speed_kmh?: number | null
          telematics_session_id?: string | null
          trip_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_pupil_positions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_pupil_positions_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_pupil_positions_telematics_session_id_fkey"
            columns: ["telematics_session_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
          vehicle_id: string | null
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
          vehicle_id?: string | null
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
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_log_vehicle_health_id_fkey"
            columns: ["vehicle_health_id"]
            isOneToOne: false
            referencedRelation: "vehicle_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_steps: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: number
          is_enabled: boolean
          is_required: boolean
          name: string
          step_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order: number
          icon_name: string
          id?: number
          is_enabled?: boolean
          is_required?: boolean
          name: string
          step_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: number
          is_enabled?: boolean
          is_required?: boolean
          name?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      parent_otp_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
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
      payment_intents: {
        Row: {
          amount_pence: number
          created_at: string
          currency_code: string
          gateway_response: Json | null
          id: string
          instructor_id: string | null
          order_ref: string
          provider: string
          pupil_id: string | null
          status: string
          transaction_unique: string | null
          updated_at: string
        }
        Insert: {
          amount_pence: number
          created_at?: string
          currency_code?: string
          gateway_response?: Json | null
          id?: string
          instructor_id?: string | null
          order_ref: string
          provider?: string
          pupil_id?: string | null
          status?: string
          transaction_unique?: string | null
          updated_at?: string
        }
        Update: {
          amount_pence?: number
          created_at?: string
          currency_code?: string
          gateway_response?: Json | null
          id?: string
          instructor_id?: string | null
          order_ref?: string
          provider?: string
          pupil_id?: string | null
          status?: string
          transaction_unique?: string | null
          updated_at?: string
        }
        Relationships: []
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
      public_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_published: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      pupil_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          coins_awarded: number | null
          description: string | null
          earned_at: string
          icon_name: string | null
          id: string
          pupil_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          coins_awarded?: number | null
          description?: string | null
          earned_at?: string
          icon_name?: string | null
          id?: string
          pupil_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          coins_awarded?: number | null
          description?: string | null
          earned_at?: string
          icon_name?: string | null
          id?: string
          pupil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_achievements_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_assignments: {
        Row: {
          assignment_type: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          feedback: string | null
          id: string
          instructor_id: string
          notes: string | null
          pupil_id: string
          rating: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          pupil_id: string
          rating?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          pupil_id?: string
          rating?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_assignments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_assignments_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_badges: {
        Row: {
          id: string
          pupil_id: string
          tier_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          pupil_id: string
          tier_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          pupil_id?: string
          tier_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_badges_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_badges_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "reward_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_coaching_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          pupil_id: string
          title: string
          trip_reference: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          pupil_id: string
          title: string
          trip_reference?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          pupil_id?: string
          title?: string
          trip_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_coaching_messages_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_coaching_messages_trip_reference_fkey"
            columns: ["trip_reference"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
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
      pupil_otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      pupil_push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          pupil_id: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          pupil_id: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          pupil_id?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_push_subscriptions_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_referrals: {
        Row: {
          bonus_points_awarded: number | null
          completed_at: string | null
          created_at: string
          id: string
          instructor_id: string
          referral_code: string
          referred_pupil_id: string
          referrer_pupil_id: string
          status: string | null
        }
        Insert: {
          bonus_points_awarded?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          referral_code: string
          referred_pupil_id: string
          referrer_pupil_id: string
          status?: string | null
        }
        Update: {
          bonus_points_awarded?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          referral_code?: string
          referred_pupil_id?: string
          referrer_pupil_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_referrals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_referrals_referred_pupil_id_fkey"
            columns: ["referred_pupil_id"]
            isOneToOne: true
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_referrals_referrer_pupil_id_fkey"
            columns: ["referrer_pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_rewards_history: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          lesson_id: string | null
          points_change: number
          pupil_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          lesson_id?: string | null
          points_change: number
          pupil_id: string
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          points_change?: number
          pupil_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_rewards_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_rewards_history_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_rewards_history_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_signatures: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          ip_address: string | null
          parent_name: string | null
          parent_signature_url: string | null
          parent_signed_at: string | null
          pupil_id: string
          requires_parent_signature: boolean | null
          signature_url: string
          signed_at: string
          terms_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          ip_address?: string | null
          parent_name?: string | null
          parent_signature_url?: string | null
          parent_signed_at?: string | null
          pupil_id: string
          requires_parent_signature?: boolean | null
          signature_url: string
          signed_at?: string
          terms_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          ip_address?: string | null
          parent_name?: string | null
          parent_signature_url?: string | null
          parent_signed_at?: string | null
          pupil_id?: string
          requires_parent_signature?: boolean | null
          signature_url?: string
          signed_at?: string
          terms_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_signatures_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_signatures_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_signatures_terms_id_fkey"
            columns: ["terms_id"]
            isOneToOne: false
            referencedRelation: "instructor_terms_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_upsells: {
        Row: {
          amount_paid: number
          created_at: string
          fulfilled_at: string | null
          id: string
          notes: string | null
          pupil_id: string
          purchased_at: string | null
          refund_processed_at: string | null
          refund_requested_at: string | null
          status: string | null
          updated_at: string
          upsell_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          pupil_id: string
          purchased_at?: string | null
          refund_processed_at?: string | null
          refund_requested_at?: string | null
          status?: string | null
          updated_at?: string
          upsell_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          pupil_id?: string
          purchased_at?: string | null
          refund_processed_at?: string | null
          refund_requested_at?: string | null
          status?: string | null
          updated_at?: string
          upsell_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_upsells_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_upsells_upsell_id_fkey"
            columns: ["upsell_id"]
            isOneToOne: false
            referencedRelation: "booking_upsells"
            referencedColumns: ["id"]
          },
        ]
      }
      pupils: {
        Row: {
          account_balance: number | null
          address: string
          balance_due_date: string | null
          best_driving_score: number | null
          course_type: string | null
          created_at: string
          current_streak: number | null
          damoov_device_token: string | null
          date_of_birth: string | null
          deposit_forfeited: boolean | null
          deposit_paid: number | null
          drive_coins: number | null
          email: string | null
          enquiry_id: string | null
          free_lessons_earned: number | null
          free_lessons_used: number | null
          harsh_brake_events_total: number | null
          id: string
          instructor_id: string
          last_trip_at: string | null
          lessons_completed: number | null
          longest_streak: number | null
          monthly_driving_score: number | null
          name: string
          next_lesson: string | null
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          payment_type: string | null
          phone: string | null
          postcode: string
          preferred_days: string[] | null
          preferred_language: string | null
          preferred_times: string[] | null
          prepaid_hours: number | null
          profile_image_url: string | null
          progress: number | null
          referral_code: string | null
          referred_by_pupil_id: string | null
          reward_points: number | null
          scheduling_status: string | null
          speeding_events_total: number | null
          test_attempts: number | null
          test_centre_id: string | null
          test_date: string | null
          test_passed: boolean | null
          test_result_date: string | null
          test_time: string | null
          total_distance_km: number | null
          total_driving_minutes: number | null
          total_lessons_for_rewards: number | null
          total_trips: number | null
          updated_at: string
          weekly_driving_score: number | null
          what3words: string | null
        }
        Insert: {
          account_balance?: number | null
          address: string
          balance_due_date?: string | null
          best_driving_score?: number | null
          course_type?: string | null
          created_at?: string
          current_streak?: number | null
          damoov_device_token?: string | null
          date_of_birth?: string | null
          deposit_forfeited?: boolean | null
          deposit_paid?: number | null
          drive_coins?: number | null
          email?: string | null
          enquiry_id?: string | null
          free_lessons_earned?: number | null
          free_lessons_used?: number | null
          harsh_brake_events_total?: number | null
          id?: string
          instructor_id: string
          last_trip_at?: string | null
          lessons_completed?: number | null
          longest_streak?: number | null
          monthly_driving_score?: number | null
          name: string
          next_lesson?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          payment_type?: string | null
          phone?: string | null
          postcode: string
          preferred_days?: string[] | null
          preferred_language?: string | null
          preferred_times?: string[] | null
          prepaid_hours?: number | null
          profile_image_url?: string | null
          progress?: number | null
          referral_code?: string | null
          referred_by_pupil_id?: string | null
          reward_points?: number | null
          scheduling_status?: string | null
          speeding_events_total?: number | null
          test_attempts?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_passed?: boolean | null
          test_result_date?: string | null
          test_time?: string | null
          total_distance_km?: number | null
          total_driving_minutes?: number | null
          total_lessons_for_rewards?: number | null
          total_trips?: number | null
          updated_at?: string
          weekly_driving_score?: number | null
          what3words?: string | null
        }
        Update: {
          account_balance?: number | null
          address?: string
          balance_due_date?: string | null
          best_driving_score?: number | null
          course_type?: string | null
          created_at?: string
          current_streak?: number | null
          damoov_device_token?: string | null
          date_of_birth?: string | null
          deposit_forfeited?: boolean | null
          deposit_paid?: number | null
          drive_coins?: number | null
          email?: string | null
          enquiry_id?: string | null
          free_lessons_earned?: number | null
          free_lessons_used?: number | null
          harsh_brake_events_total?: number | null
          id?: string
          instructor_id?: string
          last_trip_at?: string | null
          lessons_completed?: number | null
          longest_streak?: number | null
          monthly_driving_score?: number | null
          name?: string
          next_lesson?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          payment_type?: string | null
          phone?: string | null
          postcode?: string
          preferred_days?: string[] | null
          preferred_language?: string | null
          preferred_times?: string[] | null
          prepaid_hours?: number | null
          profile_image_url?: string | null
          progress?: number | null
          referral_code?: string | null
          referred_by_pupil_id?: string | null
          reward_points?: number | null
          scheduling_status?: string | null
          speeding_events_total?: number | null
          test_attempts?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_passed?: boolean | null
          test_result_date?: string | null
          test_time?: string | null
          total_distance_km?: number | null
          total_driving_minutes?: number | null
          total_lessons_for_rewards?: number | null
          total_trips?: number | null
          updated_at?: string
          weekly_driving_score?: number | null
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
            foreignKeyName: "pupils_referred_by_pupil_id_fkey"
            columns: ["referred_by_pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
      recurring_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          frequency: string
          id: string
          instructor_id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          frequency?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          frequency?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_signing_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          instructor_id: string
          pupil_id: string
          sms_sent_at: string | null
          status: string
          terms_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          instructor_id: string
          pupil_id: string
          sms_sent_at?: string | null
          status?: string
          terms_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          instructor_id?: string
          pupil_id?: string
          sms_sent_at?: string | null
          status?: string
          terms_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remote_signing_tokens_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remote_signing_tokens_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remote_signing_tokens_terms_id_fkey"
            columns: ["terms_id"]
            isOneToOne: false
            referencedRelation: "instructor_terms_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_tiers: {
        Row: {
          badge_image_url: string | null
          color: string
          created_at: string
          display_order: number
          icon: string
          id: string
          min_points: number
          name: string
          perks: Json | null
          updated_at: string
        }
        Insert: {
          badge_image_url?: string | null
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          min_points?: number
          name: string
          perks?: Json | null
          updated_at?: string
        }
        Update: {
          badge_image_url?: string | null
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          min_points?: number
          name?: string
          perks?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_route_waypoints: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string | null
          route_id: string
          sequence: number
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name?: string | null
          route_id: string
          sequence: number
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string | null
          route_id?: string
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_route_waypoints_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "saved_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_routes: {
        Row: {
          avg_speed_kmh: number | null
          category: string | null
          created_at: string
          description: string | null
          distance_km: number | null
          duration_minutes: number | null
          end_location: string | null
          id: string
          instructor_id: string
          is_shared: boolean | null
          max_speed_kmh: number | null
          metadata: Json | null
          name: string
          pupil_id: string | null
          route_path: Json | null
          route_type: string
          share_code: string | null
          shared_at: string | null
          start_location: string | null
          telematics_id: string | null
          test_centre_id: string | null
        }
        Insert: {
          avg_speed_kmh?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          end_location?: string | null
          id?: string
          instructor_id: string
          is_shared?: boolean | null
          max_speed_kmh?: number | null
          metadata?: Json | null
          name: string
          pupil_id?: string | null
          route_path?: Json | null
          route_type?: string
          share_code?: string | null
          shared_at?: string | null
          start_location?: string | null
          telematics_id?: string | null
          test_centre_id?: string | null
        }
        Update: {
          avg_speed_kmh?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          end_location?: string | null
          id?: string
          instructor_id?: string
          is_shared?: boolean | null
          max_speed_kmh?: number | null
          metadata?: Json | null
          name?: string
          pupil_id?: string | null
          route_path?: Json | null
          route_type?: string
          share_code?: string | null
          shared_at?: string | null
          start_location?: string | null
          telematics_id?: string | null
          test_centre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_routes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_routes_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_routes_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_routes_test_centre_id_fkey"
            columns: ["test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_lessons: {
        Row: {
          amount_due: number | null
          created_at: string
          dropoff_postcode: string | null
          duration_minutes: number
          google_event_id: string | null
          id: string
          instructor_id: string
          lesson_date: string
          lesson_miles: number | null
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
          vehicle_id: string | null
        }
        Insert: {
          amount_due?: number | null
          created_at?: string
          dropoff_postcode?: string | null
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          instructor_id: string
          lesson_date: string
          lesson_miles?: number | null
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
          vehicle_id?: string | null
        }
        Update: {
          amount_due?: number | null
          created_at?: string
          dropoff_postcode?: string | null
          duration_minutes?: number
          google_event_id?: string | null
          id?: string
          instructor_id?: string
          lesson_date?: string
          lesson_miles?: number | null
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
          vehicle_id?: string | null
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
          {
            foreignKeyName: "scheduled_lessons_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
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
          admin_notification_emails: string[] | null
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
          admin_notification_emails?: string[] | null
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
          admin_notification_emails?: string[] | null
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
      slot_offers: {
        Row: {
          created_at: string | null
          duration_mins: number
          end_time: string
          expires_at: string | null
          id: string
          instructor_approved: boolean | null
          instructor_approved_at: string | null
          instructor_id: string
          lesson_date: string
          original_lesson_id: string | null
          pupil_id: string
          pupil_notified_at: string | null
          pupil_responded_at: string | null
          pupil_response: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          duration_mins: number
          end_time: string
          expires_at?: string | null
          id?: string
          instructor_approved?: boolean | null
          instructor_approved_at?: string | null
          instructor_id: string
          lesson_date: string
          original_lesson_id?: string | null
          pupil_id: string
          pupil_notified_at?: string | null
          pupil_responded_at?: string | null
          pupil_response?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          duration_mins?: number
          end_time?: string
          expires_at?: string | null
          id?: string
          instructor_approved?: boolean | null
          instructor_approved_at?: string | null
          instructor_id?: string
          lesson_date?: string
          original_lesson_id?: string | null
          pupil_id?: string
          pupil_notified_at?: string | null
          pupil_responded_at?: string | null
          pupil_response?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_offers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_offers_original_lesson_id_fkey"
            columns: ["original_lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_offers_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          cta_text: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          gocardless_plan_id: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
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
          cta_text?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          gocardless_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
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
          cta_text?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          gocardless_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
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
      telematics_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          alert_type: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          road_name: string | null
          severity: string | null
          speed_delta: number | null
          speed_kmh: number | null
          speed_limit_kmh: number | null
          telematics_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          severity?: string | null
          speed_delta?: number | null
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
          telematics_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          severity?: string | null
          speed_delta?: number | null
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
          telematics_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telematics_alerts_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
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
          road_name: string | null
          speed_kmh: number | null
          speed_limit_kmh: number | null
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
          road_name?: string | null
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
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
          road_name?: string | null
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
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
      telematics_motion_raw: {
        Row: {
          acceleration_x: number | null
          acceleration_y: number | null
          acceleration_z: number | null
          g_force: number | null
          id: string
          recorded_at: string | null
          rotation_alpha: number | null
          rotation_beta: number | null
          rotation_gamma: number | null
          telematics_id: string
        }
        Insert: {
          acceleration_x?: number | null
          acceleration_y?: number | null
          acceleration_z?: number | null
          g_force?: number | null
          id?: string
          recorded_at?: string | null
          rotation_alpha?: number | null
          rotation_beta?: number | null
          rotation_gamma?: number | null
          telematics_id: string
        }
        Update: {
          acceleration_x?: number | null
          acceleration_y?: number | null
          acceleration_z?: number | null
          g_force?: number | null
          id?: string
          recorded_at?: string | null
          rotation_alpha?: number | null
          rotation_beta?: number | null
          rotation_gamma?: number | null
          telematics_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telematics_motion_raw_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      telematics_realtime_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_acknowledged: boolean | null
          latitude: number | null
          longitude: number | null
          road_name: string | null
          severity: string
          speed_kmh: number | null
          speed_limit_kmh: number | null
          telematics_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          severity?: string
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
          telematics_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          severity?: string
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
          telematics_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telematics_realtime_alerts_telematics_id_fkey"
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
          average_wait_weeks: number | null
          created_at: string
          facilities: Json | null
          google_maps_url: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          opening_hours: string | null
          parking_info: string | null
          pass_rate: number | null
          phone: string | null
          postcode: string | null
          tips: string | null
        }
        Insert: {
          address?: string | null
          average_wait_weeks?: number | null
          created_at?: string
          facilities?: Json | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          opening_hours?: string | null
          parking_info?: string | null
          pass_rate?: number | null
          phone?: string | null
          postcode?: string | null
          tips?: string | null
        }
        Update: {
          address?: string | null
          average_wait_weeks?: number | null
          created_at?: string
          facilities?: Json | null
          google_maps_url?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          opening_hours?: string | null
          parking_info?: string | null
          pass_rate?: number | null
          phone?: string | null
          postcode?: string | null
          tips?: string | null
        }
        Relationships: []
      }
      traccar_devices: {
        Row: {
          created_at: string | null
          current_pupil_id: string | null
          current_session_id: string | null
          device_identifier: string
          device_name: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
          is_test_route_mode: boolean
          last_heading: number | null
          last_latitude: number | null
          last_longitude: number | null
          last_seen_at: string | null
          last_speed_kmh: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_pupil_id?: string | null
          current_session_id?: string | null
          device_identifier: string
          device_name?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          is_test_route_mode?: boolean
          last_heading?: number | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_seen_at?: string | null
          last_speed_kmh?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_pupil_id?: string | null
          current_session_id?: string | null
          device_identifier?: string
          device_name?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          is_test_route_mode?: boolean
          last_heading?: number | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_seen_at?: string | null
          last_speed_kmh?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traccar_devices_current_pupil_id_fkey"
            columns: ["current_pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_devices_current_session_id_fkey"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_devices_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
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
      cleanup_expired_otp_codes: { Args: never; Returns: undefined }
      cleanup_expired_parent_otp_codes: { Args: never; Returns: undefined }
      generate_calendar_share_token: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_live_position: {
        Args: {
          p_accuracy?: number
          p_heading?: number
          p_latitude: number
          p_longitude: number
          p_pupil_id: string
          p_session_id?: string
          p_speed_kmh?: number
          p_trip_status?: string
        }
        Returns: string
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
