-- S2RB v3.0 WP-03 Singleton Fencing Leases & Clone Quota Escrow Ledger

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS s2_singleton_leases (
    s2_did TEXT PRIMARY KEY CHECK (length(s2_did) = 22),
    holder_world_suns TEXT NOT NULL,
    fencing_token INTEGER NOT NULL CHECK (fencing_token >= 1),
    presence_phase TEXT NOT NULL CHECK (presence_phase IN ('ACTIVE', 'FREEZE_EXTRACTING', 'IN_BIFROST_TRANSIT')),
    transit_deadline_ms INTEGER,
    imported_currency_zero REAL NOT NULL DEFAULT 0.0 CHECK (imported_currency_zero = 0.0),
    updated_at_ms INTEGER NOT NULL
);

-- Monotonic Fencing Token Trigger: forbids regressing fencing_token (anti-split-brain)
CREATE TRIGGER IF NOT EXISTS trg_singleton_monotonic_fencing
BEFORE UPDATE ON s2_singleton_leases
WHEN NEW.fencing_token < OLD.fencing_token
BEGIN
    SELECT RAISE(ABORT, 'S2RB_SPLIT_BRAIN_GUARD: fencing_token must be monotonically non-decreasing');
END;

CREATE TABLE IF NOT EXISTS s2_clone_forks (
    fork_id TEXT PRIMARY KEY,
    parent_s2_did TEXT NOT NULL CHECK (length(parent_s2_did) = 22),
    target_world_suns TEXT NOT NULL,
    trust_tier TEXT NOT NULL CHECK (trust_tier IN ('TIER_1_AUTHORITATIVE', 'TIER_2_PARTNER_VERIFIED', 'TIER_3_LOCAL_SANDBOX')),
    escrowed_consumables_json TEXT NOT NULL,
    imported_currency_zero REAL NOT NULL DEFAULT 0.0 CHECK (imported_currency_zero = 0.0),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE_PARALLEL', 'MERGED_RETIRED')),
    created_at_ms INTEGER NOT NULL
);
