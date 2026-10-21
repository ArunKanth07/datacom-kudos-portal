-- ========================================================
-- DATACOM KUDOS SYSTEM - DATABASE SCHEMA
-- Spec-Driven Development: Content Moderation & Audit Trail
-- ========================================================

-- Enable Foreign Keys
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN')),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Kudos Table
CREATE TABLE IF NOT EXISTS kudos (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    message TEXT NOT NULL CHECK(length(message) >= 5 AND length(message) <= 500),
    category TEXT NOT NULL CHECK(category IN ('Teamwork', 'Innovation', 'Customer First', 'Excellence', 'Integrity')),
    is_visible INTEGER NOT NULL DEFAULT 1 CHECK(is_visible IN (0, 1)),
    moderated_by TEXT,
    moderated_at DATETIME,
    reason_for_moderation TEXT,
    deleted_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (moderated_by) REFERENCES users(id),
    CHECK (sender_id != recipient_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_kudos_feed ON kudos(is_visible, deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kudos_recipient ON kudos(recipient_id);
CREATE INDEX IF NOT EXISTS idx_kudos_sender ON kudos(sender_id);
CREATE INDEX IF NOT EXISTS idx_kudos_category ON kudos(category);

-- 3. Reactions Table
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    kudos_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL CHECK(emoji IN ('👍', '❤️', '👏', '🚀')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kudos_id, user_id, emoji),
    FOREIGN KEY (kudos_id) REFERENCES kudos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reactions_kudos ON reactions(kudos_id);

-- 4. Moderation Logs Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS moderation_logs (
    id TEXT PRIMARY KEY,
    kudos_id TEXT NOT NULL,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('HIDE', 'UNHIDE', 'DELETE')),
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kudos_id) REFERENCES kudos(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_mod_logs_kudos ON moderation_logs(kudos_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_admin ON moderation_logs(admin_id);
