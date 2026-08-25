export type ReportCategory =
  | 'broken_light'
  | 'pothole'
  | 'graffiti'
  | 'trash'
  | 'tree'
  | 'facility'
  | 'flooding'
  | 'noise'
  | 'other';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type ReportStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'cannot_fix';

export type UserRole = 'citizen' | 'admin' | 'municipality';

export interface ReportUpdate {
  id: string;
  report_id: string;
  status: ReportStatus;
  message: string;
  resolved_photo_url?: string | null;
  updated_by?: string;
  admin_name?: string;
  updated_at: string;
}

export interface ReportMessage {
  id: string;
  report_id: string;
  sender_id: string;
  sender_type: 'admin' | 'citizen';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id?: string | null;
  category: ReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  priority_level: PriorityLevel;
  is_anonymous: boolean;
  status: ReportStatus;
  resolved_photo_url?: string | null;
  confirmations_count?: number;
  photos_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  photos: string[];
  user_full_name?: string;
  updates?: ReportUpdate[];
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  action: string;
  report_id: string;
  changes?: Record<string, any>;
  created_at: string;
  admin_name?: string;
}
