"""


Flows implemented:
  - signup_local        username + email + password
  - login_local         username/email + password
  - github_oauth_login  GitHub OAuth "code" -> creates or links the account
  - refresh_session      rotates an expired access token using a refresh token
  - logout                revokes a refresh token
  - forgot_password       issues a one-time reset token (would be emailed)
  - reset_password        consumes that token, sets a new password
  - change_password       logged-in user changes their own password
"""
from datetime import datetime, timezone
from fastapi import HTTPException

from Database.db import (
    get_user_by_username,
    get_user_by_email,
    get_user_by_id,
    create_local_user,
    create_github_user,
    update_password,
    get_oauth_account,
    link_oauth_account,
    store_refresh_token,
    get_refresh_token,
    revoke_refresh_token,
    revoke_all_refresh_tokens,
    create_reset_token,
    get_valid_reset_token,
    mark_reset_token_used,
)
from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    new_raw_token,
    hash_token,
    refresh_token_expiry,
    reset_token_expiry,
)
from backend.auth.github_oauth import exchange_code_for_token, fetch_github_profile


def _issue_session(user: dict) -> dict:
    
    access_token = create_access_token(user["user_id"], user["username"])

    raw_refresh = new_raw_token()
    store_refresh_token(
        user_id=user["user_id"],
        token_hash=hash_token(raw_refresh),
        expires_at=refresh_token_expiry().isoformat(),
    )

    return {
        "success": True,
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "username": user["username"],
            "email": user.get("email"),
            "avatar_url": user.get("avatar_url"),
            "auth_provider": user.get("auth_provider", "local"),
            "has_password":bool(user.get("password_hash")),
        },
    }


# ------------------------------------------------------------------ signup
def signup_local(username: str, email: str, password: str) -> dict:
    username = username.strip()
    email = email.strip().lower()

    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    if get_user_by_username(username):
        raise HTTPException(status_code=409, detail="Username already registered")
    if get_user_by_email(email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = create_local_user(username, email, hash_password(password))
    return _issue_session(user)


# ------------------------------------------------------------------- login
def login_local(identifier: str, password: str) -> dict:
    identifier = identifier.strip()
    user = get_user_by_username(identifier) or get_user_by_email(identifier.lower())

    if not user:
        raise HTTPException(status_code=404, detail="No account found with that username/email")

    if user.get("auth_provider") == "github" and not user.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail="This account signed up with GitHub — use 'Continue with GitHub' to log in",
        )

    if not verify_password(password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Incorrect password")

    return _issue_session(user)


# -------------------------------------------------------------- github oauth
async def github_oauth_login(code: str) -> dict:
    try:
        github_token = await exchange_code_for_token(code)
        profile = await fetch_github_profile(github_token)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Could not reach GitHub, try again")

    existing_link = get_oauth_account("github", profile["provider_user_id"])
    if existing_link:
        user = get_user_by_id(existing_link["user_id"])
        return _issue_session(user)

    user = get_user_by_email(profile["email"]) if profile.get("email") else None

    if not user:
        
        candidate = profile["username"] or f"github_{profile['provider_user_id']}"
        base_candidate = candidate
        suffix = 1
        while get_user_by_username(candidate):
            suffix += 1
            candidate = f"{base_candidate}{suffix}"

        user = create_github_user(candidate, profile.get("email"), profile.get("avatar_url"))

    link_oauth_account(user["user_id"], "github", profile["provider_user_id"])
    return _issue_session(user)


# --------------------------------------------------------------- refresh
def refresh_session(raw_refresh_token: str) -> dict:
    token_hash = hash_token(raw_refresh_token)
    stored = get_refresh_token(token_hash)

    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token invalid or already used")

    expires_at = datetime.fromisoformat(stored["expires_at"].replace("Z", "+00:00"))
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired, please log in again")

    # Rotate: the old refresh token is single-use.
    revoke_refresh_token(token_hash)

    user = get_user_by_id(stored["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="Account no longer exists")

    return _issue_session(user)


def logout(raw_refresh_token: str) -> dict:
    revoke_refresh_token(hash_token(raw_refresh_token))
    return {"success": True, "message": "Logged out"}


# ------------------------------------------------------- forgot / reset
def forgot_password(email: str) -> dict:
    user = get_user_by_email(email.strip().lower())

    generic_response = {
        "success": True,
        "message": "If that email is registered, a reset link has been sent.",
    }
    if not user:
        return generic_response

    raw_token = new_raw_token()
    create_reset_token(user["user_id"], hash_token(raw_token), reset_token_expiry().isoformat())

    # TODO: wire up a real email provider (SES/SendGrid/Resend/etc).
    # For local dev we just log the link so you can copy/paste it.
    reset_link = f"http://localhost:5173/reset-password?token={raw_token}"
    print(f"[dev-only] Password reset link for {user['username']}: {reset_link}")

    return generic_response


def reset_password(raw_token: str, new_password: str) -> dict:
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    token_hash = hash_token(raw_token)
    stored = get_valid_reset_token(token_hash)
    if not stored:
        raise HTTPException(status_code=400, detail="Reset link is invalid or already used")

    expires_at = datetime.fromisoformat(stored["expires_at"].replace("Z", "+00:00"))
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset link has expired, request a new one")

    update_password(stored["user_id"], hash_password(new_password))
    mark_reset_token_used(token_hash)
    revoke_all_refresh_tokens(stored["user_id"]) 

    return {"success": True, "message": "Password updated — please log in again"}


# --------------------------------------------------------- change password
def change_password(user_id: str, current_password: str, new_password: str) -> dict:
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail="This account has no password yet - use 'set password ' instead of 'change password' "

        )
    
    if not verify_password(current_password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    update_password(user_id, hash_password(new_password))
    revoke_all_refresh_tokens(user_id)  

    return {"success": True, "message": "Password changed successfully"}

def set_initial_password(user_id:str , new_password:str ) -> dict:
    
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail="Password already exists. Use change password instead."

        )
    update_password(user_id,hash_password(new_password))

    return {"success":True , "message": "Password set — you can now log in with it anytime"}