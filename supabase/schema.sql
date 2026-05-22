create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'sales_rep');
create type public.lead_priority as enum ('hot', 'warm', 'nurture');
create type public.lead_status as enum (
  'new_lead',
  'contact_attempted',
  'contacted',
  'appointment_set',
  'phone_appointment_set',
  'in_person_appointment_set',
  'appointment_completed',
  'quote_needed',
  'quote_sent',
  'quote_approved',
  'lost_not_interested',
  'follow_up_later',
  'waiting_on_customer',
  'wrong_phone_number',
  'getting_quote_elsewhere'
);
create type public.active_project_status as enum (
  'initial_payment_received',
  'in_progress',
  'second_payment_received',
  'final_payment_received',
  'completed'
);
create type public.activity_type as enum (
  'call',
  'text',
  'email',
  'note',
  'follow_up',
  'appointment',
  'ai',
  'assignment'
);
create type public.communication_channel as enum ('call', 'sms', 'email');
create type public.communication_status as enum ('draft', 'queued', 'sent', 'delivered', 'failed');
create type public.followup_status as enum ('open', 'completed', 'snoozed', 'missed');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'sales_rep',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  property_address text,
  city text,
  project_type text,
  timeline text,
  project_info text,
  notes text,
  estimated_value numeric(12, 2),
  priority public.lead_priority not null default 'warm',
  status public.lead_status not null default 'new_lead',
  source text,
  assigned_rep_id uuid references public.users(id) on delete set null,
  assigned_rep_name text,
  next_followup_at timestamptz,
  next_step text,
  active_project_status public.active_project_status,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  type public.activity_type not null,
  title text not null,
  detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_rep_id uuid references public.users(id) on delete set null,
  appointment_at timestamptz not null,
  appointment_type text not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  channel public.communication_channel not null,
  direction text not null default 'outbound',
  status public.communication_status not null default 'draft',
  external_id text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  summary text not null,
  next_best_action text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  assigned_rep_id uuid references public.users(id) on delete set null,
  due_at timestamptz not null,
  completed_at timestamptz,
  status public.followup_status not null default 'open',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_assigned_rep_id_idx on public.leads(assigned_rep_id);
create index leads_next_followup_at_idx on public.leads(next_followup_at);
create index leads_status_idx on public.leads(status);
create index leads_is_archived_idx on public.leads(is_archived);
create index activities_lead_id_idx on public.activities(lead_id);
create index notes_lead_id_idx on public.notes(lead_id);
create index appointments_lead_id_idx on public.appointments(lead_id);
create index communications_lead_id_idx on public.communications(lead_id);
create index ai_summaries_lead_id_idx on public.ai_summaries(lead_id);
create index followups_due_at_idx on public.followups(due_at);
create index followups_assigned_rep_id_idx on public.followups(assigned_rep_id);

alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.notes enable row level security;
alter table public.appointments enable row level security;
alter table public.communications enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.followups enable row level security;

create policy "authenticated users can read crm users"
  on public.users for select
  to authenticated
  using (true);

create policy "authenticated users can write crm users"
  on public.users for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read and write leads"
  on public.leads for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read and write activities"
  on public.activities for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read and write notes"
  on public.notes for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read and write appointments"
  on public.appointments for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read and write communications"
  on public.communications for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read and write ai summaries"
  on public.ai_summaries for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can read and write followups"
  on public.followups for all
  to authenticated
  using (true)
  with check (true);
