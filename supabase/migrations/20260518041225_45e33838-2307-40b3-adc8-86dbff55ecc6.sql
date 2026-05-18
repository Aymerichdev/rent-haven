
revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;
revoke execute on function public.current_role() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop policy if exists "receipts_public_read" on storage.objects;
drop policy if exists "property_public_read" on storage.objects;
