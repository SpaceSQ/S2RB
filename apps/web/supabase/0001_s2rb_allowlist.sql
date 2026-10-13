-- Zero-trust cloud. These three shapes are the only S2RB rows that may exist
-- on Supabase. Do not add tables for chat bodies, failed DID probes, or UI prefs.

-- valid address / DID lookups that already passed the local screen
-- create table s2rb_valid_lookup (
--   query text primary key,
--   kind text not null check (kind in ('DID', 'ADDRESS')),
--   seen_at timestamptz not null default now()
-- );

-- successful handshake identity, no conversation
-- create table s2rb_handshake (
--   did char(22) primary key,
--   agent_class char(1) not null,
--   seen_at timestamptz not null default now()
-- );

-- redacted client model only
-- create table s2rb_client_model (
--   model text primary key,
--   seen_at timestamptz not null default now()
-- );

-- forbidden: s2rb_chat, s2rb_scan_fail, s2rb_ui_settings
