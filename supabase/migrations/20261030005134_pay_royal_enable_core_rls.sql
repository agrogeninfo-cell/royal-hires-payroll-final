
drop policy if exists "Allow all for anon" on public.employees;
drop policy if exists "Allow all for anon" on public.attendance;
drop policy if exists "Allow all for anon" on public.settlements;
drop policy if exists "Allow all for anon" on public.meals;
alter table public.user_profiles enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.meals enable row level security;
alter table public.settlements enable row level security;
drop policy if exists profiles_read_self on public.user_profiles;
create policy profiles_read_self on public.user_profiles for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists profiles_admin_manage on public.user_profiles;
create policy profiles_admin_manage on public.user_profiles for all to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id = (select auth.uid()) and p.role='admin' and p.is_active))
with check (exists (select 1 from public.user_profiles p where p.user_id = (select auth.uid()) and p.role='admin' and p.is_active));
drop policy if exists employees_role_read on public.employees;
create policy employees_role_read on public.employees for select to authenticated using (
 exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='supervisor' and coalesce(factory_id,factory)=p.factory_id)
 or auth_user_id=(select auth.uid())
);
drop policy if exists employees_admin_office_insert on public.employees;
create policy employees_admin_office_insert on public.employees for insert to authenticated
with check (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff')));
drop policy if exists employees_admin_office_update on public.employees;
create policy employees_admin_office_update on public.employees for update to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff')))
with check (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff')));
drop policy if exists employees_admin_delete on public.employees;
create policy employees_admin_delete on public.employees for delete to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='admin'));
