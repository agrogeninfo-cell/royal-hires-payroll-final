create or replace function public.record_worker_portal_failed_attempt(p_credential_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.worker_portal_credentials
  set
    locked_until = case
      when failed_attempts >= 4 then now() + interval '15 minutes'
      else locked_until
    end,
    failed_attempts = case
      when failed_attempts >= 4 then 0
      else failed_attempts + 1
    end,
    updated_at = now()
  where id = p_credential_id
    and is_active = true;
$$;
revoke all on function public.record_worker_portal_failed_attempt(uuid) from public, anon, authenticated;
grant execute on function public.record_worker_portal_failed_attempt(uuid) to service_role;