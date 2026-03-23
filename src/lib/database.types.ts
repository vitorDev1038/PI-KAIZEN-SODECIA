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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'employee' | 'admin'
          points: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'employee' | 'admin'
          points?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'employee' | 'admin'
          points?: number
          is_active?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          created_at?: string
        }
      }
      kaizens: {
        Row: {
          id: string
          title: string
          category_id: string | null
          problem: string
          suggestion: string
          benefits: string
          image_url: string | null
          status: 'pending' | 'approved' | 'rejected' | 'under_review'
          employee_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          category_id?: string | null
          problem: string
          suggestion: string
          benefits: string
          image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          employee_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          category_id?: string | null
          problem?: string
          suggestion?: string
          benefits?: string
          image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          employee_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          kaizen_id: string
          user_id: string
          content: string
          is_feedback: boolean
          created_at: string
        }
        Insert: {
          id?: string
          kaizen_id: string
          user_id: string
          content: string
          is_feedback?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          kaizen_id?: string
          user_id?: string
          content?: string
          is_feedback?: boolean
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Kaizen = Database['public']['Tables']['kaizens']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
