export type Role = 'applicant' | 'committee' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Major {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Period {
  id: string;
  name: string;
  academic_year: string;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  is_required: boolean;
  is_active: boolean;
  max_size_bytes: number;
  allowed_mime_types: string[];
}

export interface Catalog {
  majors: Major[];
  periods: Period[];
  document_types: DocumentType[];
}

export interface Profile {
  full_name: string | null;
  birthplace: string | null;
  birth_date: string | null;
  gender: 'L' | 'P' | null;
  address: string | null;
  phone: string | null;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'correction_requested'
  | 'verified'
  | 'selection_in_progress'
  | 'completed'
  | 'withdrawn';

export interface ApplicationSummary {
  id: string;
  registration_number: string;
  period_id: string;
  major_id: number;
  status: ApplicationStatus;
  created_at: string;
  submitted_at: string | null;
}

export type DocVerificationStatus = 'pending' | 'approved' | 'correction_requested';

export interface ApplicationDoc {
  id: string;
  document_type_id: number;
  mime_type: string;
  size_bytes: number;
  verification_status: DocVerificationStatus;
  revision: number;
  uploaded_at: string;
  storage_key: string;
}

export interface StatusHistory {
  previous_status: string | null;
  new_status: string;
  note: string | null;
  changed_by: string;
  changed_at: string;
}

export interface VerificationRecord {
  id: string;
  document_id: string | null;
  status: string;
  note: string | null;
  verified_by: string;
  verified_at: string;
}

export interface SelectionResult {
  outcome: 'accepted' | 'waitlisted' | 'rejected';
  note: string | null;
  announcement_at: string;
  published_at: string | null;
}

export interface ApplicationDetail {
  application: ApplicationSummary;
  profile: Profile;
  documents: ApplicationDoc[];
  history: StatusHistory[];
  verifications: VerificationRecord[];
  selection_result: SelectionResult | null;
}

export interface ApplicantRow {
  user_id: string;
  full_name: string;
  phone: string | null;
  application_id: string | null;
  registration_number: string | null;
  status: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AuditLogRow {
  occurred_at: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role_code: Role;
  account_status: 'active' | 'suspended' | 'closed';
  created_at: string;
}

export interface StudentDashboard {
  profile: Profile | null;
  applications: ApplicationSummary[];
  periods: Period[];
  majors: Major[];
  documentTypes: DocumentType[];
}

export interface StaffDashboard {
  counts: Record<string, number>;
  total: number;
  recent: ApplicantRow[];
  periods: Period[];
}

export interface AdminDashboard {
  roleCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  totalApplicants: number;
  totalUsers: number;
  periods: Period[];
  announcementCount: number;
}
