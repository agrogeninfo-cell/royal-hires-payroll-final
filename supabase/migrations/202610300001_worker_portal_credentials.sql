-- Worker portal credential and session storage. Apply to the development project first.
-- No worker credentials are created by this migration.
create table if not exists public.worker_portal_credentials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  member_id text not null,
  employee_record_id text not null,
  pin_salt text not null,
  pin_hash text not null,
  is_active boolean not null default true,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  pin_changed_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, member_id),
  unique(company_id, employee_record_id)
);
create table if not exists public.worker_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.worker_portal_credentials(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists worker_portal_sessions_expiry_idx on public.worker_portal_sessions(expires_at);
alter table public.worker_portal_credentials enable row level security;
alter table public.worker_portal_sessions enable row level security;
revoke all on public.worker_portal_credentials from anon, authenticated;
revoke all on public.worker_portal_sessions from anon, authenticated;
comment on table public.worker_portal_credentials is 'Worker portal PIN hashes only; all reads/writes must be performed by the worker portal Edge Function using server-side credentials.';
comment on table public.worker_portal_sessions is 'Hashed opaque worker portal session tokens; all access is server-side only.';
