export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          id: string
          email: string
          created_at: string
          invited_by: string | null
          label: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          invited_by?: string | null
          label?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          invited_by?: string | null
          label?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          date_of_birth: string | null
          avatar_url: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
