export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          domain: string
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      google_integrations: {
        Row: {
          id: string
          brand_id: string
          integration_type: 'GA4' | 'GSC'
          property_id: string | null
          credentials: Record<string, any> | null
          refresh_token: string | null
          status: string
          last_sync: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          integration_type: 'GA4' | 'GSC'
          property_id?: string | null
          credentials?: Record<string, any> | null
          refresh_token?: string | null
          status?: string
          last_sync?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          integration_type?: 'GA4' | 'GSC'
          property_id?: string | null
          credentials?: Record<string, any> | null
          refresh_token?: string | null
          status?: string
          last_sync?: string | null
          created_at?: string
        }
      }
      analytics_snapshots: {
        Row: {
          id: string
          brand_id: string
          source: 'GA4' | 'GSC'
          metric_type: string
          data: Record<string, any>
          date_from: string
          date_to: string
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          source: 'GA4' | 'GSC'
          metric_type: string
          data: Record<string, any>
          date_from: string
          date_to: string
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          source?: 'GA4' | 'GSC'
          metric_type?: string
          data?: Record<string, any>
          date_from?: string
          date_to?: string
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          brand_id: string
          user_id: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          user_id: string
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          user_id?: string
          title?: string | null
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          metadata?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          metadata?: Record<string, any> | null
          created_at?: string
        }
      }
      dashboard_configs: {
        Row: {
          id: string
          brand_id: string
          name: string
          config: Record<string, any>
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          name: string
          config: Record<string, any>
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          name?: string
          config?: Record<string, any>
          is_default?: boolean
          created_at?: string
        }
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
  }
}