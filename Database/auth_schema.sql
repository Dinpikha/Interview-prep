----------------------------------------------------
-- AUTH SCHEMA MIGRATION
-- Run this AFTER create_database.md's base tables exist.
-- It only ADDS columns/tables — nothing here drops or
-- rewrites sessions / messages / resume / metrics.
----------------------------------------------------

----------------------------------------------------
-- USERS — extended with real auth fields
----------------------------------------------------
alter table users
    add column if not exists email text unique,
    add column if not exists password_hash text,
    -- 'local'  -> signed up with username/password
    -- 'github' -> signed up via GitHub OAuth (password_hash stays null)
    add column if not exists auth_provider text not null default 'local'
        check (auth_provider in ('local', 'github')),
    add column if not exists avatar_url text,
    add column if not exists is_active boolean not null default true,
    add column if not exists updated_at timestamptz default now();

----------------------------------------------------
-- OAUTH ACCOUNTS
-- Kept separate from `users` so a local account can
-- later link a GitHub account (or vice versa) without
-- a schema change.
----------------------------------------------------
create table if not exists oauth_accounts (
    oauth_account_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(user_id) on delete cascade,
    provider text not null check (provider in ('github')),
    provider_user_id text not null,
    created_at timestamptz default now(),
    unique (provider, provider_user_id)
);

----------------------------------------------------
-- REFRESH TOKENS
-- Access tokens (JWT) are short-lived and stateless.
-- Refresh tokens are opaque random strings — only their
-- SHA-256 hash is ever stored, so a DB leak can't be used
-- to mint new sessions. Rotated on every /auth/refresh call.
----------------------------------------------------
create table if not exists refresh_tokens (
    token_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(user_id) on delete cascade,
    token_hash text not null unique,
    expires_at timestamptz not null,
    revoked boolean not null default false,
    created_at timestamptz default now()
);

----------------------------------------------------
-- PASSWORD RESET TOKENS
-- Same "store only the hash" pattern as refresh tokens.
-- One-time use, short expiry (30 min default).
----------------------------------------------------
create table if not exists password_reset_tokens (
    reset_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(user_id) on delete cascade,
    token_hash text not null unique,
    expires_at timestamptz not null,
    used boolean not null default false,
    created_at timestamptz default now()
);

create index if not exists idx_refresh_tokens_user on refresh_tokens(user_id);
create index if not exists idx_reset_tokens_user on password_reset_tokens(user_id);
create index if not exists idx_oauth_accounts_user on oauth_accounts(user_id);
