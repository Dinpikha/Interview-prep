from datetime import datetime, timedelta, timezone
import asyncio

import pytest
from fastapi import HTTPException

from backend.api_file import auth_route_api_file as auth_routes
from backend.auth.deps import get_current_user
from backend.auth.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hashing_and_verification():
    password_hash = hash_password("correct-password")

    assert password_hash != "correct-password"
    assert verify_password("correct-password", password_hash) is True
    assert verify_password("wrong-password", password_hash) is False


def test_access_token_decodes_user_identity():
    token = create_access_token("user-1", "dipika")

    payload = decode_access_token(token)

    assert payload["sub"] == "user-1"
    assert payload["username"] == "dipika"
    assert payload["type"] == "access"


def test_get_current_user_rejects_missing_header():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_current_user(None))

    assert exc.value.status_code == 401


def test_get_current_user_accepts_valid_bearer_token():
    token = create_access_token("user-1", "dipika")

    user = asyncio.run(get_current_user(f"Bearer {token}"))

    assert user == {"user_id": "user-1", "username": "dipika"}


def test_signup_rejects_duplicate_email(monkeypatch):
    monkeypatch.setattr(auth_routes, "get_user_by_username", lambda username: None)
    monkeypatch.setattr(auth_routes, "get_user_by_email", lambda email: {"user_id": "existing"})

    with pytest.raises(HTTPException) as exc:
        auth_routes.signup_local("dipika", "taken@example.com", "password123")

    assert exc.value.status_code == 409


def test_signup_creates_user_and_issues_session(monkeypatch):
    stored_refresh = {}

    monkeypatch.setattr(auth_routes, "get_user_by_username", lambda username: None)
    monkeypatch.setattr(auth_routes, "get_user_by_email", lambda email: None)
    monkeypatch.setattr(
        auth_routes,
        "create_local_user",
        lambda username, email, password_hash: {
            "user_id": "user-1",
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "auth_provider": "local",
        },
    )
    monkeypatch.setattr(auth_routes, "new_raw_token", lambda: "refresh-token")
    monkeypatch.setattr(
        auth_routes,
        "store_refresh_token",
        lambda **kwargs: stored_refresh.update(kwargs),
    )

    result = auth_routes.signup_local("Dipika", "USER@EXAMPLE.COM", "password123")

    assert result["success"] is True
    assert result["refresh_token"] == "refresh-token"
    assert result["user"]["email"] == "user@example.com"
    assert stored_refresh["user_id"] == "user-1"


def test_login_rejects_invalid_password(monkeypatch):
    monkeypatch.setattr(auth_routes, "get_user_by_username", lambda identifier: {
        "user_id": "user-1",
        "username": "dipika",
        "email": "d@example.com",
        "password_hash": hash_password("correct-password"),
        "auth_provider": "local",
    })
    monkeypatch.setattr(auth_routes, "get_user_by_email", lambda email: None)

    with pytest.raises(HTTPException) as exc:
        auth_routes.login_local("dipika", "wrong-password")

    assert exc.value.status_code == 401


def test_refresh_session_rotates_valid_refresh_token(monkeypatch):
    revoked = []
    stored_hashes = []

    monkeypatch.setattr(auth_routes, "hash_token", lambda raw: f"hash:{raw}")
    monkeypatch.setattr(auth_routes, "get_refresh_token", lambda token_hash: {
        "token_hash": token_hash,
        "user_id": "user-1",
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
    })
    monkeypatch.setattr(auth_routes, "revoke_refresh_token", lambda token_hash: revoked.append(token_hash))
    monkeypatch.setattr(auth_routes, "get_user_by_id", lambda user_id: {
        "user_id": user_id,
        "username": "dipika",
        "email": "d@example.com",
        "password_hash": "hash",
        "auth_provider": "local",
    })
    monkeypatch.setattr(auth_routes, "new_raw_token", lambda: "new-refresh")
    monkeypatch.setattr(auth_routes, "store_refresh_token", lambda **kwargs: stored_hashes.append(kwargs["token_hash"]))

    result = auth_routes.refresh_session("old-refresh")

    assert result["success"] is True
    assert revoked == ["hash:old-refresh"]
    assert stored_hashes == ["hash:new-refresh"]


def test_refresh_session_rejects_invalid_token(monkeypatch):
    monkeypatch.setattr(auth_routes, "hash_token", lambda raw: f"hash:{raw}")
    monkeypatch.setattr(auth_routes, "get_refresh_token", lambda token_hash: None)

    with pytest.raises(HTTPException) as exc:
        auth_routes.refresh_session("missing")

    assert exc.value.status_code == 401
