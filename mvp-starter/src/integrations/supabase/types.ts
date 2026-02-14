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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      challenges: {
        Row: {
          badge_reward_id: string | null
          created_at: string
          description: string
          end_date: string
          goal_type: string
          goal_value: number
          id: string
          is_active: boolean
          name: string
          start_date: string
          type: string
          xp_reward: number
        }
        Insert: {
          badge_reward_id?: string | null
          created_at?: string
          description: string
          end_date: string
          goal_type: string
          goal_value: number
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          type: string
          xp_reward: number
        }
        Update: {
          badge_reward_id?: string | null
          created_at?: string
          description?: string
          end_date?: string
          goal_type?: string
          goal_value?: number
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          type?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenges_badge_reward_id_fkey"
            columns: ["badge_reward_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          ebook_id: string
          end_page: number
          id: string
          start_page: number
          title: string
        }
        Insert: {
          chapter_number: number
          ebook_id: string
          end_page: number
          id?: string
          start_page: number
          title: string
        }
        Update: {
          chapter_number?: number
          ebook_id?: string
          end_page?: number
          id?: string
          start_page?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      community_creations: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          ebook_id: string | null
          id: string
          image_url: string
          ingredients: Json | null
          is_featured: boolean
          likes_count: number
          saves_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          ebook_id?: string | null
          id?: string
          image_url: string
          ingredients?: Json | null
          is_featured?: boolean
          likes_count?: number
          saves_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          ebook_id?: string | null
          id?: string
          image_url?: string
          ingredients?: Json | null
          is_featured?: boolean
          likes_count?: number
          saves_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_creations_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_creations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_creations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          is_public: boolean
          likes_count: number
          media_urls: string[] | null
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          media_urls?: string[] | null
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          media_urls?: string[] | null
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation: {
        Row: {
          ai_analysis: string | null
          ai_score: number | null
          content_id: string
          content_type: string
          created_at: string
          flags: Json | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_score?: number | null
          content_id: string
          content_type: string
          created_at?: string
          flags?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          flags?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      creation_likes: {
        Row: {
          created_at: string
          creation_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creation_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creation_likes_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "community_creations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creation_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creation_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reading_stats: {
        Row: {
          books_completed: number | null
          created_at: string | null
          date: string
          id: string
          pages_read: number | null
          reading_time_minutes: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          books_completed?: number | null
          created_at?: string | null
          date?: string
          id?: string
          pages_read?: number | null
          reading_time_minutes?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          books_completed?: number | null
          created_at?: string | null
          date?: string
          id?: string
          pages_read?: number | null
          reading_time_minutes?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      ebook_questions: {
        Row: {
          created_at: string
          ebook_id: string
          helpful_count: number
          id: string
          is_answered: boolean
          question: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          ebook_id: string
          helpful_count?: number
          id?: string
          is_answered?: boolean
          question: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          ebook_id?: string
          helpful_count?: number
          id?: string
          is_answered?: boolean
          question?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ebook_questions_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ebook_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ebook_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          author: string | null
          category: string | null
          cover_url: string
          created_at: string | null
          current_price: number | null
          description: string | null
          discount_percentage: number | null
          estimated_reading_time: number | null
          id: string
          is_active: boolean | null
          original_price: number | null
          pdf_url: string
          purchase_url: string | null
          sample_pdf_url: string | null
          subtitle: string | null
          tags: string[] | null
          title: string
          total_pages: number
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          cover_url: string
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          discount_percentage?: number | null
          estimated_reading_time?: number | null
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          pdf_url: string
          purchase_url?: string | null
          sample_pdf_url?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title: string
          total_pages: number
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          cover_url?: string
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          discount_percentage?: number | null
          estimated_reading_time?: number | null
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          pdf_url?: string
          purchase_url?: string | null
          sample_pdf_url?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          total_pages?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      license_usage: {
        Row: {
          domain: string
          id: string
          last_check_at: string
          license_key: string
          metadata: Json | null
          user_count: number | null
        }
        Insert: {
          domain: string
          id?: string
          last_check_at?: string
          license_key: string
          metadata?: Json | null
          user_count?: number | null
        }
        Update: {
          domain?: string
          id?: string
          last_check_at?: string
          license_key?: string
          metadata?: Json | null
          user_count?: number | null
        }
        Relationships: []
      }
      licenses: {
        Row: {
          allowed_domains: string[]
          created_at: string
          expires_at: string | null
          id: string
          license_key: string
          max_users: number | null
          metadata: Json | null
          owner_email: string
          owner_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          allowed_domains?: string[]
          created_at?: string
          expires_at?: string | null
          id?: string
          license_key: string
          max_users?: number | null
          metadata?: Json | null
          owner_email: string
          owner_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          allowed_domains?: string[]
          created_at?: string
          expires_at?: string | null
          id?: string
          license_key?: string
          max_users?: number | null
          metadata?: Json | null
          owner_email?: string
          owner_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_activity: {
        Row: {
          activity_type: string
          created_at: string
          ebook_id: string
          id: string
          user_location: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          ebook_id: string
          id?: string
          user_location?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          ebook_id?: string
          id?: string
          user_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_activity_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_purchases: {
        Row: {
          amount: number | null
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          ebook_id: string | null
          ebook_name: string | null
          email: string
          id: string
          offer_id: string | null
          paid_at: string | null
          product_id: string | null
          raw_payload: Json | null
          transaction_id: string
        }
        Insert: {
          amount?: number | null
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          ebook_id?: string | null
          ebook_name?: string | null
          email: string
          id?: string
          offer_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          raw_payload?: Json | null
          transaction_id: string
        }
        Update: {
          amount?: number | null
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          ebook_id?: string | null
          ebook_name?: string | null
          email?: string
          id?: string
          offer_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          raw_payload?: Json | null
          transaction_id?: string
        }
        Relationships: []
      }
      pending_purchases_audit: {
        Row: {
          accessed_at: string | null
          accessed_by: string | null
          action_type: string
          id: string
          pending_purchase_id: string | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          accessed_by?: string | null
          action_type: string
          id?: string
          pending_purchase_id?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          accessed_by?: string | null
          action_type?: string
          id?: string
          pending_purchase_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_mappings: {
        Row: {
          created_at: string | null
          ebook_id: string
          id: string
          platform: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          ebook_id: string
          id?: string
          platform?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          ebook_id?: string
          id?: string
          platform?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_mappings_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          last_login_at: string | null
          onboarding_completed: boolean | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          last_login_at?: string | null
          onboarding_completed?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          onboarding_completed?: boolean | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      purchase_clicks: {
        Row: {
          created_at: string | null
          ebook_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          ebook_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          ebook_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_clicks_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_answers: {
        Row: {
          answer: string
          created_at: string
          helpful_count: number
          id: string
          is_official: boolean
          is_verified_purchaser: boolean
          question_id: string
          user_id: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_official?: boolean
          is_verified_purchaser?: boolean
          question_id: string
          user_id?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_official?: boolean
          is_verified_purchaser?: boolean
          question_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ebook_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          action: string
          attempts: number
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action?: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          conversion_date: string | null
          created_at: string
          expires_at: string | null
          id: string
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          reward_claimed: boolean | null
          reward_claimed_at: string | null
          reward_ebook_id: string | null
          reward_type: string | null
          status: string
        }
        Insert: {
          conversion_date?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          reward_ebook_id?: string | null
          reward_type?: string | null
          status?: string
        }
        Update: {
          conversion_date?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          reward_ebook_id?: string | null
          reward_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_reward_ebook_id_fkey"
            columns: ["reward_ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          badge_id: string | null
          created_at: string
          description: string
          ebook_id: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          required_badge_id: string | null
          required_level: number | null
          required_xp: number | null
          type: string
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          description: string
          ebook_id?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          required_badge_id?: string | null
          required_level?: number | null
          required_xp?: number | null
          type: string
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          description?: string
          ebook_id?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          required_badge_id?: string | null
          required_level?: number | null
          required_xp?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_required_badge_id_fkey"
            columns: ["required_badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          testimonial_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          testimonial_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          testimonial_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_comments_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_likes: {
        Row: {
          created_at: string
          id: string
          testimonial_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          testimonial_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          testimonial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_likes_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonial_media: {
        Row: {
          created_at: string | null
          id: string
          media_type: string
          media_url: string
          testimonial_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_type: string
          media_url: string
          testimonial_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          testimonial_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonial_media_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          ebook_id: string
          id: string
          is_public: boolean
          likes_count: number
          rating: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          ebook_id: string
          id?: string
          is_public?: boolean
          likes_count?: number
          rating: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          ebook_id?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          rating?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          claimed: boolean
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ebooks: {
        Row: {
          ebook_id: string
          id: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          ebook_id: string
          id?: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          ebook_id?: string
          id?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ebooks_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ebooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ebooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          best_daily_pages: number | null
          books_completed: number | null
          created_at: string
          current_level: number
          current_streak_days: number
          id: string
          install_reward_claimed: boolean | null
          last_page_read_at: string | null
          last_read_date: string | null
          longest_streak_days: number
          pages_read_today: number
          total_pages_read: number | null
          total_reading_time_minutes: number | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_daily_pages?: number | null
          books_completed?: number | null
          created_at?: string
          current_level?: number
          current_streak_days?: number
          id?: string
          install_reward_claimed?: boolean | null
          last_page_read_at?: string | null
          last_read_date?: string | null
          longest_streak_days?: number
          pages_read_today?: number
          total_pages_read?: number | null
          total_reading_time_minutes?: number | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_daily_pages?: number | null
          books_completed?: number | null
          created_at?: string
          current_level?: number
          current_streak_days?: number
          id?: string
          install_reward_claimed?: boolean | null
          last_page_read_at?: string | null
          last_read_date?: string | null
          longest_streak_days?: number
          pages_read_today?: number
          total_pages_read?: number | null
          total_reading_time_minutes?: number | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          current_page: number | null
          ebook_id: string
          id: string
          last_read_at: string | null
          progress_percentage: number | null
          reading_time_minutes: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          current_page?: number | null
          ebook_id: string
          id?: string
          last_read_at?: string | null
          progress_percentage?: number | null
          reading_time_minutes?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          current_page?: number | null
          ebook_id?: string
          id?: string
          last_read_at?: string | null
          progress_percentage?: number | null
          reading_time_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          claimed_at: string
          id: string
          reward_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
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
      xp_transactions: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          related_ebook_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          related_ebook_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          related_ebook_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_related_ebook_id_fkey"
            columns: ["related_ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_level: { Args: { xp: number }; Returns: number }
      check_rate_limit: {
        Args: {
          p_action: string
          p_block_minutes: number
          p_identifier: string
          p_max_attempts: number
          p_window_minutes: number
        }
        Returns: Json
      }
      cleanup_old_pending_purchases: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      extract_hostname: { Args: { p_origin: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_ebook_id_for_product: {
        Args: { p_product_id: string }
        Returns: string
      }
      get_level_name: { Args: { level: number }; Returns: string }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      get_xp_for_level: { Args: { level: number }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_rate_limit: {
        Args: { p_action: string; p_identifier: string }
        Returns: undefined
      }
      validate_license: {
        Args: { p_license_key: string; p_origin: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
