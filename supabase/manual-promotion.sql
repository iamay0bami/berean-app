-- Bootstrap the first admin in the Supabase SQL editor after that user signs up.
update public.profiles
set role = 'admin', assigned_class_id = null, updated_at = now()
where id = 'AUTH-USER-UUID-HERE';

-- After an admin exists, use the guarded RPC for subsequent assignments.
select public.assign_user_role('AUTH-USER-UUID-HERE', 'class_leader', 'CLASS-ID-HERE');
