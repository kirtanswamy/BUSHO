-- BUSHO database security audit for the PostgreSQL contract CI job.
-- Run after every migration with psql -v ON_ERROR_STOP=1.
-- This is a fail-closed structural audit, not a substitute for authenticated RLS tests.

do $security_audit$
declare
  v_count integer;
  v_details text;
begin
  -- Every exposed ordinary/partitioned public table must have RLS enabled.
  select count(*), string_agg(format('%I.%I', n.nspname, c.relname), ', ')
    into v_count, v_details
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r','p')
    and not c.relrowsecurity;
  if v_count > 0 then
    raise exception 'Public tables without RLS: %', v_details;
  end if;

  -- No anonymous role may have table privileges in the exposed public schema.
  select count(*), string_agg(format('%I.%I (%s)', n.nspname, c.relname, p.privilege_type), ', ')
    into v_count, v_details
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join lateral (values
    ('SELECT', has_table_privilege('anon', c.oid, 'SELECT')),
    ('INSERT', has_table_privilege('anon', c.oid, 'INSERT')),
    ('UPDATE', has_table_privilege('anon', c.oid, 'UPDATE')),
    ('DELETE', has_table_privilege('anon', c.oid, 'DELETE')),
    ('TRUNCATE', has_table_privilege('anon', c.oid, 'TRUNCATE')),
    ('REFERENCES', has_table_privilege('anon', c.oid, 'REFERENCES')),
    ('TRIGGER', has_table_privilege('anon', c.oid, 'TRIGGER'))
  ) p(privilege_type, granted)
  where n.nspname = 'public'
    and c.relkind in ('r','p')
    and p.granted;
  if v_count > 0 then
    raise exception 'Anonymous public-table privileges detected: %', v_details;
  end if;

  -- Every authenticated table grant must be protected by RLS.
  select count(*), string_agg(format('%I.%I', n.nspname, c.relname), ', ')
    into v_count, v_details
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r','p')
    and not c.relrowsecurity
    and (
      has_table_privilege('authenticated', c.oid, 'SELECT')
      or has_table_privilege('authenticated', c.oid, 'INSERT')
      or has_table_privilege('authenticated', c.oid, 'UPDATE')
      or has_table_privilege('authenticated', c.oid, 'DELETE')
    );
  if v_count > 0 then
    raise exception 'Authenticated table access without RLS: %', v_details;
  end if;

  -- app_private must not be exposed to anon, and authenticated execution is
  -- restricted to the four narrowly scoped identity/scope helper functions.
  if has_schema_privilege('anon', 'app_private', 'USAGE') then
    raise exception 'anon has USAGE on app_private';
  end if;

  select count(*), string_agg(p.oid::regprocedure::text, ', ')
    into v_count, v_details
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'app_private'
    and has_function_privilege('anon', p.oid, 'EXECUTE');
  if v_count > 0 then
    raise exception 'anon can execute app_private routines: %', v_details;
  end if;

  select count(*), string_agg(p.oid::regprocedure::text, ', ')
    into v_count, v_details
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'app_private'
    and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and p.oid::regprocedure::text not in (
      'app_private.current_profile_role()',
      'app_private.profile_is_active()',
      'app_private.has_facility_access(uuid,text[])',
      'app_private.auth_worker_id()'
    );
  if v_count > 0 then
    raise exception 'Unexpected authenticated execution grants in app_private: %', v_details;
  end if;

  -- Public RPCs and internal helpers must not be callable by anon or
  -- authenticated unless they are one of the four explicitly approved helpers.
  select count(*), string_agg(p.oid::regprocedure::text, ', ')
    into v_count, v_details
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      or has_function_privilege('authenticated', p.oid, 'EXECUTE')
    );
  if v_count > 0 then
    raise exception 'Public-schema functions executable by anon/authenticated: %', v_details;
  end if;

  -- SECURITY DEFINER routines must pin search_path to empty to prevent
  -- object-shadowing attacks. Inspect all exposed and private application
  -- routines, excluding extension-owned functions.
  select count(*), string_agg(p.oid::regprocedure::text, ', ')
    into v_count, v_details
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','app_private')
    and p.prosecdef
    and coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%';
  if v_count > 0 then
    raise exception 'SECURITY DEFINER routines missing pinned search_path: %', v_details;
  end if;

  -- No PUBLIC EXECUTE ACL on app-defined SECURITY DEFINER routines.
  select count(*), string_agg(p.oid::regprocedure::text, ', ')
    into v_count, v_details
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  where n.nspname in ('public','app_private')
    and p.prosecdef
    and a.grantee = 0
    and a.privilege_type = 'EXECUTE';
  if v_count > 0 then
    raise exception 'SECURITY DEFINER routines retain PUBLIC EXECUTE: %', v_details;
  end if;

  raise notice 'BUSHO database security audit passed: public RLS, anon table/function denial, app_private allowlist and SECURITY DEFINER search_path checks';
end
$security_audit$;
