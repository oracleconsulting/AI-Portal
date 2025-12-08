// Core enums
export type CommitteeType = 'implementation' | 'oversight'
export type TeamType = 'bsg' | 'audit' | 'tax' | 'corporate_finance' | 'bookkeeping' | 'admin'
export type IdentificationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

// Audit types
export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'approval' | 'rejection' | 'submission' | 'review' | 'comment'

// Oversight types
export type OversightStatus = 'not_required' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'deferred' | 'requires_changes'
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted'

// AI Tool types
export type ToolCategory = 'llm_general' | 'llm_coding' | 'audit_specific' | 'tax_specific' | 'data_extraction' | 'document_processing' | 'automation' | 'analytics' | 'transcription' | 'image_generation' | 'other'
export type ToolStatus = 'proposed' | 'evaluating' | 'pilot' | 'approved' | 'approved_restricted' | 'deprecated' | 'banned'

// Review types
export type ReviewRecommendation = 'continue' | 'expand' | 'modify' | 'pause' | 'discontinue'
export type ReviewType = '30_day' | '90_day' | '180_day' | '365_day' | 'ad_hoc'

// Policy types
export type PolicyStatus = 'draft' | 'pending_approval' | 'approved' | 'superseded' | 'archived'
export type PolicyCategory = 'acceptable_use' | 'security' | 'data_handling' | 'procurement' | 'training' | 'governance' | 'compliance' | 'other'

// Time savings structure
export interface TimeSaving {
  staff_level: string
  hours_per_week: number
}

export interface ActionItem {
  id: string
  description: string
  assignee: string | null
  due_date: string | null
  completed: boolean
}

// Database interface
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          committee: CommitteeType
          team: TeamType | null
          role: 'member' | 'chair' | 'admin'
          must_change_password: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          committee: CommitteeType
          team?: TeamType | null
          role?: 'member' | 'chair' | 'admin'
          must_change_password?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      identification_forms: {
        Row: {
          id: string
          problem_identified: string
          solution: string | null
          cost_of_solution: number | null
          time_savings: TimeSaving[] | null
          time_saving_hours: number | null
          staff_level: string | null
          time_saving_description: string | null
          priority: Priority
          status: IdentificationStatus
          submitted_by: string
          submitted_by_name: string | null
          notes: string | null
          // Oversight fields
          oversight_status: OversightStatus
          oversight_reviewed_by: string | null
          oversight_reviewed_by_name: string | null
          oversight_reviewed_at: string | null
          oversight_notes: string | null
          oversight_conditions: string | null
          risk_category: string | null
          risk_score: number | null
          data_classification: DataClassification | null
          security_review_required: boolean
          security_reviewed_by: string | null
          security_reviewed_at: string | null
          escalated_to_partner: boolean
          partner_approved_by: string | null
          partner_approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_identified: string
          solution?: string | null
          cost_of_solution?: number | null
          time_savings?: TimeSaving[] | null
          time_saving_hours?: number | null
          staff_level?: string | null
          time_saving_description?: string | null
          priority?: Priority
          status?: IdentificationStatus
          submitted_by: string
          submitted_by_name?: string | null
          notes?: string | null
          oversight_status?: OversightStatus
          risk_category?: string | null
          risk_score?: number | null
          data_classification?: DataClassification | null
        }
        Update: Partial<Database['public']['Tables']['identification_forms']['Insert']> & {
          oversight_reviewed_by?: string | null
          oversight_reviewed_by_name?: string | null
          oversight_reviewed_at?: string | null
          oversight_notes?: string | null
          oversight_conditions?: string | null
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
          team: TeamType | null
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
          team?: TeamType | null
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['meeting_transcripts']['Insert']>
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
        }
        Update: Partial<Database['public']['Tables']['oversight_suggestions']['Insert']>
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: AuditAction
          changed_by: string | null
          changed_by_name: string | null
          changed_by_email: string | null
          changed_at: string
          old_values: Record<string, unknown> | null
          new_values: Record<string, unknown> | null
          change_summary: string | null
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
        }
        Insert: never // Read-only, populated by triggers
        Update: never
      }
      ai_tools: {
        Row: {
          id: string
          name: string
          vendor: string
          version: string | null
          category: ToolCategory
          status: ToolStatus
          description: string | null
          approved_use_cases: string[]
          prohibited_use_cases: string[]
          data_classification_permitted: DataClassification
          data_residency: string | null
          processes_pii: boolean
          processes_client_data: boolean
          pricing_model: string | null
          annual_cost: number | null
          cost_per_unit: number | null
          cost_notes: string | null
          security_assessment_date: string | null
          security_score: number | null
          security_notes: string | null
          has_soc2: boolean
          has_iso27001: boolean
          gdpr_compliant: boolean
          risk_score: number | null
          risk_notes: string | null
          proposed_by: string | null
          proposed_at: string
          evaluated_by: string | null
          evaluated_at: string | null
          approved_by: string | null
          approved_at: string | null
          linked_form_id: string | null
          vendor_url: string | null
          documentation_url: string | null
          internal_guidance_url: string | null
          next_review_date: string | null
          review_frequency_months: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          vendor: string
          version?: string | null
          category: ToolCategory
          status?: ToolStatus
          description?: string | null
          approved_use_cases?: string[]
          prohibited_use_cases?: string[]
          data_classification_permitted?: DataClassification
          data_residency?: string | null
          processes_pii?: boolean
          processes_client_data?: boolean
          pricing_model?: string | null
          annual_cost?: number | null
          security_score?: number | null
          risk_score?: number | null
          has_soc2?: boolean
          has_iso27001?: boolean
          gdpr_compliant?: boolean
          proposed_by?: string | null
          linked_form_id?: string | null
          vendor_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['ai_tools']['Insert']> & {
          evaluated_by?: string | null
          evaluated_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
        }
      }
      ai_tool_usage: {
        Row: {
          id: string
          tool_id: string
          user_id: string
          team: TeamType | null
          usage_date: string
          usage_type: string | null
          usage_count: number
          tokens_used: number | null
          cost_incurred: number | null
          time_saved_minutes: number | null
          task_type: string | null
          client_code: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          user_id: string
          team?: TeamType | null
          usage_date?: string
          usage_type?: string | null
          usage_count?: number
          tokens_used?: number | null
          cost_incurred?: number | null
          time_saved_minutes?: number | null
          task_type?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['ai_tool_usage']['Insert']>
      }
      implementation_reviews: {
        Row: {
          id: string
          form_id: string
          tool_id: string | null
          review_type: ReviewType
          review_date: string
          review_due_date: string | null
          actual_time_saved: TimeSaving[] | null
          actual_weekly_hours: number | null
          actual_annual_value: number | null
          actual_cost: number | null
          actual_roi: number | null
          projected_weekly_hours: number | null
          projected_annual_value: number | null
          projected_cost: number | null
          variance_percentage: number | null
          user_satisfaction_score: number | null
          adoption_rate_percentage: number | null
          quality_impact: 'improved' | 'unchanged' | 'declined' | null
          challenges_encountered: string | null
          unexpected_benefits: string | null
          lessons_learned: string | null
          recommendation: ReviewRecommendation
          recommendation_notes: string | null
          action_items: ActionItem[]
          next_review_date: string | null
          requires_oversight_review: boolean
          reviewed_by: string
          reviewed_by_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          tool_id?: string | null
          review_type: ReviewType
          review_date: string
          actual_time_saved?: TimeSaving[] | null
          actual_weekly_hours?: number | null
          actual_annual_value?: number | null
          actual_cost?: number | null
          user_satisfaction_score?: number | null
          adoption_rate_percentage?: number | null
          quality_impact?: 'improved' | 'unchanged' | 'declined' | null
          challenges_encountered?: string | null
          unexpected_benefits?: string | null
          lessons_learned?: string | null
          recommendation: ReviewRecommendation
          recommendation_notes?: string | null
          next_review_date?: string | null
          reviewed_by: string
        }
        Update: Partial<Database['public']['Tables']['implementation_reviews']['Insert']>
      }
      staff_rates: {
        Row: {
          id: string
          staff_level: string
          display_name: string | null
          hourly_rate: number
          display_order: number | null
          is_active: boolean
          effective_from: string
          effective_to: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          staff_level: string
          display_name?: string | null
          hourly_rate: number
          display_order?: number | null
          is_active?: boolean
          effective_from?: string
        }
        Update: Partial<Database['public']['Tables']['staff_rates']['Insert']>
      }
      policy_documents: {
        Row: {
          id: string
          policy_code: string | null
          title: string
          category: PolicyCategory
          summary: string | null
          content: string
          version: string
          previous_version_id: string | null
          status: PolicyStatus
          approved_by: string | null
          approved_at: string | null
          effective_from: string | null
          effective_to: string | null
          review_date: string | null
          applies_to_committees: string[]
          applies_to_teams: TeamType[] | null
          owner: string | null
          author: string | null
          tags: string[] | null
          attachment_urls: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          policy_code?: string | null
          title: string
          category: PolicyCategory
          summary?: string | null
          content: string
          version?: string
          status?: PolicyStatus
          applies_to_committees?: string[]
          owner?: string | null
          author?: string | null
          tags?: string[] | null
        }
        Update: Partial<Database['public']['Tables']['policy_documents']['Insert']>
      }
      approval_thresholds: {
        Row: {
          id: string
          threshold_name: string
          min_amount: number | null
          max_amount: number | null
          required_approver_role: string
          requires_security_review: boolean
          requires_partner_approval: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          threshold_name: string
          min_amount?: number | null
          max_amount?: number | null
          required_approver_role: string
          requires_security_review?: boolean
          requires_partner_approval?: boolean
        }
        Update: Partial<Database['public']['Tables']['approval_thresholds']['Insert']>
      }
    }
    Views: {
      oversight_review_queue: {
        Row: {
          id: string
          problem_identified: string
          solution: string | null
          cost_of_solution: number | null
          time_savings: TimeSaving[] | null
          priority: Priority
          status: IdentificationStatus
          oversight_status: OversightStatus
          submitted_by: string
          submitted_by_name: string | null
          created_at: string
          updated_at: string
          risk_category: string | null
          risk_score: number | null
          data_classification: DataClassification | null
          team: TeamType | null
          annual_value: number
          days_pending: number
        }
      }
      implementation_with_reviews: {
        Row: {
          form_id: string
          problem_identified: string
          solution: string | null
          projected_cost: number | null
          status: IdentificationStatus
          submitted_at: string
          tool_name: string | null
          tool_status: ToolStatus | null
          latest_review_id: string | null
          latest_review_date: string | null
          actual_annual_value: number | null
          actual_roi: number | null
          variance_percentage: number | null
          recommendation: ReviewRecommendation | null
          user_satisfaction_score: number | null
          projected_annual_value: number
          total_reviews: number
          review_overdue: boolean
        }
      }
    }
    Functions: {
      get_staff_rate: {
        Args: { p_staff_level: string; p_date?: string }
        Returns: number
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      committee_type: CommitteeType
      team_type: TeamType
      identification_status: IdentificationStatus
      priority: Priority
      audit_action: AuditAction
      oversight_status: OversightStatus
      tool_category: ToolCategory
      tool_status: ToolStatus
      review_recommendation: ReviewRecommendation
      policy_status: PolicyStatus
      policy_category: PolicyCategory
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type IdentificationForm = Database['public']['Tables']['identification_forms']['Row']
export type MeetingTranscript = Database['public']['Tables']['meeting_transcripts']['Row']
export type OversightSuggestion = Database['public']['Tables']['oversight_suggestions']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
export type AITool = Database['public']['Tables']['ai_tools']['Row']
export type AIToolUsage = Database['public']['Tables']['ai_tool_usage']['Row']
export type ImplementationReview = Database['public']['Tables']['implementation_reviews']['Row']
export type StaffRate = Database['public']['Tables']['staff_rates']['Row']
export type PolicyDocument = Database['public']['Tables']['policy_documents']['Row']
export type ApprovalThreshold = Database['public']['Tables']['approval_thresholds']['Row']

// View types
export type OversightReviewQueueItem = Database['public']['Views']['oversight_review_queue']['Row']
export type ImplementationWithReview = Database['public']['Views']['implementation_with_reviews']['Row']
