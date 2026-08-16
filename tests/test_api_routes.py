import pytest
from pydantic import ValidationError

from backend import backend_fetch


def test_health_route_returns_ok():
    assert backend_fetch.health_route() == {"status": "ok"}


def test_signup_request_validates_required_email():
    with pytest.raises(ValidationError):
        backend_fetch.SignupRequest(username="dipika", password="password123")


def test_auth_signup_route_wires_to_auth_service(monkeypatch):
    monkeypatch.setattr(
        backend_fetch.auth,
        "signup_local",
        lambda username, email, password: {
            "success": True,
            "access_token": "access",
            "refresh_token": "refresh",
            "user": {"user_id": "user-1", "username": username, "email": email},
        },
    )
    request = backend_fetch.SignupRequest(
        username="dipika",
        email="d@example.com",
        password="password123",
    )

    response = backend_fetch.signup_route(request)

    assert response["success"] is True
    assert response["user"]["username"] == "dipika"


def test_create_session_route_contract(monkeypatch):
    monkeypatch.setattr(backend_fetch, "create_session_", lambda user_id: {"success": True, "session_id": "session-1"})

    response = backend_fetch.create_new_session(backend_fetch.SessionRequest(user_id="user-1"))

    assert response == {"success": True, "session_id": "session-1"}


def test_ai_mentor_route_contract(monkeypatch):
    monkeypatch.setattr(
        backend_fetch,
        "ai_mentor_response_",
        lambda user_id, user_prompt, session_id, role, web_search: {
            "success": True,
            "response": "Practice FastAPI next.",
            "sources": [],
        },
    )

    response = backend_fetch.get_model_response(
        backend_fetch.PromptRequest(
            user_id="user-1",
            user_prompt="What next?",
            session_id="session-1",
            role="user",
            web_search=False,
        )
    )

    assert response["response"] == "Practice FastAPI next."


def test_mock_interview_start_route_contract(monkeypatch):
    monkeypatch.setattr(
        backend_fetch,
        "start_mock_interview_",
        lambda **kwargs: {"success": True, "session": {"mock_interview_id": "mock-1"}, "questions": []},
    )

    response = backend_fetch.start_mock_interview_route(
        backend_fetch.StartMockInterviewRequest(
            user_id="user-1",
            interview_type="technical",
            question_count=3,
        )
    )

    assert response["session"]["mock_interview_id"] == "mock-1"
