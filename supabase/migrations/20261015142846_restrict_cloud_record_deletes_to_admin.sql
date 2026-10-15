-- Prevent Office Staff from deleting cloud business records, including payroll and invoices.
-- Admin-only deletion is the least-privilege policy; sync never issues deletes.
drop policy if exists app_records_delete_admin_office on public.app_records;
drop policy if exists app_records_delete_admin_only on public.app_records;
create policy app_records_delete_admin_only
on public.app_records
for delete
to authenticated
using (
  company_id = (select private.current_company_id())
  and (select private.current_user_role()) = 'admin'
);
