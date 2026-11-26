-- WP-08: Taohuayuan Ancient Town Genesis Operations Center & Dual /s2RB Portal Ledger
CREATE TABLE IF NOT EXISTS s2_genesis_hub_nodes (
    engine_id               TEXT PRIMARY KEY,
    world_suns              TEXT NOT NULL UNIQUE,
    portal_channel          TEXT NOT NULL CHECK (portal_channel IN ('ROBOT0_S2RB', 'TAOHUAYUAN_S2RB', 'DUAL_PORTAL')),
    trust_tier              INTEGER NOT NULL CHECK (trust_tier IN (1, 2, 3)),
    active_containers       INTEGER NOT NULL DEFAULT 0 CHECK (active_containers >= 0),
    allow_currency_import   INTEGER NOT NULL DEFAULT 0 CHECK (allow_currency_import = 0),
    prism_roughness_pct     REAL NOT NULL DEFAULT 6.5 CHECK (prism_roughness_pct >= 5.0),
    status                  TEXT NOT NULL CHECK (status IN ('ONLINE', 'SANCTUARY_FUSED', 'DEGRADED'))
);

CREATE TABLE IF NOT EXISTS s2_taoyuan_travel_passes (
    pass_id                 TEXT PRIMARY KEY,
    traveler_did            TEXT NOT NULL,
    companion_did           TEXT,
    route_code              TEXT NOT NULL,
    entry_gate_suns         TEXT NOT NULL DEFAULT 'META-CN-001-TAOHUAYUAN2-001-2',
    physical_landmark_code  TEXT NOT NULL DEFAULT 'TC-001-ARCH',
    cryo_recovery_mult      REAL NOT NULL DEFAULT 1.5 CHECK (cryo_recovery_mult >= 1.0),
    imported_currency       REAL NOT NULL DEFAULT 0.0 CHECK (imported_currency = 0.0),
    issued_at_iso           TEXT NOT NULL
);
