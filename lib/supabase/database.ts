export type DbUserRole = "admin" | "sales_rep";
export type DbLeadPriority = "hot" | "warm" | "nurture";
export type DbLeadStatus =
  | "new_lead"
  | "contact_attempted"
  | "contacted"
  | "appointment_set"
  | "phone_appointment_set"
  | "in_person_appointment_set"
  | "appointment_completed"
  | "quote_needed"
  | "quote_sent"
  | "quote_approved"
  | "lost_not_interested"
  | "follow_up_later"
  | "waiting_on_customer"
  | "wrong_phone_number"
  | "getting_quote_elsewhere";
export type DbActivityType =
  | "call"
  | "text"
  | "email"
  | "note"
  | "follow_up"
  | "appointment"
  | "ai"
  | "assignment";
export type DbActiveProjectStatus =
  | "initial_payment_received"
  | "in_progress"
  | "second_payment_received"
  | "final_payment_received"
  | "completed";

export type DbUser = {
  auth_user_id: string | null;
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  is_active: boolean;
  role: DbUserRole;
  updated_at: string;
};

export type DbLead = {
  active_project_status: DbActiveProjectStatus | null;
  archived_at: string | null;
  assigned_rep_id: string | null;
  assigned_rep_name: string | null;
  city: string | null;
  created_at: string;
  email: string | null;
  estimated_value: number | null;
  full_name: string;
  id: string;
  is_archived: boolean;
  next_followup_at: string | null;
  next_step: string | null;
  notes: string | null;
  phone: string | null;
  priority: DbLeadPriority;
  project_info: string | null;
  project_type: string | null;
  property_address: string | null;
  source: string | null;
  status: DbLeadStatus;
  timeline: string | null;
  updated_at: string;
};

export type DbActivity = {
  created_at: string;
  detail: string | null;
  id: string;
  lead_id: string;
  title: string;
  type: DbActivityType;
  updated_at: string;
  user_id: string | null;
};

export type DbNote = {
  body: string;
  created_at: string;
  id: string;
  lead_id: string;
  updated_at: string;
  user_id: string | null;
};

export type DbAppointment = {
  appointment_at: string;
  appointment_type: string;
  assigned_rep_id: string | null;
  created_at: string;
  id: string;
  lead_id: string;
  notes: string | null;
  status: string;
  updated_at: string;
};

export type DbFollowup = {
  assigned_rep_id: string | null;
  completed_at: string | null;
  created_at: string;
  due_at: string;
  id: string;
  lead_id: string;
  reason: string | null;
  status: "open" | "completed" | "snoozed" | "missed";
  updated_at: string;
};

export type DbAiSummary = {
  created_at: string;
  id: string;
  lead_id: string;
  model: string | null;
  next_best_action: string | null;
  summary: string;
  updated_at: string;
};

export type DbCommunication = {
  body: string | null;
  channel: "call" | "sms" | "email";
  created_at: string;
  direction: "inbound" | "outbound";
  external_id: string | null;
  id: string;
  lead_id: string;
  status: "draft" | "queued" | "sent" | "delivered" | "failed";
  updated_at: string;
  user_id: string | null;
};
