
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text,
  role text not null default 'supervisor' check (role in ('admin','office_staff','supervisor')),
  is_active boolean not null default false,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  invited_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  approval_requested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_company_id_idx on public.profiles(company_id);

create table if not exists public.factories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  legacy_id text not null,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, legacy_id),
  unique(company_id, code),
  unique(company_id, id)
);
create index if not exists factories_company_id_idx on public.factories(company_id);

create table if not exists public.user_factory_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  factory_id uuid not null,
  created_at timestamptz not null default now(),
  constraint user_factory_assignments_factory_company_fk
    foreign key (company_id, factory_id) references public.factories(company_id, id) on delete cascade,
  unique(company_id, user_id, factory_id)
);
create index if not exists user_factory_assignments_user_idx on public.user_factory_assignments(company_id, user_id);

create table if not exists public.app_records (
  company_id uuid not null references public.companies(id) on delete cascade,
  collection_name text not null check (collection_name in (
    'factory_configs','employees','attendance','overtime','payroll_runs',
    'employee_payments','invoices','receipts','boarding_locations',
    'billing_rate_history','audit_logs'
  )),
  record_id text not null,
  factory_id uuid,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key(company_id, collection_name, record_id),
  constraint app_records_factory_company_fk
    foreign key (company_id, factory_id) references public.factories(company_id, id) on delete set null
);
create index if not exists app_records_company_collection_idx on public.app_records(company_id, collection_name);
create index if not exists app_records_company_factory_idx on public.app_records(company_id, factory_id);
create index if not exists app_records_updated_at_idx on public.app_records(updated_at desc);

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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, member_id)
);
create index if not exists worker_portal_credentials_member_idx on public.worker_portal_credentials(member_id);

create table if not exists public.worker_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.worker_portal_credentials(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists worker_portal_sessions_credential_idx on public.worker_portal_sessions(credential_id);
create index if not exists worker_portal_sessions_expiry_idx on public.worker_portal_sessions(expires_at);

create or replace function private.current_company_id()
returns uuid language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.company_id from public.profiles p
  where p.user_id = (select auth.uid()) and p.is_active = true limit 1
$$;

create or replace function private.current_user_role()
returns text language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.role from public.profiles p
  where p.user_id = (select auth.uid()) and p.is_active = true limit 1
$$;

create or replace function private.is_assigned_to_factory(target_factory_id uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_factory_assignments ufa
    where ufa.user_id = (select auth.uid())
      and ufa.factory_id = target_factory_id
      and ufa.company_id = private.current_company_id()
  )
$$;

revoke all on function private.current_company_id() from public, anon;
revoke all on function private.current_user_role() from public, anon;
revoke all on function private.is_assigned_to_factory(uuid) from public, anon;
grant execute on function private.current_company_id() to authenticated, service_role;
grant execute on function private.current_user_role() to authenticated, service_role;
grant execute on function private.is_assigned_to_factory(uuid) to authenticated, service_role;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.factories enable row level security;
alter table public.user_factory_assignments enable row level security;
alter table public.app_records enable row level security;
alter table public.worker_portal_credentials enable row level security;
alter table public.worker_portal_sessions enable row level security;

drop policy if exists companies_select_member on public.companies;
create policy companies_select_member on public.companies
for select to authenticated
using (id = (select private.current_company_id()));

drop policy if exists profiles_select_self_or_office on public.profiles;
create policy profiles_select_self_or_office on public.profiles
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    company_id = (select private.current_company_id())
    and (select private.current_user_role()) in ('admin','office_staff')
  )
);

drop policy if exists factories_select_scoped on public.factories;
create policy factories_select_scoped on public.factories
for select to authenticated
using (
  company_id = (select private.current_company_id())
  and (
    (select private.current_user_role()) in ('admin','office_staff')
    or (select private.is_assigned_to_factory(id))
  )
);
drop policy if exists factories_insert_admin on public.factories;
create policy factories_insert_admin on public.factories
for insert to authenticated
with check (company_id = (select private.current_company_id()) and (select private.current_user_role()) = 'admin');
drop policy if exists factories_update_admin on public.factories;
create policy factories_update_admin on public.factories
for update to authenticated
using (company_id = (select private.current_company_id()) and (select private.current_user_role()) = 'admin')
with check (company_id = (select private.current_company_id()) and (select private.current_user_role()) = 'admin');
drop policy if exists factories_delete_admin on public.factories;
create policy factories_delete_admin on public.factories
for delete to authenticated
using (company_id = (select private.current_company_id()) and (select private.current_user_role()) = 'admin');

drop policy if exists assignments_select_scoped on public.user_factory_assignments;
create policy assignments_select_scoped on public.user_factory_assignments
for select to authenticated
using (
  company_id = (select private.current_company_id())
  and (
    user_id = (select auth.uid())
    or (select private.current_user_role()) in ('admin','office_staff')
  )
);
drop policy if exists assignments_insert_admin on public.user_factory_assignments;
create policy assignments_insert_admin on public.user_factory_assignments
for insert to authenticated
with check (
  company_id = (select private.current_company_id())
  and (select private.current_user_role()) = 'admin'
  and exists (
    select 1 from public.profiles p
    where p.user_id = user_factory_assignments.user_id
      and p.company_id = user_factory_assignments.company_id
      and p.is_active = true
  )
  and exists (
    select 1 from public.factories f
    where f.id = user_factory_assignments.factory_id
      and f.company_id = user_factory_assignments.company_id
  )
);
drop policy if exists assignments_delete_admin on public.user_factory_assignments;
create policy assignments_delete_admin on public.user_factory_assignments
for delete to authenticated
using (company_id = (select private.current_company_id()) and (select private.current_user_role()) = 'admin');

drop policy if exists app_records_select_company_scoped on public.app_records;
create policy app_records_select_company_scoped on public.app_records
for select to authenticated
using (
  company_id = (select private.current_company_id())
  and (
    (select private.current_user_role()) in ('admin','office_staff')
    or (
      (select private.current_user_role()) = 'supervisor'
      and collection_name in ('employees','attendance')
      and factory_id is not null
      and (select private.is_assigned_to_factory(factory_id))
    )
  )
);
drop policy if exists app_records_insert_company_scoped on public.app_records;
create policy app_records_insert_company_scoped on public.app_records
for insert to authenticated
with check (
  company_id = (select private.current_company_id())
  and (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'office_staff'
      and collection_name <> 'factory_configs'
    )
    or (
      (select private.current_user_role()) = 'supervisor'
      and collection_name = 'attendance'
      and factory_id is not null
      and (select private.is_assigned_to_factory(factory_id))
      and coalesce(payload ->> 'submissionStatus','submitted') = 'submitted'
      and coalesce(payload ->> 'billable','false') <> 'true'
    )
  )
);
drop policy if exists app_records_update_company_scoped on public.app_records;
create policy app_records_update_company_scoped on public.app_records
for update to authenticated
using (
  company_id = (select private.current_company_id())
  and (
    (select private.current_user_role()) = 'admin'
    or ((select private.current_user_role()) = 'office_staff' and collection_name <> 'factory_configs')
    or ((select private.current_user_role()) = 'supervisor' and collection_name = 'attendance'
      and factory_id is not null and (select private.is_assigned_to_factory(factory_id)))
  )
)
with check (
  company_id = (select private.current_company_id())
  and (
    (select private.current_user_role()) = 'admin'
    or ((select private.current_user_role()) = 'office_staff' and collection_name <> 'factory_configs')
    or (
      (select private.current_user_role()) = 'supervisor'
      and collection_name = 'attendance'
      and factory_id is not null
      and (select private.is_assigned_to_factory(factory_id))
      and coalesce(payload ->> 'submissionStatus','submitted') = 'submitted'
      and coalesce(payload ->> 'billable','false') <> 'true'
    )
  )
);
drop policy if exists app_records_delete_admin_only on public.app_records;
create policy app_records_delete_admin_only on public.app_records
for delete to authenticated
using (company_id = (select private.current_company_id()) and (select private.current_user_role()) = 'admin');

grant select on public.companies, public.profiles to authenticated;
grant select, insert, update, delete on public.factories, public.user_factory_assignments, public.app_records to authenticated;
revoke all on public.worker_portal_credentials, public.worker_portal_sessions from public, anon, authenticated;
grant all on public.worker_portal_credentials, public.worker_portal_sessions to service_role;

create or replace function public.record_worker_portal_failed_attempt(p_credential_id uuid)
returns void language sql security definer
set search_path = public
as $$
  update public.worker_portal_credentials
  set
    locked_until = case when failed_attempts >= 4 then now() + interval '15 minutes' else locked_until end,
    failed_attempts = case when failed_attempts >= 4 then 0 else failed_attempts + 1 end,
    updated_at = now()
  where id = p_credential_id and is_active = true;
$$;
revoke all on function public.record_worker_portal_failed_attempt(uuid) from public, anon, authenticated;
grant execute on function public.record_worker_portal_failed_attempt(uuid) to service_role;

create or replace function public.handle_new_royal_pay_auth_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  company_count integer;
  target_company_id uuid;
  requested_name text;
begin
  select count(*), (array_agg(id order by created_at))[1]
    into company_count, target_company_id
  from public.companies;
  requested_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '');
  if company_count = 1 then
    insert into public.profiles (
      user_id, company_id, full_name, role, is_active, approval_status, approval_requested_at
    ) values (
      new.id, target_company_id,
      coalesce(requested_name, nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Royal Pay User'),
      'supervisor', false, 'pending', now()
    ) on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.handle_new_royal_pay_auth_user() from public, anon, authenticated;
drop trigger if exists on_royal_pay_auth_user_created on auth.users;
create trigger on_royal_pay_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_royal_pay_auth_user();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_records') then
      alter publication supabase_realtime add table public.app_records;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'factories') then
      alter publication supabase_realtime add table public.factories;
    end if;
  end if;
end
$$;

insert into public.companies(name)
values ('Royal Hires Private Limited')
on conflict (name) do nothing;

insert into public.profiles(user_id, company_id, full_name, role, is_active, approval_status, approved_at)
select up.user_id, c.id, coalesce(up.display_name, 'Royal Hires Administrator'),
       'admin', true, 'approved', now()
from public.user_profiles up
cross join public.companies c
where c.name = 'Royal Hires Private Limited'
  and up.role = 'admin'
  and up.is_active = true
on conflict (user_id) do update
set company_id = excluded.company_id,
    full_name = excluded.full_name,
    role = 'admin',
    is_active = true,
    approval_status = 'approved',
    approved_at = coalesce(public.profiles.approved_at, now());

insert into public.factories(company_id, legacy_id, code, name, is_active)
select c.id, 'fac-empire-teas', 'FAC-EMPIRE-TEAS', 'Empire Teas', true
from public.companies c where c.name = 'Royal Hires Private Limited'
on conflict (company_id, legacy_id) do update
set code = excluded.code, name = excluded.name, is_active = excluded.is_active;

insert into public.factories(company_id, legacy_id, code, name, is_active)
select c.id, 'fac-millennium-teas', 'FAC-MILLENNIUM-TEAS', 'Millennium Teas', true
from public.companies c where c.name = 'Royal Hires Private Limited'
on conflict (company_id, legacy_id) do update
set code = excluded.code, name = excluded.name, is_active = excluded.is_active;
