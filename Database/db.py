from dotenv import load_dotenv
load_dotenv()
import os
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone


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
    if numeric_metrics:
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

    score_trend_by_day = {}
    for metric in numeric_metrics:
        timestamp = _parse_timestamp(metric.get("created_at"))
        if not timestamp:
            continue
        day = timestamp.date().isoformat()
        score_trend_by_day.setdefault(day, []).append(float(metric["score"]))

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
            "action": "Practice Session",
            "detail": "AI Mentor conversation started",
            "created_at": session.get("started_at"),
            "time": _relative_time(session.get("started_at")),
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

    return {
        "success": True,
        "stats": [
            {
                "id": "sessions",
                "label": "Practice Sessions",
                "value": len(sessions),
                "change": f"{sessions_this_week} this week",
            },
            {
                "id": "score",
                "label": "Average Score",
                "value": f"{average_score}%" if average_score is not None else "No scores yet",
                "change": f"{len(numeric_metrics)} scored attempts",
            },
            {
                "id": "messages",
                "label": "Mentor Messages",
                "value": len(messages),
                "change": "Recent saved messages",
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
