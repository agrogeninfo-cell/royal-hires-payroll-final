-- Enable company-scoped live refresh notifications for Royal Pay cloud records.
-- Additive and reversible: no business rows or payroll data are modified.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_records'
  ) then
    execute 'alter publication supabase_realtime add table public.app_records';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'factories'
  ) then
    execute 'alter publication supabase_realtime add table public.factories';
  end if;
end
$$;
