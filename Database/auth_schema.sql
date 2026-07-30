
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


create table if not exists mock_interview_sessions (
    mock_interview_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(user_id) on delete cascade,
    session_id uuid references sessions(session_id) on delete set null,

    interview_type text not null,        -- e.g. 'technical', 'behavioral', 'system-design'
    role_focus text,                     -- e.g. 'Frontend Engineer', 'Data Analyst' - nullable since target role was removed elsewhere but this is a different context
    difficulty_level text,               -- e.g. 'easy', 'medium', 'hard'

    status text not null default 'in_progress'
        check (status in ('in_progress', 'completed', 'abandoned')),

    overall_score numeric,               -- final score once completed, null while in progress
    started_at timestamptz default now(),
    completed_at timestamptz,

    created_at timestamptz default now()
);

create index if not exists idx_mock_interview_sessions_user on mock_interview_sessions(user_id);
create index if not exists idx_mock_interview_sessions_status on mock_interview_sessions(status);

create table if not exists mock_interview_questions (
    mock_question_id uuid primary key default gen_random_uuid(),
    mock_interview_id uuid not null references mock_interview_sessions(mock_interview_id) on delete cascade,
    user_id uuid not null references users(user_id) on delete cascade,

    question_text text not null,
    question_hash text not null,
    question_type text,
    difficulty text,
    related_skill text,

    answer_text text,
    answer_status text not null default 'pending'
        check (answer_status in ('pending', 'answered', 'skipped')),
    score numeric,
    strengths jsonb,
    weaknesses jsonb,
    feedback text,

    created_at timestamptz default now(),
    answered_at timestamptz,
    unique (user_id, question_hash)
);

create index if not exists idx_mock_interview_questions_user on mock_interview_questions(user_id);
create index if not exists idx_mock_interview_questions_session on mock_interview_questions(mock_interview_id);

alter table mock_interview_questions
    add column if not exists answer_status text not null default 'pending'
        check (answer_status in ('pending', 'answered', 'skipped'));
