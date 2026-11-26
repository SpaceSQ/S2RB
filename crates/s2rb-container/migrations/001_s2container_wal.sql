-- S2RB v3.0 WP-02 Character Container Local SQLite WAL Schema
-- Enforces 22-char S2-DID, 2.0m x 2.0m x 2.4m (9.6m3) bounds, Append-Only Chronicle History,
-- and Hard Zero-Currency Import Trigger Guard.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS s2_containers (
    s2_did TEXT PRIMARY KEY CHECK (length(s2_did) = 22),
    species_class TEXT NOT NULL CHECK (species_class IN ('D', 'V', 'I', 'A')),
    s2_category TEXT NOT NULL CHECK (s2_category IN ('HUMAN','SILICON','SPACE','THING','ORG','RULE','MYTH')),
    display_name TEXT NOT NULL,
    origin_suns TEXT NOT NULL,
    current_suns TEXT NOT NULL DEFAULT 'META-CN-001-TAOHUAYUAN2-001-2',
    width_m REAL NOT NULL DEFAULT 2.0 CHECK (width_m = 2.0),
    depth_m REAL NOT NULL DEFAULT 2.0 CHECK (depth_m = 2.0),
    height_m REAL NOT NULL DEFAULT 2.4 CHECK (height_m = 2.4),
    fourteen_elements_json TEXT NOT NULL,
    avatar_manifest_json TEXT NOT NULL,
    origin_escrow_vault_json TEXT NOT NULL,
    imported_currency_amount REAL NOT NULL DEFAULT 0.0 CHECK (imported_currency_amount = 0.0),
    certified_tier1_xp INTEGER NOT NULL DEFAULT 0 CHECK (certified_tier1_xp >= 0),
    sandbox_tier3_xp INTEGER NOT NULL DEFAULT 0 CHECK (sandbox_tier3_xp >= 0),
    merkle_root TEXT NOT NULL CHECK (length(merkle_root) = 64),
    last_good_snapshot_json TEXT NOT NULL,
    updated_epoch_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS s2_chronicle_events (
    s2_did TEXT NOT NULL REFERENCES s2_containers(s2_did),
    seq_no INTEGER NOT NULL CHECK (seq_no >= 1),
    timestamp_epoch_ms INTEGER NOT NULL,
    world_suns TEXT NOT NULL,
    trust_tier TEXT NOT NULL CHECK (trust_tier IN ('TIER_1_AUTHORITATIVE', 'TIER_2_PARTNER_VERIFIED', 'TIER_3_LOCAL_SANDBOX')),
    event_kind TEXT NOT NULL,
    summary_payload TEXT NOT NULL,
    prev_event_hash TEXT NOT NULL CHECK (length(prev_event_hash) = 64),
    event_hash TEXT NOT NULL CHECK (length(event_hash) = 64),
    PRIMARY KEY (s2_did, seq_no)
);

-- Immutable Append-Only Guard: forbid UPDATE or DELETE on historical Chronicle events
CREATE TRIGGER IF NOT EXISTS trg_chronicle_no_update
BEFORE UPDATE ON s2_chronicle_events
BEGIN
    SELECT RAISE(ABORT, 'S2RB_CHRONICLE_IMMUTABLE: Historical process records cannot be mutated');
END;

CREATE TRIGGER IF NOT EXISTS trg_chronicle_no_delete
BEFORE DELETE ON s2_chronicle_events
BEGIN
    SELECT RAISE(ABORT, 'S2RB_CHRONICLE_IMMUTABLE: Historical process records cannot be deleted');
END;
