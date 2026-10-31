
-- Replace broad ALL policies with least-privilege policies.
drop policy if exists attendance_role_access on public.attendance;
create policy attendance_admin_office_all on public.attendance
for all to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role in ('admin','office_staff')))
with check (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role in ('admin','office_staff')));
create policy attendance_supervisor_read on public.attendance
for select to authenticated
using (exists (select 1 from public.user_profiles p join public.employees e on e.id=attendance.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id));
create policy attendance_supervisor_write on public.attendance
for insert to authenticated
with check (exists (select 1 from public.user_profiles p join public.employees e on e.id=attendance.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id));
create policy attendance_supervisor_update on public.attendance
for update to authenticated
using (exists (select 1 from public.user_profiles p join public.employees e on e.id=attendance.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id))
with check (exists (select 1 from public.user_profiles p join public.employees e on e.id=attendance.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id));
create policy attendance_worker_read_own on public.attendance
for select to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role='worker' and p.employee_id=attendance.employee_id));

drop policy if exists meals_role_access on public.meals;
create policy meals_admin_office_all on public.meals
for all to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role in ('admin','office_staff')))
with check (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role in ('admin','office_staff')));
create policy meals_supervisor_read on public.meals
for select to authenticated
using (exists (select 1 from public.user_profiles p join public.employees e on e.id=meals.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id));
create policy meals_supervisor_write on public.meals
for insert to authenticated
with check (exists (select 1 from public.user_profiles p join public.employees e on e.id=meals.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id));
create policy meals_supervisor_update on public.meals
for update to authenticated
using (exists (select 1 from public.user_profiles p join public.employees e on e.id=meals.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id))
with check (exists (select 1 from public.user_profiles p join public.employees e on e.id=meals.employee_id where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(e.factory_id,e.factory)=p.factory_id));
create policy meals_worker_read_own on public.meals
for select to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role='worker' and p.employee_id=meals.employee_id));

drop policy if exists settlements_role_access on public.settlements;
create policy settlements_admin_office_all on public.settlements
for all to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role in ('admin','office_staff')))
with check (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role in ('admin','office_staff')));
create policy settlements_worker_read_own on public.settlements
for select to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role='worker' and p.employee_id=settlements.employee_id));

drop policy if exists employees_role_read on public.employees;
create policy employees_role_read on public.employees
for select to authenticated
using (
 exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role in ('admin','office_staff'))
 or exists (select 1 from public.user_profiles p where p.user_id=auth.uid() and p.is_active and p.role='supervisor' and coalesce(employees.factory_id,employees.factory)=p.factory_id)
 or auth_user_id=auth.uid()
);
