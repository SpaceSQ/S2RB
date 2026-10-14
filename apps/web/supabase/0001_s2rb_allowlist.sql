-- Zero-trust cloud. These three shapes are the only S2RB rows that may exist
-- on Supabase. Do not add tables for chat bodies, failed DID probes, or UI prefs.
-- Apply in the Supabase SQL editor (or `supabase db push` if this folder is linked).

create table if not exists public.s2rb_valid_lookup (
  query text primary key,
  kind text not null check (kind in ('DID', 'ADDRESS')),
  seen_at timestamptz not null default now(),
  constraint s2rb_valid_lookup_shape check (
    (kind = 'DID' and query ~ '^[A-Z0-9]{22}$')
    or (
      kind = 'ADDRESS'
      and (
        query ~ '^SITE-[A-Z0-9]{1,32}-[A-Z0-9]{1,32}-[A-Z0-9]{1,32}-ROOM[0-9]{2}-[0-9]{2}$'
        or query ~ '^(MARS|MOON|PHYS|GAME|MYTH)-[A-Z]{2}-[0-9]{3}-[A-Z0-9_]{1,16}-ROOM[0-9]{2}-[0-9]{2}$'
      )
    )
  )
);

create table if not exists public.s2rb_handshake (
  did char(22) primary key,
  agent_class char(1) not null check (agent_class in ('D', 'V', 'I', 'R', 'A', 'E')),
  seen_at timestamptz not null default now(),
  constraint s2rb_handshake_did_shape check (did ~ '^[A-Z0-9]{22}$')
);

create table if not exists public.s2rb_client_model (
  model text primary key,
  seen_at timestamptz not null default now(),
  constraint s2rb_client_model_shape check (model ~ '^[A-Za-z0-9._-]{1,32}$')
);

comment on table public.s2rb_valid_lookup is
  'Queries that already passed the local screen. No failed probes.';
comment on table public.s2rb_handshake is
  'Successful handshake identity only. No conversation.';
comment on table public.s2rb_client_model is
  'Redacted client model label only.';

alter table public.s2rb_valid_lookup enable row level security;
alter table public.s2rb_handshake enable row level security;
alter table public.s2rb_client_model enable row level security;

revoke all on table public.s2rb_valid_lookup from anon, authenticated;
revoke all on table public.s2rb_handshake from anon, authenticated;
revoke all on table public.s2rb_client_model from anon, authenticated;

grant insert on table public.s2rb_valid_lookup to anon, authenticated;
grant insert on table public.s2rb_handshake to anon, authenticated;
grant insert on table public.s2rb_client_model to anon, authenticated;

drop policy if exists s2rb_valid_lookup_insert on public.s2rb_valid_lookup;
drop policy if exists s2rb_handshake_insert on public.s2rb_handshake;
drop policy if exists s2rb_client_model_insert on public.s2rb_client_model;

create policy s2rb_valid_lookup_insert on public.s2rb_valid_lookup
  for insert to anon, authenticated
  with check (true);

create policy s2rb_handshake_insert on public.s2rb_handshake
  for insert to anon, authenticated
  with check (true);

create policy s2rb_client_model_insert on public.s2rb_client_model
  for insert to anon, authenticated
  with check (true);

-- forbidden: s2rb_chat, s2rb_scan_fail, s2rb_ui_settings
