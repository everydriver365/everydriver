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
      abandoned_checkouts: {
        Row: {
          booking_data: Json | null
          converted_at: string | null
          created_at: string
          id: string
          instructor_id: string
          pupil_email: string | null
          pupil_name: string | null
          pupil_phone: string | null
          reminder_sent_at: string | null
          resume_token: string | null
        }
        Insert: {
          booking_data?: Json | null
          converted_at?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          pupil_email?: string | null
          pupil_name?: string | null
          pupil_phone?: string | null
          reminder_sent_at?: string | null
          resume_token?: string | null
        }
        Update: {
          booking_data?: Json | null
          converted_at?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          pupil_email?: string | null
          pupil_name?: string | null
          pupil_phone?: string | null
          reminder_sent_at?: string | null
          resume_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_checkouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_checkouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      accessible_forum_replies: {
        Row: {
          author_name: string
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          topic_id: string
        }
        Insert: {
          author_name: string
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          topic_id: string
        }
        Update: {
          author_name?: string
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accessible_forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "accessible_forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      accessible_forum_topics: {
        Row: {
          author_name: string
          author_user_id: string | null
          body: string
          category: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string | null
          reply_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_user_id?: string | null
          body: string
          category?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          reply_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_user_id?: string | null
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          reply_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      accessible_garages: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          motability_approved: boolean
          name: string
          phone: string | null
          postcode: string | null
          services: string[]
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          motability_approved?: boolean
          name: string
          phone?: string | null
          postcode?: string | null
          services?: string[]
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          motability_approved?: boolean
          name?: string
          phone?: string | null
          postcode?: string | null
          services?: string[]
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      accessible_trackers: {
        Row: {
          affiliate_url: string | null
          brand: string
          created_at: string
          description: string | null
          display_order: number
          features: string[]
          fitting_required: boolean
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_monthly: number | null
          price_one_off: number | null
          supports_adaptations: boolean
          updated_at: string
        }
        Insert: {
          affiliate_url?: string | null
          brand: string
          created_at?: string
          description?: string | null
          display_order?: number
          features?: string[]
          fitting_required?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_monthly?: number | null
          price_one_off?: number | null
          supports_adaptations?: boolean
          updated_at?: string
        }
        Update: {
          affiliate_url?: string | null
          brand?: string
          created_at?: string
          description?: string | null
          display_order?: number
          features?: string[]
          fitting_required?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_monthly?: number | null
          price_one_off?: number | null
          supports_adaptations?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      accounting_sync_log: {
        Row: {
          error_message: string | null
          id: string
          instructor_id: string
          period_end: string
          period_start: string
          platform: string
          records_synced: number
          status: string
          sync_type: string
          synced_at: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          instructor_id: string
          period_end: string
          period_start: string
          platform: string
          records_synced?: number
          status?: string
          sync_type: string
          synced_at?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          instructor_id?: string
          period_end?: string
          period_start?: string
          platform?: string
          records_synced?: number
          status?: string
          sync_type?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_sync_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_sync_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          instructor_id: string | null
          is_read: boolean
          message: string
          metadata: Json | null
          subscription_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          is_read?: boolean
          message: string
          metadata?: Json | null
          subscription_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          is_read?: boolean
          message?: string
          metadata?: Json | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_campaigns: {
        Row: {
          audience_filter: Json | null
          audience_type: string
          channel: string
          created_at: string
          id: string
          message: string
          recipient_count: number
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          audience_filter?: Json | null
          audience_type: string
          channel?: string
          created_at?: string
          id?: string
          message: string
          recipient_count?: number
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          audience_filter?: Json | null
          audience_type?: string
          channel?: string
          created_at?: string
          id?: string
          message?: string
          recipient_count?: number
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "admin_conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_events: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          event_date: string
          event_type: string
          id: string
          is_active: boolean
          link_label: string | null
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          event_date: string
          event_type?: string
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          event_date?: string
          event_type?: string
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      ai_booking_requests: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          decided_at: string | null
          duration_minutes: number
          id: string
          instructor_id: string
          notes: string | null
          pupil_id: string | null
          requested_start: string
          resulting_lesson_id: string | null
          source_call_log_id: string | null
          source_channel: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          decided_at?: string | null
          duration_minutes: number
          id?: string
          instructor_id: string
          notes?: string | null
          pupil_id?: string | null
          requested_start: string
          resulting_lesson_id?: string | null
          source_call_log_id?: string | null
          source_channel: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          decided_at?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string
          notes?: string | null
          pupil_id?: string | null
          requested_start?: string
          resulting_lesson_id?: string | null
          source_call_log_id?: string | null
          source_channel?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_booking_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_booking_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_booking_requests_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_booking_requests_resulting_lesson_id_fkey"
            columns: ["resulting_lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_booking_requests_source_call_log_id_fkey"
            columns: ["source_call_log_id"]
            isOneToOne: false
            referencedRelation: "famulor_call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_command_logs: {
        Row: {
          command_text: string
          created_at: string
          id: string
          instructor_id: string
          parsed_intent: string | null
          result: Json | null
        }
        Insert: {
          command_text: string
          created_at?: string
          id?: string
          instructor_id: string
          parsed_intent?: string | null
          result?: Json | null
        }
        Update: {
          command_text?: string
          created_at?: string
          id?: string
          instructor_id?: string
          parsed_intent?: string | null
          result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_command_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_command_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reschedule_requests: {
        Row: {
          auto_approved: boolean
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          decided_at: string | null
          id: string
          instructor_id: string
          lesson_id: string
          notes: string | null
          original_duration_minutes: number
          original_start: string
          pupil_id: string | null
          requested_duration_minutes: number
          requested_start: string
          source_channel: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_approved?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          instructor_id: string
          lesson_id: string
          notes?: string | null
          original_duration_minutes: number
          original_start: string
          pupil_id?: string | null
          requested_duration_minutes: number
          requested_start: string
          source_channel: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_approved?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          instructor_id?: string
          lesson_id?: string
          notes?: string | null
          original_duration_minutes?: number
          original_start?: string
          pupil_id?: string | null
          requested_duration_minutes?: number
          requested_start?: string
          source_channel?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reschedule_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_reschedule_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_reschedule_requests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_reschedule_requests_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
          name: string
          steps: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          name: string
          steps?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflows_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_workflows_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          auto_notify_pupils: boolean
          category: string | null
          created_at: string
          day_of_week: number | null
          description: string | null
          end_date: string | null
          id: string
          instructor_id: string
          is_auto: boolean
          is_available: boolean
          is_recurring: boolean
          notes: string | null
          rule_type: Database["public"]["Enums"]["availability_rule_type"]
          start_date: string | null
          title: string | null
          week_of_month: number | null
        }
        Insert: {
          auto_notify_pupils?: boolean
          category?: string | null
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructor_id: string
          is_auto?: boolean
          is_available?: boolean
          is_recurring?: boolean
          notes?: string | null
          rule_type: Database["public"]["Enums"]["availability_rule_type"]
          start_date?: string | null
          title?: string | null
          week_of_month?: number | null
        }
        Update: {
          auto_notify_pupils?: boolean
          category?: string | null
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          instructor_id?: string
          is_auto?: boolean
          is_available?: boolean
          is_recurring?: boolean
          notes?: string | null
          rule_type?: Database["public"]["Enums"]["availability_rule_type"]
          start_date?: string | null
          title?: string | null
          week_of_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_windows: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string
          is_active: boolean
          label: string | null
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
          label?: string | null
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
          label?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_windows_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_windows_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_drafts: {
        Row: {
          converted_at: string | null
          course_hours: number | null
          course_name: string | null
          created_at: string
          email: string
          follow_up_sent_at: string | null
          form_data: Json | null
          id: string
          instructor_id: string
          name: string | null
          phone: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          course_hours?: number | null
          course_name?: string | null
          created_at?: string
          email: string
          follow_up_sent_at?: string | null
          form_data?: Json | null
          id?: string
          instructor_id: string
          name?: string | null
          phone?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          course_hours?: number | null
          course_name?: string | null
          created_at?: string
          email?: string
          follow_up_sent_at?: string | null
          form_data?: Json | null
          id?: string
          instructor_id?: string
          name?: string | null
          phone?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_drafts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_drafts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_enquiries: {
        Row: {
          contacted_at: string | null
          converted_pupil_id: string | null
          course_hours: number | null
          course_name: string | null
          created_at: string
          id: string
          instructor_id: string
          message: string | null
          pupil_email: string
          pupil_name: string
          pupil_phone: string
          pupil_postcode: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contacted_at?: string | null
          converted_pupil_id?: string | null
          course_hours?: number | null
          course_name?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          message?: string | null
          pupil_email: string
          pupil_name: string
          pupil_phone: string
          pupil_postcode?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contacted_at?: string | null
          converted_pupil_id?: string | null
          course_hours?: number | null
          course_name?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          message?: string | null
          pupil_email?: string
          pupil_name?: string
          pupil_phone?: string
          pupil_postcode?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_enquiries_converted_pupil_id_fkey"
            columns: ["converted_pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_enquiries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_enquiries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_intake_answers: {
        Row: {
          answer_text: string
          created_at: string
          enquiry_id: string | null
          id: string
          pupil_id: string | null
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          enquiry_id?: string | null
          id?: string
          pupil_id?: string | null
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          enquiry_id?: string | null
          id?: string
          pupil_id?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_intake_answers_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "course_enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_intake_answers_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_intake_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "booking_intake_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_intake_questions: {
        Row: {
          created_at: string
          display_order: number
          field_type: string
          id: string
          instructor_id: string
          is_active: boolean
          is_required: boolean
          options: Json | null
          question_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_type?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          question_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          field_type?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_intake_questions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_intake_questions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_pages: {
        Row: {
          brand_colour: string | null
          created_at: string
          description: string | null
          heading: string | null
          id: string
          instructor_id: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          page_type: string
          school_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_colour?: string | null
          created_at?: string
          description?: string | null
          heading?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          page_type?: string
          school_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_colour?: string | null
          created_at?: string
          description?: string | null
          heading?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          page_type?: string
          school_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_pages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_pages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_pages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_pages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
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
      broadcast_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          instructor_id: string | null
          is_system: boolean
          title: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          is_system?: boolean
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          instructor_id?: string | null
          is_system?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "calendar_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      calendar_sync_queue: {
        Row: {
          action: string
          created_at: string
          error: string | null
          id: string
          instructor_id: string
          lesson_id: string
          processed_at: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error?: string | null
          id?: string
          instructor_id: string
          lesson_id: string
          processed_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error?: string | null
          id?: string
          instructor_id?: string
          lesson_id?: string
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_queue_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_queue_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog: {
        Row: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          portal_types: string[]
          title: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          portal_types?: string[]
          title: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          portal_types?: string[]
          title?: string
          version?: string | null
        }
        Relationships: []
      }
      checklist_submissions: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          lesson_id: string | null
          photo_urls: string[] | null
          pupil_id: string | null
          responses: Json
          signature_url: string | null
          status: string
          submitted_at: string
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          lesson_id?: string | null
          photo_urls?: string[] | null
          pupil_id?: string | null
          responses?: Json
          signature_url?: string | null
          status?: string
          submitted_at?: string
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          photo_urls?: string[] | null
          pupil_id?: string | null
          responses?: Json
          signature_url?: string | null
          status?: string
          submitted_at?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submissions_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          checklist_type: string
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
          items: Json
          title: string
          updated_at: string
        }
        Insert: {
          checklist_type?: string
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          items?: Json
          title: string
          updated_at?: string
        }
        Update: {
          checklist_type?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          items?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_events: {
        Row: {
          created_at: string | null
          detected_at: string | null
          event_type: string
          id: string
          instructor_id: string
          pupil_id: string
          re_engaged_at: string | null
          reason: string | null
          risk_score: number | null
        }
        Insert: {
          created_at?: string | null
          detected_at?: string | null
          event_type?: string
          id?: string
          instructor_id: string
          pupil_id: string
          re_engaged_at?: string | null
          reason?: string | null
          risk_score?: number | null
        }
        Update: {
          created_at?: string | null
          detected_at?: string | null
          event_type?: string
          id?: string
          instructor_id?: string
          pupil_id?: string
          re_engaged_at?: string | null
          reason?: string | null
          risk_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "churn_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_events_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      clock_entries: {
        Row: {
          clock_in_at: string
          clock_in_latitude: number | null
          clock_in_longitude: number | null
          clock_out_at: string | null
          clock_out_latitude: number | null
          clock_out_longitude: number | null
          created_at: string
          id: string
          instructor_id: string
          notes: string | null
          total_hours: number | null
        }
        Insert: {
          clock_in_at?: string
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out_at?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string
          id?: string
          instructor_id: string
          notes?: string | null
          total_hours?: number | null
        }
        Update: {
          clock_in_at?: string
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out_at?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clock_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clock_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      community_road_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string | null
          expires_at: string
          id: string
          latitude: number
          longitude: number
          reporter_id: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          latitude: number
          longitude: number
          reporter_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          latitude?: number
          longitude?: number
          reporter_id?: string
        }
        Relationships: []
      }
      comparison_features: {
        Row: {
          category: string
          created_at: string | null
          display_order: number
          feature_name: string
          id: string
          plan_values: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order?: number
          feature_name: string
          id?: string
          plan_values?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number
          feature_name?: string
          id?: string
          plan_values?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      comparison_plans: {
        Row: {
          created_at: string | null
          cta_text: string
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_popular: boolean | null
          name: string
          period: string | null
          price: string
          price_annual: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cta_text: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_popular?: boolean | null
          name: string
          period?: string | null
          price: string
          price_annual?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cta_text?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_popular?: boolean | null
          name?: string
          period?: string | null
          price?: string
          price_annual?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
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
          vehicle_id: string | null
        }
        Insert: {
          days_before: number
          expiry_date: string
          id?: string
          instructor_id: string
          reminder_type: string
          sent_at?: string
          sent_via: string
          vehicle_id?: string | null
        }
        Update: {
          days_before?: number
          expiry_date?: string
          id?: string
          instructor_id?: string
          reminder_type?: string
          sent_at?: string
          sent_via?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reminders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_reminders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_reminders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
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
          muted_at: string | null
          pupil_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructor_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          muted_at?: string | null
          pupil_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instructor_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          muted_at?: string | null
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
            foreignKeyName: "conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          email: string | null
          id: string
          name: string
          phone: string | null
          postcode: string
          preferred_timing: string
          requested_hours: number | null
          status: string
          total_cost: number | null
          transmission_type: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          address: string
          assigned_instructor_id?: string | null
          course_type: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postcode: string
          preferred_timing: string
          requested_hours?: number | null
          status?: string
          total_cost?: number | null
          transmission_type?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          address?: string
          assigned_instructor_id?: string | null
          course_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postcode?: string
          preferred_timing?: string
          requested_hours?: number | null
          status?: string
          total_cost?: number | null
          transmission_type?: string | null
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
          {
            foreignKeyName: "course_enquiries_assigned_instructor_id_fkey"
            columns: ["assigned_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      course_proposals: {
        Row: {
          created_at: string
          feasible: boolean
          generated_slots: Json
          hours_remaining: number
          id: string
          instructor_id: string | null
          lead_email: string | null
          lead_name: string | null
          lead_phone: string | null
          lead_postcode: string | null
          lesson_length_minutes: number
          lessons_per_week: number
          notes: string | null
          pattern_summary: Json | null
          pupil_id: string | null
          shortfall_hours: number | null
          source: string
          status: string
          test_centre_name: string | null
          test_date: string | null
          test_time: string | null
          updated_at: string
          weekly_availability: Json
        }
        Insert: {
          created_at?: string
          feasible?: boolean
          generated_slots?: Json
          hours_remaining?: number
          id?: string
          instructor_id?: string | null
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_postcode?: string | null
          lesson_length_minutes?: number
          lessons_per_week?: number
          notes?: string | null
          pattern_summary?: Json | null
          pupil_id?: string | null
          shortfall_hours?: number | null
          source?: string
          status?: string
          test_centre_name?: string | null
          test_date?: string | null
          test_time?: string | null
          updated_at?: string
          weekly_availability?: Json
        }
        Update: {
          created_at?: string
          feasible?: boolean
          generated_slots?: Json
          hours_remaining?: number
          id?: string
          instructor_id?: string | null
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_postcode?: string | null
          lesson_length_minutes?: number
          lessons_per_week?: number
          notes?: string | null
          pattern_summary?: Json | null
          pupil_id?: string | null
          shortfall_hours?: number | null
          source?: string
          status?: string
          test_centre_name?: string | null
          test_date?: string | null
          test_time?: string | null
          updated_at?: string
          weekly_availability?: Json
        }
        Relationships: [
          {
            foreignKeyName: "course_proposals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_proposals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_proposals_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
          moderation_note: string | null
          moderation_status: string
          rating: number
          review_date: string | null
          review_text: string
          reviewer_email: string | null
          reviewer_name: string
        }
        Insert: {
          course_hours: number
          created_at?: string
          id?: string
          instructor_id: string
          is_verified?: boolean | null
          is_visible?: boolean | null
          moderation_note?: string | null
          moderation_status?: string
          rating: number
          review_date?: string | null
          review_text: string
          reviewer_email?: string | null
          reviewer_name: string
        }
        Update: {
          course_hours?: number
          created_at?: string
          id?: string
          instructor_id?: string
          is_verified?: boolean | null
          is_visible?: boolean | null
          moderation_note?: string | null
          moderation_status?: string
          rating?: number
          review_date?: string | null
          review_text?: string
          reviewer_email?: string | null
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
          {
            foreignKeyName: "course_reviews_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      cover_offer_recipients: {
        Row: {
          cover_offer_id: string
          created_at: string
          declined_at: string | null
          distance_miles: number | null
          id: string
          instructor_id: string
          notified_at: string | null
          viewed_at: string | null
        }
        Insert: {
          cover_offer_id: string
          created_at?: string
          declined_at?: string | null
          distance_miles?: number | null
          id?: string
          instructor_id: string
          notified_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          cover_offer_id?: string
          created_at?: string
          declined_at?: string | null
          distance_miles?: number | null
          id?: string
          instructor_id?: string
          notified_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cover_offer_recipients_cover_offer_id_fkey"
            columns: ["cover_offer_id"]
            isOneToOne: false
            referencedRelation: "cover_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_offer_recipients_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_offer_recipients_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_offers: {
        Row: {
          claimed_at: string | null
          claimed_by_instructor_id: string | null
          created_at: string
          expires_at: string
          finders_fee_pct: number
          id: string
          lesson_duration_minutes: number
          lesson_id: string
          lesson_price: number | null
          lesson_start: string
          notes: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_postcode: string | null
          pupil_id: string
          requesting_instructor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_instructor_id?: string | null
          created_at?: string
          expires_at?: string
          finders_fee_pct?: number
          id?: string
          lesson_duration_minutes: number
          lesson_id: string
          lesson_price?: number | null
          lesson_start: string
          notes?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_postcode?: string | null
          pupil_id: string
          requesting_instructor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by_instructor_id?: string | null
          created_at?: string
          expires_at?: string
          finders_fee_pct?: number
          id?: string
          lesson_duration_minutes?: number
          lesson_id?: string
          lesson_price?: number | null
          lesson_start?: string
          notes?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_postcode?: string | null
          pupil_id?: string
          requesting_instructor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_offers_claimed_by_instructor_id_fkey"
            columns: ["claimed_by_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_offers_claimed_by_instructor_id_fkey"
            columns: ["claimed_by_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_offers_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_offers_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_offers_requesting_instructor_id_fkey"
            columns: ["requesting_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_offers_requesting_instructor_id_fkey"
            columns: ["requesting_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_settlements: {
        Row: {
          amount: number
          cover_offer_id: string
          created_at: string
          id: string
          notes: string | null
          payee_instructor_id: string
          payer_instructor_id: string
          settled_at: string | null
          status: string
        }
        Insert: {
          amount: number
          cover_offer_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payee_instructor_id: string
          payer_instructor_id: string
          settled_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          cover_offer_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payee_instructor_id?: string
          payer_instructor_id?: string
          settled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_settlements_cover_offer_id_fkey"
            columns: ["cover_offer_id"]
            isOneToOne: false
            referencedRelation: "cover_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_settlements_payee_instructor_id_fkey"
            columns: ["payee_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_settlements_payee_instructor_id_fkey"
            columns: ["payee_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_settlements_payer_instructor_id_fkey"
            columns: ["payer_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_settlements_payer_instructor_id_fkey"
            columns: ["payer_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "cpd_log_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_sync_config: {
        Row: {
          created_at: string
          id: string
          interval_seconds: number
          is_enabled: boolean
          last_error: string | null
          last_run_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          interval_seconds?: number
          is_enabled?: boolean
          last_error?: string | null
          last_run_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_seconds?: number
          is_enabled?: boolean
          last_error?: string | null
          last_run_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_domain_admin_queue: {
        Row: {
          admin_notes: string | null
          created_at: string
          dns_verified_at: string
          domain: string
          id: string
          instructor_id: string
          ssl_added_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          dns_verified_at?: string
          domain: string
          id?: string
          instructor_id: string
          ssl_added_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          dns_verified_at?: string
          domain?: string
          id?: string
          instructor_id?: string
          ssl_added_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_domain_admin_queue_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domain_admin_queue_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domain_audit_log: {
        Row: {
          actor_role: string
          actor_user_id: string | null
          created_at: string
          domain: string
          event: string
          id: string
          instructor_id: string | null
          metadata: Json
          notes: string | null
        }
        Insert: {
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          domain: string
          event: string
          id?: string
          instructor_id?: string | null
          metadata?: Json
          notes?: string | null
        }
        Update: {
          actor_role?: string
          actor_user_id?: string | null
          created_at?: string
          domain?: string
          event?: string
          id?: string
          instructor_id?: string | null
          metadata?: Json
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domain_audit_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domain_audit_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      dashcam_media: {
        Row: {
          camera_angle: string | null
          created_at: string
          device_id: string | null
          driver_id: string | null
          driver_name: string | null
          duration_seconds: number | null
          event_tags: string[] | null
          file_name: string | null
          file_size_bytes: number | null
          g_force: number | null
          geotab_media_file_id: string
          id: string
          instructor_id: string
          is_incident: boolean
          latitude: number | null
          lesson_telematics_id: string | null
          longitude: number | null
          media_type: string
          processing_status: string | null
          recorded_at: string
          resolution: string | null
          road_name: string | null
          speed_at_event_kmh: number | null
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          camera_angle?: string | null
          created_at?: string
          device_id?: string | null
          driver_id?: string | null
          driver_name?: string | null
          duration_seconds?: number | null
          event_tags?: string[] | null
          file_name?: string | null
          file_size_bytes?: number | null
          g_force?: number | null
          geotab_media_file_id: string
          id?: string
          instructor_id: string
          is_incident?: boolean
          latitude?: number | null
          lesson_telematics_id?: string | null
          longitude?: number | null
          media_type?: string
          processing_status?: string | null
          recorded_at?: string
          resolution?: string | null
          road_name?: string | null
          speed_at_event_kmh?: number | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          camera_angle?: string | null
          created_at?: string
          device_id?: string | null
          driver_id?: string | null
          driver_name?: string | null
          duration_seconds?: number | null
          event_tags?: string[] | null
          file_name?: string | null
          file_size_bytes?: number | null
          g_force?: number | null
          geotab_media_file_id?: string
          id?: string
          instructor_id?: string
          is_incident?: boolean
          latitude?: number | null
          lesson_telematics_id?: string | null
          longitude?: number | null
          media_type?: string
          processing_status?: string | null
          recorded_at?: string
          resolution?: string | null
          road_name?: string | null
          speed_at_event_kmh?: number | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashcam_media_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashcam_media_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashcam_media_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashcam_media_lesson_telematics_id_fkey"
            columns: ["lesson_telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      data_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          instructor_id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          instructor_id: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          instructor_id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
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
      digital_waivers: {
        Row: {
          content_html: string
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
          is_required: boolean
          title: string
          updated_at: string
          waiver_type: string
        }
        Insert: {
          content_html?: string
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          is_required?: boolean
          title: string
          updated_at?: string
          waiver_type?: string
        }
        Update: {
          content_html?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          is_required?: boolean
          title?: string
          updated_at?: string
          waiver_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_waivers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_waivers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
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
          school_id: string | null
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
          school_id?: string | null
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
          school_id?: string | null
          times_used?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      document_read_receipts: {
        Row: {
          document_id: string
          id: string
          read_at: string
          reader_instructor_id: string
        }
        Insert: {
          document_id: string
          id?: string
          read_at?: string
          reader_instructor_id: string
        }
        Update: {
          document_id?: string
          id?: string
          read_at?: string
          reader_instructor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_read_receipts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_read_receipts_reader_instructor_id_fkey"
            columns: ["reader_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_read_receipts_reader_instructor_id_fkey"
            columns: ["reader_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      document_vault: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          instructor_id: string
          is_shared: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          instructor_id: string
          is_shared?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          instructor_id?: string
          is_shared?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_vault_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_vault_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "domain_orders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      doodlepads: {
        Row: {
          annotations: Json
          center_lat: number
          center_lng: number
          created_at: string
          id: string
          instructor_id: string
          name: string
          updated_at: string
          zoom_level: number
        }
        Insert: {
          annotations?: Json
          center_lat?: number
          center_lng?: number
          created_at?: string
          id?: string
          instructor_id: string
          name?: string
          updated_at?: string
          zoom_level?: number
        }
        Update: {
          annotations?: Json
          center_lat?: number
          center_lng?: number
          created_at?: string
          id?: string
          instructor_id?: string
          name?: string
          updated_at?: string
          zoom_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "doodlepads_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doodlepads_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_timesheets: {
        Row: {
          created_at: string
          first_trip_start: string | null
          id: string
          instructor_id: string
          last_trip_end: string | null
          quartix_vehicle_id: string | null
          sheet_date: string
          total_distance_km: number | null
          total_driving_minutes: number | null
          total_idle_minutes: number | null
          trip_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_trip_start?: string | null
          id?: string
          instructor_id: string
          last_trip_end?: string | null
          quartix_vehicle_id?: string | null
          sheet_date: string
          total_distance_km?: number | null
          total_driving_minutes?: number | null
          total_idle_minutes?: number | null
          trip_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_trip_start?: string | null
          id?: string
          instructor_id?: string
          last_trip_end?: string | null
          quartix_vehicle_id?: string | null
          sheet_date?: string
          total_distance_km?: number | null
          total_driving_minutes?: number | null
          total_idle_minutes?: number | null
          trip_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_timesheets_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_timesheets_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          test_centre_name: string | null
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
          test_centre_name?: string | null
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
          test_centre_name?: string | null
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
            foreignKeyName: "driving_test_results_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
            foreignKeyName: "examiners_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      expense_receipts: {
        Row: {
          created_at: string
          expense_id: string | null
          extracted_amount: number | null
          extracted_category: string | null
          extracted_date: string | null
          extracted_vendor: string | null
          extraction_status: string | null
          id: string
          image_url: string
          instructor_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expense_id?: string | null
          extracted_amount?: number | null
          extracted_category?: string | null
          extracted_date?: string | null
          extracted_vendor?: string | null
          extraction_status?: string | null
          id?: string
          image_url: string
          instructor_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expense_id?: string | null
          extracted_amount?: number | null
          extracted_category?: string | null
          extracted_date?: string | null
          extracted_vendor?: string | null
          extraction_status?: string | null
          id?: string
          image_url?: string
          instructor_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_receipts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "instructor_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_receipts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_receipts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      expo_push_tokens: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          instructor_id: string
          platform: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          instructor_id: string
          platform?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          instructor_id?: string
          platform?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expo_push_tokens_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expo_push_tokens_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      famulor_call_logs: {
        Row: {
          agent_name: string | null
          channel: string
          cost_pence: number | null
          created_at: string
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          famulor_call_id: string | null
          from_number: string | null
          id: string
          instructor_id: string
          lead_id: string | null
          metadata: Json | null
          outcome: string | null
          phone_number: string | null
          pupil_id: string | null
          purpose: string
          recording_url: string | null
          started_at: string | null
          status: string
          summary: string | null
          to_number: string | null
          transcript: Json | null
        }
        Insert: {
          agent_name?: string | null
          channel?: string
          cost_pence?: number | null
          created_at?: string
          direction: string
          duration_seconds?: number | null
          ended_at?: string | null
          famulor_call_id?: string | null
          from_number?: string | null
          id?: string
          instructor_id: string
          lead_id?: string | null
          metadata?: Json | null
          outcome?: string | null
          phone_number?: string | null
          pupil_id?: string | null
          purpose: string
          recording_url?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          to_number?: string | null
          transcript?: Json | null
        }
        Update: {
          agent_name?: string | null
          channel?: string
          cost_pence?: number | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          famulor_call_id?: string | null
          from_number?: string | null
          id?: string
          instructor_id?: string
          lead_id?: string | null
          metadata?: Json | null
          outcome?: string | null
          phone_number?: string | null
          pupil_id?: string | null
          purpose?: string
          recording_url?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          to_number?: string | null
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "famulor_call_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famulor_call_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famulor_call_logs_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      famulor_settings: {
        Row: {
          auto_book_enabled: boolean
          auto_confirm_bookings: boolean
          auto_fallback_channel: string
          auto_fallback_enabled: boolean
          business_hours_only: boolean
          created_at: string
          daily_call_cap: number
          dormant_days_threshold: number
          dormant_winback_enabled: boolean
          draft_followup_enabled: boolean
          enabled: boolean
          fallback_template: string | null
          id: string
          inbound_agent_id: string | null
          inbound_answering_enabled: boolean
          inbound_phone_number: string | null
          instructor_id: string
          last_verified_at: string | null
          last_verified_message: string | null
          last_verified_status: string | null
          outbound_agent_id: string | null
          per_channel_status: Json
          phone_inbound_enabled: boolean
          phone_outbound_enabled: boolean
          reminder_hours_before: number
          reminders_enabled: boolean
          updated_at: string
          voice_id: string | null
          webchat_agent_id: string | null
          webchat_enabled: boolean
          webchat_widget_token: string | null
          whatsapp_agent_id: string | null
          whatsapp_enabled: boolean
        }
        Insert: {
          auto_book_enabled?: boolean
          auto_confirm_bookings?: boolean
          auto_fallback_channel?: string
          auto_fallback_enabled?: boolean
          business_hours_only?: boolean
          created_at?: string
          daily_call_cap?: number
          dormant_days_threshold?: number
          dormant_winback_enabled?: boolean
          draft_followup_enabled?: boolean
          enabled?: boolean
          fallback_template?: string | null
          id?: string
          inbound_agent_id?: string | null
          inbound_answering_enabled?: boolean
          inbound_phone_number?: string | null
          instructor_id: string
          last_verified_at?: string | null
          last_verified_message?: string | null
          last_verified_status?: string | null
          outbound_agent_id?: string | null
          per_channel_status?: Json
          phone_inbound_enabled?: boolean
          phone_outbound_enabled?: boolean
          reminder_hours_before?: number
          reminders_enabled?: boolean
          updated_at?: string
          voice_id?: string | null
          webchat_agent_id?: string | null
          webchat_enabled?: boolean
          webchat_widget_token?: string | null
          whatsapp_agent_id?: string | null
          whatsapp_enabled?: boolean
        }
        Update: {
          auto_book_enabled?: boolean
          auto_confirm_bookings?: boolean
          auto_fallback_channel?: string
          auto_fallback_enabled?: boolean
          business_hours_only?: boolean
          created_at?: string
          daily_call_cap?: number
          dormant_days_threshold?: number
          dormant_winback_enabled?: boolean
          draft_followup_enabled?: boolean
          enabled?: boolean
          fallback_template?: string | null
          id?: string
          inbound_agent_id?: string | null
          inbound_answering_enabled?: boolean
          inbound_phone_number?: string | null
          instructor_id?: string
          last_verified_at?: string | null
          last_verified_message?: string | null
          last_verified_status?: string | null
          outbound_agent_id?: string | null
          per_channel_status?: Json
          phone_inbound_enabled?: boolean
          phone_outbound_enabled?: boolean
          reminder_hours_before?: number
          reminders_enabled?: boolean
          updated_at?: string
          voice_id?: string | null
          webchat_agent_id?: string | null
          webchat_enabled?: boolean
          webchat_widget_token?: string | null
          whatsapp_agent_id?: string | null
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "famulor_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famulor_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
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
          pupil_id: string | null
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
          pupil_id?: string | null
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
          pupil_id?: string | null
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
          {
            foreignKeyName: "favourite_locations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favourite_locations_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_plan_assignments: {
        Row: {
          created_at: string
          feature_id: string
          id: string
          plan_slug: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          id?: string
          plan_slug: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          id?: string
          plan_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_plan_assignments_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_showcase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_showcase_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          icon_name: string | null
          id: string
          is_visible: boolean
          plan_tier: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_visible?: boolean
          plan_tier?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon_name?: string | null
          id?: string
          is_visible?: boolean
          plan_tier?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_suggestion_votes: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          suggestion_id: string
          vote: number
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          suggestion_id: string
          vote: number
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          suggestion_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_suggestion_votes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_suggestion_votes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "feature_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_suggestions: {
        Row: {
          created_at: string
          description: string
          downvotes: number
          id: string
          instructor_id: string
          status: string
          title: string
          upvotes: number
        }
        Insert: {
          created_at?: string
          description?: string
          downvotes?: number
          id?: string
          instructor_id: string
          status?: string
          title: string
          upvotes?: number
        }
        Update: {
          created_at?: string
          description?: string
          downvotes?: number
          id?: string
          instructor_id?: string
          status?: string
          title?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_suggestions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_suggestions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_log: {
        Row: {
          booked_lesson_at: string | null
          channel: string
          clicked_at: string | null
          delivered_at: string | null
          error: string | null
          id: string
          instructor_id: string
          message_content: string | null
          opened_at: string | null
          pupil_id: string
          sent_at: string
          template_id: string | null
          trigger_type: string
          unsubscribed_at: string | null
        }
        Insert: {
          booked_lesson_at?: string | null
          channel: string
          clicked_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          instructor_id: string
          message_content?: string | null
          opened_at?: string | null
          pupil_id: string
          sent_at?: string
          template_id?: string | null
          trigger_type: string
          unsubscribed_at?: string | null
        }
        Update: {
          booked_lesson_at?: string | null
          channel?: string
          clicked_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          instructor_id?: string
          message_content?: string | null
          opened_at?: string | null
          pupil_id?: string
          sent_at?: string
          template_id?: string | null
          trigger_type?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_log_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "followup_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_templates: {
        Row: {
          created_at: string
          delay_hours: number
          email_subject: string | null
          email_template: string | null
          id: string
          instructor_id: string
          is_enabled: boolean | null
          send_email: boolean | null
          send_sms: boolean | null
          sms_template: string | null
          trigger_name: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_hours?: number
          email_subject?: string | null
          email_template?: string | null
          id?: string
          instructor_id: string
          is_enabled?: boolean | null
          send_email?: boolean | null
          send_sms?: boolean | null
          sms_template?: string | null
          trigger_name: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_hours?: number
          email_subject?: string | null
          email_template?: string | null
          id?: string
          instructor_id?: string
          is_enabled?: boolean | null
          send_email?: boolean | null
          send_sms?: boolean | null
          sms_template?: string | null
          trigger_name?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_enquiries: {
        Row: {
          created_at: string | null
          current_situation: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          preferred_tier: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_situation?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          preferred_tier?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_situation?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          preferred_tier?: string | null
          status?: string | null
        }
        Relationships: []
      }
      fuel_log: {
        Row: {
          calculated_mpg: number | null
          created_at: string
          fill_date: string
          id: string
          instructor_id: string
          is_full_tank: boolean | null
          litres: number
          notes: string | null
          odometer_reading_km: number | null
          price_per_litre: number
          receipt_url: string | null
          station_address: string | null
          station_name: string | null
          total_cost: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          calculated_mpg?: number | null
          created_at?: string
          fill_date?: string
          id?: string
          instructor_id: string
          is_full_tank?: boolean | null
          litres: number
          notes?: string | null
          odometer_reading_km?: number | null
          price_per_litre: number
          receipt_url?: string | null
          station_address?: string | null
          station_name?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          calculated_mpg?: number | null
          created_at?: string
          fill_date?: string
          id?: string
          instructor_id?: string
          is_full_tank?: boolean | null
          litres?: number
          notes?: string | null
          odometer_reading_km?: number | null
          price_per_litre?: number
          receipt_url?: string | null
          station_address?: string | null
          station_name?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          event_data: Json | null
          event_name: string
          id: string
          instructor_id: string | null
          occurred_at: string
        }
        Insert: {
          event_data?: Json | null
          event_name: string
          id?: string
          instructor_id?: string | null
          occurred_at?: string
        }
        Update: {
          event_data?: Json | null
          event_name?: string
          id?: string
          instructor_id?: string | null
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_offers: {
        Row: {
          batch_id: string | null
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
          slot_number: number | null
          slot_start_time: string
          status: string
          twilio_message_sid: string | null
        }
        Insert: {
          batch_id?: string | null
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
          slot_number?: number | null
          slot_start_time: string
          status?: string
          twilio_message_sid?: string | null
        }
        Update: {
          batch_id?: string | null
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
          slot_number?: number | null
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
            foreignKeyName: "gap_offers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      geofence_alerts: {
        Row: {
          alert_type: string
          created_at: string
          device_id: string
          geofence_id: string
          id: string
          instructor_id: string
          is_read: boolean
          latitude: number | null
          longitude: number | null
          triggered_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          device_id: string
          geofence_id: string
          id?: string
          instructor_id: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          triggered_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          device_id?: string
          geofence_id?: string
          id?: string
          instructor_id?: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_alerts_geofence_id_fkey"
            columns: ["geofence_id"]
            isOneToOne: false
            referencedRelation: "geofences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofence_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          active_hours_end: string | null
          active_hours_start: string | null
          alert_on_enter: boolean
          alert_on_exit: boolean
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_m: number
          updated_at: string
        }
        Insert: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_m?: number
          updated_at?: string
        }
        Update: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_m?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofences_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      geotab_driver_events: {
        Row: {
          created_at: string
          device_id: string | null
          duration_seconds: number | null
          ended_at: string | null
          event_type: string
          geotab_event_id: string | null
          id: string
          instructor_id: string
          latitude: number | null
          longitude: number | null
          rule_name: string | null
          severity: string
          speed_kmh: number | null
          started_at: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          event_type: string
          geotab_event_id?: string | null
          id?: string
          instructor_id: string
          latitude?: number | null
          longitude?: number | null
          rule_name?: string | null
          severity?: string
          speed_kmh?: number | null
          started_at?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          event_type?: string
          geotab_event_id?: string | null
          id?: string
          instructor_id?: string
          latitude?: number | null
          longitude?: number | null
          rule_name?: string | null
          severity?: string
          speed_kmh?: number | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geotab_driver_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_driver_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_driver_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      geotab_fault_codes: {
        Row: {
          created_at: string | null
          description: string | null
          detected_at: string
          device_id: string | null
          fault_code: string
          id: string
          instructor_id: string | null
          is_active: boolean | null
          resolved_at: string | null
          severity: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          detected_at: string
          device_id?: string | null
          fault_code: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          detected_at?: string
          device_id?: string | null
          fault_code?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geotab_fault_codes_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_fault_codes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_fault_codes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      geotab_fuel_usage: {
        Row: {
          cost_gbp: number | null
          created_at: string
          device_id: string | null
          distance_km: number | null
          fuel_used_litres: number | null
          id: string
          instructor_id: string
          litres_per_100km: number | null
          trip_end: string | null
          trip_start: string | null
        }
        Insert: {
          cost_gbp?: number | null
          created_at?: string
          device_id?: string | null
          distance_km?: number | null
          fuel_used_litres?: number | null
          id?: string
          instructor_id: string
          litres_per_100km?: number | null
          trip_end?: string | null
          trip_start?: string | null
        }
        Update: {
          cost_gbp?: number | null
          created_at?: string
          device_id?: string | null
          distance_km?: number | null
          fuel_used_litres?: number | null
          id?: string
          instructor_id?: string
          litres_per_100km?: number | null
          trip_end?: string | null
          trip_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geotab_fuel_usage_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_fuel_usage_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_fuel_usage_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      geotab_impact_events: {
        Row: {
          acknowledged: boolean
          created_at: string
          device_id: string | null
          event_time: string
          g_force: number | null
          geotab_event_id: string | null
          id: string
          instructor_id: string
          latitude: number | null
          longitude: number | null
          severity: string
          speed_kmh: number | null
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          device_id?: string | null
          event_time?: string
          g_force?: number | null
          geotab_event_id?: string | null
          id?: string
          instructor_id: string
          latitude?: number | null
          longitude?: number | null
          severity?: string
          speed_kmh?: number | null
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          device_id?: string | null
          event_time?: string
          g_force?: number | null
          geotab_event_id?: string | null
          id?: string
          instructor_id?: string
          latitude?: number | null
          longitude?: number | null
          severity?: string
          speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geotab_impact_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_impact_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geotab_impact_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      geotab_session_cache: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          server_url: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          server_url: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          server_url?: string
          session_id?: string
        }
        Relationships: []
      }
      gps_battery_history: {
        Row: {
          battery_percent: number
          device_id: string
          id: string
          instructor_id: string
          recorded_at: string
        }
        Insert: {
          battery_percent: number
          device_id: string
          id?: string
          instructor_id: string
          recorded_at?: string
        }
        Update: {
          battery_percent?: number
          device_id?: string
          id?: string
          instructor_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "traccar_battery_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_battery_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_battery_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_devices: {
        Row: {
          created_at: string | null
          current_pupil_id: string | null
          current_session_id: string | null
          daily_start_date: string | null
          daily_start_ecu_odometer_km: number | null
          daily_start_odometer_m: number | null
          device_identifier: string
          device_name: string | null
          geotab_device_id: string | null
          gpsgate_engine_hours_s: number | null
          gpsgate_odometer_m: number | null
          gpsgate_user_id: number | null
          id: string
          instructor_id: string
          is_active: boolean | null
          is_test_route_mode: boolean
          last_battery_percent: number | null
          last_battery_voltage: number | null
          last_coolant_temp_c: number | null
          last_dashcam_active: boolean | null
          last_diagnostics_at: string | null
          last_ecu_odometer_km: number | null
          last_engine_hours: number | null
          last_fault_codes: Json | null
          last_fuel_percent: number | null
          last_gpsgate_odometer_m: number | null
          last_gpsgate_track_time: string | null
          last_heading: number | null
          last_heartbeat_at: string | null
          last_ignition_status: boolean | null
          last_is_speeding: boolean | null
          last_latitude: number | null
          last_longitude: number | null
          last_panic_pressed: boolean | null
          last_road_name: string | null
          last_seen_at: string | null
          last_speed_kmh: number | null
          last_speed_limit_kmh: number | null
          last_tire_pressure_json: Json | null
          last_traccar_fix_time: string | null
          last_traccar_position_id: number | null
          quartix_driver_id: string | null
          quartix_vehicle_id: string | null
          session_start_ecu_odometer_km: number | null
          tracking_provider: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_pupil_id?: string | null
          current_session_id?: string | null
          daily_start_date?: string | null
          daily_start_ecu_odometer_km?: number | null
          daily_start_odometer_m?: number | null
          device_identifier: string
          device_name?: string | null
          geotab_device_id?: string | null
          gpsgate_engine_hours_s?: number | null
          gpsgate_odometer_m?: number | null
          gpsgate_user_id?: number | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          is_test_route_mode?: boolean
          last_battery_percent?: number | null
          last_battery_voltage?: number | null
          last_coolant_temp_c?: number | null
          last_dashcam_active?: boolean | null
          last_diagnostics_at?: string | null
          last_ecu_odometer_km?: number | null
          last_engine_hours?: number | null
          last_fault_codes?: Json | null
          last_fuel_percent?: number | null
          last_gpsgate_odometer_m?: number | null
          last_gpsgate_track_time?: string | null
          last_heading?: number | null
          last_heartbeat_at?: string | null
          last_ignition_status?: boolean | null
          last_is_speeding?: boolean | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_panic_pressed?: boolean | null
          last_road_name?: string | null
          last_seen_at?: string | null
          last_speed_kmh?: number | null
          last_speed_limit_kmh?: number | null
          last_tire_pressure_json?: Json | null
          last_traccar_fix_time?: string | null
          last_traccar_position_id?: number | null
          quartix_driver_id?: string | null
          quartix_vehicle_id?: string | null
          session_start_ecu_odometer_km?: number | null
          tracking_provider?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_pupil_id?: string | null
          current_session_id?: string | null
          daily_start_date?: string | null
          daily_start_ecu_odometer_km?: number | null
          daily_start_odometer_m?: number | null
          device_identifier?: string
          device_name?: string | null
          geotab_device_id?: string | null
          gpsgate_engine_hours_s?: number | null
          gpsgate_odometer_m?: number | null
          gpsgate_user_id?: number | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          is_test_route_mode?: boolean
          last_battery_percent?: number | null
          last_battery_voltage?: number | null
          last_coolant_temp_c?: number | null
          last_dashcam_active?: boolean | null
          last_diagnostics_at?: string | null
          last_ecu_odometer_km?: number | null
          last_engine_hours?: number | null
          last_fault_codes?: Json | null
          last_fuel_percent?: number | null
          last_gpsgate_odometer_m?: number | null
          last_gpsgate_track_time?: string | null
          last_heading?: number | null
          last_heartbeat_at?: string | null
          last_ignition_status?: boolean | null
          last_is_speeding?: boolean | null
          last_latitude?: number | null
          last_longitude?: number | null
          last_panic_pressed?: boolean | null
          last_road_name?: string | null
          last_seen_at?: string | null
          last_speed_kmh?: number | null
          last_speed_limit_kmh?: number | null
          last_tire_pressure_json?: Json | null
          last_traccar_fix_time?: string | null
          last_traccar_position_id?: number | null
          quartix_driver_id?: string | null
          quartix_vehicle_id?: string | null
          session_start_ecu_odometer_km?: number | null
          tracking_provider?: string
          updated_at?: string | null
          vehicle_id?: string | null
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
          {
            foreignKeyName: "traccar_devices_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_devices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_ignition_events: {
        Row: {
          device_id: string
          event_type: string
          id: string
          instructor_id: string
          latitude: number | null
          longitude: number | null
          recorded_at: string
          road_name: string | null
          vehicle_id: string | null
        }
        Insert: {
          device_id: string
          event_type: string
          id?: string
          instructor_id: string
          latitude?: number | null
          longitude?: number | null
          recorded_at?: string
          road_name?: string | null
          vehicle_id?: string | null
        }
        Update: {
          device_id?: string
          event_type?: string
          id?: string
          instructor_id?: string
          latitude?: number | null
          longitude?: number | null
          recorded_at?: string
          road_name?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traccar_ignition_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_ignition_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_ignition_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traccar_ignition_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_tips: {
        Row: {
          category: string
          content: string
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "hosting_orders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      instructor_accounting_connections: {
        Row: {
          access_token: string
          company_name: string | null
          connected_at: string
          id: string
          instructor_id: string
          platform: string
          refresh_token: string | null
          tenant_id: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          company_name?: string | null
          connected_at?: string
          id?: string
          instructor_id: string
          platform: string
          refresh_token?: string | null
          tenant_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          company_name?: string | null
          connected_at?: string
          id?: string
          instructor_id?: string
          platform?: string
          refresh_token?: string | null
          tenant_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_accounting_connections_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_accounting_connections_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_addons: {
        Row: {
          addon_type: string
          cancelled_at: string | null
          created_at: string | null
          gocardless_subscription_id: string | null
          id: string
          instructor_id: string
          price_monthly: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addon_type: string
          cancelled_at?: string | null
          created_at?: string | null
          gocardless_subscription_id?: string | null
          id?: string
          instructor_id: string
          price_monthly?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addon_type?: string
          cancelled_at?: string | null
          created_at?: string | null
          gocardless_subscription_id?: string | null
          id?: string
          instructor_id?: string
          price_monthly?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_addons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_addons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_app_features: {
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
      instructor_automations: {
        Row: {
          action_config: Json
          action_type: Database["public"]["Enums"]["automation_action"]
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
          name: string
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: Database["public"]["Enums"]["automation_action"]
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          name: string
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["automation_action"]
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          name?: string
          trigger_type?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_automations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_automations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          created_at: string
          id: string
          instructor_id: string
          is_verified: boolean
          sort_code: string
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          created_at?: string
          id?: string
          instructor_id: string
          is_verified?: boolean
          sort_code: string
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_verified?: boolean
          sort_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_bank_details_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_bank_details_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_blood_glucose_logs: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          log_date: string
          log_time: string | null
          notes: string | null
          reading_mmol: number
          reading_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          log_date?: string
          log_time?: string | null
          notes?: string | null
          reading_mmol: number
          reading_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          log_date?: string
          log_time?: string | null
          notes?: string | null
          reading_mmol?: number
          reading_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_blood_glucose_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_blood_glucose_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_blood_pressure_logs: {
        Row: {
          created_at: string
          diastolic: number
          id: string
          instructor_id: string
          log_date: string
          log_time: string | null
          notes: string | null
          pulse: number | null
          systolic: number
        }
        Insert: {
          created_at?: string
          diastolic: number
          id?: string
          instructor_id: string
          log_date?: string
          log_time?: string | null
          notes?: string | null
          pulse?: number | null
          systolic: number
        }
        Update: {
          created_at?: string
          diastolic?: number
          id?: string
          instructor_id?: string
          log_date?: string
          log_time?: string | null
          notes?: string | null
          pulse?: number | null
          systolic?: number
        }
        Relationships: [
          {
            foreignKeyName: "instructor_blood_pressure_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_blood_pressure_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_booking_settings: {
        Row: {
          allow_extra_hours_request: boolean
          allow_self_booking: boolean
          allow_self_cancel: boolean
          allow_self_reschedule: boolean
          allowed_durations: number[]
          booking_message: string | null
          cancel_notice_hours: number
          created_at: string
          id: string
          instructor_id: string
          max_advance_days: number
          min_notice_hours: number
          require_approval: boolean
          reschedule_notice_hours: number
          updated_at: string
        }
        Insert: {
          allow_extra_hours_request?: boolean
          allow_self_booking?: boolean
          allow_self_cancel?: boolean
          allow_self_reschedule?: boolean
          allowed_durations?: number[]
          booking_message?: string | null
          cancel_notice_hours?: number
          created_at?: string
          id?: string
          instructor_id: string
          max_advance_days?: number
          min_notice_hours?: number
          require_approval?: boolean
          reschedule_notice_hours?: number
          updated_at?: string
        }
        Update: {
          allow_extra_hours_request?: boolean
          allow_self_booking?: boolean
          allow_self_cancel?: boolean
          allow_self_reschedule?: boolean
          allowed_durations?: number[]
          booking_message?: string | null
          cancel_notice_hours?: number
          created_at?: string
          id?: string
          instructor_id?: string
          max_advance_days?: number
          min_notice_hours?: number
          require_approval?: boolean
          reschedule_notice_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_booking_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_booking_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_calendar_events: {
        Row: {
          color: string | null
          description: string | null
          end_time: string
          external_event_id: string
          html_link: string | null
          id: string
          instructor_id: string
          is_busy: boolean
          location: string | null
          meeting_provider: string | null
          meeting_url: string | null
          start_time: string
          synced_at: string
          title: string | null
        }
        Insert: {
          color?: string | null
          description?: string | null
          end_time: string
          external_event_id: string
          html_link?: string | null
          id?: string
          instructor_id: string
          is_busy?: boolean
          location?: string | null
          meeting_provider?: string | null
          meeting_url?: string | null
          start_time: string
          synced_at?: string
          title?: string | null
        }
        Update: {
          color?: string | null
          description?: string | null
          end_time?: string
          external_event_id?: string
          html_link?: string | null
          id?: string
          instructor_id?: string
          is_busy?: boolean
          location?: string | null
          meeting_provider?: string | null
          meeting_url?: string | null
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
          {
            foreignKeyName: "instructor_calendar_events_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          {
            foreignKeyName: "instructor_calendar_shares_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
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
          {
            foreignKeyName: "instructor_calendar_tokens_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
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
          {
            foreignKeyName: "instructor_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          {
            foreignKeyName: "instructor_date_overrides_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_discount_codes: {
        Row: {
          applies_to: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          instructor_id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          times_used: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          instructor_id: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_discount_codes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_discount_codes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          {
            foreignKeyName: "instructor_expenses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      instructor_forum_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          instructor_id: string
          is_read: boolean | null
          reply_id: string | null
          topic_id: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          instructor_id: string
          is_read?: boolean | null
          reply_id?: string | null
          topic_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_read?: boolean | null
          reply_id?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_forum_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_alerts_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "instructor_forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_alerts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "instructor_forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          instructor_id: string
          is_solution: boolean | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          instructor_id: string
          is_solution?: boolean | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_solution?: boolean | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_forum_replies_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_replies_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "instructor_forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_forum_topics: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          instructor_id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          last_reply_at: string | null
          last_reply_by: string | null
          reply_count: number | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          instructor_id: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_by?: string | null
          reply_count?: number | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          last_reply_by?: string | null
          reply_count?: number | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_forum_topics_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_topics_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_topics_last_reply_by_fkey"
            columns: ["last_reply_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_forum_topics_last_reply_by_fkey"
            columns: ["last_reply_by"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_friends: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_friends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_friends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "instructor_google_service_calendar_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_health_alerts: {
        Row: {
          created_at: string
          id: string
          instructor_id: string | null
          message: string
          resolved_at: string | null
          severity: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id?: string | null
          message: string
          resolved_at?: string | null
          severity: string
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string | null
          message?: string
          resolved_at?: string | null
          severity?: string
          source?: string
        }
        Relationships: []
      }
      instructor_health_logs: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          log_date: string
          notes: string | null
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          log_date?: string
          notes?: string | null
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          log_date?: string
          notes?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "instructor_health_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_health_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_health_settings: {
        Row: {
          break_reminder_enabled: boolean
          created_at: string
          daily_water_goal: number
          height_cm: number | null
          id: string
          instructor_id: string
          reminder_interval_minutes: number
          updated_at: string
          weight_unit: string
        }
        Insert: {
          break_reminder_enabled?: boolean
          created_at?: string
          daily_water_goal?: number
          height_cm?: number | null
          id?: string
          instructor_id: string
          reminder_interval_minutes?: number
          updated_at?: string
          weight_unit?: string
        }
        Update: {
          break_reminder_enabled?: boolean
          created_at?: string
          daily_water_goal?: number
          height_cm?: number | null
          id?: string
          instructor_id?: string
          reminder_interval_minutes?: number
          updated_at?: string
          weight_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_health_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_health_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
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
          color: string | null
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
          color?: string | null
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
          color?: string | null
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
          {
            foreignKeyName: "instructor_manual_blocks_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_notification_settings: {
        Row: {
          category_mutes: Json
          created_at: string
          daily_summary_enabled: boolean
          daily_summary_include: Json
          daily_summary_time: string
          delivery_cadence: string
          end_of_lesson_enabled: boolean
          end_of_lesson_lead_minutes: number
          instructor_id: string
          notification_rules: Json
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
        }
        Insert: {
          category_mutes?: Json
          created_at?: string
          daily_summary_enabled?: boolean
          daily_summary_include?: Json
          daily_summary_time?: string
          delivery_cadence?: string
          end_of_lesson_enabled?: boolean
          end_of_lesson_lead_minutes?: number
          instructor_id: string
          notification_rules?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
        }
        Update: {
          category_mutes?: Json
          created_at?: string
          daily_summary_enabled?: boolean
          daily_summary_include?: Json
          daily_summary_time?: string
          delivery_cadence?: string
          end_of_lesson_enabled?: boolean
          end_of_lesson_lead_minutes?: number
          instructor_id?: string
          notification_rules?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_notification_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_notification_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          instructor_id: string
          is_read: boolean
          message: string
          metadata: Json | null
          snoozed_until: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          snoozed_until?: string | null
          title: string
          type?: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          snoozed_until?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_notifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_notifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          instructor_id: string
          notes: string | null
          payment_ids: string[]
          transferred_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          instructor_id: string
          notes?: string | null
          payment_ids?: string[]
          transferred_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          payment_ids?: string[]
          transferred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_phone_numbers: {
        Row: {
          created_at: string
          forward_to_mobile: string | null
          id: string
          instructor_id: string
          monthly_cost_pence: number | null
          phone_number: string
          provider: Database["public"]["Enums"]["phone_number_provider"]
          routing_mode: Database["public"]["Enums"]["phone_number_routing_mode"]
          status: Database["public"]["Enums"]["phone_number_status"]
          twilio_sid: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          forward_to_mobile?: string | null
          id?: string
          instructor_id: string
          monthly_cost_pence?: number | null
          phone_number: string
          provider: Database["public"]["Enums"]["phone_number_provider"]
          routing_mode?: Database["public"]["Enums"]["phone_number_routing_mode"]
          status?: Database["public"]["Enums"]["phone_number_status"]
          twilio_sid?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          forward_to_mobile?: string | null
          id?: string
          instructor_id?: string
          monthly_cost_pence?: number | null
          phone_number?: string
          provider?: Database["public"]["Enums"]["phone_number_provider"]
          routing_mode?: Database["public"]["Enums"]["phone_number_routing_mode"]
          status?: Database["public"]["Enums"]["phone_number_status"]
          twilio_sid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_phone_numbers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_phone_numbers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_pinned_tiles: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          position: number
          tile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          position: number
          tile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          position?: number
          tile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_postcode_rates: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          instructor_id: string
          outward_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hourly_rate: number
          id?: string
          instructor_id: string
          outward_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          instructor_id?: string
          outward_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_postcode_rates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_postcode_rates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_premium_placements: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          instructor_id: string
          is_active: boolean
          placement_type: string
          priority_score: number
          started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean
          placement_type?: string
          priority_score?: number
          started_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean
          placement_type?: string
          priority_score?: number
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_premium_placements_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_premium_placements_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_referral_settings: {
        Row: {
          created_at: string | null
          id: string
          instructor_id: string
          is_enabled: boolean | null
          max_referrals_per_pupil: number | null
          referee_reward_amount: number | null
          referee_reward_type: string | null
          referrer_reward_amount: number | null
          referrer_reward_type: string | null
          reward_description: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructor_id: string
          is_enabled?: boolean | null
          max_referrals_per_pupil?: number | null
          referee_reward_amount?: number | null
          referee_reward_type?: string | null
          referrer_reward_amount?: number | null
          referrer_reward_type?: string | null
          reward_description?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instructor_id?: string
          is_enabled?: boolean | null
          max_referrals_per_pupil?: number | null
          referee_reward_amount?: number | null
          referee_reward_type?: string | null
          referrer_reward_amount?: number | null
          referrer_reward_type?: string | null
          reward_description?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_referral_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_referral_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_referrals: {
        Row: {
          created_at: string
          id: string
          qualified_at: string | null
          referred_email: string
          referred_instructor_id: string | null
          referrer_id: string
          reward_amount: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          referred_email: string
          referred_instructor_id?: string | null
          referrer_id: string
          reward_amount?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          referred_email?: string
          referred_instructor_id?: string | null
          referrer_id?: string
          reward_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_referrals_referred_instructor_id_fkey"
            columns: ["referred_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_referrals_referred_instructor_id_fkey"
            columns: ["referred_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_reminder_preferences: {
        Row: {
          auto_charge_no_show: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          id: string
          instructor_id: string
          late_cancel_fee: number | null
          late_cancel_hours: number | null
          no_show_fee: number | null
          push_enabled: boolean | null
          reminder_1h_enabled: boolean | null
          reminder_time: string | null
          sms_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_charge_no_show?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          instructor_id: string
          late_cancel_fee?: number | null
          late_cancel_hours?: number | null
          no_show_fee?: number | null
          push_enabled?: boolean | null
          reminder_1h_enabled?: boolean | null
          reminder_time?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_charge_no_show?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          instructor_id?: string
          late_cancel_fee?: number | null
          late_cancel_hours?: number | null
          no_show_fee?: number | null
          push_enabled?: boolean | null
          reminder_1h_enabled?: boolean | null
          reminder_time?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_reminder_preferences_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_reminder_preferences_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_reports: {
        Row: {
          filename: string
          generated_at: string
          id: string
          instructor_id: string
          parameters: Json | null
          pdf_url: string | null
          report_type: string
        }
        Insert: {
          filename: string
          generated_at?: string
          id?: string
          instructor_id: string
          parameters?: Json | null
          pdf_url?: string | null
          report_type: string
        }
        Update: {
          filename?: string
          generated_at?: string
          id?: string
          instructor_id?: string
          parameters?: Json | null
          pdf_url?: string | null
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_resources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          instructor_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          instructor_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          instructor_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "instructor_standards_check_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          gocardless_billing_request_id: string | null
          gocardless_customer_id: string | null
          gocardless_mandate_id: string | null
          gocardless_subscription_id: string | null
          id: string
          instructor_id: string
          is_pdi_programme: boolean | null
          paused_at: string | null
          plan_id: string
          qualification_converted_at: string | null
          resume_at: string | null
          save_discount_percent: number | null
          save_discount_until: string | null
          seat_count: number | null
          square_card_id: string | null
          square_customer_id: string | null
          square_subscription_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          total_monthly_amount: number | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          gocardless_billing_request_id?: string | null
          gocardless_customer_id?: string | null
          gocardless_mandate_id?: string | null
          gocardless_subscription_id?: string | null
          id?: string
          instructor_id: string
          is_pdi_programme?: boolean | null
          paused_at?: string | null
          plan_id: string
          qualification_converted_at?: string | null
          resume_at?: string | null
          save_discount_percent?: number | null
          save_discount_until?: string | null
          seat_count?: number | null
          square_card_id?: string | null
          square_customer_id?: string | null
          square_subscription_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_monthly_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          gocardless_billing_request_id?: string | null
          gocardless_customer_id?: string | null
          gocardless_mandate_id?: string | null
          gocardless_subscription_id?: string | null
          id?: string
          instructor_id?: string
          is_pdi_programme?: boolean | null
          paused_at?: string | null
          plan_id?: string
          qualification_converted_at?: string | null
          resume_at?: string | null
          save_discount_percent?: number | null
          save_discount_until?: string | null
          seat_count?: number | null
          square_card_id?: string | null
          square_customer_id?: string | null
          square_subscription_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_monthly_amount?: number | null
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
            foreignKeyName: "instructor_subscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      instructor_support_resources: {
        Row: {
          category: string
          content: string | null
          created_at: string
          description: string | null
          display_order: number | null
          external_url: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          resource_type: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          resource_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          resource_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "instructor_terms_conditions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_terms_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "instructor_terms_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_terms_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
            foreignKeyName: "instructor_test_centres_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      instructor_tile_preferences: {
        Row: {
          created_at: string
          hero_image_url: string | null
          hidden_tiles: Json | null
          home_layout_style: string
          id: string
          instructor_id: string
          tile_order: Json
          updated_at: string
          wallpaper_color: string | null
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          hidden_tiles?: Json | null
          home_layout_style?: string
          id?: string
          instructor_id: string
          tile_order?: Json
          updated_at?: string
          wallpaper_color?: string | null
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          hidden_tiles?: Json | null
          home_layout_style?: string
          id?: string
          instructor_id?: string
          tile_order?: Json
          updated_at?: string
          wallpaper_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_tile_preferences_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_tile_preferences_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_todos: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          display_order: number
          due_date: string | null
          id: string
          instructor_id: string
          is_completed: boolean
          parent_id: string | null
          priority: number
          project: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          instructor_id: string
          is_completed?: boolean
          parent_id?: string | null
          priority?: number
          project?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          instructor_id?: string
          is_completed?: boolean
          parent_id?: string | null
          priority?: number
          project?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_todos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_todos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_todos_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "instructor_todos"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_tracking_config: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          provider: string
          quartix_account_id: string | null
          quartix_api_key: string | null
          updated_at: string
          working_days: number[] | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          provider?: string
          quartix_account_id?: string | null
          quartix_api_key?: string | null
          updated_at?: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          provider?: string
          quartix_account_id?: string | null
          quartix_api_key?: string | null
          updated_at?: string
          working_days?: number[] | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_tracking_config_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_tracking_config_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_vehicles: {
        Row: {
          assigned_instructor_id: string | null
          color_code: string | null
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
          assigned_instructor_id?: string | null
          color_code?: string | null
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
          assigned_instructor_id?: string | null
          color_code?: string | null
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
            foreignKeyName: "instructor_vehicles_assigned_instructor_id_fkey"
            columns: ["assigned_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_vehicles_assigned_instructor_id_fkey"
            columns: ["assigned_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_vehicles_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_vehicles_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_water_logs: {
        Row: {
          created_at: string
          daily_goal: number
          glasses_count: number
          id: string
          instructor_id: string
          log_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          glasses_count?: number
          id?: string
          instructor_id: string
          log_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_goal?: number
          glasses_count?: number
          id?: string
          instructor_id?: string
          log_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_water_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_water_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_website_pages: {
        Row: {
          canonical_url: string | null
          content_blocks: Json | null
          created_at: string
          display_order: number
          draft_content_blocks: Json | null
          has_unpublished_changes: boolean
          hero_heading: string | null
          hero_image_url: string | null
          hero_subheading: string | null
          id: string
          instructor_id: string
          is_published: boolean
          keywords: string | null
          last_edited_at: string | null
          last_edited_by: string | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          page_title: string
          page_type: string
          schema_jsonld: Json | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          content_blocks?: Json | null
          created_at?: string
          display_order?: number
          draft_content_blocks?: Json | null
          has_unpublished_changes?: boolean
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          instructor_id: string
          is_published?: boolean
          keywords?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          page_title: string
          page_type: string
          schema_jsonld?: Json | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          content_blocks?: Json | null
          created_at?: string
          display_order?: number
          draft_content_blocks?: Json | null
          has_unpublished_changes?: boolean
          hero_heading?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          instructor_id?: string
          is_published?: boolean
          keywords?: string | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          page_title?: string
          page_type?: string
          schema_jsonld?: Json | null
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
          {
            foreignKeyName: "instructor_website_pages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_website_settings: {
        Row: {
          created_at: string
          custom_head_html: string | null
          default_keywords: string | null
          default_meta_description: string | null
          default_og_image_url: string | null
          google_analytics_id: string | null
          google_site_verification: string | null
          id: string
          instructor_id: string
          robots_indexable: boolean
          site_tagline: string | null
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_head_html?: string | null
          default_keywords?: string | null
          default_meta_description?: string | null
          default_og_image_url?: string | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          id?: string
          instructor_id: string
          robots_indexable?: boolean
          site_tagline?: string | null
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_head_html?: string | null
          default_keywords?: string | null
          default_meta_description?: string | null
          default_og_image_url?: string | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          id?: string
          instructor_id?: string
          robots_indexable?: boolean
          site_tagline?: string | null
          social_links?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_website_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_website_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_weekly_reports: {
        Row: {
          cancelled_count: number | null
          created_at: string | null
          expenses: number | null
          id: string
          instructor_id: string
          lesson_count: number | null
          mileage_miles: number | null
          report_text: string | null
          revenue: number | null
          total_hours: number | null
          week_start: string
        }
        Insert: {
          cancelled_count?: number | null
          created_at?: string | null
          expenses?: number | null
          id?: string
          instructor_id: string
          lesson_count?: number | null
          mileage_miles?: number | null
          report_text?: string | null
          revenue?: number | null
          total_hours?: number | null
          week_start: string
        }
        Update: {
          cancelled_count?: number | null
          created_at?: string | null
          expenses?: number | null
          id?: string
          instructor_id?: string
          lesson_count?: number | null
          mileage_miles?: number | null
          report_text?: string | null
          revenue?: number | null
          total_hours?: number | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_weekly_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_weekly_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_whatsapp_accounts: {
        Row: {
          access_token: string | null
          connected_at: string | null
          created_at: string
          display_phone: string | null
          id: string
          instructor_id: string
          last_health_check_at: string | null
          last_health_status: Json | null
          phone_number_id: string | null
          quality_rating: string | null
          status: string
          updated_at: string
          verified_name: string | null
          waba_id: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string
          display_phone?: string | null
          id?: string
          instructor_id: string
          last_health_check_at?: string | null
          last_health_status?: Json | null
          phone_number_id?: string | null
          quality_rating?: string | null
          status?: string
          updated_at?: string
          verified_name?: string | null
          waba_id?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string
          display_phone?: string | null
          id?: string
          instructor_id?: string
          last_health_check_at?: string | null
          last_health_status?: Json | null
          phone_number_id?: string | null
          quality_rating?: string | null
          status?: string
          updated_at?: string
          verified_name?: string | null
          waba_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_whatsapp_accounts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_whatsapp_accounts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
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
          {
            foreignKeyName: "instructor_working_hours_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          accepts_cover_lessons: boolean
          accessibility_bio: string | null
          accessibility_enabled: boolean
          adaptations: string[]
          additional_certifications: string[] | null
          adi_badge_expiry: string | null
          adi_badge_number: string | null
          adi_certificate_url: string | null
          adi_code_of_practice: boolean | null
          adi_grade: string | null
          ai_auto_invoices_enabled: boolean
          ai_call_divert_buffer_after_minutes: number
          ai_call_divert_buffer_before_minutes: number
          ai_call_divert_enabled: boolean
          ai_call_divert_mode: string
          ai_cancellation_risk_enabled: boolean
          ai_lesson_plans_enabled: boolean
          ai_morning_briefing_enabled: boolean
          ai_parent_reports_enabled: boolean
          ai_pricing_suggestions_enabled: boolean
          ai_re_engagement_enabled: boolean
          ai_receptionist_enabled: boolean
          ai_test_readiness_enabled: boolean
          ai_waitlist_filling_enabled: boolean
          ai_weekly_report_enabled: boolean
          allow_same_day_booking: boolean
          allowed_lesson_lengths: number[] | null
          app_slug: string | null
          auth_user_id: string | null
          auto_block_bank_holidays: boolean
          auto_reengage_dormant: boolean
          auto_reengagement_enabled: boolean | null
          auto_start_tracker: boolean
          availability_paused: boolean
          available_from: string | null
          bank_holiday_surcharge_amount: number
          battery_kwh: number | null
          bio: string | null
          bonus_earned: number | null
          booking_advance_days: number | null
          booking_mode: string | null
          brand_colour: string | null
          broadcast_messaging_enabled: boolean | null
          bsl_signing: boolean
          buffer_minutes: number
          business_name: string | null
          calendar_colors: Json | null
          cancellation_analytics_enabled: boolean | null
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
          cash_payments_enabled: boolean | null
          clearpay_enabled: boolean | null
          commission_payer: string | null
          commission_split_percent: number
          cover_finders_fee_pct: number
          cover_max_distance_miles: number
          cover_min_notice_hours: number
          cpd_certified: boolean | null
          cpd_hours_logged: number | null
          cpd_year_target: number | null
          created_at: string
          custom_branding_enabled: boolean | null
          custom_domain: string | null
          custom_domain_added_at: string | null
          custom_domain_dns_status: string
          custom_domain_last_checked_at: string | null
          custom_domain_ssl_status: string
          custom_domain_status_message: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified: boolean | null
          dark_mode_enabled: boolean | null
          data_retention_months: number | null
          dbs_certificate_expiry: string | null
          dbs_certificate_issued: string | null
          dbs_certificate_url: string | null
          deleted_at: string | null
          demo_mode: boolean | null
          deposit_amount: number | null
          deposit_deadline_days: number | null
          deposit_enabled: boolean | null
          direct_debit_enabled: boolean
          disability_experience: string[]
          drive_time_alerts_enabled: boolean | null
          driving_licence_back_url: string | null
          driving_licence_expiry: string | null
          driving_licence_front_url: string | null
          driving_licence_number: string | null
          electricity_cost_per_kwh: number | null
          email: string | null
          extra_info: string | null
          facebook_url: string | null
          fuel_cost_per_litre: number | null
          fuel_type: string
          gender: string | null
          google_access_token: string | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_review_url: string | null
          google_token_expires_at: string | null
          gpsgate_user_id: number | null
          gpsgate_username: string | null
          has_completed_tour: boolean
          hero_image_url: string | null
          hero_overlay_color: string | null
          hero_overlay_opacity: number | null
          hero_show_logo: boolean | null
          home_address: string | null
          home_postcode: string
          hourly_rate: number | null
          id: string
          instagram_url: string | null
          instant_bank_pay_enabled: boolean
          instructor_grade: string | null
          insurance_certificate_url: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          intake_questions_enabled: boolean | null
          is_active: boolean
          is_online: boolean | null
          klarna_enabled: boolean | null
          last_active_at: string | null
          last_calendar_sync: string | null
          last_compliance_reminder_sent: string | null
          last_seen_at: string | null
          lat: number | null
          lesson_feedback_enabled: boolean | null
          linkedin_url: string | null
          lng: number | null
          location_name: string | null
          logo_url: string | null
          min_lead_hours: number
          mini_website_domain_id: string | null
          morning_briefing_enabled: boolean | null
          mot_certificate_url: string | null
          motability_friendly: boolean
          name: string
          odd_hours_end: string
          odd_hours_start: string
          odd_hours_surcharge_amount: number
          payment_link_base_url: string | null
          payment_qr_url: string | null
          payment_qr_url_instructor_pays: string | null
          payment_qr_url_pupil_pays: string | null
          personal_website_url: string | null
          phone: string | null
          prefer_earliest_slot: boolean
          preferred_language: string | null
          preferred_lesson_length: number
          preferred_tracking_provider: string | null
          pricing_rules_enabled: boolean | null
          profile_image_url: string | null
          pupil_app_dark_mode: boolean | null
          pupil_app_enabled: boolean | null
          pupil_self_booking_enabled: boolean | null
          quotes_enabled: boolean | null
          radius_miles: number
          reflective_logs_enabled: boolean | null
          road_tax_reference: string | null
          school_skim_amount: number | null
          school_skim_percentage: number | null
          secondary_colour: string | null
          slot_increment_minutes: number
          special_skills: string | null
          square_access_token_encrypted: string | null
          square_connected_at: string | null
          square_merchant_id: string | null
          square_refresh_token_encrypted: string | null
          square_token_expires_at: string | null
          standards_check_at: string | null
          standards_check_result: string | null
          stripe_account_id: string | null
          support_chat_muted_at: string | null
          tax_code: string | null
          tracking_mode: string
          truelayer_enabled: boolean | null
          twitter_url: string | null
          updated_at: string
          vehicle_mpg: number | null
          website_button_color: string | null
          website_font: string | null
          website_footer_bg: string | null
          website_header_bg: string | null
          website_header_style: string | null
          website_heading_color: string | null
          website_menu_text_color: string | null
          website_text_color: string | null
          website_theme: string | null
          weekend_surcharge_amount: number
          welcome_video_url: string | null
          whatsapp_enabled: boolean | null
          xero_connected: boolean | null
          xero_tenant_id: string | null
          years_experience_adi: number | null
        }
        Insert: {
          accepts_cover_lessons?: boolean
          accessibility_bio?: string | null
          accessibility_enabled?: boolean
          adaptations?: string[]
          additional_certifications?: string[] | null
          adi_badge_expiry?: string | null
          adi_badge_number?: string | null
          adi_certificate_url?: string | null
          adi_code_of_practice?: boolean | null
          adi_grade?: string | null
          ai_auto_invoices_enabled?: boolean
          ai_call_divert_buffer_after_minutes?: number
          ai_call_divert_buffer_before_minutes?: number
          ai_call_divert_enabled?: boolean
          ai_call_divert_mode?: string
          ai_cancellation_risk_enabled?: boolean
          ai_lesson_plans_enabled?: boolean
          ai_morning_briefing_enabled?: boolean
          ai_parent_reports_enabled?: boolean
          ai_pricing_suggestions_enabled?: boolean
          ai_re_engagement_enabled?: boolean
          ai_receptionist_enabled?: boolean
          ai_test_readiness_enabled?: boolean
          ai_waitlist_filling_enabled?: boolean
          ai_weekly_report_enabled?: boolean
          allow_same_day_booking?: boolean
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          auth_user_id?: string | null
          auto_block_bank_holidays?: boolean
          auto_reengage_dormant?: boolean
          auto_reengagement_enabled?: boolean | null
          auto_start_tracker?: boolean
          availability_paused?: boolean
          available_from?: string | null
          bank_holiday_surcharge_amount?: number
          battery_kwh?: number | null
          bio?: string | null
          bonus_earned?: number | null
          booking_advance_days?: number | null
          booking_mode?: string | null
          brand_colour?: string | null
          broadcast_messaging_enabled?: boolean | null
          bsl_signing?: boolean
          buffer_minutes?: number
          business_name?: string | null
          calendar_colors?: Json | null
          cancellation_analytics_enabled?: boolean | null
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
          cash_payments_enabled?: boolean | null
          clearpay_enabled?: boolean | null
          commission_payer?: string | null
          commission_split_percent?: number
          cover_finders_fee_pct?: number
          cover_max_distance_miles?: number
          cover_min_notice_hours?: number
          cpd_certified?: boolean | null
          cpd_hours_logged?: number | null
          cpd_year_target?: number | null
          created_at?: string
          custom_branding_enabled?: boolean | null
          custom_domain?: string | null
          custom_domain_added_at?: string | null
          custom_domain_dns_status?: string
          custom_domain_last_checked_at?: string | null
          custom_domain_ssl_status?: string
          custom_domain_status_message?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified?: boolean | null
          dark_mode_enabled?: boolean | null
          data_retention_months?: number | null
          dbs_certificate_expiry?: string | null
          dbs_certificate_issued?: string | null
          dbs_certificate_url?: string | null
          deleted_at?: string | null
          demo_mode?: boolean | null
          deposit_amount?: number | null
          deposit_deadline_days?: number | null
          deposit_enabled?: boolean | null
          direct_debit_enabled?: boolean
          disability_experience?: string[]
          drive_time_alerts_enabled?: boolean | null
          driving_licence_back_url?: string | null
          driving_licence_expiry?: string | null
          driving_licence_front_url?: string | null
          driving_licence_number?: string | null
          electricity_cost_per_kwh?: number | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          fuel_cost_per_litre?: number | null
          fuel_type?: string
          gender?: string | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_review_url?: string | null
          google_token_expires_at?: string | null
          gpsgate_user_id?: number | null
          gpsgate_username?: string | null
          has_completed_tour?: boolean
          hero_image_url?: string | null
          hero_overlay_color?: string | null
          hero_overlay_opacity?: number | null
          hero_show_logo?: boolean | null
          home_address?: string | null
          home_postcode: string
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          instant_bank_pay_enabled?: boolean
          instructor_grade?: string | null
          insurance_certificate_url?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          intake_questions_enabled?: boolean | null
          is_active?: boolean
          is_online?: boolean | null
          klarna_enabled?: boolean | null
          last_active_at?: string | null
          last_calendar_sync?: string | null
          last_compliance_reminder_sent?: string | null
          last_seen_at?: string | null
          lat?: number | null
          lesson_feedback_enabled?: boolean | null
          linkedin_url?: string | null
          lng?: number | null
          location_name?: string | null
          logo_url?: string | null
          min_lead_hours?: number
          mini_website_domain_id?: string | null
          morning_briefing_enabled?: boolean | null
          mot_certificate_url?: string | null
          motability_friendly?: boolean
          name: string
          odd_hours_end?: string
          odd_hours_start?: string
          odd_hours_surcharge_amount?: number
          payment_link_base_url?: string | null
          payment_qr_url?: string | null
          payment_qr_url_instructor_pays?: string | null
          payment_qr_url_pupil_pays?: string | null
          personal_website_url?: string | null
          phone?: string | null
          prefer_earliest_slot?: boolean
          preferred_language?: string | null
          preferred_lesson_length?: number
          preferred_tracking_provider?: string | null
          pricing_rules_enabled?: boolean | null
          profile_image_url?: string | null
          pupil_app_dark_mode?: boolean | null
          pupil_app_enabled?: boolean | null
          pupil_self_booking_enabled?: boolean | null
          quotes_enabled?: boolean | null
          radius_miles?: number
          reflective_logs_enabled?: boolean | null
          road_tax_reference?: string | null
          school_skim_amount?: number | null
          school_skim_percentage?: number | null
          secondary_colour?: string | null
          slot_increment_minutes?: number
          special_skills?: string | null
          square_access_token_encrypted?: string | null
          square_connected_at?: string | null
          square_merchant_id?: string | null
          square_refresh_token_encrypted?: string | null
          square_token_expires_at?: string | null
          standards_check_at?: string | null
          standards_check_result?: string | null
          stripe_account_id?: string | null
          support_chat_muted_at?: string | null
          tax_code?: string | null
          tracking_mode?: string
          truelayer_enabled?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          vehicle_mpg?: number | null
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_bg?: string | null
          website_header_style?: string | null
          website_heading_color?: string | null
          website_menu_text_color?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          weekend_surcharge_amount?: number
          welcome_video_url?: string | null
          whatsapp_enabled?: boolean | null
          xero_connected?: boolean | null
          xero_tenant_id?: string | null
          years_experience_adi?: number | null
        }
        Update: {
          accepts_cover_lessons?: boolean
          accessibility_bio?: string | null
          accessibility_enabled?: boolean
          adaptations?: string[]
          additional_certifications?: string[] | null
          adi_badge_expiry?: string | null
          adi_badge_number?: string | null
          adi_certificate_url?: string | null
          adi_code_of_practice?: boolean | null
          adi_grade?: string | null
          ai_auto_invoices_enabled?: boolean
          ai_call_divert_buffer_after_minutes?: number
          ai_call_divert_buffer_before_minutes?: number
          ai_call_divert_enabled?: boolean
          ai_call_divert_mode?: string
          ai_cancellation_risk_enabled?: boolean
          ai_lesson_plans_enabled?: boolean
          ai_morning_briefing_enabled?: boolean
          ai_parent_reports_enabled?: boolean
          ai_pricing_suggestions_enabled?: boolean
          ai_re_engagement_enabled?: boolean
          ai_receptionist_enabled?: boolean
          ai_test_readiness_enabled?: boolean
          ai_waitlist_filling_enabled?: boolean
          ai_weekly_report_enabled?: boolean
          allow_same_day_booking?: boolean
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          auth_user_id?: string | null
          auto_block_bank_holidays?: boolean
          auto_reengage_dormant?: boolean
          auto_reengagement_enabled?: boolean | null
          auto_start_tracker?: boolean
          availability_paused?: boolean
          available_from?: string | null
          bank_holiday_surcharge_amount?: number
          battery_kwh?: number | null
          bio?: string | null
          bonus_earned?: number | null
          booking_advance_days?: number | null
          booking_mode?: string | null
          brand_colour?: string | null
          broadcast_messaging_enabled?: boolean | null
          bsl_signing?: boolean
          buffer_minutes?: number
          business_name?: string | null
          calendar_colors?: Json | null
          cancellation_analytics_enabled?: boolean | null
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
          cash_payments_enabled?: boolean | null
          clearpay_enabled?: boolean | null
          commission_payer?: string | null
          commission_split_percent?: number
          cover_finders_fee_pct?: number
          cover_max_distance_miles?: number
          cover_min_notice_hours?: number
          cpd_certified?: boolean | null
          cpd_hours_logged?: number | null
          cpd_year_target?: number | null
          created_at?: string
          custom_branding_enabled?: boolean | null
          custom_domain?: string | null
          custom_domain_added_at?: string | null
          custom_domain_dns_status?: string
          custom_domain_last_checked_at?: string | null
          custom_domain_ssl_status?: string
          custom_domain_status_message?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified?: boolean | null
          dark_mode_enabled?: boolean | null
          data_retention_months?: number | null
          dbs_certificate_expiry?: string | null
          dbs_certificate_issued?: string | null
          dbs_certificate_url?: string | null
          deleted_at?: string | null
          demo_mode?: boolean | null
          deposit_amount?: number | null
          deposit_deadline_days?: number | null
          deposit_enabled?: boolean | null
          direct_debit_enabled?: boolean
          disability_experience?: string[]
          drive_time_alerts_enabled?: boolean | null
          driving_licence_back_url?: string | null
          driving_licence_expiry?: string | null
          driving_licence_front_url?: string | null
          driving_licence_number?: string | null
          electricity_cost_per_kwh?: number | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          fuel_cost_per_litre?: number | null
          fuel_type?: string
          gender?: string | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_review_url?: string | null
          google_token_expires_at?: string | null
          gpsgate_user_id?: number | null
          gpsgate_username?: string | null
          has_completed_tour?: boolean
          hero_image_url?: string | null
          hero_overlay_color?: string | null
          hero_overlay_opacity?: number | null
          hero_show_logo?: boolean | null
          home_address?: string | null
          home_postcode?: string
          hourly_rate?: number | null
          id?: string
          instagram_url?: string | null
          instant_bank_pay_enabled?: boolean
          instructor_grade?: string | null
          insurance_certificate_url?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          intake_questions_enabled?: boolean | null
          is_active?: boolean
          is_online?: boolean | null
          klarna_enabled?: boolean | null
          last_active_at?: string | null
          last_calendar_sync?: string | null
          last_compliance_reminder_sent?: string | null
          last_seen_at?: string | null
          lat?: number | null
          lesson_feedback_enabled?: boolean | null
          linkedin_url?: string | null
          lng?: number | null
          location_name?: string | null
          logo_url?: string | null
          min_lead_hours?: number
          mini_website_domain_id?: string | null
          morning_briefing_enabled?: boolean | null
          mot_certificate_url?: string | null
          motability_friendly?: boolean
          name?: string
          odd_hours_end?: string
          odd_hours_start?: string
          odd_hours_surcharge_amount?: number
          payment_link_base_url?: string | null
          payment_qr_url?: string | null
          payment_qr_url_instructor_pays?: string | null
          payment_qr_url_pupil_pays?: string | null
          personal_website_url?: string | null
          phone?: string | null
          prefer_earliest_slot?: boolean
          preferred_language?: string | null
          preferred_lesson_length?: number
          preferred_tracking_provider?: string | null
          pricing_rules_enabled?: boolean | null
          profile_image_url?: string | null
          pupil_app_dark_mode?: boolean | null
          pupil_app_enabled?: boolean | null
          pupil_self_booking_enabled?: boolean | null
          quotes_enabled?: boolean | null
          radius_miles?: number
          reflective_logs_enabled?: boolean | null
          road_tax_reference?: string | null
          school_skim_amount?: number | null
          school_skim_percentage?: number | null
          secondary_colour?: string | null
          slot_increment_minutes?: number
          special_skills?: string | null
          square_access_token_encrypted?: string | null
          square_connected_at?: string | null
          square_merchant_id?: string | null
          square_refresh_token_encrypted?: string | null
          square_token_expires_at?: string | null
          standards_check_at?: string | null
          standards_check_result?: string | null
          stripe_account_id?: string | null
          support_chat_muted_at?: string | null
          tax_code?: string | null
          tracking_mode?: string
          truelayer_enabled?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          vehicle_mpg?: number | null
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_bg?: string | null
          website_header_style?: string | null
          website_heading_color?: string | null
          website_menu_text_color?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          weekend_surcharge_amount?: number
          welcome_video_url?: string | null
          whatsapp_enabled?: boolean | null
          xero_connected?: boolean | null
          xero_tenant_id?: string | null
          years_experience_adi?: number | null
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
      invoices: {
        Row: {
          created_at: string
          currency: string | null
          due_date: string
          id: string
          instructor_details: Json | null
          instructor_id: string
          invoice_date: string
          invoice_number: string
          items: Json
          notes: string | null
          paid_at: string | null
          payment_terms: string | null
          pdf_url: string | null
          pupil_details: Json | null
          pupil_id: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total: number
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          due_date: string
          id?: string
          instructor_details?: Json | null
          instructor_id: string
          invoice_date?: string
          invoice_number: string
          items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          pupil_details?: Json | null
          pupil_id?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          due_date?: string
          id?: string
          instructor_details?: Json | null
          instructor_id?: string
          invoice_date?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          pupil_details?: Json | null
          pupil_id?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_test_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          instructor_id: string | null
          name: string | null
          notes: string | null
          phone: string | null
          postcode: string | null
          preferred_centre: string | null
          preferred_date: string
          preferred_date_end: string | null
          preferred_time: string | null
          pupil_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          instructor_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_centre?: string | null
          preferred_date: string
          preferred_date_end?: string | null
          preferred_time?: string | null
          pupil_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          instructor_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_centre?: string | null
          preferred_date?: string
          preferred_date_end?: string | null
          preferred_time?: string | null
          pupil_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_test_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_test_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_test_requests_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
            foreignKeyName: "lesson_cancellation_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      lesson_cancellation_stats: {
        Row: {
          avg_lesson_value: number | null
          created_at: string | null
          id: string
          instructor_id: string
          month_year: string
          total_cancelled: number | null
          total_completed: number | null
          total_no_show: number | null
          total_revenue: number | null
          total_scheduled: number | null
          updated_at: string | null
        }
        Insert: {
          avg_lesson_value?: number | null
          created_at?: string | null
          id?: string
          instructor_id: string
          month_year: string
          total_cancelled?: number | null
          total_completed?: number | null
          total_no_show?: number | null
          total_revenue?: number | null
          total_scheduled?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_lesson_value?: number | null
          created_at?: string | null
          id?: string
          instructor_id?: string
          month_year?: string
          total_cancelled?: number | null
          total_completed?: number | null
          total_no_show?: number | null
          total_revenue?: number | null
          total_scheduled?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_cancellation_stats_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_cancellation_stats_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          instructor_id: string
          lesson_history_id: string | null
          pupil_id: string
          rating: number | null
          requested_at: string
          responded_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          lesson_history_id?: string | null
          pupil_id: string
          rating?: number | null
          requested_at?: string
          responded_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          lesson_history_id?: string | null
          pupil_id?: string
          rating?: number | null
          requested_at?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_feedback_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_lesson_history_id_fkey"
            columns: ["lesson_history_id"]
            isOneToOne: false
            referencedRelation: "lesson_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_pupil_id_fkey"
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
          deleted_at: string | null
          duration_minutes: number
          id: string
          instructor_id: string
          lesson_date: string
          next_lesson_plan: string | null
          notes: string | null
          pupil_id: string
          rating: number | null
          scheduled_lesson_id: string | null
          skills_practiced: string[] | null
          start_time: string | null
          telematics_session_id: string | null
          updated_at: string
          vehicle_id: string | null
          voice_note_url: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          instructor_id: string
          lesson_date: string
          next_lesson_plan?: string | null
          notes?: string | null
          pupil_id: string
          rating?: number | null
          scheduled_lesson_id?: string | null
          skills_practiced?: string[] | null
          start_time?: string | null
          telematics_session_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
          voice_note_url?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string
          lesson_date?: string
          next_lesson_plan?: string | null
          notes?: string | null
          pupil_id?: string
          rating?: number | null
          scheduled_lesson_id?: string | null
          skills_practiced?: string[] | null
          start_time?: string | null
          telematics_session_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
          voice_note_url?: string | null
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
            foreignKeyName: "lesson_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      lesson_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          is_active: boolean
          name: string
          price: number
          total_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean
          name: string
          price: number
          total_hours: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean
          name?: string
          price?: number
          total_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_pedal_data: {
        Row: {
          brake_pedal_pct: number | null
          created_at: string | null
          gear_position: number | null
          id: string
          recorded_at: string
          telematics_id: string
        }
        Insert: {
          brake_pedal_pct?: number | null
          created_at?: string | null
          gear_position?: number | null
          id?: string
          recorded_at: string
          telematics_id: string
        }
        Update: {
          brake_pedal_pct?: number | null
          created_at?: string | null
          gear_position?: number | null
          id?: string
          recorded_at?: string
          telematics_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_pedal_data_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          instructor_id: string
          lesson_id: string
          pupil_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          lesson_id: string
          pupil_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          lesson_id?: string
          pupil_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_ratings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_ratings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_ratings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_ratings_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reminders: {
        Row: {
          channel: string
          created_at: string | null
          id: string
          instructor_id: string
          lesson_id: string
          pupil_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          id?: string
          instructor_id: string
          lesson_id: string
          pupil_id: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          id?: string
          instructor_id?: string
          lesson_id?: string
          pupil_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reminders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reminders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reminders_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reminders_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reminders_log: {
        Row: {
          channel: string
          error: string | null
          id: string
          instructor_id: string
          lesson_id: string
          pupil_id: string | null
          sent_at: string
          status: string
        }
        Insert: {
          channel: string
          error?: string | null
          id?: string
          instructor_id: string
          lesson_id: string
          pupil_id?: string | null
          sent_at?: string
          status?: string
        }
        Update: {
          channel?: string
          error?: string | null
          id?: string
          instructor_id?: string
          lesson_id?: string
          pupil_id?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reminders_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reminders_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reminders_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reminders_log_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_routes: {
        Row: {
          coordinates: Json
          created_at: string
          distance_km: number | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          instructor_id: string
          lesson_id: string | null
          pupil_id: string | null
          started_at: string | null
          telematics_id: string | null
        }
        Insert: {
          coordinates?: Json
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          instructor_id: string
          lesson_id?: string | null
          pupil_id?: string | null
          started_at?: string | null
          telematics_id?: string | null
        }
        Update: {
          coordinates?: Json
          created_at?: string
          distance_km?: number | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          pupil_id?: string | null
          started_at?: string | null
          telematics_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_routes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_routes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_routes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_routes_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_routes_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_lesson_week: string | null
          longest_streak: number
          pupil_id: string
          total_lessons_tracked: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_lesson_week?: string | null
          longest_streak?: number
          pupil_id: string
          total_lessons_tracked?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_lesson_week?: string | null
          longest_streak?: number
          pupil_id?: string
          total_lessons_tracked?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_streaks_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: true
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_syllabus_updates: {
        Row: {
          comment: string | null
          competency_id: string
          created_at: string
          id: string
          lesson_history_id: string
          new_level: number
          previous_level: number
          pupil_id: string
        }
        Insert: {
          comment?: string | null
          competency_id: string
          created_at?: string
          id?: string
          lesson_history_id: string
          new_level?: number
          previous_level?: number
          pupil_id: string
        }
        Update: {
          comment?: string | null
          competency_id?: string
          created_at?: string
          id?: string
          lesson_history_id?: string
          new_level?: number
          previous_level?: number
          pupil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_syllabus_updates_lesson_history_id_fkey"
            columns: ["lesson_history_id"]
            isOneToOne: false
            referencedRelation: "lesson_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_syllabus_updates_pupil_id_fkey"
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
          harsh_brake_count: number | null
          id: string
          instructor_id: string
          lesson_id: string | null
          local_score: number | null
          manually_started: boolean
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
          manually_started?: boolean
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
          manually_started?: boolean
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
      lesson_video_clips: {
        Row: {
          clip_end_seconds: number | null
          clip_start_seconds: number | null
          clip_type: string
          created_at: string
          duration_seconds: number | null
          gps_point_id: string | null
          id: string
          instructor_id: string
          instructor_note: string | null
          is_shared_with_pupil: boolean
          pupil_id: string | null
          telematics_id: string | null
          thumbnail_url: string | null
          video_url: string
        }
        Insert: {
          clip_end_seconds?: number | null
          clip_start_seconds?: number | null
          clip_type?: string
          created_at?: string
          duration_seconds?: number | null
          gps_point_id?: string | null
          id?: string
          instructor_id: string
          instructor_note?: string | null
          is_shared_with_pupil?: boolean
          pupil_id?: string | null
          telematics_id?: string | null
          thumbnail_url?: string | null
          video_url: string
        }
        Update: {
          clip_end_seconds?: number | null
          clip_start_seconds?: number | null
          clip_type?: string
          created_at?: string
          duration_seconds?: number | null
          gps_point_id?: string | null
          id?: string
          instructor_id?: string
          instructor_note?: string | null
          is_shared_with_pupil?: boolean
          pupil_id?: string | null
          telematics_id?: string | null
          thumbnail_url?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_video_clips_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_video_clips_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_video_clips_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_video_clips_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_waitlist: {
        Row: {
          auto_expired: boolean | null
          confirmation_sent_at: string | null
          created_at: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
          last_confirmed_at: string | null
          max_duration_mins: number | null
          min_duration_mins: number | null
          notes: string | null
          preferred_days: string[] | null
          preferred_times: string[] | null
          pupil_id: string
          updated_at: string | null
        }
        Insert: {
          auto_expired?: boolean | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          last_confirmed_at?: string | null
          max_duration_mins?: number | null
          min_duration_mins?: number | null
          notes?: string | null
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          pupil_id: string
          updated_at?: string | null
        }
        Update: {
          auto_expired?: boolean | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          last_confirmed_at?: string | null
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
            foreignKeyName: "lesson_waitlist_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          {
            foreignKeyName: "live_chat_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          speed_limit_kmh: number | null
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
          speed_limit_kmh?: number | null
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
          speed_limit_kmh?: number | null
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
            foreignKeyName: "live_pupil_positions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      marketing_page_sections: {
        Row: {
          content: Json | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          page_id: string
          section_key: string
          section_type: string
          subtitle: string | null
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          page_id: string
          section_key: string
          section_type?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          page_id?: string
          section_key?: string
          section_type?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "marketing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          page_key: string
          page_title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_key: string
          page_title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_key?: string
          page_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_feature_gates: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_locked_for_free: boolean
          menu_item_key: string
          menu_item_label: string
          menu_section: string
          required_feature: string | null
          updated_at: string
          upgrade_message: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_locked_for_free?: boolean
          menu_item_key: string
          menu_item_label: string
          menu_section: string
          required_feature?: string | null
          updated_at?: string
          upgrade_message?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_locked_for_free?: boolean
          menu_item_key?: string
          menu_item_label?: string
          menu_section?: string
          required_feature?: string | null
          updated_at?: string
          upgrade_message?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          delivered_at: string | null
          id: string
          is_urgent: boolean | null
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
          deleted_at?: string | null
          delivered_at?: string | null
          id?: string
          is_urgent?: boolean | null
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
          deleted_at?: string | null
          delivered_at?: string | null
          id?: string
          is_urgent?: boolean | null
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
      meta_data_deletions: {
        Row: {
          confirmation_code: string
          created_at: string
          id: string
          meta_user_id: string
          status: string
        }
        Insert: {
          confirmation_code: string
          created_at?: string
          id?: string
          meta_user_id: string
          status?: string
        }
        Update: {
          confirmation_code?: string
          created_at?: string
          id?: string
          meta_user_id?: string
          status?: string
        }
        Relationships: []
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
      mileage_logs: {
        Row: {
          created_at: string
          distance_km: number
          end_location: string | null
          end_odometer_km: number | null
          estimated_fuel_cost_gbp: number | null
          fuel_litres_used: number | null
          id: string
          instructor_id: string
          is_auto_logged: boolean
          log_date: string
          pupil_id: string | null
          purpose: string | null
          start_location: string | null
          start_odometer_km: number | null
          telematics_id: string | null
          trip_type: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          distance_km?: number
          end_location?: string | null
          end_odometer_km?: number | null
          estimated_fuel_cost_gbp?: number | null
          fuel_litres_used?: number | null
          id?: string
          instructor_id: string
          is_auto_logged?: boolean
          log_date?: string
          pupil_id?: string | null
          purpose?: string | null
          start_location?: string | null
          start_odometer_km?: number | null
          telematics_id?: string | null
          trip_type?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          distance_km?: number
          end_location?: string | null
          end_odometer_km?: number | null
          estimated_fuel_cost_gbp?: number | null
          fuel_litres_used?: number | null
          id?: string
          instructor_id?: string
          is_auto_logged?: boolean
          log_date?: string
          pupil_id?: string | null
          purpose?: string | null
          start_location?: string | null
          start_odometer_km?: number | null
          telematics_id?: string | null
          trip_type?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_logs_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_logs_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mini_site_health: {
        Row: {
          checked_at: string
          dns_ok: boolean | null
          domain_ok: boolean | null
          id: string
          instructor_id: string
          notes: string | null
          pages_missing: string[] | null
          pages_ok: boolean
          render_ok: boolean | null
          slug_ok: boolean
          ssl_ok: boolean | null
          status: string
        }
        Insert: {
          checked_at?: string
          dns_ok?: boolean | null
          domain_ok?: boolean | null
          id?: string
          instructor_id: string
          notes?: string | null
          pages_missing?: string[] | null
          pages_ok?: boolean
          render_ok?: boolean | null
          slug_ok?: boolean
          ssl_ok?: boolean | null
          status?: string
        }
        Update: {
          checked_at?: string
          dns_ok?: boolean | null
          domain_ok?: boolean | null
          id?: string
          instructor_id?: string
          notes?: string | null
          pages_missing?: string[] | null
          pages_ok?: boolean
          render_ok?: boolean | null
          slug_ok?: boolean
          ssl_ok?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_site_health_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mini_site_health_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_entries: {
        Row: {
          created_at: string
          energy_level: number | null
          id: string
          instructor_id: string
          logged_date: string
          mood_score: number
          notes: string | null
          stress_level: number | null
        }
        Insert: {
          created_at?: string
          energy_level?: number | null
          id?: string
          instructor_id: string
          logged_date?: string
          mood_score: number
          notes?: string | null
          stress_level?: number | null
        }
        Update: {
          created_at?: string
          energy_level?: number | null
          id?: string
          instructor_id?: string
          logged_date?: string
          mood_score?: number
          notes?: string | null
          stress_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_alerts: {
        Row: {
          created_at: string
          detected_at: string
          device_id: string
          id: string
          instructor_id: string
          is_read: boolean
          latitude: number | null
          longitude: number | null
          road_name: string | null
          speed_kmh: number | null
        }
        Insert: {
          created_at?: string
          detected_at?: string
          device_id: string
          id?: string
          instructor_id: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          speed_kmh?: number | null
        }
        Update: {
          created_at?: string
          detected_at?: string
          device_id?: string
          id?: string
          instructor_id?: string
          is_read?: boolean
          latitude?: number | null
          longitude?: number | null
          road_name?: string | null
          speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movement_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      mtd_instructor_settings: {
        Row: {
          accounting_type: string | null
          business_name: string | null
          business_start_date: string | null
          created_at: string
          flat_rate_expenses: boolean | null
          hmrc_nino: string | null
          id: string
          instructor_id: string
          is_mtd_enrolled: boolean | null
          updated_at: string
          utr: string | null
        }
        Insert: {
          accounting_type?: string | null
          business_name?: string | null
          business_start_date?: string | null
          created_at?: string
          flat_rate_expenses?: boolean | null
          hmrc_nino?: string | null
          id?: string
          instructor_id: string
          is_mtd_enrolled?: boolean | null
          updated_at?: string
          utr?: string | null
        }
        Update: {
          accounting_type?: string | null
          business_name?: string | null
          business_start_date?: string | null
          created_at?: string
          flat_rate_expenses?: boolean | null
          hmrc_nino?: string | null
          id?: string
          instructor_id?: string
          is_mtd_enrolled?: boolean | null
          updated_at?: string
          utr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtd_instructor_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtd_instructor_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      mtd_quarterly_periods: {
        Row: {
          created_at: string
          deadline: string
          hmrc_response: Json | null
          hmrc_submission_id: string | null
          id: string
          instructor_id: string
          period_end: string
          period_start: string
          quarter: number
          status: string
          submitted_at: string | null
          tax_year: number
          total_expenses: number | null
          total_income: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline: string
          hmrc_response?: Json | null
          hmrc_submission_id?: string | null
          id?: string
          instructor_id: string
          period_end: string
          period_start: string
          quarter: number
          status?: string
          submitted_at?: string | null
          tax_year: number
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string
          hmrc_response?: Json | null
          hmrc_submission_id?: string | null
          id?: string
          instructor_id?: string
          period_end?: string
          period_start?: string
          quarter?: number
          status?: string
          submitted_at?: string | null
          tax_year?: number
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtd_quarterly_periods_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtd_quarterly_periods_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      mtd_sa103_mappings: {
        Row: {
          created_at: string
          description: string | null
          expense_category: string
          hmrc_category: string
          id: string
          sa103_box: string
          sa103_label: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expense_category: string
          hmrc_category: string
          id?: string
          sa103_box: string
          sa103_label: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expense_category?: string
          hmrc_category?: string
          id?: string
          sa103_box?: string
          sa103_label?: string
        }
        Relationships: []
      }
      mtd_submission_log: {
        Row: {
          error_message: string | null
          hmrc_correlation_id: string | null
          hmrc_response: Json | null
          id: string
          instructor_id: string
          payload: Json
          period_id: string | null
          quarter: number | null
          status: string
          submission_type: string
          submitted_at: string
          tax_year: number
        }
        Insert: {
          error_message?: string | null
          hmrc_correlation_id?: string | null
          hmrc_response?: Json | null
          id?: string
          instructor_id: string
          payload: Json
          period_id?: string | null
          quarter?: number | null
          status?: string
          submission_type: string
          submitted_at?: string
          tax_year: number
        }
        Update: {
          error_message?: string | null
          hmrc_correlation_id?: string | null
          hmrc_response?: Json | null
          id?: string
          instructor_id?: string
          payload?: Json
          period_id?: string | null
          quarter?: number | null
          status?: string
          submission_type?: string
          submitted_at?: string
          tax_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "mtd_submission_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtd_submission_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtd_submission_log_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "mtd_quarterly_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_school_seats: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          franchise_instructor_id: string
          id: string
          invited_at: string | null
          seat_email: string | null
          seat_instructor_id: string | null
          seat_name: string | null
          status: string
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          franchise_instructor_id: string
          id?: string
          invited_at?: string | null
          seat_email?: string | null
          seat_instructor_id?: string | null
          seat_name?: string | null
          status?: string
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          franchise_instructor_id?: string
          id?: string
          invited_at?: string | null
          seat_email?: string | null
          seat_instructor_id?: string | null
          seat_name?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multi_school_seats_franchise_instructor_id_fkey"
            columns: ["franchise_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_school_seats_franchise_instructor_id_fkey"
            columns: ["franchise_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_school_seats_seat_instructor_id_fkey"
            columns: ["seat_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_school_seats_seat_instructor_id_fkey"
            columns: ["seat_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_school_seats_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "instructor_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          folder: string | null
          id: string
          is_pinned: boolean | null
          owner_id: string
          owner_type: string
          shared_with_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          folder?: string | null
          id?: string
          is_pinned?: boolean | null
          owner_id: string
          owner_type: string
          shared_with_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          folder?: string | null
          id?: string
          is_pinned?: boolean | null
          owner_id?: string
          owner_type?: string
          shared_with_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_outbox: {
        Row: {
          body: string | null
          category: string
          created_at: string
          deliver_at: string
          id: string
          importance: string
          instructor_id: string
          payload: Json
          sent_at: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          category: string
          created_at?: string
          deliver_at?: string
          id?: string
          importance?: string
          instructor_id: string
          payload?: Json
          sent_at?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          deliver_at?: string
          id?: string
          importance?: string
          instructor_id?: string
          payload?: Json
          sent_at?: string | null
          title?: string | null
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          action_type: string
          created_at: string
          error: string | null
          id: string
          instructor_id: string
          payload: Json
          record_id: string
          synced_at: string | null
          table_name: string
        }
        Insert: {
          action_type: string
          created_at?: string
          error?: string | null
          id?: string
          instructor_id: string
          payload?: Json
          record_id: string
          synced_at?: string | null
          table_name: string
        }
        Update: {
          action_type?: string
          created_at?: string
          error?: string | null
          id?: string
          instructor_id?: string
          payload?: Json
          record_id?: string
          synced_at?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_sync_queue_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_sync_queue_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      on_my_way_notifications: {
        Row: {
          eta_minutes: number | null
          id: string
          instructor_id: string
          lesson_id: string | null
          pupil_id: string | null
          sent_at: string
        }
        Insert: {
          eta_minutes?: number | null
          id?: string
          instructor_id: string
          lesson_id?: string | null
          pupil_id?: string | null
          sent_at?: string
        }
        Update: {
          eta_minutes?: number | null
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          pupil_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "on_my_way_notifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_my_way_notifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_my_way_notifications_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "on_my_way_notifications_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
      overspeed_events: {
        Row: {
          created_at: string | null
          device_id: string | null
          excess_kmh: number
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          road_name: string | null
          speed_kmh: number
          speed_limit_kmh: number
          telematics_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          excess_kmh: number
          id?: string
          latitude: number
          longitude: number
          recorded_at: string
          road_name?: string | null
          speed_kmh: number
          speed_limit_kmh: number
          telematics_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          excess_kmh?: number
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          road_name?: string | null
          speed_kmh?: number
          speed_limit_kmh?: number
          telematics_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "overspeed_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overspeed_events_telematics_id_fkey"
            columns: ["telematics_id"]
            isOneToOne: false
            referencedRelation: "lesson_telematics"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_conversations: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          last_message_at: string | null
          last_message_preview: string | null
          parent_phone: string
          pupil_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          parent_phone: string
          pupil_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          parent_phone?: string
          pupil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_conversations_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "parent_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      parent_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          parent_phone: string
          updated_at: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          parent_phone: string
          updated_at?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          parent_phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      pass_report_queue: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          id: string
          processed_at: string | null
          pupil_id: string
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          pupil_id: string
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          pupil_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pass_report_queue_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_disputes: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          payment_id: string
          pupil_id: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["payment_dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          payment_id: string
          pupil_id: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["payment_dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          payment_id?: string
          pupil_id?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["payment_dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_disputes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_history"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          deleted_at: string | null
          id: string
          instructor_id: string
          lesson_id: string | null
          notes: string | null
          payment_method: string | null
          payout_id: string | null
          payout_status: string | null
          pupil_id: string
          recorded_at: string
          transferred_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          instructor_id: string
          lesson_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payout_id?: string | null
          payout_status?: string | null
          pupil_id: string
          recorded_at?: string
          transferred_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          instructor_id?: string
          lesson_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payout_id?: string | null
          payout_status?: string | null
          pupil_id?: string
          recorded_at?: string
          transferred_at?: string | null
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
            foreignKeyName: "payment_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
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
          gocardless_payment_id: string | null
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
          gocardless_payment_id?: string | null
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
          gocardless_payment_id?: string | null
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
            foreignKeyName: "payment_link_tracking_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      payment_reminder_log: {
        Row: {
          amount_owed: number | null
          channel: string
          created_at: string
          id: string
          instructor_id: string
          pupil_id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          amount_owed?: number | null
          channel: string
          created_at?: string
          id?: string
          instructor_id: string
          pupil_id: string
          reminder_type?: string
          sent_at?: string
        }
        Update: {
          amount_owed?: number | null
          channel?: string
          created_at?: string
          id?: string
          instructor_id?: string
          pupil_id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminder_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminder_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminder_log_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_live_positions: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          created_at: string
          heading: number | null
          id: string
          instructor_id: string
          latitude: number
          longitude: number
          provider: string
          pupil_id: string
          recorded_at: string
          session_id: string | null
          speed_kmh: number | null
          speed_limit_kmh: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          instructor_id: string
          latitude: number
          longitude: number
          provider?: string
          pupil_id: string
          recorded_at?: string
          session_id?: string | null
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          instructor_id?: string
          latitude?: number
          longitude?: number
          provider?: string
          pupil_id?: string
          recorded_at?: string
          session_id?: string | null
          speed_kmh?: number | null
          speed_limit_kmh?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      phone_tracking_audit: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          instructor_id: string
          pupil_id: string | null
          status: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          instructor_id: string
          pupil_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          instructor_id?: string
          pupil_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      phone_tracking_permissions: {
        Row: {
          created_at: string
          denied_at: string | null
          granted_at: string | null
          id: string
          instructor_id: string
          pupil_id: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          denied_at?: string | null
          granted_at?: string | null
          id?: string
          instructor_id: string
          pupil_id?: string | null
          status: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          denied_at?: string | null
          granted_at?: string | null
          id?: string
          instructor_id?: string
          pupil_id?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      pipeline_leads: {
        Row: {
          course_type: string | null
          created_at: string
          email: string | null
          id: string
          instructor_id: string
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          updated_at: string
        }
        Insert: {
          course_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instructor_id: string
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Update: {
          course_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instructor_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_leads_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_leads_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_feature_descriptions: {
        Row: {
          created_at: string | null
          display_name: string
          display_order: number | null
          feature_key: string
          icon_name: string | null
          id: string
          long_description: string | null
          short_description: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string
          display_order?: number | null
          feature_key: string
          icon_name?: string | null
          id?: string
          long_description?: string | null
          short_description?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          display_order?: number | null
          feature_key?: string
          icon_name?: string | null
          id?: string
          long_description?: string | null
          short_description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_commission_config: {
        Row: {
          commission_type: string
          created_at: string
          fixed_fee_pence: number
          id: string
          is_active: boolean
          rate_percent: number
          updated_at: string
        }
        Insert: {
          commission_type?: string
          created_at?: string
          fixed_fee_pence?: number
          id?: string
          is_active?: boolean
          rate_percent?: number
          updated_at?: string
        }
        Update: {
          commission_type?: string
          created_at?: string
          fixed_fee_pence?: number
          id?: string
          is_active?: boolean
          rate_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number | null
          created_at: string
          description: string | null
          fixed_fee: number | null
          gross_amount: number
          id: string
          instructor_id: string | null
          net_amount: number
          source_id: string | null
          source_type: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          fixed_fee?: number | null
          gross_amount?: number
          id?: string
          instructor_id?: string | null
          net_amount?: number
          source_id?: string | null
          source_type?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          fixed_fee?: number | null
          gross_amount?: number
          id?: string
          instructor_id?: string | null
          net_amount?: number
          source_id?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_fees: {
        Row: {
          amount: number
          booking_reference: string | null
          created_at: string
          currency: string
          id: string
          instructor_id: string | null
          notes: string | null
          pupil_id: string | null
          source: string
        }
        Insert: {
          amount?: number
          booking_reference?: string | null
          created_at?: string
          currency?: string
          id?: string
          instructor_id?: string | null
          notes?: string | null
          pupil_id?: string | null
          source?: string
        }
        Update: {
          amount?: number
          booking_reference?: string | null
          created_at?: string
          currency?: string
          id?: string
          instructor_id?: string | null
          notes?: string | null
          pupil_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_fees_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fees_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fees_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_updates: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_published: boolean
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          title?: string
        }
        Relationships: []
      }
      pre_lesson_checklist_completions: {
        Row: {
          all_required_completed: boolean | null
          completed_at: string | null
          completed_items: Json
          created_at: string
          id: string
          lesson_id: string
          pupil_id: string
          reminder_sent_at: string | null
          template_id: string | null
        }
        Insert: {
          all_required_completed?: boolean | null
          completed_at?: string | null
          completed_items?: Json
          created_at?: string
          id?: string
          lesson_id: string
          pupil_id: string
          reminder_sent_at?: string | null
          template_id?: string | null
        }
        Update: {
          all_required_completed?: boolean | null
          completed_at?: string | null
          completed_items?: Json
          created_at?: string
          id?: string
          lesson_id?: string
          pupil_id?: string
          reminder_sent_at?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_lesson_checklist_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_lesson_checklist_completions_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_lesson_checklist_completions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pre_lesson_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_lesson_checklist_templates: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean | null
          is_first_lesson: boolean
          items: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean | null
          is_first_lesson?: boolean
          items?: Json
          template_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          is_first_lesson?: boolean
          items?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_lesson_checklist_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_lesson_checklist_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          adjustment_type: string
          adjustment_value: number
          condition: Json
          created_at: string
          display_order: number
          id: string
          instructor_id: string
          is_active: boolean
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          adjustment_type?: string
          adjustment_value?: number
          condition?: Json
          created_at?: string
          display_order?: number
          id?: string
          instructor_id: string
          is_active?: boolean
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: number
          condition?: Json
          created_at?: string
          display_order?: number
          id?: string
          instructor_id?: string
          is_active?: boolean
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
            foreignKeyName: "pupil_assignments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      pupil_certificates: {
        Row: {
          certificate_url: string | null
          id: string
          instructor_id: string
          issued_at: string
          milestone_type: string
          pupil_id: string
        }
        Insert: {
          certificate_url?: string | null
          id?: string
          instructor_id: string
          issued_at?: string
          milestone_type: string
          pupil_id: string
        }
        Update: {
          certificate_url?: string | null
          id?: string
          instructor_id?: string
          issued_at?: string
          milestone_type?: string
          pupil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_certificates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_certificates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_certificates_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_certifications: {
        Row: {
          awarded_at: string
          created_at: string
          id: string
          instructor_id: string
          milestone_type: string
          notes: string | null
          pupil_id: string
          title: string
        }
        Insert: {
          awarded_at?: string
          created_at?: string
          id?: string
          instructor_id: string
          milestone_type?: string
          notes?: string | null
          pupil_id: string
          title: string
        }
        Update: {
          awarded_at?: string
          created_at?: string
          id?: string
          instructor_id?: string
          milestone_type?: string
          notes?: string | null
          pupil_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_certifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_certifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_certifications_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_churn_scores: {
        Row: {
          calculated_at: string
          cancellation_rate: number | null
          created_at: string
          days_since_last_lesson: number | null
          id: string
          instructor_id: string
          lesson_frequency_trend: number | null
          pupil_id: string
          recommended_actions: Json
          risk_factors: Json
          risk_level: string | null
          risk_score: number
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          cancellation_rate?: number | null
          created_at?: string
          days_since_last_lesson?: number | null
          id?: string
          instructor_id: string
          lesson_frequency_trend?: number | null
          pupil_id: string
          recommended_actions?: Json
          risk_factors?: Json
          risk_level?: string | null
          risk_score?: number
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          cancellation_rate?: number | null
          created_at?: string
          days_since_last_lesson?: number | null
          id?: string
          instructor_id?: string
          lesson_frequency_trend?: number | null
          pupil_id?: string
          recommended_actions?: Json
          risk_factors?: Json
          risk_level?: string | null
          risk_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_churn_scores_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_churn_scores_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_churn_scores_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: true
            referencedRelation: "pupils"
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
      pupil_credentials: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          pupil_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          pupil_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          pupil_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_credentials_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: true
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_goals: {
        Row: {
          created_at: string
          current_value: number | null
          goal_type: string
          id: string
          pupil_id: string
          status: string
          target_date: string | null
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          goal_type?: string
          id?: string
          pupil_id: string
          status?: string
          target_date?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          goal_type?: string
          id?: string
          pupil_id?: string
          status?: string
          target_date?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_goals_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
            foreignKeyName: "pupil_leaderboard_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      pupil_milestones: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          instructor_id: string
          milestone_type: string
          pupil_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          instructor_id: string
          milestone_type: string
          pupil_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          instructor_id?: string
          milestone_type?: string
          pupil_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_milestones_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_milestones_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_milestones_pupil_id_fkey"
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
      pupil_packages: {
        Row: {
          created_at: string
          expires_at: string | null
          hours_purchased: number
          hours_remaining: number
          id: string
          instructor_id: string
          package_id: string
          pupil_id: string
          purchased_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          hours_purchased: number
          hours_remaining: number
          id?: string
          instructor_id: string
          package_id: string
          pupil_id: string
          purchased_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          hours_purchased?: number
          hours_remaining?: number
          id?: string
          instructor_id?: string
          package_id?: string
          pupil_id?: string
          purchased_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "lesson_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_packages_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
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
      pupil_reengagement_log: {
        Row: {
          channel: string
          error: string | null
          id: string
          instructor_id: string
          message_body: string | null
          message_template: string | null
          pupil_id: string
          responded_at: string | null
          resulted_in_booking: boolean | null
          sent_at: string
          status: string
        }
        Insert: {
          channel: string
          error?: string | null
          id?: string
          instructor_id: string
          message_body?: string | null
          message_template?: string | null
          pupil_id: string
          responded_at?: string | null
          resulted_in_booking?: boolean | null
          sent_at?: string
          status?: string
        }
        Update: {
          channel?: string
          error?: string | null
          id?: string
          instructor_id?: string
          message_body?: string | null
          message_template?: string | null
          pupil_id?: string
          responded_at?: string | null
          resulted_in_booking?: boolean | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_reengagement_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_reengagement_log_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_reengagement_log_pupil_id_fkey"
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
          credit_awarded_at: string | null
          id: string
          instructor_id: string
          referral_code: string
          referred_credit_amount: number
          referred_pupil_id: string
          referrer_credit_amount: number
          referrer_pupil_id: string
          status: string | null
        }
        Insert: {
          bonus_points_awarded?: number | null
          completed_at?: string | null
          created_at?: string
          credit_awarded_at?: string | null
          id?: string
          instructor_id: string
          referral_code: string
          referred_credit_amount?: number
          referred_pupil_id: string
          referrer_credit_amount?: number
          referrer_pupil_id: string
          status?: string | null
        }
        Update: {
          bonus_points_awarded?: number | null
          completed_at?: string | null
          created_at?: string
          credit_awarded_at?: string | null
          id?: string
          instructor_id?: string
          referral_code?: string
          referred_credit_amount?: number
          referred_pupil_id?: string
          referrer_credit_amount?: number
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
            foreignKeyName: "pupil_referrals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
            foreignKeyName: "pupil_rewards_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          terms_content_snapshot: string | null
          terms_id: string
          terms_title_snapshot: string | null
          terms_version_snapshot: number | null
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
          terms_content_snapshot?: string | null
          terms_id: string
          terms_title_snapshot?: string | null
          terms_version_snapshot?: number | null
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
          terms_content_snapshot?: string | null
          terms_id?: string
          terms_title_snapshot?: string | null
          terms_version_snapshot?: number | null
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
            foreignKeyName: "pupil_signatures_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      pupil_subscriptions: {
        Row: {
          created_at: string
          day_of_week: number
          duration_minutes: number
          gocardless_customer_id: string | null
          gocardless_mandate_id: string | null
          id: string
          instructor_id: string
          next_lesson_date: string | null
          payment_method: string
          pickup_address: string | null
          pickup_postcode: string | null
          price_per_lesson: number
          pupil_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          duration_minutes?: number
          gocardless_customer_id?: string | null
          gocardless_mandate_id?: string | null
          id?: string
          instructor_id: string
          next_lesson_date?: string | null
          payment_method?: string
          pickup_address?: string | null
          pickup_postcode?: string | null
          price_per_lesson?: number
          pupil_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          duration_minutes?: number
          gocardless_customer_id?: string | null
          gocardless_mandate_id?: string | null
          id?: string
          instructor_id?: string
          next_lesson_date?: string | null
          payment_method?: string
          pickup_address?: string | null
          pickup_postcode?: string | null
          price_per_lesson?: number
          pupil_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupil_subscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_subscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_subscriptions_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_syllabus_progress: {
        Row: {
          competency_id: string
          created_at: string | null
          id: string
          instructor_notes: string | null
          last_practiced: string | null
          level: number | null
          pupil_id: string
          updated_at: string | null
        }
        Insert: {
          competency_id: string
          created_at?: string | null
          id?: string
          instructor_notes?: string | null
          last_practiced?: string | null
          level?: number | null
          pupil_id: string
          updated_at?: string | null
        }
        Update: {
          competency_id?: string
          created_at?: string | null
          id?: string
          instructor_notes?: string | null
          last_practiced?: string | null
          level?: number | null
          pupil_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_syllabus_progress_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      pupil_terms_agreements: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          ip_address: string | null
          pupil_id: string
          signed_at: string | null
          status: string
          template_id: string
          template_version: number
          token: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          ip_address?: string | null
          pupil_id: string
          signed_at?: string | null
          status?: string
          template_id: string
          template_version: number
          token?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          ip_address?: string | null
          pupil_id?: string
          signed_at?: string | null
          status?: string
          template_id?: string
          template_version?: number
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pupil_terms_agreements_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_terms_agreements_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_terms_agreements_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupil_terms_agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "instructor_terms_templates"
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
          address: string | null
          balance_due_date: string | null
          best_driving_score: number | null
          checklist_completed_at: string | null
          churn_risk_score: number | null
          churn_risk_updated_at: string | null
          communication_preference: string | null
          course_status: string
          course_type: string | null
          created_at: string
          current_streak: number | null
          custom_hourly_rate: number | null
          custom_rate_120min: number | null
          custom_rate_90min: number | null
          damoov_device_token: string | null
          date_of_birth: string | null
          deleted_at: string | null
          deposit_forfeited: boolean | null
          deposit_paid: number | null
          drive_coins: number | null
          driver_number: string | null
          dvla_check_code: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          enquiry_id: string | null
          eyesight_checked: boolean | null
          free_lessons_earned: number | null
          free_lessons_used: number | null
          harsh_brake_events_total: number | null
          id: string
          instructor_id: string
          last_trip_at: string | null
          lessons_completed: number | null
          licence_photo_back_url: string | null
          licence_photo_url: string | null
          longest_streak: number | null
          medical_notes: string | null
          monthly_driving_score: number | null
          name: string
          needs_glasses: boolean | null
          next_lesson: string | null
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_portal_enabled: boolean
          pass_report_generated_at: string | null
          pass_report_url: string | null
          payment_method: string
          payment_type: string | null
          phone: string | null
          pickup_address: string | null
          pickup_postcode: string | null
          postcode: string | null
          preferred_days: string[] | null
          preferred_duration_minutes: number | null
          preferred_language: string | null
          preferred_times: string[] | null
          prepaid_hours: number | null
          previous_experience: string | null
          profile_image_url: string | null
          progress: number | null
          referral_code: string | null
          referred_by_pupil_id: string | null
          reminder_preferences: Json | null
          reward_points: number | null
          scheduling_status: string | null
          sex: string | null
          special_needs: string | null
          speeding_events_total: number | null
          status: string
          test_attempts: number | null
          test_centre_id: string | null
          test_date: string | null
          test_passed: boolean | null
          test_result_date: string | null
          test_time: string | null
          theory_cert_number: string | null
          theory_test_date: string | null
          theory_test_passed: boolean | null
          total_distance_km: number | null
          total_driving_minutes: number | null
          total_lessons_for_rewards: number | null
          total_trips: number | null
          transmission_type: string | null
          travel_time_minutes: number | null
          updated_at: string
          weekly_driving_score: number | null
          what3words: string | null
          whatsapp_confirmed_at: string | null
          whatsapp_opt_in: boolean
        }
        Insert: {
          account_balance?: number | null
          address?: string | null
          balance_due_date?: string | null
          best_driving_score?: number | null
          checklist_completed_at?: string | null
          churn_risk_score?: number | null
          churn_risk_updated_at?: string | null
          communication_preference?: string | null
          course_status?: string
          course_type?: string | null
          created_at?: string
          current_streak?: number | null
          custom_hourly_rate?: number | null
          custom_rate_120min?: number | null
          custom_rate_90min?: number | null
          damoov_device_token?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deposit_forfeited?: boolean | null
          deposit_paid?: number | null
          drive_coins?: number | null
          driver_number?: string | null
          dvla_check_code?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enquiry_id?: string | null
          eyesight_checked?: boolean | null
          free_lessons_earned?: number | null
          free_lessons_used?: number | null
          harsh_brake_events_total?: number | null
          id?: string
          instructor_id: string
          last_trip_at?: string | null
          lessons_completed?: number | null
          licence_photo_back_url?: string | null
          licence_photo_url?: string | null
          longest_streak?: number | null
          medical_notes?: string | null
          monthly_driving_score?: number | null
          name: string
          needs_glasses?: boolean | null
          next_lesson?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_portal_enabled?: boolean
          pass_report_generated_at?: string | null
          pass_report_url?: string | null
          payment_method?: string
          payment_type?: string | null
          phone?: string | null
          pickup_address?: string | null
          pickup_postcode?: string | null
          postcode?: string | null
          preferred_days?: string[] | null
          preferred_duration_minutes?: number | null
          preferred_language?: string | null
          preferred_times?: string[] | null
          prepaid_hours?: number | null
          previous_experience?: string | null
          profile_image_url?: string | null
          progress?: number | null
          referral_code?: string | null
          referred_by_pupil_id?: string | null
          reminder_preferences?: Json | null
          reward_points?: number | null
          scheduling_status?: string | null
          sex?: string | null
          special_needs?: string | null
          speeding_events_total?: number | null
          status?: string
          test_attempts?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_passed?: boolean | null
          test_result_date?: string | null
          test_time?: string | null
          theory_cert_number?: string | null
          theory_test_date?: string | null
          theory_test_passed?: boolean | null
          total_distance_km?: number | null
          total_driving_minutes?: number | null
          total_lessons_for_rewards?: number | null
          total_trips?: number | null
          transmission_type?: string | null
          travel_time_minutes?: number | null
          updated_at?: string
          weekly_driving_score?: number | null
          what3words?: string | null
          whatsapp_confirmed_at?: string | null
          whatsapp_opt_in?: boolean
        }
        Update: {
          account_balance?: number | null
          address?: string | null
          balance_due_date?: string | null
          best_driving_score?: number | null
          checklist_completed_at?: string | null
          churn_risk_score?: number | null
          churn_risk_updated_at?: string | null
          communication_preference?: string | null
          course_status?: string
          course_type?: string | null
          created_at?: string
          current_streak?: number | null
          custom_hourly_rate?: number | null
          custom_rate_120min?: number | null
          custom_rate_90min?: number | null
          damoov_device_token?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deposit_forfeited?: boolean | null
          deposit_paid?: number | null
          drive_coins?: number | null
          driver_number?: string | null
          dvla_check_code?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enquiry_id?: string | null
          eyesight_checked?: boolean | null
          free_lessons_earned?: number | null
          free_lessons_used?: number | null
          harsh_brake_events_total?: number | null
          id?: string
          instructor_id?: string
          last_trip_at?: string | null
          lessons_completed?: number | null
          licence_photo_back_url?: string | null
          licence_photo_url?: string | null
          longest_streak?: number | null
          medical_notes?: string | null
          monthly_driving_score?: number | null
          name?: string
          needs_glasses?: boolean | null
          next_lesson?: string | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_portal_enabled?: boolean
          pass_report_generated_at?: string | null
          pass_report_url?: string | null
          payment_method?: string
          payment_type?: string | null
          phone?: string | null
          pickup_address?: string | null
          pickup_postcode?: string | null
          postcode?: string | null
          preferred_days?: string[] | null
          preferred_duration_minutes?: number | null
          preferred_language?: string | null
          preferred_times?: string[] | null
          prepaid_hours?: number | null
          previous_experience?: string | null
          profile_image_url?: string | null
          progress?: number | null
          referral_code?: string | null
          referred_by_pupil_id?: string | null
          reminder_preferences?: Json | null
          reward_points?: number | null
          scheduling_status?: string | null
          sex?: string | null
          special_needs?: string | null
          speeding_events_total?: number | null
          status?: string
          test_attempts?: number | null
          test_centre_id?: string | null
          test_date?: string | null
          test_passed?: boolean | null
          test_result_date?: string | null
          test_time?: string | null
          theory_cert_number?: string | null
          theory_test_date?: string | null
          theory_test_passed?: boolean | null
          total_distance_km?: number | null
          total_driving_minutes?: number | null
          total_lessons_for_rewards?: number | null
          total_trips?: number | null
          transmission_type?: string | null
          travel_time_minutes?: number | null
          updated_at?: string
          weekly_driving_score?: number | null
          what3words?: string | null
          whatsapp_confirmed_at?: string | null
          whatsapp_opt_in?: boolean
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
            foreignKeyName: "pupils_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          {
            foreignKeyName: "push_subscriptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      quartix_auth_cache: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quartix_driver_scores: {
        Row: {
          acceleration_score: number | null
          braking_score: number | null
          cornering_score: number | null
          created_at: string
          fatigue_score: number | null
          id: string
          instructor_id: string
          overall_score: number | null
          pupil_id: string | null
          quartix_driver_id: string
          raw_data: Json | null
          score_date: string
          speed_score: number | null
        }
        Insert: {
          acceleration_score?: number | null
          braking_score?: number | null
          cornering_score?: number | null
          created_at?: string
          fatigue_score?: number | null
          id?: string
          instructor_id: string
          overall_score?: number | null
          pupil_id?: string | null
          quartix_driver_id: string
          raw_data?: Json | null
          score_date: string
          speed_score?: number | null
        }
        Update: {
          acceleration_score?: number | null
          braking_score?: number | null
          cornering_score?: number | null
          created_at?: string
          fatigue_score?: number | null
          id?: string
          instructor_id?: string
          overall_score?: number | null
          pupil_id?: string | null
          quartix_driver_id?: string
          raw_data?: Json | null
          score_date?: string
          speed_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quartix_driver_scores_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quartix_driver_scores_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quartix_driver_scores_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          course_type: string | null
          created_at: string
          deposit_amount: number | null
          email: string | null
          expires_at: string | null
          id: string
          instructor_id: string
          package_details: string | null
          phone: string | null
          postcode: string | null
          price: number
          pupil_name: string
          schedule_notes: string | null
          status: string
          token: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          course_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          email?: string | null
          expires_at?: string | null
          id?: string
          instructor_id: string
          package_details?: string | null
          phone?: string | null
          postcode?: string | null
          price: number
          pupil_name: string
          schedule_notes?: string | null
          status?: string
          token?: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          course_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          email?: string | null
          expires_at?: string | null
          id?: string
          instructor_id?: string
          package_details?: string | null
          phone?: string | null
          postcode?: string | null
          price?: number
          pupil_name?: string
          schedule_notes?: string | null
          status?: string
          token?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      radius_session_cache: {
        Row: {
          access_token: string
          expires_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          expires_at: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          expires_at?: string
          id?: string
          updated_at?: string | null
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
          {
            foreignKeyName: "recurring_expenses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      reflective_logs: {
        Row: {
          created_at: string | null
          id: string
          improvements: string | null
          instructor_response: string | null
          lesson_history_id: string | null
          next_goals: string | null
          pupil_id: string
          updated_at: string | null
          what_went_well: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          improvements?: string | null
          instructor_response?: string | null
          lesson_history_id?: string | null
          next_goals?: string | null
          pupil_id: string
          updated_at?: string | null
          what_went_well?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          improvements?: string | null
          instructor_response?: string | null
          lesson_history_id?: string | null
          next_goals?: string | null
          pupil_id?: string
          updated_at?: string | null
          what_went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflective_logs_lesson_history_id_fkey"
            columns: ["lesson_history_id"]
            isOneToOne: false
            referencedRelation: "lesson_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflective_logs_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
            foreignKeyName: "remote_signing_tokens_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      reschedule_requests: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          lesson_id: string
          original_date: string | null
          original_time: string | null
          pupil_id: string
          reason: string | null
          requested_date: string
          requested_time: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          lesson_id: string
          original_date?: string | null
          original_time?: string | null
          pupil_id: string
          reason?: string | null
          requested_date: string
          requested_time?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          lesson_id?: string
          original_date?: string | null
          original_time?: string | null
          pupil_id?: string
          reason?: string | null
          requested_date?: string
          requested_time?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedule_requests_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          notes: string | null
          points_spent: number
          processed_at: string | null
          pupil_id: string
          reward_type: string
          reward_value: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          notes?: string | null
          points_spent: number
          processed_at?: string | null
          pupil_id: string
          reward_type: string
          reward_value: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          points_spent?: number
          processed_at?: string | null
          pupil_id?: string
          reward_type?: string
          reward_value?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
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
            foreignKeyName: "saved_routes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
          booking_status: string | null
          cancellation_note: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in_responded_at: string | null
          check_in_sent_at: string | null
          check_in_status: string | null
          clash_overridden: boolean
          created_at: string
          deleted_at: string | null
          dropoff_postcode: string | null
          duration_minutes: number
          eol_sent_at: string | null
          examiner_id: string | null
          geotab_trip_id: string | null
          google_event_id: string | null
          id: string
          instructor_id: string
          lesson_date: string
          lesson_miles: number | null
          lesson_type: string
          marked_no_show_at: string | null
          no_show_fee_charged: number | null
          notes: string | null
          original_lesson_id: string | null
          payment_method: string | null
          payment_status: string
          payment_token: string | null
          pickup_location: string | null
          pickup_postcode: string | null
          pickup_what3words: string | null
          planned_competencies: string[] | null
          prepaid_hours_used: number | null
          price_per_hour: number | null
          pupil_id: string
          recurrence_parent_id: string | null
          recurrence_rule: string | null
          reminder_1h_sent_at: string | null
          reminder_24h_sent_at: string | null
          start_time: string
          status: string
          surcharge_amount: number
          test_centre_id: string | null
          trip_auto_linked_at: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount_due?: number | null
          booking_status?: string | null
          cancellation_note?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in_responded_at?: string | null
          check_in_sent_at?: string | null
          check_in_status?: string | null
          clash_overridden?: boolean
          created_at?: string
          deleted_at?: string | null
          dropoff_postcode?: string | null
          duration_minutes?: number
          eol_sent_at?: string | null
          examiner_id?: string | null
          geotab_trip_id?: string | null
          google_event_id?: string | null
          id?: string
          instructor_id: string
          lesson_date: string
          lesson_miles?: number | null
          lesson_type?: string
          marked_no_show_at?: string | null
          no_show_fee_charged?: number | null
          notes?: string | null
          original_lesson_id?: string | null
          payment_method?: string | null
          payment_status?: string
          payment_token?: string | null
          pickup_location?: string | null
          pickup_postcode?: string | null
          pickup_what3words?: string | null
          planned_competencies?: string[] | null
          prepaid_hours_used?: number | null
          price_per_hour?: number | null
          pupil_id: string
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          start_time: string
          status?: string
          surcharge_amount?: number
          test_centre_id?: string | null
          trip_auto_linked_at?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          amount_due?: number | null
          booking_status?: string | null
          cancellation_note?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in_responded_at?: string | null
          check_in_sent_at?: string | null
          check_in_status?: string | null
          clash_overridden?: boolean
          created_at?: string
          deleted_at?: string | null
          dropoff_postcode?: string | null
          duration_minutes?: number
          eol_sent_at?: string | null
          examiner_id?: string | null
          geotab_trip_id?: string | null
          google_event_id?: string | null
          id?: string
          instructor_id?: string
          lesson_date?: string
          lesson_miles?: number | null
          lesson_type?: string
          marked_no_show_at?: string | null
          no_show_fee_charged?: number | null
          notes?: string | null
          original_lesson_id?: string | null
          payment_method?: string | null
          payment_status?: string
          payment_token?: string | null
          pickup_location?: string | null
          pickup_postcode?: string | null
          pickup_what3words?: string | null
          planned_competencies?: string[] | null
          prepaid_hours_used?: number | null
          price_per_hour?: number | null
          pupil_id?: string
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          start_time?: string
          status?: string
          surcharge_amount?: number
          test_centre_id?: string | null
          trip_auto_linked_at?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_lessons_examiner_id_fkey"
            columns: ["examiner_id"]
            isOneToOne: false
            referencedRelation: "examiners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
            foreignKeyName: "scheduled_lessons_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "scheduled_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_lessons_test_centre_id_fkey"
            columns: ["test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
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
      scheduled_reports: {
        Row: {
          config: Json | null
          created_at: string
          email: string
          frequency: string
          id: string
          instructor_id: string
          is_active: boolean
          last_sent_at: string | null
          report_type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          email: string
          frequency?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          last_sent_at?: string | null
          report_type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          last_sent_at?: string | null
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      school_course_instructors: {
        Row: {
          id: string
          instructor_id: string
          school_course_id: string
        }
        Insert: {
          id?: string
          instructor_id: string
          school_course_id: string
        }
        Update: {
          id?: string
          instructor_id?: string
          school_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_course_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_course_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_course_instructors_school_course_id_fkey"
            columns: ["school_course_id"]
            isOneToOne: false
            referencedRelation: "school_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      school_courses: {
        Row: {
          course_hours: number
          course_image_url: string | null
          course_name: string
          created_at: string
          description: string | null
          discounted_price: number | null
          display_order: number
          driving_test_details: string | null
          explainer_video_url: string | null
          features: string[] | null
          full_description: string | null
          id: string
          is_active: boolean
          is_intensive: boolean
          is_popular: boolean
          payment_terms: string | null
          prerequisites: string[] | null
          price: number
          school_id: string
          short_description: string | null
          terms_conditions: string | null
          theory_test_details: string | null
          updated_at: string
          what_to_bring: string[] | null
        }
        Insert: {
          course_hours: number
          course_image_url?: string | null
          course_name: string
          created_at?: string
          description?: string | null
          discounted_price?: number | null
          display_order?: number
          driving_test_details?: string | null
          explainer_video_url?: string | null
          features?: string[] | null
          full_description?: string | null
          id?: string
          is_active?: boolean
          is_intensive?: boolean
          is_popular?: boolean
          payment_terms?: string | null
          prerequisites?: string[] | null
          price: number
          school_id: string
          short_description?: string | null
          terms_conditions?: string | null
          theory_test_details?: string | null
          updated_at?: string
          what_to_bring?: string[] | null
        }
        Update: {
          course_hours?: number
          course_image_url?: string | null
          course_name?: string
          created_at?: string
          description?: string | null
          discounted_price?: number | null
          display_order?: number
          driving_test_details?: string | null
          explainer_video_url?: string | null
          features?: string[] | null
          full_description?: string | null
          id?: string
          is_active?: boolean
          is_intensive?: boolean
          is_popular?: boolean
          payment_terms?: string | null
          prerequisites?: string[] | null
          price?: number
          school_id?: string
          short_description?: string | null
          terms_conditions?: string | null
          theory_test_details?: string | null
          updated_at?: string
          what_to_bring?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "school_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_franchise_fees: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          instructor_id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          school_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          school_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          school_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_franchise_fees_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_franchise_fees_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_franchise_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_franchise_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_instructors: {
        Row: {
          id: string
          instructor_id: string
          joined_at: string
          role: Database["public"]["Enums"]["school_role"]
          school_id: string
        }
        Insert: {
          id?: string
          instructor_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["school_role"]
          school_id: string
        }
        Update: {
          id?: string
          instructor_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["school_role"]
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_instructors_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_instructors_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          school_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          school_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          school_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_website_pages: {
        Row: {
          content_blocks: Json | null
          created_at: string | null
          display_order: number | null
          hero_heading: string | null
          hero_subheading: string | null
          id: string
          is_published: boolean | null
          page_title: string
          page_type: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          content_blocks?: Json | null
          created_at?: string | null
          display_order?: number | null
          hero_heading?: string | null
          hero_subheading?: string | null
          id?: string
          is_published?: boolean | null
          page_title: string
          page_type: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          content_blocks?: Json | null
          created_at?: string | null
          display_order?: number | null
          hero_heading?: string | null
          hero_subheading?: string | null
          id?: string
          is_published?: boolean | null
          page_title?: string
          page_type?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_website_pages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "public_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_website_pages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          brand_colour: string | null
          clearpay_enabled: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          custom_domain: string | null
          description: string | null
          enabled_features: Json
          franchise_fee_amount: number | null
          hero_image_url: string | null
          id: string
          klarna_enabled: boolean
          logo_url: string | null
          name: string
          notification_preferences: Json | null
          own_paypal_client_id: string | null
          own_paypal_secret: string | null
          own_square_access_token: string | null
          own_square_app_id: string | null
          own_square_location_id: string | null
          own_stripe_publishable_key: string | null
          own_stripe_secret_key: string | null
          owner_user_id: string
          payment_gateway_mode: string
          slug: string | null
          updated_at: string
          website_button_color: string | null
          website_font: string | null
          website_footer_bg: string | null
          website_header_bg: string | null
          website_header_style: string | null
          website_theme: string | null
          website_tier: string | null
        }
        Insert: {
          brand_colour?: string | null
          clearpay_enabled?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          enabled_features?: Json
          franchise_fee_amount?: number | null
          hero_image_url?: string | null
          id?: string
          klarna_enabled?: boolean
          logo_url?: string | null
          name: string
          notification_preferences?: Json | null
          own_paypal_client_id?: string | null
          own_paypal_secret?: string | null
          own_square_access_token?: string | null
          own_square_app_id?: string | null
          own_square_location_id?: string | null
          own_stripe_publishable_key?: string | null
          own_stripe_secret_key?: string | null
          owner_user_id: string
          payment_gateway_mode?: string
          slug?: string | null
          updated_at?: string
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_bg?: string | null
          website_header_style?: string | null
          website_theme?: string | null
          website_tier?: string | null
        }
        Update: {
          brand_colour?: string | null
          clearpay_enabled?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          enabled_features?: Json
          franchise_fee_amount?: number | null
          hero_image_url?: string | null
          id?: string
          klarna_enabled?: boolean
          logo_url?: string | null
          name?: string
          notification_preferences?: Json | null
          own_paypal_client_id?: string | null
          own_paypal_secret?: string | null
          own_square_access_token?: string | null
          own_square_app_id?: string | null
          own_square_location_id?: string | null
          own_stripe_publishable_key?: string | null
          own_stripe_secret_key?: string | null
          owner_user_id?: string
          payment_gateway_mode?: string
          slug?: string | null
          updated_at?: string
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_bg?: string | null
          website_header_style?: string | null
          website_theme?: string | null
          website_tier?: string | null
        }
        Relationships: []
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
          claim_expires_at: string | null
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
          queue_position: number | null
          start_time: string
        }
        Insert: {
          claim_expires_at?: string | null
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
          queue_position?: number | null
          start_time: string
        }
        Update: {
          claim_expires_at?: string | null
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
          queue_position?: number | null
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
            foreignKeyName: "slot_offers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      sos_alerts: {
        Row: {
          alert_level: string
          created_at: string
          id: string
          instructor_id: string
          latitude: number | null
          longitude: number | null
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          what3words: string | null
        }
        Insert: {
          alert_level?: string
          created_at?: string
          id?: string
          instructor_id: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          what3words?: string | null
        }
        Update: {
          alert_level?: string
          created_at?: string
          id?: string
          instructor_id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          what3words?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      speed_limit_cache: {
        Row: {
          expires_at: string
          fetched_at: string
          grid_lat: number
          grid_lng: number
          id: string
          road_name: string | null
          road_type: string | null
          source: string | null
          speed_limit_kmh: number
        }
        Insert: {
          expires_at?: string
          fetched_at?: string
          grid_lat: number
          grid_lng: number
          id?: string
          road_name?: string | null
          road_type?: string | null
          source?: string | null
          speed_limit_kmh: number
        }
        Update: {
          expires_at?: string
          fetched_at?: string
          grid_lat?: number
          grid_lng?: number
          id?: string
          road_name?: string | null
          road_type?: string | null
          source?: string | null
          speed_limit_kmh?: number
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          gocardless_payment_id: string | null
          id: string
          instructor_id: string
          payment_date: string | null
          period_end: string | null
          period_start: string | null
          receipt_sent: boolean
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          gocardless_payment_id?: string | null
          id?: string
          instructor_id: string
          payment_date?: string | null
          period_end?: string | null
          period_start?: string | null
          receipt_sent?: boolean
          status?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          gocardless_payment_id?: string | null
          id?: string
          instructor_id?: string
          payment_date?: string | null
          period_end?: string | null
          period_start?: string | null
          receipt_sent?: boolean
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          base_price_monthly: number | null
          billing_interval_months: number
          commission_fixed_pence: number | null
          commission_rate_percent: number | null
          created_at: string | null
          cta_text: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          gocardless_plan_id: string | null
          id: string
          is_active: boolean | null
          is_per_seat: boolean | null
          is_popular: boolean | null
          max_pupils: number | null
          min_seats: number | null
          name: string
          payout_speed: string | null
          per_seat_price_monthly: number | null
          price_monthly: number
          price_yearly: number | null
          show_contact_us: boolean
          slug: string
          sms_credits_monthly: number | null
          square_plan_variation_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_price_monthly?: number | null
          billing_interval_months?: number
          commission_fixed_pence?: number | null
          commission_rate_percent?: number | null
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          gocardless_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          is_per_seat?: boolean | null
          is_popular?: boolean | null
          max_pupils?: number | null
          min_seats?: number | null
          name: string
          payout_speed?: string | null
          per_seat_price_monthly?: number | null
          price_monthly?: number
          price_yearly?: number | null
          show_contact_us?: boolean
          slug: string
          sms_credits_monthly?: number | null
          square_plan_variation_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price_monthly?: number | null
          billing_interval_months?: number
          commission_fixed_pence?: number | null
          commission_rate_percent?: number | null
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          gocardless_plan_id?: string | null
          id?: string
          is_active?: boolean | null
          is_per_seat?: boolean | null
          is_popular?: boolean | null
          max_pupils?: number | null
          min_seats?: number | null
          name?: string
          payout_speed?: string | null
          per_seat_price_monthly?: number | null
          price_monthly?: number
          price_yearly?: number | null
          show_contact_us?: boolean
          slug?: string
          sms_credits_monthly?: number | null
          square_plan_variation_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_save_offers: {
        Row: {
          accepted_at: string | null
          created_at: string
          declined_at: string | null
          expires_at: string
          from_plan_slug: string
          id: string
          instructor_id: string
          offer_type: string
          offer_value: Json | null
          shown_at: string
          to_plan_slug: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          from_plan_slug: string
          id?: string
          instructor_id: string
          offer_type: string
          offer_value?: Json | null
          shown_at?: string
          to_plan_slug: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          from_plan_slug?: string
          id?: string
          instructor_id?: string
          offer_type?: string
          offer_value?: Json | null
          shown_at?: string
          to_plan_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_save_offers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_save_offers_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_templates: {
        Row: {
          competencies: Json
          created_at: string | null
          id: string
          instructor_id: string | null
          is_default: boolean | null
          is_shared: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          competencies?: Json
          created_at?: string | null
          id?: string
          instructor_id?: string | null
          is_default?: boolean | null
          is_shared?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          competencies?: Json
          created_at?: string | null
          id?: string
          instructor_id?: string | null
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      team_channel_members: {
        Row: {
          channel_id: string
          id: string
          instructor_id: string
          joined_at: string
        }
        Insert: {
          channel_id: string
          id?: string
          instructor_id: string
          joined_at?: string
        }
        Update: {
          channel_id?: string
          id?: string
          instructor_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channel_members_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channel_members_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      team_channel_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          sender_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          sender_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channel_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channel_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      team_channels: {
        Row: {
          channel_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          name: string
        }
        Insert: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
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
          related_competency_id: string | null
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
          related_competency_id?: string | null
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
          related_competency_id?: string | null
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
          is_speeding: boolean | null
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
          is_speeding?: boolean | null
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
          is_speeding?: boolean | null
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
      test_requests: {
        Row: {
          created_at: string
          created_by_type: string
          date_range_end: string | null
          id: string
          instructor_id: string
          notes: string | null
          pupil_id: string | null
          request_type: string
          status: string
          test_centre_id: string | null
          test_centre_name: string | null
          test_date: string
          test_time: string
          time_range_end: string | null
          updated_at: string
          willing_to_pay_swap_fee: boolean
        }
        Insert: {
          created_at?: string
          created_by_type?: string
          date_range_end?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          pupil_id?: string | null
          request_type?: string
          status?: string
          test_centre_id?: string | null
          test_centre_name?: string | null
          test_date: string
          test_time: string
          time_range_end?: string | null
          updated_at?: string
          willing_to_pay_swap_fee?: boolean
        }
        Update: {
          created_at?: string
          created_by_type?: string
          date_range_end?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          pupil_id?: string | null
          request_type?: string
          status?: string
          test_centre_id?: string | null
          test_centre_name?: string | null
          test_date?: string
          test_time?: string
          time_range_end?: string | null
          updated_at?: string
          willing_to_pay_swap_fee?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "test_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_requests_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_requests_test_centre_id_fkey"
            columns: ["test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      test_slot_reservations: {
        Row: {
          centre: string
          created_at: string | null
          date: string
          id: string
          instructor_id: string
          status: string
          time: string
        }
        Insert: {
          centre: string
          created_at?: string | null
          date: string
          id?: string
          instructor_id: string
          status?: string
          time: string
        }
        Update: {
          centre?: string
          created_at?: string | null
          date?: string
          id?: string
          instructor_id?: string
          status?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_slot_reservations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_slot_reservations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      test_slot_watches: {
        Row: {
          created_at: string
          current_test_date: string | null
          id: string
          instructor_id: string
          notified_at: string | null
          preferred_dates: Json | null
          pupil_id: string | null
          status: string
          test_centre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_test_date?: string | null
          id?: string
          instructor_id: string
          notified_at?: string | null
          preferred_dates?: Json | null
          pupil_id?: string | null
          status?: string
          test_centre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_test_date?: string | null
          id?: string
          instructor_id?: string
          notified_at?: string | null
          preferred_dates?: Json | null
          pupil_id?: string | null
          status?: string
          test_centre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_slot_watches_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_slot_watches_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_slot_watches_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      test_swap_offers: {
        Row: {
          created_at: string
          id: string
          message: string | null
          offered_by_admin: boolean
          offered_by_instructor_id: string | null
          offered_test_centre_id: string | null
          offered_test_centre_name: string | null
          offered_test_date: string
          offered_test_time: string
          status: string
          test_request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          offered_by_admin?: boolean
          offered_by_instructor_id?: string | null
          offered_test_centre_id?: string | null
          offered_test_centre_name?: string | null
          offered_test_date: string
          offered_test_time: string
          status?: string
          test_request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          offered_by_admin?: boolean
          offered_by_instructor_id?: string | null
          offered_test_centre_id?: string | null
          offered_test_centre_name?: string | null
          offered_test_date?: string
          offered_test_time?: string
          status?: string
          test_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_swap_offers_offered_by_instructor_id_fkey"
            columns: ["offered_by_instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_swap_offers_offered_by_instructor_id_fkey"
            columns: ["offered_by_instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_swap_offers_offered_test_centre_id_fkey"
            columns: ["offered_test_centre_id"]
            isOneToOne: false
            referencedRelation: "test_centres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_swap_offers_test_request_id_fkey"
            columns: ["test_request_id"]
            isOneToOne: false
            referencedRelation: "test_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_mock_results: {
        Row: {
          category_breakdown: Json | null
          created_at: string
          id: string
          passed: boolean
          pupil_id: string
          score: number
          time_taken_seconds: number | null
          total_questions: number
        }
        Insert: {
          category_breakdown?: Json | null
          created_at?: string
          id?: string
          passed?: boolean
          pupil_id: string
          score: number
          time_taken_seconds?: number | null
          total_questions: number
        }
        Update: {
          category_breakdown?: Json | null
          created_at?: string
          id?: string
          passed?: boolean
          pupil_id?: string
          score?: number
          time_taken_seconds?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "theory_mock_results_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_mock_scores: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          notes: string | null
          pupil_id: string
          score: number
          source: string | null
          test_date: string
          test_type: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          notes?: string | null
          pupil_id: string
          score: number
          source?: string | null
          test_date?: string
          test_type?: string
          total_questions?: number
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          notes?: string | null
          pupil_id?: string
          score?: number
          source?: string | null
          test_date?: string
          test_type?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "theory_mock_scores_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_mock_scores_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_mock_scores_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      theory_questions: {
        Row: {
          category: string
          correct_index: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_active: boolean
          options: Json
          question: string
        }
        Insert: {
          category: string
          correct_index: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options: Json
          question: string
        }
        Update: {
          category?: string
          correct_index?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question?: string
        }
        Relationships: []
      }
      theory_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_practice_date: string | null
          longest_streak: number
          pupil_id: string
          total_xp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          pupil_id: string
          total_xp?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          pupil_id?: string
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      theory_test_attempts: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          instructor_id: string
          passed: boolean
          pupil_id: string
          test_type: string
          time_taken_seconds: number | null
          total_questions: number
          weak_categories: Json | null
        }
        Insert: {
          correct_answers: number
          created_at?: string
          id?: string
          instructor_id: string
          passed?: boolean
          pupil_id: string
          test_type?: string
          time_taken_seconds?: number | null
          total_questions: number
          weak_categories?: Json | null
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          instructor_id?: string
          passed?: boolean
          pupil_id?: string
          test_type?: string
          time_taken_seconds?: number | null
          total_questions?: number
          weak_categories?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "theory_test_attempts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_test_attempts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theory_test_attempts_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      tile_health_checks: {
        Row: {
          checked_at: string
          details: Json | null
          id: string
          instructor_id: string | null
          latency_ms: number | null
          source: string
          status: string
        }
        Insert: {
          checked_at?: string
          details?: Json | null
          id?: string
          instructor_id?: string | null
          latency_ms?: number | null
          source: string
          status: string
        }
        Update: {
          checked_at?: string
          details?: Json | null
          id?: string
          instructor_id?: string | null
          latency_ms?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      urgent_alerts: {
        Row: {
          created_at: string
          created_by: string | null
          dismissed_at: string | null
          id: string
          instructor_id: string | null
          is_broadcast: boolean
          message: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dismissed_at?: string | null
          id?: string
          instructor_id?: string | null
          is_broadcast?: boolean
          message: string
          severity?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dismissed_at?: string | null
          id?: string
          instructor_id?: string | null
          is_broadcast?: boolean
          message?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "urgent_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urgent_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
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
      vehicle_security_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          device_id: string | null
          id: string
          instructor_id: string
          latitude: number | null
          longitude: number | null
          notification_sent: boolean
          speed_kmh: number | null
          triggered_at: string
          vehicle_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          device_id?: string | null
          id?: string
          instructor_id: string
          latitude?: number | null
          longitude?: number | null
          notification_sent?: boolean
          speed_kmh?: number | null
          triggered_at?: string
          vehicle_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          device_id?: string | null
          id?: string
          instructor_id?: string
          latitude?: number | null
          longitude?: number | null
          notification_sent?: boolean
          speed_kmh?: number | null
          triggered_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_security_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "gps_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_security_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_security_alerts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_security_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_security_settings: {
        Row: {
          alert_cooldown_minutes: number
          created_at: string
          id: string
          instructor_id: string
          movement_threshold_kmh: number
          notify_on_ignition: boolean
          security_enabled: boolean
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          alert_cooldown_minutes?: number
          created_at?: string
          id?: string
          instructor_id: string
          movement_threshold_kmh?: number
          notify_on_ignition?: boolean
          security_enabled?: boolean
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          alert_cooldown_minutes?: number
          created_at?: string
          id?: string
          instructor_id?: string
          movement_threshold_kmh?: number
          notify_on_ignition?: boolean
          security_enabled?: boolean
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_security_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_security_settings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_security_settings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_service_history: {
        Row: {
          cost_gbp: number | null
          created_at: string | null
          custom_name: string | null
          id: string
          instructor_id: string
          notes: string | null
          odometer_km: number | null
          provider: string | null
          receipt_url: string | null
          reminder_id: string | null
          service_date: string
          service_type: Database["public"]["Enums"]["service_type"]
          vehicle_id: string
        }
        Insert: {
          cost_gbp?: number | null
          created_at?: string | null
          custom_name?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          odometer_km?: number | null
          provider?: string | null
          receipt_url?: string | null
          reminder_id?: string | null
          service_date: string
          service_type: Database["public"]["Enums"]["service_type"]
          vehicle_id: string
        }
        Update: {
          cost_gbp?: number | null
          created_at?: string | null
          custom_name?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          odometer_km?: number | null
          provider?: string | null
          receipt_url?: string | null
          reminder_id?: string | null
          service_date?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_service_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_history_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "vehicle_service_reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_service_reminders: {
        Row: {
          auto_created: boolean | null
          created_at: string | null
          custom_name: string | null
          id: string
          instructor_id: string
          interval_engine_hours: number | null
          interval_km: number | null
          interval_months: number | null
          is_active: boolean | null
          last_service_date: string | null
          last_service_engine_hours: number | null
          last_service_km: number | null
          next_due_date: string | null
          next_due_engine_hours: number | null
          next_due_km: number | null
          reminder_days_before: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          auto_created?: boolean | null
          created_at?: string | null
          custom_name?: string | null
          id?: string
          instructor_id: string
          interval_engine_hours?: number | null
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean | null
          last_service_date?: string | null
          last_service_engine_hours?: number | null
          last_service_km?: number | null
          next_due_date?: string | null
          next_due_engine_hours?: number | null
          next_due_km?: number | null
          reminder_days_before?: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          auto_created?: boolean | null
          created_at?: string | null
          custom_name?: string | null
          id?: string
          instructor_id?: string
          interval_engine_hours?: number | null
          interval_km?: number | null
          interval_months?: number | null
          is_active?: boolean | null
          last_service_date?: string | null
          last_service_engine_hours?: number | null
          last_service_km?: number | null
          next_due_date?: string | null
          next_due_engine_hours?: number | null
          next_due_km?: number | null
          reminder_days_before?: number | null
          service_type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_service_reminders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_reminders_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_reminders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "instructor_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_room_config: {
        Row: {
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
          zoom_link: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          zoom_link?: string
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          zoom_link?: string
        }
        Relationships: []
      }
      waiting_room_sessions: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_cancelled: boolean
          notes: string | null
          session_date: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_cancelled?: boolean
          notes?: string | null
          session_date: string
          start_time: string
          title?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_cancelled?: boolean
          notes?: string | null
          session_date?: string
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          instructor_id: string
          name: string
          notes: string | null
          notified_at: string | null
          phone: string | null
          preferred_days: string[] | null
          preferred_times: string[] | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          instructor_id: string
          name: string
          notes?: string | null
          notified_at?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          instructor_id?: string
          name?: string
          notes?: string | null
          notified_at?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      waiver_signatures: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          ip_address: string | null
          parent_email: string | null
          parent_name: string | null
          pupil_id: string
          signature_data: string | null
          signed_at: string
          waiver_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          ip_address?: string | null
          parent_email?: string | null
          parent_name?: string | null
          pupil_id: string
          signature_data?: string | null
          signed_at?: string
          waiver_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          ip_address?: string | null
          parent_email?: string | null
          parent_name?: string | null
          pupil_id?: string
          signature_data?: string | null
          signed_at?: string
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiver_signatures_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_signatures_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_signatures_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_signatures_waiver_id_fkey"
            columns: ["waiver_id"]
            isOneToOne: false
            referencedRelation: "digital_waivers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          ai_enabled: boolean
          created_at: string
          id: string
          instructor_id: string | null
          last_message_at: string | null
          muted_at: string | null
          phone_number: string
          pupil_id: string | null
          visitor_name: string | null
        }
        Insert: {
          ai_enabled?: boolean
          created_at?: string
          id?: string
          instructor_id?: string | null
          last_message_at?: string | null
          muted_at?: string | null
          phone_number: string
          pupil_id?: string | null
          visitor_name?: string | null
        }
        Update: {
          ai_enabled?: boolean
          created_at?: string
          id?: string
          instructor_id?: string | null
          last_message_at?: string | null
          muted_at?: string | null
          phone_number?: string
          pupil_id?: string | null
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          delivery_status: string
          direction: string
          id: string
          media_mime: string | null
          media_type: string | null
          media_url: string | null
          read_at: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          delivery_status?: string
          direction?: string
          id?: string
          media_mime?: string | null
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          delivery_status?: string
          direction?: string
          id?: string
          media_mime?: string | null
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body_text: string
          category: string
          created_at: string
          id: string
          instructor_id: string
          language: string
          meta_template_id: string | null
          name: string
          rejection_reason: string | null
          status: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body_text: string
          category?: string
          created_at?: string
          id?: string
          instructor_id: string
          language?: string
          meta_template_id?: string | null
          name: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_text?: string
          category?: string
          created_at?: string
          id?: string
          instructor_id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      famulor_daily_stats: {
        Row: {
          call_count: number | null
          completed_count: number | null
          day: string | null
          direction: string | null
          failed_count: number | null
          instructor_id: string | null
          no_answer_count: number | null
          purpose: string | null
          total_cost_pence: number | null
          total_duration_seconds: number | null
        }
        Relationships: [
          {
            foreignKeyName: "famulor_call_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "famulor_call_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "public_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      public_instructors: {
        Row: {
          allowed_lesson_lengths: number[] | null
          app_slug: string | null
          available_from: string | null
          bank_holiday_surcharge_amount: number | null
          bio: string | null
          booking_advance_days: number | null
          booking_mode: string | null
          brand_colour: string | null
          buffer_minutes: number | null
          business_name: string | null
          cancellation_charge_percent: number | null
          cancellation_policy_hours: number | null
          cancellation_policy_text: string | null
          car_image_url: string | null
          car_make: string | null
          car_model: string | null
          car_type: string | null
          clearpay_enabled: boolean | null
          cpd_certified: boolean | null
          created_at: string | null
          custom_branding_enabled: boolean | null
          custom_domain: string | null
          custom_domain_verified: boolean | null
          deposit_amount: number | null
          deposit_deadline_days: number | null
          deposit_enabled: boolean | null
          email: string | null
          extra_info: string | null
          facebook_url: string | null
          hero_image_url: string | null
          hero_overlay_color: string | null
          hero_overlay_opacity: number | null
          hero_show_logo: boolean | null
          home_postcode: string | null
          hourly_rate: number | null
          id: string | null
          instagram_url: string | null
          instructor_grade: string | null
          is_active: boolean | null
          klarna_enabled: boolean | null
          lat: number | null
          linkedin_url: string | null
          lng: number | null
          location_name: string | null
          logo_url: string | null
          name: string | null
          odd_hours_end: string | null
          odd_hours_start: string | null
          odd_hours_surcharge_amount: number | null
          personal_website_url: string | null
          phone: string | null
          preferred_lesson_length: number | null
          profile_image_url: string | null
          pupil_app_dark_mode: boolean | null
          pupil_app_enabled: boolean | null
          radius_miles: number | null
          secondary_colour: string | null
          special_skills: string | null
          twitter_url: string | null
          website_button_color: string | null
          website_font: string | null
          website_footer_bg: string | null
          website_header_bg: string | null
          website_header_style: string | null
          website_heading_color: string | null
          website_menu_text_color: string | null
          website_text_color: string | null
          website_theme: string | null
          weekend_surcharge_amount: number | null
          welcome_video_url: string | null
        }
        Insert: {
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          available_from?: string | null
          bank_holiday_surcharge_amount?: number | null
          bio?: string | null
          booking_advance_days?: number | null
          booking_mode?: string | null
          brand_colour?: string | null
          buffer_minutes?: number | null
          business_name?: string | null
          cancellation_charge_percent?: number | null
          cancellation_policy_hours?: number | null
          cancellation_policy_text?: string | null
          car_image_url?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          clearpay_enabled?: boolean | null
          cpd_certified?: boolean | null
          created_at?: string | null
          custom_branding_enabled?: boolean | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          deposit_amount?: number | null
          deposit_deadline_days?: number | null
          deposit_enabled?: boolean | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          hero_overlay_color?: string | null
          hero_overlay_opacity?: number | null
          hero_show_logo?: boolean | null
          home_postcode?: string | null
          hourly_rate?: number | null
          id?: string | null
          instagram_url?: string | null
          instructor_grade?: string | null
          is_active?: boolean | null
          klarna_enabled?: boolean | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          location_name?: string | null
          logo_url?: string | null
          name?: string | null
          odd_hours_end?: string | null
          odd_hours_start?: string | null
          odd_hours_surcharge_amount?: number | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_lesson_length?: number | null
          profile_image_url?: string | null
          pupil_app_dark_mode?: boolean | null
          pupil_app_enabled?: boolean | null
          radius_miles?: number | null
          secondary_colour?: string | null
          special_skills?: string | null
          twitter_url?: string | null
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_bg?: string | null
          website_header_style?: string | null
          website_heading_color?: string | null
          website_menu_text_color?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          weekend_surcharge_amount?: number | null
          welcome_video_url?: string | null
        }
        Update: {
          allowed_lesson_lengths?: number[] | null
          app_slug?: string | null
          available_from?: string | null
          bank_holiday_surcharge_amount?: number | null
          bio?: string | null
          booking_advance_days?: number | null
          booking_mode?: string | null
          brand_colour?: string | null
          buffer_minutes?: number | null
          business_name?: string | null
          cancellation_charge_percent?: number | null
          cancellation_policy_hours?: number | null
          cancellation_policy_text?: string | null
          car_image_url?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          clearpay_enabled?: boolean | null
          cpd_certified?: boolean | null
          created_at?: string | null
          custom_branding_enabled?: boolean | null
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          deposit_amount?: number | null
          deposit_deadline_days?: number | null
          deposit_enabled?: boolean | null
          email?: string | null
          extra_info?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          hero_overlay_color?: string | null
          hero_overlay_opacity?: number | null
          hero_show_logo?: boolean | null
          home_postcode?: string | null
          hourly_rate?: number | null
          id?: string | null
          instagram_url?: string | null
          instructor_grade?: string | null
          is_active?: boolean | null
          klarna_enabled?: boolean | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          location_name?: string | null
          logo_url?: string | null
          name?: string | null
          odd_hours_end?: string | null
          odd_hours_start?: string | null
          odd_hours_surcharge_amount?: number | null
          personal_website_url?: string | null
          phone?: string | null
          preferred_lesson_length?: number | null
          profile_image_url?: string | null
          pupil_app_dark_mode?: boolean | null
          pupil_app_enabled?: boolean | null
          radius_miles?: number | null
          secondary_colour?: string | null
          special_skills?: string | null
          twitter_url?: string | null
          website_button_color?: string | null
          website_font?: string | null
          website_footer_bg?: string | null
          website_header_bg?: string | null
          website_header_style?: string | null
          website_heading_color?: string | null
          website_menu_text_color?: string | null
          website_text_color?: string | null
          website_theme?: string | null
          weekend_surcharge_amount?: number | null
          welcome_video_url?: string | null
        }
        Relationships: []
      }
      public_schools: {
        Row: {
          brand_colour: string | null
          description: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          brand_colour?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          brand_colour?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      pupil_weekly_streaks: {
        Row: {
          last_active_week: string | null
          pupil_id: string | null
          total_active_weeks: number | null
          total_lessons: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_lessons_pupil_id_fkey"
            columns: ["pupil_id"]
            isOneToOne: false
            referencedRelation: "pupils"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      audit_list_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      auto_cleanup_stale_sessions: { Args: never; Returns: undefined }
      award_course_completion_bonus: {
        Args: { p_instructor_id: string; p_pupil_id: string }
        Returns: boolean
      }
      check_save_offer_eligibility: {
        Args: { p_instructor_id: string }
        Returns: boolean
      }
      claim_cover_offer: { Args: { p_offer_id: string }; Returns: Json }
      cleanup_expired_otp_codes: { Args: never; Returns: undefined }
      cleanup_expired_parent_otp_codes: { Args: never; Returns: undefined }
      generate_calendar_share_token: { Args: never; Returns: string }
      generate_domain_verification_token: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_unique_instructor_slug: {
        Args: { p_source: string }
        Returns: string
      }
      get_instructor_id_for_user: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_pupil_payment_info: {
        Args: { p_instructor_id: string; p_pupil_id: string }
        Returns: {
          email: string
          name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_pupil_balance: {
        Args: { p_amount: number; p_pupil_id: string }
        Returns: number
      }
      increment_total_distance: {
        Args: { p_distance: number; p_id: string }
        Returns: undefined
      }
      increment_vehicle_odometer: {
        Args: { p_distance_km: number; p_vehicle_id: string }
        Returns: undefined
      }
      is_school_owner: { Args: { p_school_id: string }; Returns: boolean }
      log_custom_domain_event: {
        Args: {
          p_domain: string
          p_event: string
          p_instructor_id: string
          p_metadata?: Json
          p_notes?: string
        }
        Returns: undefined
      }
      record_phone_gps_point: {
        Args: {
          p_accuracy?: number
          p_distance_delta_km?: number
          p_heading?: number
          p_latitude: number
          p_longitude: number
          p_road_name?: string
          p_session_id: string
          p_speed_kmh?: number
          p_speed_limit_kmh?: number
        }
        Returns: string
      }
      update_live_position:
        | {
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
        | {
            Args: {
              p_accuracy?: number
              p_heading?: number
              p_latitude: number
              p_longitude: number
              p_pupil_id: string
              p_session_id?: string
              p_speed_kmh?: number
              p_speed_limit_kmh?: number
              p_trip_status?: string
            }
            Returns: string
          }
      update_pupil_profile: {
        Args: { p_pupil_id: string; p_updates: Json }
        Returns: boolean
      }
      upsert_phone_live_position:
        | {
            Args: {
              p_accuracy?: number
              p_battery_level?: number
              p_heading?: number
              p_latitude: number
              p_longitude: number
              p_provider?: string
              p_pupil_id: string
              p_session_id?: string
              p_speed_kmh?: number
            }
            Returns: string
          }
        | {
            Args: {
              p_accuracy?: number
              p_battery_level?: number
              p_heading?: number
              p_latitude: number
              p_longitude: number
              p_provider?: string
              p_pupil_id: string
              p_session_id?: string
              p_speed_kmh?: number
              p_speed_limit_kmh?: number
            }
            Returns: string
          }
    }
    Enums: {
      app_role: "instructor" | "admin" | "pupil" | "school_manager"
      automation_action:
        | "send_sms"
        | "send_email"
        | "add_note"
        | "move_pipeline"
        | "create_todo"
      automation_trigger:
        | "lesson_completed"
        | "cancellation"
        | "no_show"
        | "test_passed"
        | "payment_overdue"
        | "new_enquiry"
      availability_rule_type:
        | "recurring_exception"
        | "holiday_block"
        | "seasonal"
      friendship_status: "pending" | "accepted" | "declined"
      payment_dispute_status: "open" | "resolved" | "dismissed"
      phone_number_provider: "twilio_provisioned" | "byo_forwarded"
      phone_number_routing_mode: "ai" | "mobile" | "schedule"
      phone_number_status: "active" | "releasing" | "released"
      pipeline_stage:
        | "new_lead"
        | "contacted"
        | "quoted"
        | "booked"
        | "active"
        | "test_passed"
        | "lost"
      school_role: "school_owner" | "school_admin" | "instructor"
      service_type:
        | "oil_change"
        | "full_service"
        | "mot"
        | "tire_rotation"
        | "brake_check"
        | "air_filter"
        | "coolant_flush"
        | "transmission"
        | "other"
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
      app_role: ["instructor", "admin", "pupil", "school_manager"],
      automation_action: [
        "send_sms",
        "send_email",
        "add_note",
        "move_pipeline",
        "create_todo",
      ],
      automation_trigger: [
        "lesson_completed",
        "cancellation",
        "no_show",
        "test_passed",
        "payment_overdue",
        "new_enquiry",
      ],
      availability_rule_type: [
        "recurring_exception",
        "holiday_block",
        "seasonal",
      ],
      friendship_status: ["pending", "accepted", "declined"],
      payment_dispute_status: ["open", "resolved", "dismissed"],
      phone_number_provider: ["twilio_provisioned", "byo_forwarded"],
      phone_number_routing_mode: ["ai", "mobile", "schedule"],
      phone_number_status: ["active", "releasing", "released"],
      pipeline_stage: [
        "new_lead",
        "contacted",
        "quoted",
        "booked",
        "active",
        "test_passed",
        "lost",
      ],
      school_role: ["school_owner", "school_admin", "instructor"],
      service_type: [
        "oil_change",
        "full_service",
        "mot",
        "tire_rotation",
        "brake_check",
        "air_filter",
        "coolant_flush",
        "transmission",
        "other",
      ],
    },
  },
} as const
