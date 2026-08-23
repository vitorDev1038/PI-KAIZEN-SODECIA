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
        Relationships: []
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
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          name: string
          company: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          company?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          created_at?: string
        }
        Relationships: []
      }
      kaizens: {
        Row: {
          id: string
          title: string
          category_id: string | null
          department_id: string | null
          problem: string
          suggestion: string
          benefits: string
          image_url: string | null
          before_image_url: string | null
          after_image_url: string | null
          status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'in_progress' | 'completed'
          estimated_savings: number
          realized_savings: number
          implementation_cost: number
          effort_level: 'low' | 'medium' | 'high'
          impact_level: 'low' | 'medium' | 'high'
          employee_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          category_id?: string | null
          department_id?: string | null
          problem: string
          suggestion: string
          benefits: string
          image_url?: string | null
          before_image_url?: string | null
          after_image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'in_progress' | 'completed'
          estimated_savings?: number
          realized_savings?: number
          implementation_cost?: number
          effort_level?: 'low' | 'medium' | 'high'
          impact_level?: 'low' | 'medium' | 'high'
          employee_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          category_id?: string | null
          department_id?: string | null
          problem?: string
          suggestion?: string
          benefits?: string
          image_url?: string | null
          before_image_url?: string | null
          after_image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'in_progress' | 'completed'
          estimated_savings?: number
          realized_savings?: number
          implementation_cost?: number
          effort_level?: 'low' | 'medium' | 'high'
          impact_level?: 'low' | 'medium' | 'high'
          employee_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kaizens_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kaizens_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kaizens_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "comments_kaizen_id_fkey"
            columns: ["kaizen_id"]
            isOneToOne: false
            referencedRelation: "kaizens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      action_plans: {
        Row: {
          id: string
          kaizen_id: string
          what: string
          who: string
          where_location: string | null
          why_reason: string | null
          how_method: string | null
          cost: number
          due_date: string | null
          status: 'todo' | 'in_progress' | 'done'
          created_at: string
        }
        Insert: {
          id?: string
          kaizen_id: string
          what: string
          who: string
          where_location?: string | null
          why_reason?: string | null
          how_method?: string | null
          cost?: number
          due_date?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          created_at?: string
        }
        Update: {
          id?: string
          kaizen_id?: string
          what?: string
          who?: string
          where_location?: string | null
          why_reason?: string | null
          how_method?: string | null
          cost?: number
          due_date?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_kaizen_id_fkey"
            columns: ["kaizen_id"]
            isOneToOne: false
            referencedRelation: "kaizens"
            referencedColumns: ["id"]
          }
        ]
      }
      badges: {
        Row: {
          id: string
          code: string
          title: string
          description: string
          icon: string
          points_required: number
          color: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          description: string
          icon: string
          points_required?: number
          color?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string
          icon?: string
          points_required?: number
          color?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          awarded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          awarded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          awarded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          kaizen_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          read?: boolean
          kaizen_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          kaizen_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_kaizen_id_fkey"
            columns: ["kaizen_id"]
            isOneToOne: false
            referencedRelation: "kaizens"
            referencedColumns: ["id"]
          }
        ]
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

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Kaizen = Database['public']['Tables']['kaizens']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type ActionPlan = Database['public']['Tables']['action_plans']['Row'];
export type BadgeItem = Database['public']['Tables']['badges']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type NotificationItem = Database['public']['Tables']['notifications']['Row'];
