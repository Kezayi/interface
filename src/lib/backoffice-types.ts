export interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'support_admin';
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  action_details: Record<string, any>;
  justification: string;
  ip_address?: string;
  created_at: string;
}

export interface DigitalHeir {
  id: string;
  memorial_id: string;
  heir_name: string;
  heir_email: string;
  heir_phone?: string;
  relationship?: string;
  status: 'inactive' | 'pending_activation' | 'active';
  activation_note?: string;
  activated_by?: string;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationAction {
  id: string;
  admin_id: string;
  target_type: 'guestbook_message' | 'contribution' | 'memorial';
  target_id: string;
  action: 'hide' | 'archive' | 'restore';
  reason: string;
  reason_category: 'injurious' | 'dignity_violation' | 'off_context' | 'commercial_exploitation';
  created_at: string;
}

export interface Incident {
  id: string;
  type: 'payment_unconfirmed' | 'double_charge' | 'dispute' | 'transfer_issue' | 'technical_error' | 'user_report';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  title: string;
  description: string;
  memorial_id?: string;
  transaction_id?: string;
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemParameter {
  id: string;
  key: string;
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_sensitive: boolean;
  last_modified_by?: string;
  last_modified_at: string;
  change_justification?: string;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  transaction_uuid: string;
  memorial_id?: string;
  user_id?: string;
  type: 'gesture_candle' | 'gesture_flower' | 'gesture_rip' | 'contribution' | 'publication';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SUCCESS_MANUAL' | 'REFUNDED';
  provider?: string;
  provider_reference?: string;
  manual_verification_note?: string;
  verified_by?: string;
  refunded_at?: string;
  refunded_by?: string;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BackOfficeStats {
  total_memorials: number;
  active_memorials: number;
  total_gestures: number;
  total_revenue: number;
  pending_transactions: number;
  open_incidents: number;
  critical_incidents: number;
}
