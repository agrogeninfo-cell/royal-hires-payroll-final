-- Royal Hires live-project cutover audit (READ ONLY)
-- Run in Supabase SQL Editor for the intended project.
-- This script reads metadata only. It does not read employee/payroll rows,
-- change schema, alter permissions, or modify business data.

-- 1) Confirm the expected live tables and their columns.
select
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    'employees', 'attendance', 'meals', 'settlements',
    'companies', 'profiles', 'factories', 'user_factory_assignments',
    'app_records', 'employee_portal_accounts', 'meal_rates'
  )
order by c.table_name, c.ordinal_position;

-- 2) RLS enabled/forced status for relevant public tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname in (
    'employees', 'attendance', 'meals', 'settlements',
    'companies', 'profiles', 'factories', 'user_factory_assignments',
    'app_records', 'employee_portal_accounts', 'meal_rates'
  )
order by c.relname;

-- 3) Policies (definitions only; no row data).
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'employees', 'attendance', 'meals', 'settlements',
    'companies', 'profiles', 'factories', 'user_factory_assignments',
    'app_records', 'employee_portal_accounts', 'meal_rates'
  )
order by tablename, policyname;

-- 4) Table grants for API roles. Review for unexpected anon access.
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
  and table_name in (
    'employees', 'attendance', 'meals', 'settlements',
    'companies', 'profiles', 'factories', 'user_factory_assignments',
    'app_records', 'employee_portal_accounts', 'meal_rates'
  )
order by table_name, grantee, privilege_type;

-- 5) Relevant deployed Edge Functions are not exposed by standard SQL metadata.
-- Check Dashboard > Edge Functions for royal-pay-login-v2 and admin-user-access.
-- Do not paste secrets or employee/payroll records into chat.
