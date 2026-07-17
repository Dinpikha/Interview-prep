from dotenv import load_dotenv
load_dotenv()
import os
from supabase import create_client, Client


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
