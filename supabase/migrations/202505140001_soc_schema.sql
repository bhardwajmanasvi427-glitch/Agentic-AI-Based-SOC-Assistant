-- Aegis SOC schema. Run with `supabase db push` or in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'SOC Analyst'
    check (role in ('SOC Analyst', 'Cybersecurity Engineer', 'Incident Response Team', 'IT Administrator')),
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity text not null check (severity in ('Critical', 'High', 'Medium', 'Low')),
  confidence integer not null check (confidence between 0 and 100),
  source text not null,
  status text not null default 'New'
    check (status in ('New', 'Investigating', 'Triaged', 'Resolved')),
  assigned_analyst uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  linked_alerts uuid[] not null default '{}',
  severity text not null check (severity in ('Critical', 'High', 'Medium', 'Low')),
  owner uuid references public.profiles(id) on delete set null,
  status text not null default 'Investigating'
    check (status in ('Investigating', 'Contained', 'Monitoring', 'Resolved')),
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  evidence_type text not null,
  description text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.response_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  suggested_action text not null,
  rationale text,
  ai_confidence integer check (ai_confidence between 0 and 100),
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'dismissed')),
  approver uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  execution_status text not null default 'not_started'
    check (execution_status in ('not_started', 'queued', 'running', 'succeeded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor uuid references public.profiles(id) on delete set null,
  action text not null,
  affected_table text not null,
  affected_record uuid,
  outcome text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and account_status = 'active' $$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and account_status = 'active') $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role, account_status)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    'SOC Analyst',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_new_user();

insert into public.profiles (id, display_name, role, account_status)
select id, coalesce(nullif(raw_user_meta_data ->> 'display_name', ''), split_part(email, '@', 1)), 'SOC Analyst', 'active'
from auth.users
on conflict (id) do nothing;

create or replace function public.enforce_response_approval()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_role text;
begin
  actor_role := public.current_profile_role();

  if old.approval_status = 'pending' and new.approval_status = 'approved' then
    if auth.uid() is null or actor_role not in ('SOC Analyst', 'Incident Response Team') then
      raise exception 'Only an authenticated SOC analyst or incident responder may approve a response';
    end if;
    if new.approver is distinct from auth.uid() then
      raise exception 'Approver must match the authenticated user';
    end if;
    new.approved_at := now();
    new.execution_status := 'queued';
  elsif old.approval_status = 'pending' and new.approval_status = 'dismissed' then
    if auth.uid() is null or actor_role not in ('SOC Analyst', 'Incident Response Team') then
      raise exception 'Only an authenticated SOC analyst or incident responder may dismiss a response';
    end if;
    if new.approver is distinct from auth.uid() then
      raise exception 'Actor must match the authenticated user';
    end if;
    new.execution_status := 'not_started';
  elsif old.approval_status = 'pending' and new.execution_status <> 'not_started' then
    raise exception 'A pending recommendation cannot be executed';
  end if;

  if old.approval_status <> 'approved'
     and new.execution_status in ('running', 'succeeded', 'failed') then
    raise exception 'Execution status cannot advance before analyst approval';
  end if;
  return new;
end $$;

create or replace function public.log_record_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare record_id uuid;
begin
  record_id := coalesce(new.id, old.id);
  insert into public.audit_logs(actor, action, affected_table, affected_record, outcome, details)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    record_id,
    'recorded',
    jsonb_build_object('old_status', old.status, 'new_status', new.status)
  );
  return new;
end $$;

create or replace function public.log_response_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs(actor, action, affected_table, affected_record, outcome, details)
  values (
    auth.uid(),
    'response_' || new.approval_status,
    'response_actions',
    new.id,
    new.execution_status,
    jsonb_build_object('approval_status', new.approval_status, 'execution_status', new.execution_status)
  );
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists alerts_updated_at on public.alerts;
create trigger alerts_updated_at before update on public.alerts for each row execute function public.set_updated_at();
drop trigger if exists incidents_updated_at on public.incidents;
create trigger incidents_updated_at before update on public.incidents for each row execute function public.set_updated_at();
drop trigger if exists response_actions_updated_at on public.response_actions;
create trigger response_actions_updated_at before update on public.response_actions for each row execute function public.set_updated_at();
drop trigger if exists enforce_response_approval_trigger on public.response_actions;
create trigger enforce_response_approval_trigger before update on public.response_actions for each row execute function public.enforce_response_approval();
drop trigger if exists incident_audit_trigger on public.incidents;
create trigger incident_audit_trigger after update on public.incidents for each row execute function public.log_record_change();
drop trigger if exists response_audit_trigger on public.response_actions;
create trigger response_audit_trigger after update on public.response_actions for each row execute function public.log_response_change();

alter table public.profiles enable row level security;
alter table public.alerts enable row level security;
alter table public.incidents enable row level security;
alter table public.evidence enable row level security;
alter table public.response_actions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "active users read profiles" on public.profiles;
create policy "active users read profiles" on public.profiles for select to authenticated using (public.is_active_user());
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for update to authenticated
using (public.current_profile_role() = 'IT Administrator')
with check (public.current_profile_role() = 'IT Administrator');

drop policy if exists "active users read alerts" on public.alerts;
create policy "active users read alerts" on public.alerts for select to authenticated using (public.is_active_user());
drop policy if exists "analysts update alerts" on public.alerts;
create policy "analysts update alerts" on public.alerts for update to authenticated
using (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'))
with check (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'));
drop policy if exists "engineers create alerts" on public.alerts;
create policy "engineers create alerts" on public.alerts for insert to authenticated
with check (public.current_profile_role() in ('Cybersecurity Engineer', 'IT Administrator'));

drop policy if exists "active users read incidents" on public.incidents;
create policy "active users read incidents" on public.incidents for select to authenticated using (public.is_active_user());
drop policy if exists "response roles create incidents" on public.incidents;
create policy "response roles create incidents" on public.incidents for insert to authenticated
with check (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'));
drop policy if exists "response roles update incidents" on public.incidents;
create policy "response roles update incidents" on public.incidents for update to authenticated
using (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'))
with check (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'));

drop policy if exists "active users read evidence" on public.evidence;
create policy "active users read evidence" on public.evidence for select to authenticated using (public.is_active_user());
drop policy if exists "response roles add evidence" on public.evidence;
create policy "response roles add evidence" on public.evidence for insert to authenticated
with check (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'));

drop policy if exists "active users read response actions" on public.response_actions;
create policy "active users read response actions" on public.response_actions for select to authenticated using (public.is_active_user());
drop policy if exists "response roles suggest actions" on public.response_actions;
create policy "response roles suggest actions" on public.response_actions for insert to authenticated
with check (
  public.current_profile_role() in ('SOC Analyst', 'Incident Response Team')
  and approval_status = 'pending'
  and execution_status = 'not_started'
  and approver is null
);
drop policy if exists "response roles review actions" on public.response_actions;
create policy "response roles review actions" on public.response_actions for update to authenticated
using (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'))
with check (public.current_profile_role() in ('SOC Analyst', 'Incident Response Team'));

drop policy if exists "authorized roles read audit logs" on public.audit_logs;
create policy "authorized roles read audit logs" on public.audit_logs for select to authenticated
using (
  public.current_profile_role() in ('Incident Response Team', 'IT Administrator')
  or actor = auth.uid()
);

do $$
begin
  alter publication supabase_realtime add table public.alerts;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.incidents;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.response_actions;
exception when duplicate_object then null;
end $$;

-- Fictional operational data. User-linked ownership is intentionally left null.
insert into public.alerts (id, title, severity, confidence, source, status, created_at)
values
  ('24810000-0000-4000-8000-000000000001', 'Suspicious PowerShell & credential access', 'Critical', 96, 'CrowdStrike EDR', 'Investigating', now() - interval '2 minutes'),
  ('24800000-0000-4000-8000-000000000002', 'Impossible travel with privileged login', 'High', 89, 'Microsoft Entra ID', 'New', now() - interval '8 minutes'),
  ('24790000-0000-4000-8000-000000000003', 'Lateral movement via remote service', 'High', 84, 'Splunk SIEM', 'New', now() - interval '17 minutes'),
  ('24780000-0000-4000-8000-000000000004', 'Unusual outbound data transfer', 'Medium', 72, 'Zscaler', 'Triaged', now() - interval '32 minutes')
on conflict (id) do nothing;

insert into public.incidents (id, title, linked_alerts, severity, status, notes)
values (
  '10470000-0000-4000-8000-000000000001',
  'Credential access on finance endpoint',
  array['24810000-0000-4000-8000-000000000001'::uuid],
  'Critical',
  'Investigating',
  '[{"author":"Aegis AI","text":"Incident created from correlated alert ALT-2481."}]'::jsonb
)
on conflict (id) do nothing;

insert into public.evidence (incident_id, evidence_type, description, source, created_at)
values
  ('10470000-0000-4000-8000-000000000001', 'transcript', 'PowerShell transcript', 'CrowdStrike EDR', now() - interval '8 minutes'),
  ('10470000-0000-4000-8000-000000000001', 'process_tree', 'Process tree snapshot', 'Microsoft Defender', now() - interval '7 minutes'),
  ('10470000-0000-4000-8000-000000000001', 'network', 'Network connection log', 'Zscaler', now() - interval '6 minutes')
on conflict do nothing;

insert into public.response_actions (
  id, incident_id, suggested_action, rationale, ai_confidence, approval_status, execution_status
)
values (
  '77310000-0000-4000-8000-000000000001',
  '10470000-0000-4000-8000-000000000001',
  'Isolate endpoint FIN-WS-042 from the network',
  'Contain likely credential theft while preserving the EDR control channel.',
  94,
  'pending',
  'not_started'
)
on conflict (id) do nothing;
