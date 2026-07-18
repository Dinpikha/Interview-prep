
alter table users
    add column if not exists email text unique,
    add column if not exists password_hash text,

    add column if not exists auth_provider text not null default 'local'
        check (auth_provider in ('local', 'github')),
    add column if not exists avatar_url text,
    add column if not exists is_active boolean not null default true,
    add column if not exists updated_at timestamptz default now();


create table if not exists oauth_accounts (
    oauth_account_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(user_id) on delete cascade,
    provider text not null check (provider in ('github')),
    provider_user_id text not null,
    created_at timestamptz default now(),
    unique (provider, provider_user_id)
);

create table if not exists refresh_tokens (
    token_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(user_id) on delete cascade,
    token_hash text not null unique,
    expires_at timestamptz not null,
    revoked boolean not null default false,
    created_at timestamptz default now()
);

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
