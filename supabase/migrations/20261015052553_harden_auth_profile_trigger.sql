-- The auth trigger invokes this function internally; API clients must not call it directly.
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
