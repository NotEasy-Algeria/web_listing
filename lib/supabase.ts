import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you can generate these from your Supabase dashboard)
export interface Database {
  public: {
    Tables: {
      // Note: users table not implemented - kept for reference only
      // users: { ... }
      doctors: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          field: string | null
          status: boolean
          phone: string | null
          password: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          field?: string | null
          status?: boolean
          phone?: string | null
          password?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          field?: string | null
          status?: boolean
          phone?: string | null
          password?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          password: string
          status: boolean
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          password: string
          status?: boolean
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          password?: string
          status?: boolean
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      abonnements: {
        Row: {
          id: string
          id_doctor: string
          price: number
          type: string
          count: number
          start: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          id_doctor: string
          price: number
          type: string
          count?: number
          start: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          id_doctor?: string
          price?: number
          type?: string
          count?: number
          start?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      sub_type: {
        Row: {
          id: string
          name: string
          price: number
          duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          duration: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          duration?: number
          created_at?: string
          updated_at?: string
        }
      }
      fileds: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Note: appointments table not implemented - kept for reference only
      // appointments: { ... }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_registrations: {
        Row: {
          id: string
          id_doctor: string
          id_event: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          id_doctor: string
          id_event: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          id_doctor?: string
          id_event?: string
          created_at?: string
          updated_at?: string
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
