
drop policy if exists profiles_admin_manage on public.user_profiles;
drop policy if exists attendance_role_access on public.attendance;
create policy attendance_role_access on public.attendance for all to authenticated
using (
 exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p join public.employees e on e.id=attendance.employee_id where p.user_id=(select auth.uid()) and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id)
 or exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='worker' and p.employee_id=attendance.employee_id)
)
with check (
 exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p join public.employees e on e.id=attendance.employee_id where p.user_id=(select auth.uid()) and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id)
 or exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='worker' and p.employee_id=attendance.employee_id)
);
drop policy if exists meals_role_access on public.meals;
create policy meals_role_access on public.meals for all to authenticated
using (
 exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p join public.employees e on e.id=meals.employee_id where p.user_id=(select auth.uid()) and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id)
 or exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='worker' and p.employee_id=meals.employee_id)
)
with check (
 exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p join public.employees e on e.id=meals.employee_id where p.user_id=(select auth.uid()) and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id)
 or exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='worker' and p.employee_id=meals.employee_id)
);
drop policy if exists settlements_role_access on public.settlements;
create policy settlements_role_access on public.settlements for all to authenticated
using (
 exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p join public.employees e on e.id=settlements.employee_id where p.user_id=(select auth.uid()) and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id)
 or exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='worker' and p.employee_id=settlements.employee_id)
)
with check (
 exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p join public.employees e on e.id=settlements.employee_id where p.user_id=(select auth.uid()) and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id)
 or exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.is_active and p.role='worker' and p.employee_id=settlements.employee_id)
);
