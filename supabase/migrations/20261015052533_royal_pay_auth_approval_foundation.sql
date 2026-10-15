-- Royal Pay auth approval foundation.
-- Additive migration: preserves existing profiles and all payroll/business records.

alter table public.profiles
  add column if not exists approval_status text,
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists approval_requested_at timestamptz;

update public.profiles
set approval_status = case when is_active then 'approved' else 'pending' end
where approval_status is null;

alter table public.profiles
  alter column approval_status set default 'pending',
  alter column approval_status set not null,
  alter column approval_requested_at set default now(),
  alter column approval_requested_at set not null,
  alter column is_active set default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_approval_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_approval_status_check
      check (approval_status in ('pending', 'approved', 'rejected'));
  end if;
end
$$;

-- New password/Google sign-ups receive a pending profile, never an admin role.
-- Automatic company association is allowed only while exactly one company exists.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
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
      user_id, company_id, full_name, role, is_active,
      approval_status, approval_requested_at
    )
    values (
      new.id, target_company_id, coalesce(requested_name, nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Royal Pay User'),
      'supervisor', false, 'pending', now()
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

comment on column public.profiles.approval_status is
  'Access workflow state. New self-signups remain pending until an authorized admin approves them.';
