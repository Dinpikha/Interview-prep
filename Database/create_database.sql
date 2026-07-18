
create table users (
    user_id uuid primary key default gen_random_uuid(),
    username text not null unique,
    created_at timestamptz default now()
);



create table sessions (
    session_id uuid primary key default gen_random_uuid(),
    user_id uuid references users(user_id) on delete cascade,
    started_at timestamptz default now(),
    ended_at timestamptz
);

create extension if not exists vector;

create table messages (
    message_id uuid primary key default gen_random_uuid(),
    session_id uuid references sessions(session_id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    embedding vector(384),
    created_at timestamptz default now()
);

create table resume (
    user_id uuid primary key references users(user_id) on delete cascade,
    resume_text text not null,
    summary text,
    updated_at timestamptz default now()
);


create table metrics (
    metric_id uuid primary key default gen_random_uuid(),
    user_id uuid references users(user_id) on delete cascade,
    session_id uuid references sessions(session_id) on delete cascade,
    category text not null,
    score numeric,
    created_at timestamptz default now()
);





























































