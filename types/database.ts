export type CommitteeType = 'implementation' | 'oversight'

export type IdentificationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          committee: CommitteeType
          role: 'member' | 'chair' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          committee: CommitteeType
          role?: 'member' | 'chair' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          committee?: CommitteeType
          role?: 'member' | 'chair' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      identification_forms: {
        Row: {
          id: string
          problem_identified: string
          solution: string | null
          cost_of_solution: number | null
          time_saving_hours: number | null
          time_saving_description: string | null
          priority: Priority
          status: IdentificationStatus
          submitted_by: string
          submitted_by_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_identified: string
          solution?: string | null
          cost_of_solution?: number | null
          time_saving_hours?: number | null
          time_saving_description?: string | null
          priority?: Priority
          status?: IdentificationStatus
          submitted_by: string
          submitted_by_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_identified?: string
          solution?: string | null
          cost_of_solution?: number | null
          time_saving_hours?: number | null
          time_saving_description?: string | null
          priority?: Priority
          status?: IdentificationStatus
          submitted_by?: string
          submitted_by_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meeting_transcripts: {
        Row: {
          id: string
          title: string
          meeting_date: string
          transcript: string
          summary: string | null
          action_items: ActionItem[] | null
          committee: CommitteeType
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          meeting_date: string
          transcript: string
          summary?: string | null
          action_items?: ActionItem[] | null
          committee: CommitteeType
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          meeting_date?: string
          transcript?: string
          summary?: string | null
          action_items?: ActionItem[] | null
          committee?: CommitteeType
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      oversight_suggestions: {
        Row: {
          id: string
          category: 'cost' | 'security' | 'risk' | 'general'
          title: string
          description: string
          estimated_cost: number | null
          risk_level: 'low' | 'medium' | 'high' | null
          status: 'pending' | 'reviewed' | 'approved' | 'rejected'
          submitted_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: 'cost' | 'security' | 'risk' | 'general'
          title: string
          description: string
          estimated_cost?: number | null
          risk_level?: 'low' | 'medium' | 'high' | null
          status?: 'pending' | 'reviewed' | 'approved' | 'rejected'
          submitted_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: 'cost' | 'security' | 'risk' | 'general'
          title?: string
          description?: string
          estimated_cost?: number | null
          risk_level?: 'low' | 'medium' | 'high' | null
          status?: 'pending' | 'reviewed' | 'approved' | 'rejected'
          submitted_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      committee_type: CommitteeType
      identification_status: IdentificationStatus
      priority: Priority
    }
  }
}

export interface ActionItem {
  id: string
  description: string
  assignee: string | null
  due_date: string | null
  completed: boolean
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type IdentificationForm = Database['public']['Tables']['identification_forms']['Row']
export type MeetingTranscript = Database['public']['Tables']['meeting_transcripts']['Row']
export type OversightSuggestion = Database['public']['Tables']['oversight_suggestions']['Row']

