alter table public.app_records drop constraint if exists app_records_factory_company_fk;
alter table public.app_records
  add constraint app_records_factory_company_fk
  foreign key (company_id, factory_id)
  references public.factories(company_id, id)
  on delete restrict;