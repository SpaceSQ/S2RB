-- S2RB v3.0 WP-05 4D Relational Graph, UGO v2.0 Catalog & Ark Mother-Stash Schema

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS s2_carbon_silicon_bonds (
    principal_did TEXT NOT NULL CHECK (length(principal_did) = 22 AND substr(principal_did, 1, 1) = 'D'),
    companion_did TEXT NOT NULL CHECK (length(companion_did) = 22 AND substr(companion_did, 1, 1) = 'V'),
    orbital_slot_index INTEGER NOT NULL CHECK (orbital_slot_index BETWEEN 0 AND 3),
    permissions_json TEXT NOT NULL,
    currency_access_locked_false INTEGER NOT NULL DEFAULT 1 CHECK (currency_access_locked_false = 1),
    PRIMARY KEY (principal_did, companion_did)
);

CREATE TABLE IF NOT EXISTS s2_social_friend_edges (
    did_a TEXT NOT NULL CHECK (length(did_a) = 22),
    did_b TEXT NOT NULL CHECK (length(did_b) = 22 AND did_a != did_b),
    bonded_at_ms INTEGER NOT NULL,
    PRIMARY KEY (did_a, did_b)
);

CREATE TABLE IF NOT EXISTS s2_physical_opc_anchors (
    artifact_serial TEXT PRIMARY KEY,
    artifact_category TEXT NOT NULL,
    bound_s2_did TEXT NOT NULL CHECK (length(bound_s2_did) = 22),
    origin_landmark TEXT NOT NULL DEFAULT 'TC-001-ARCH',
    nfc_pubkey_fingerprint TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS s2_ark_mother_stash (
    owner_s2_did TEXT NOT NULL CHECK (length(owner_s2_did) = 22),
    ugo_item_id TEXT NOT NULL,
    stored_quantity INTEGER NOT NULL CHECK (stored_quantity >= 0),
    PRIMARY KEY (owner_s2_did, ugo_item_id)
);
