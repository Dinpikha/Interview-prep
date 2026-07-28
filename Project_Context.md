# PROJECT_CONTEXT.md — Interview-prep

## 1. What This Project Is

**Interview-prep** is an AI-powered interview preparation platform. It combines a rule-based resume/ATS analyzer, an LLM-driven mentor chat, and a personalized dashboard into one application, with the long-term goal of becoming a full interview-prep + career-guidance companion (not just a question bank).

**Target user:** students/candidates preparing for technical interviews who want structured, personalized feedback rather than generic prep content.

**Repo:** https://github.com/Dinpikha/Interview-prep
**Author:** Dipika Choudhary

---

## 2. Current Status (⚠️ source of truth — README is stale)

The repository's `README.md` currently lists Resume Analyzer, Dashboard, and Mock Interview as "planned" features. **That is out of date.** Actual status as of this file:

| Feature | Status |
|---|---|
| Auth (local signup/login + GitHub OAuth) | ✅ Implemented — JWT + refresh tokens + sessions |
| Resume Analyzer (regex ATS checks → LLM structured output) | ✅ Implemented |
| Dashboard — summary section | ✅ Implemented (dynamic, driven by resume + chat history) |
| Dashboard — rest of UI | 🟡 UI built, backend/data static |
| Mentor Chat (with safety/relevance check) | ✅ Implemented |
| Mock Interview | 🟡 UI built, static/no backend logic yet |
| LinkedIn/GitHub scanning + external scoring | 🔴 Planned (see Roadmap) |

**Action item:** update `README.md` to reflect this before showing the repo externally — a stale README is the first thing that signals an unpolished project to anyone reviewing it.

---

## 3. High-Level Architecture

```
                    User
                     │
                     ▼
            React + Tailwind Frontend
                     │
                     ▼
              FastAPI Backend
     ┌─────────┬───────────┬─────────────┐
     ▼         ▼           ▼             ▼
   Auth    Resume        AI Mentor    Mock Interview
  (JWT/    Analyzer      (Chat)       (static, planned)
  OAuth/   (regex ATS   │
  Sessions) → LLM JSON) │
     │         │         ▼
     │         │    Safety/relevance check
     │         │    ├─ off-topic → generic canned response
     │         │    └─ on-topic  → LLM (Groq API or local LLM)
     │         │                   with access to user_memory summary
     │         ▼
     └──────► user_memory / resume / dashboard summary (Postgres)
```

**Inference layer is pluggable:** the same mentor/resume pipeline can run against a **local LLM** (self-hosted, e.g. via LM Studio) or the **Groq API**, chosen depending on deployment context (local dev vs. hosted). This is handled in `backend/ai/` — see §5.

---

## 4. Database Schema

All tables use `uuid` primary keys unless noted. Timestamps are `timestamptz`.

### `users`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid (PK) | |
| username | text | |
| email | text | |
| password_hash | text | **null if `auth_provider = github`** — GitHub-only users set a password later, after login |
| auth_provider | text | `local` \| `github` |
| avatar_url | text | |
| is_active | bool | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `oauth_accounts`
| Column | Type | Notes |
|---|---|---|
| oauth_account_id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| provider | text | e.g. `github` |
| provider_user_id | text | |
| created_at | timestamptz | |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| session_id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| started_at | timestamptz | |
| ended_at | timestamptz | |

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| token_id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| token_hash | text | |
| expires_at | timestamptz | |
| revoked | bool | |
| created_at | timestamptz | |

### `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| reset_id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| token_hash | text | |
| expires_at | timestamptz | |
| used | bool | |
| created_at | timestamptz | |

### `messages`
| Column | Type | Notes |
|---|---|---|
| message_id | uuid (PK) | |
| session_id | uuid (FK → sessions) | |
| role | text | e.g. `user` / `mentor` |
| content | text | |
| embedding | vector(384) <!-- verify: dims read as 384 --> | for retrieval/semantic search over chat history |
| created_at | timestamptz | |

### `user_memory`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid (FK → users) | |
| summary | text | what the mentor "knows" about the user — powers dashboard summary |
| updated_at | timestamptz | |

### `resume`
| Column | Type | Notes |
|---|---|---|
| user_id | uuid (FK → users) | |
| resume_text | text | |
| summary | text | |
| updated_at | timestamptz | |

### `metrics`
| Column | Type | Notes |
|---|---|---|
| metric_id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| session_id | uuid (FK → sessions) | |
| algorithm <!-- verify: label unclear in notes --> | text | |
| score | numeric | |
| created_at | timestamptz | |

### Key `db.py` functions (data access layer)
`user_exists`, `signup`, `login`, `delete_user`, `create_local_user`, `create_github_user`,
`get_user_by_username`, `get_user_by_email`, `get_user_by_id`, `update_password`,
`get_oauth_account`, `link_auth_account`,
`start_refresh_token`, `get_refresh_token`, `revoke_refresh_token`, `revoke_all_refresh_tokens`,
`create_session_token`, `get_valid_session_token`, `mark_session_token_used`
`get_prev_summary`, `insert_summary`, `update_summary`, `insert_data`

---

## 5. Backend Structure (`backend/`)

```
backend/
├── ai/
│   ├── groq_client        # Groq API inference path
│   ├── local_client        # local LLM inference path (LM Studio etc.)
│   ├── model                # model selection/config
│   └── prompts              # prompt templates; also handles embeddings retrieval
│
├── ai_mentor_backend/        # mentor chat orchestration
│                              #  - runs the relevance/safety check
│                              #  - connects to files/logs
│                              #  - generates updated user_memory summary
│
├── api/                      # FastAPI route layer
│   ├── auth_route            # → connects auth + security to DB
│   ├── create_session
│   ├── delete_user
│   ├── model_response        # mentor chat endpoint
│   ├── resume_analyzer
│   └── return_summary
│
├── auth/
│   ├── deps                  # get_current_user / get_username from access token — no DB hit
│   ├── github_oauth          # OAuth code → GitHub access token exchange
│   └── security               # token generation, hashing, etc.
│
├── mock_interview/           # placeholder — static, no logic yet
│
├── resume_analyzer_backend/
│   ├── parser                # extracts resume text + sections, runs ATS checks
│   └── scoring                # calculates ATS score from parsed data
│
└── backend_fetch/            # <!-- verify: purpose unclear from notes, confirm role -->
```

**Auth flow summary:**
- Local signup → password set immediately, `auth_provider = local`.
- GitHub OAuth signup → account created with `password_hash = null`; user can set a password later from account settings, which links local auth on top of the OAuth identity.
- On login: session created (`sessions` table) + JWT access token + refresh token issued.
- Every authenticated request carries the JWT; `auth/deps` validates it without a DB round-trip.
- Refresh tokens are hashed and stored (`refresh_tokens`), individually or fully revocable.

---

## 6. Feature Deep-Dives

### 6.1 Resume Analyzer
1. `resume_analyzer_backend/parser` extracts text + sections from the uploaded resume and runs **local regex-based ATS checks** (formatting, keyword presence, section detection, etc.) — no LLM involved at this stage.
2. `resume_analyzer_backend/scoring` computes a score from those checks.
3. The score + extracted data is passed to an LLM (Groq API or local, per deployment) via a structured prompt, which returns **structured JSON** (e.g. strengths, gaps, suggestions) for the frontend to render.
4. Resume text + generated summary are persisted to the `resume` table.

### 6.2 Dashboard Summary
- Driven by `user_memory.summary`, which is generated/updated by the AI Mentor backend from resume data + chat history.
- Purpose: show the user **what the mentor currently knows about them**, so it's transparent rather than a black box.
- Rest of the dashboard (outside this summary) is currently static UI.

### 6.3 Mentor Chat
1. Incoming user prompt hits a **safety/relevance check** first: does it align with the mentor's defined context/purpose?
   - **Off-topic** → a generic canned response is returned via FastAPI to the frontend (no LLM call).
   - **On-topic** → forwarded to the LLM (Groq or local) with a structured prompt, plus the user's `user_memory` summary for background context.
2. Chat is scoped by `session_id`; messages are stored in `messages` with embeddings for retrieval.
3. Auth is enforced via JWT on every request.

### 6.4 Mock Interview
- UI is built; backend logic is not — currently static/placeholder.

---

## 7. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | Postgres <!-- verify: confirm engine, notes show generic "auth_schema.sql" --> |
| Auth | JWT (access + refresh tokens), GitHub OAuth, session IDs |
| AI Inference | Groq API (hosted) or local LLM via LM Studio, selectable per deployment |
| Vector storage | embeddings on `messages` (dim 384) for chat retrieval |

---

## 8. Conventions for Working in This Repo

- Two top-level app folders: `backend/` and `interview-prep-app/` (frontend).
- Backend follows a layered structure: `api/` (routes) → `ai_mentor_backend` / `resume_analyzer_backend` (orchestration) → `ai/` (model clients) + `db.py` (data access) → Postgres.
- `auth/deps` is the pattern for authenticating a request cheaply (token-only, no DB) — reuse it rather than re-querying the DB for user identity in new routes.
- Inference calls should go through `ai/groq_client` or `ai/local_client` behind a common interface so features stay deployment-agnostic (local vs. hosted).
- <!-- add: commit message convention, branch strategy, testing approach once established -->

---

## 9. Roadmap (Planned, not yet started)

- **LinkedIn/GitHub scanning** — pull external profile data to enrich resume scoring and mentor context.
- **Resume improvement suggestions** driven by that external data.
- **Job opportunity matching** — scan sources for roles matching the scored/scanned profile.
- **People-tracking for target roles** — help the user find and reach out to people already in a target role/company.
- Full Dashboard backend (beyond the summary section).
- Mock Interview backend logic.

---

## 10. Open Items to Verify

- [ ] `messages.embedding` — confirm vector dimension (read as 384 from handwritten notes).
- [ ] `metrics.algorithm` column — confirm exact name/purpose.
- [ ] `backend_fetch/` module — confirm what this handles.
- [ ] Exact `db.py` function names — a few were hard to read from handwriting; confirm against actual file.
- [ ] Confirm DB engine (assumed Postgres — confirm from `auth_schema.sql` / `db.py`).
- [ ] Update `README.md` to match actual feature status (see §2).