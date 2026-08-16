import pytest
from fastapi import HTTPException

from backend.api_file import model_response_api_file as mentor_api


def test_ai_mentor_stores_user_and_assistant_messages_and_updates_summary(monkeypatch):
    saved_messages = []
    summaries = []

    monkeypatch.setattr(mentor_api, "get_prev_summary", lambda user_id: "Existing summary")
    monkeypatch.setattr(
        mentor_api,
        "enter_data",
        lambda session_id, role, content, embeddings: saved_messages.append((session_id, role, content, embeddings)),
    )
    monkeypatch.setattr(
        mentor_api,
        "ai_mentor",
        lambda prompt, summary, user_id, web_search_enabled: {
            "response": "Practice FastAPI dependency injection next.",
            "sources": [{"title": "FastAPI docs"}],
        },
    )
    monkeypatch.setattr(mentor_api, "generate_new_summary", lambda context: "Updated summary")
    monkeypatch.setattr(mentor_api, "update_summary", lambda summary, user_id: summaries.append((user_id, summary)))
    monkeypatch.setattr(mentor_api, "insert_summary", lambda summary, user_id: summaries.append((user_id, summary)))

    result = mentor_api.ai_mentor_response_("user-1", "What next?", "session-1", "user", web_search=True)

    assert result["success"] is True
    assert result["response"] == "Practice FastAPI dependency injection next."
    assert saved_messages == [
        ("session-1", "user", "What next?", None),
        ("session-1", "assistant", "Practice FastAPI dependency injection next.", None),
    ]
    assert summaries == [("user-1", "Updated summary")]


def test_ai_mentor_returns_controlled_error_when_summary_lookup_fails(monkeypatch):
    monkeypatch.setattr(mentor_api, "get_prev_summary", lambda user_id: (_ for _ in ()).throw(RuntimeError("db down")))

    with pytest.raises(HTTPException) as exc:
        mentor_api.ai_mentor_response_("user-1", "Hello", "session-1", "user")

    assert exc.value.status_code == 500
    assert "profile" in exc.value.detail.lower()


def test_ai_mentor_returns_controlled_error_when_llm_fails(monkeypatch):
    monkeypatch.setattr(mentor_api, "get_prev_summary", lambda user_id: "Existing summary")
    monkeypatch.setattr(mentor_api, "enter_data", lambda *args: None)
    monkeypatch.setattr(mentor_api, "ai_mentor", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("llm down")))

    with pytest.raises(HTTPException) as exc:
        mentor_api.ai_mentor_response_("user-1", "Hello", "session-1", "user")

    assert exc.value.status_code == 503
    assert "MentorAI" in exc.value.detail
