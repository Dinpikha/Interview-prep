from dotenv import load_dotenv
load_dotenv()
import os
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone
import hashlib


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)



def user_exists_(username: str):
    response = (
        supabase
        .table("users")
        .select("*")
        .eq("username", username)
        .execute()
    )

    return len(response.data) > 0

def signup(username: str):
    """
    Inserts a new user.
    """
    response= (supabase
        .table("users")
        .insert({
            "username": username
        })
        .execute()
    )
    return response.data[0]["user_id"]
def delete_user(user_name:str):
    return(
        supabase
        .table("users")
        .delete()
        .eq("username",user_name)
        .execute()
    )

def login(username:str):
    response=(supabase
        .table("users")
        .select("*")
        .eq("username", username)
        .execute()
    )
    return len(response.data)>0,response.data[0]["user_id"]


def create_session(user_id):
    response=(
        supabase
        .table("sessions")
        .insert({
            "user_id": user_id
        })
        .execute()
    )
    return response.data[0]["session_id"]


def enter_data(session_id, role, content,embeddings):
    return (
        supabase
        .table("messages")
        .insert({
            "session_id": session_id,
            "role": role,
            "content": content,
            "embedding":embeddings
            
        })
        .execute()
    )


def _question_hash(question_text: str) -> str:
    normalized = " ".join((question_text or "").lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def get_resume_profile(user_id: str):
    response = (
        supabase
        .table("resume")
        .select("resume_text, summary, updated_at")
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0] if response.data else None


def get_previous_mock_questions(user_id: str, limit: int = 40):
    response = (
        supabase
        .table("mock_interview_questions")
        .select("question_text")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [item["question_text"] for item in (response.data or []) if item.get("question_text")]


def create_mock_interview_session(user_id: str, interview_type: str, difficulty_level: str | None = None, role_focus: str | None = None, session_id: str | None = None):
    response = (
        supabase
        .table("mock_interview_sessions")
        .insert({
            "user_id": user_id,
            "session_id": session_id,
            "interview_type": interview_type,
            "difficulty_level": difficulty_level,
            "role_focus": role_focus,
            "status": "in_progress",
        })
        .execute()
    )
    return response.data[0]


def insert_mock_questions(mock_interview_id: str, user_id: str, questions: list[dict]):
    rows = []
    for question in questions:
        question_text = question.get("question_text", "")
        rows.append({
            "mock_interview_id": mock_interview_id,
            "user_id": user_id,
            "question_text": question_text,
            "question_hash": _question_hash(question_text),
            "question_type": question.get("question_type"),
            "difficulty": question.get("difficulty"),
            "related_skill": question.get("related_skill"),
        })

    if not rows:
        return []

    response = (
        supabase
        .table("mock_interview_questions")
        .insert(rows)
        .execute()
    )
    return response.data or []


def get_mock_questions(mock_interview_id: str):
    response = (
        supabase
        .table("mock_interview_questions")
        .select("*")
        .eq("mock_interview_id", mock_interview_id)
        .order("created_at")
        .execute()
    )
    return response.data or []


def update_mock_answer(mock_question_id: str, answer_text: str, score: float, strengths: list[str], weaknesses: list[str], feedback: str):
    return (
        supabase
        .table("mock_interview_questions")
        .update({
            "answer_text": answer_text,
            "score": score,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "feedback": feedback,
            "answer_status": "answered",
            "answered_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("mock_question_id", mock_question_id)
        .execute()
    )


def skip_mock_question(mock_question_id: str):
    return (
        supabase
        .table("mock_interview_questions")
        .update({
            "answer_status": "skipped",
            "answered_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("mock_question_id", mock_question_id)
        .execute()
    )


def insert_metric(user_id: str, session_id: str | None, category: str, score: float):
    return (
        supabase
        .table("metrics")
        .insert({
            "user_id": user_id,
            "session_id": session_id,
            "category": category,
            "score": score,
        })
        .execute()
    )


def complete_mock_interview_session(mock_interview_id: str, overall_score: float):
    response = (
        supabase
        .table("mock_interview_sessions")
        .update({
            "status": "completed",
            "overall_score": overall_score,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("mock_interview_id", mock_interview_id)
        .execute()
    )
    return response.data[0] if response.data else None


def get_progress_context(user_id: str):
    dashboard = get_dashboard_data(user_id)
    resume_profile = get_resume_profile(user_id)

    mock_response = (
        supabase
        .table("mock_interview_sessions")
        .select("interview_type, difficulty_level, status, overall_score, started_at, completed_at")
        .eq("user_id", user_id)
        .order("started_at")
        .execute()
    )
    mock_interviews = mock_response.data or []

    metrics_response = (
        supabase
        .table("metrics")
        .select("category, score, created_at")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    metrics = metrics_response.data or []

    return {
        "dashboard": {
            "stats": dashboard.get("stats", []),
            "performanceAreas": dashboard.get("performanceAreas", []),
            "scoreTrend": dashboard.get("scoreTrend", []),
        },
        "mock_interviews": mock_interviews[-10:],
        "metrics": metrics[-20:],
        "resume": resume_profile,
    }

def get_prev_summary(user_id:str):
    response=(
        supabase
        .table("user_memory")
        .select("*")
        .eq("user_id",user_id)
        .execute()

    )
    if len(response.data)==0:
        return 'No Data'
    return response


def insert_summary(summary:str,user_id):
    response=(
        supabase
        .table("user_memory")
        .insert({
            "user_id":user_id,
            "summary":summary
        })
        
        .execute()

    )
    
    return response


def update_summary(summary: str, user_id: str):
    response = (
        supabase
        .table("user_memory")
        .update({
            "summary": summary
        })
        .eq("user_id", user_id)
        .execute()
    )

    return response


def _parse_timestamp(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _relative_time(value):
    timestamp = _parse_timestamp(value)
    if not timestamp:
        return "Recently"

    now = datetime.now(timezone.utc)
    delta = now - timestamp.astimezone(timezone.utc)
    seconds = max(int(delta.total_seconds()), 0)

    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    if seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = seconds // 86400
    if days == 1:
        return "Yesterday"
    return f"{days} days ago"


def get_dashboard_data(user_id: str):
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=6)
    week_start_iso = datetime.combine(week_start, datetime.min.time(), timezone.utc).isoformat()

    sessions_response = (
        supabase
        .table("sessions")
        .select("session_id, started_at")
        .eq("user_id", user_id)
        .execute()
    )
    sessions = sessions_response.data or []

    mock_response = (
        supabase
        .table("mock_interview_sessions")
        .select("mock_interview_id, session_id, interview_type, role_focus, difficulty_level, status, overall_score, started_at, completed_at")
        .eq("user_id", user_id)
        .execute()
    )
    mock_interviews = mock_response.data or []
    completed_mock_interviews = [
        interview for interview in mock_interviews
        if interview.get("status") == "completed"
    ]
    scored_mock_interviews = [
        interview for interview in completed_mock_interviews
        if interview.get("overall_score") is not None
    ]

    weekly_sessions = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        weekly_sessions.append({
            "day": day.strftime("%a"),
            "date": day.isoformat(),
            "sessions": sum(
                1
                for session in sessions
                if (_parse_timestamp(session.get("started_at")) or datetime.min.replace(tzinfo=timezone.utc)).date() == day
            ) + sum(
                1
                for interview in mock_interviews
                if (_parse_timestamp(interview.get("started_at")) or datetime.min.replace(tzinfo=timezone.utc)).date() == day
            ),
        })

    session_ids = [session["session_id"] for session in sessions if session.get("session_id")]
    messages = []
    if session_ids:
        messages_response = (
            supabase
            .table("messages")
            .select("message_id, session_id, role, content, created_at")
            .in_("session_id", session_ids)
            .order("created_at", desc=True)
            .execute()
        )
        messages = messages_response.data or []

    metrics_response = (
        supabase
        .table("metrics")
        .select("metric_id, category, score, created_at")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    metrics = metrics_response.data or []
    numeric_metrics = [
        metric for metric in metrics
        if metric.get("score") is not None
    ]

    average_score = None
    if scored_mock_interviews:
        average_score = round(
            sum(float(interview["overall_score"]) for interview in scored_mock_interviews) / len(scored_mock_interviews)
        )
    elif numeric_metrics:
        average_score = round(
            sum(float(metric["score"]) for metric in numeric_metrics) / len(numeric_metrics)
        )

    performance_by_category = {}
    for metric in numeric_metrics:
        category = metric.get("category") or "General"
        performance_by_category.setdefault(category, []).append(float(metric["score"]))

    performance_areas = [
        {
            "label": category.replace("_", " ").title(),
            "score": round(sum(scores) / len(scores)),
        }
        for category, scores in performance_by_category.items()
    ]

    mock_performance_by_type = {}
    for interview in scored_mock_interviews:
        interview_type = interview.get("interview_type") or "Mock Interview"
        mock_performance_by_type.setdefault(interview_type, []).append(float(interview["overall_score"]))

    for interview_type, scores in mock_performance_by_type.items():
        performance_areas.append({
            "label": interview_type.replace("_", " ").replace("-", " ").title(),
            "score": round(sum(scores) / len(scores)),
        })

    score_trend_by_day = {}
    for metric in numeric_metrics:
        timestamp = _parse_timestamp(metric.get("created_at"))
        if not timestamp:
            continue
        day = timestamp.date().isoformat()
        score_trend_by_day.setdefault(day, []).append(float(metric["score"]))
    for interview in scored_mock_interviews:
        timestamp = _parse_timestamp(interview.get("completed_at") or interview.get("started_at"))
        if not timestamp:
            continue
        day = timestamp.date().isoformat()
        score_trend_by_day.setdefault(day, []).append(float(interview["overall_score"]))

    score_trend = [
        {
            "date": day,
            "day": datetime.fromisoformat(day).strftime("%a"),
            "score": round(sum(scores) / len(scores)),
        }
        for day, scores in sorted(score_trend_by_day.items())
    ][-7:]

    resume_response = (
        supabase
        .table("resume")
        .select("user_id, updated_at")
        .eq("user_id", user_id)
        .execute()
    )
    resumes = resume_response.data or []

    recent_activity = []
    for session in sessions:
        recent_activity.append({
            "id": f"session-{session.get('session_id')}",
            "action": "Mentor Session",
            "detail": "AI Mentor conversation started",
            "created_at": session.get("started_at"),
            "time": _relative_time(session.get("started_at")),
        })
    for interview in mock_interviews:
        completed = interview.get("status") == "completed"
        score = interview.get("overall_score")
        interview_label = (interview.get("interview_type") or "Mock interview").replace("_", " ").replace("-", " ").title()
        detail = interview_label
        if interview.get("role_focus"):
            detail = f"{detail} - {interview.get('role_focus')}"
        if completed and score is not None:
            detail = f"{detail}: {round(float(score))}/100"
        recent_activity.append({
            "id": f"mock-{interview.get('mock_interview_id')}",
            "action": "Mock Interview Completed" if completed else "Mock Interview Started",
            "detail": detail,
            "created_at": interview.get("completed_at") or interview.get("started_at"),
            "time": _relative_time(interview.get("completed_at") or interview.get("started_at")),
        })
    for metric in metrics:
        score = metric.get("score")
        detail = metric.get("category") or "Score recorded"
        if score is not None:
            detail = f"{detail.replace('_', ' ').title()}: {round(float(score))}/100"
        recent_activity.append({
            "id": f"metric-{metric.get('metric_id')}",
            "action": "Score Recorded",
            "detail": detail,
            "created_at": metric.get("created_at"),
            "time": _relative_time(metric.get("created_at")),
        })
    for resume in resumes:
        recent_activity.append({
            "id": f"resume-{resume.get('user_id')}",
            "action": "Resume Updated",
            "detail": "Resume profile refreshed",
            "created_at": resume.get("updated_at"),
            "time": _relative_time(resume.get("updated_at")),
        })

    recent_activity = sorted(
        recent_activity,
        key=lambda item: _parse_timestamp(item.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:6]

    sessions_this_week = sum(
        1
        for session in sessions
        if (_parse_timestamp(session.get("started_at")) or datetime.min.replace(tzinfo=timezone.utc))
        >= datetime.fromisoformat(week_start_iso)
    )
    mock_this_week = sum(
        1
        for interview in mock_interviews
        if (_parse_timestamp(interview.get("started_at")) or datetime.min.replace(tzinfo=timezone.utc))
        >= datetime.fromisoformat(week_start_iso)
    )
    completed_this_week = sum(
        1
        for interview in completed_mock_interviews
        if (_parse_timestamp(interview.get("completed_at") or interview.get("started_at")) or datetime.min.replace(tzinfo=timezone.utc))
        >= datetime.fromisoformat(week_start_iso)
    )

    return {
        "success": True,
        "stats": [
            {
                "id": "interviews",
                "label": "Interviews Completed",
                "value": len(completed_mock_interviews),
                "change": f"{completed_this_week} this week",
            },
            {
                "id": "score",
                "label": "Average Score",
                "value": f"{average_score}%" if average_score is not None else "No scores yet",
                "change": f"{len(scored_mock_interviews) or len(numeric_metrics)} scored attempts",
            },
            {
                "id": "sessions",
                "label": "Practice Sessions",
                "value": len(mock_interviews),
                "change": f"{mock_this_week} this week",
            },
            {
                "id": "resumes",
                "label": "Resume Profiles",
                "value": len(resumes),
                "change": "Stored in database",
            },
        ],
        "weeklyProgress": weekly_sessions,
        "performanceAreas": performance_areas,
        "scoreTrend": score_trend,
        "recentActivity": recent_activity,
    }


# ============================================================
# AUTH — password accounts, GitHub OAuth, refresh & reset tokens
# ============================================================

def get_user_by_username(username: str):
    response = (
        supabase.table("users").select("*").eq("username", username).execute()
    )
    return response.data[0] if response.data else None


def get_user_by_email(email: str):
    response = (
        supabase.table("users").select("*").eq("email", email).execute()
    )
    return response.data[0] if response.data else None


def get_user_by_id(user_id: str):
    response = (
        supabase.table("users").select("*").eq("user_id", user_id).execute()
    )
    return response.data[0] if response.data else None


def create_local_user(username: str, email: str, password_hash: str):
    response = (
        supabase.table("users")
        .insert({
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "auth_provider": "local",
        })
        .execute()
    )
    return response.data[0]


def create_github_user(username: str, email, avatar_url):
    response = (
        supabase.table("users")
        .insert({
            "username": username,
            "email": email,
            "avatar_url": avatar_url,
            "auth_provider": "github",
        })
        .execute()
    )
    return response.data[0]


def update_password(user_id: str, new_password_hash: str):
    return (
        supabase.table("users")
        .update({"password_hash": new_password_hash})
        .eq("user_id", user_id)
        .execute()
    )


# ---- oauth account linking ----

def get_oauth_account(provider: str, provider_user_id: str):
    response = (
        supabase.table("oauth_accounts")
        .select("*")
        .eq("provider", provider)
        .eq("provider_user_id", provider_user_id)
        .execute()
    )
    return response.data[0] if response.data else None


def link_oauth_account(user_id: str, provider: str, provider_user_id: str):
    return (
        supabase.table("oauth_accounts")
        .insert({
            "user_id": user_id,
            "provider": provider,
            "provider_user_id": provider_user_id,
        })
        .execute()
    )


# ---- refresh tokens (rotated on every /auth/refresh call) ----

def store_refresh_token(user_id: str, token_hash: str, expires_at: str):
    return (
        supabase.table("refresh_tokens")
        .insert({
            "user_id": user_id,
            "token_hash": token_hash,
            "expires_at": expires_at,
        })
        .execute()
    )


def get_refresh_token(token_hash: str):
    response = (
        supabase.table("refresh_tokens")
        .select("*")
        .eq("token_hash", token_hash)
        .eq("revoked", False)
        .execute()
    )
    return response.data[0] if response.data else None


def revoke_refresh_token(token_hash: str):
    return (
        supabase.table("refresh_tokens")
        .update({"revoked": True})
        .eq("token_hash", token_hash)
        .execute()
    )


def revoke_all_refresh_tokens(user_id: str):
    """Used on password change — kills every other logged-in session."""
    return (
        supabase.table("refresh_tokens")
        .update({"revoked": True})
        .eq("user_id", user_id)
        .execute()
    )


# ---- password reset tokens (one-time use, short expiry) ----

def create_reset_token(user_id: str, token_hash: str, expires_at: str):
    return (
        supabase.table("password_reset_tokens")
        .insert({
            "user_id": user_id,
            "token_hash": token_hash,
            "expires_at": expires_at,
        })
        .execute()
    )


def get_valid_reset_token(token_hash: str):
    response = (
        supabase.table("password_reset_tokens")
        .select("*")
        .eq("token_hash", token_hash)
        .eq("used", False)
        .execute()
    )
    return response.data[0] if response.data else None


def mark_reset_token_used(token_hash: str):
    return (
        supabase.table("password_reset_tokens")
        .update({"used": True})
        .eq("token_hash", token_hash)
        .execute()
    )
