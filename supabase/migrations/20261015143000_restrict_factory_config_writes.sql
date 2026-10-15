-- Factory rate/config records affect payroll and invoicing, so only Admin may write them.
-- Office Staff can continue writing other company-scoped business collections.
drop policy if exists app_records_insert_company_scoped on public.app_records;
create policy app_records_insert_company_scoped
on public.app_records
for insert
to authenticated
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
      and coalesce(payload ->> 'submissionStatus', 'submitted') = 'submitted'
      and coalesce(payload ->> 'billable', 'false') <> 'true'
    )
  )
);

drop policy if exists app_records_update_company_scoped on public.app_records;
create policy app_records_update_company_scoped
on public.app_records
for update
to authenticated
using (
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
    )
  )
)
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
      and coalesce(payload ->> 'submissionStatus', 'submitted') = 'submitted'
      and coalesce(payload ->> 'billable', 'false') <> 'true'
    )
  )
);

drop policy if exists app_records_delete_admin_office on public.app_records;
create policy app_records_delete_admin_office
on public.app_records
for delete
to authenticated
using (
  company_id = (select private.current_company_id())
  and (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'office_staff'
      and collection_name <> 'factory_configs'
    )
  )
);
