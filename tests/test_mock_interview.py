import json

import pytest
from fastapi import HTTPException

from backend.api_file import mock_interview_api_file as mock_api


def test_parse_json_extracts_object_from_fenced_response():
    parsed = mock_api._parse_json('```json\n{"questions": []}\n```')

    assert parsed == {"questions": []}


def test_start_mock_interview_generates_and_saves_questions(monkeypatch):
    inserted_payload = {}

    monkeypatch.setattr(mock_api, "get_resume_profile", lambda user_id: {"summary": "Backend student"})
    monkeypatch.setattr(mock_api, "get_previous_mock_questions", lambda user_id: ["Old question"])
    monkeypatch.setattr(
        mock_api,
        "create_mock_interview_session",
        lambda **kwargs: {"mock_interview_id": "mock-1", **kwargs},
    )
    monkeypatch.setattr(
        mock_api,
        "groq_client",
        lambda **kwargs: json.dumps({
            "questions": [
                {
                    "question_text": "Explain FastAPI dependency injection.",
                    "question_type": "technical",
                    "difficulty": "Intermediate",
                    "related_skill": "FastAPI",
                }
            ]
        }),
    )

    def fake_insert(mock_interview_id, user_id, questions):
        inserted_payload["mock_interview_id"] = mock_interview_id
        inserted_payload["questions"] = questions
        return [{"mock_question_id": "q-1", **questions[0]}]

    monkeypatch.setattr(mock_api, "insert_mock_questions", fake_insert)

    result = mock_api.start_mock_interview_("user-1", "technical", question_count=1)

    assert result["success"] is True
    assert result["session"]["mock_interview_id"] == "mock-1"
    assert inserted_payload["mock_interview_id"] == "mock-1"
    assert inserted_payload["questions"][0]["related_skill"] == "FastAPI"


def test_start_mock_interview_returns_controlled_error_for_bad_llm_json(monkeypatch):
    monkeypatch.setattr(mock_api, "get_resume_profile", lambda user_id: None)
    monkeypatch.setattr(mock_api, "get_previous_mock_questions", lambda user_id: [])
    monkeypatch.setattr(mock_api, "create_mock_interview_session", lambda **kwargs: {"mock_interview_id": "mock-1"})
    monkeypatch.setattr(mock_api, "groq_client", lambda **kwargs: "not json")

    with pytest.raises(HTTPException) as exc:
        mock_api.start_mock_interview_("user-1", "technical")

    assert exc.value.status_code == 503


def test_score_mock_answer_updates_answer_and_metric(monkeypatch):
    updates = {}
    metrics = []

    monkeypatch.setattr(
        mock_api,
        "get_mock_questions",
        lambda mock_interview_id: [
            {
                "mock_question_id": "q-1",
                "session_id": "session-1",
                "question_text": "Explain FastAPI.",
                "related_skill": "FastAPI",
                "question_type": "technical",
            }
        ],
    )
    monkeypatch.setattr(
        mock_api,
        "groq_client",
        lambda **kwargs: json.dumps({
            "score": 84,
            "strengths": ["Clear API explanation"],
            "weaknesses": ["Needs more SQL context"],
            "feedback": "Good answer with room for examples.",
        }),
    )
    monkeypatch.setattr(mock_api, "update_mock_answer", lambda **kwargs: updates.update(kwargs))
    monkeypatch.setattr(mock_api, "insert_metric", lambda **kwargs: metrics.append(kwargs))

    result = mock_api.score_mock_answer_("user-1", "mock-1", "q-1", "FastAPI uses dependency injection.")

    assert result["success"] is True
    assert result["score"]["score"] == 84
    assert updates["mock_question_id"] == "q-1"
    assert metrics[0]["category"] == "FastAPI"


def test_score_mock_answer_returns_404_for_missing_question(monkeypatch):
    monkeypatch.setattr(mock_api, "get_mock_questions", lambda mock_interview_id: [])

    with pytest.raises(HTTPException) as exc:
        mock_api.score_mock_answer_("user-1", "mock-1", "missing", "answer")

    assert exc.value.status_code == 404


def test_complete_mock_interview_averages_scored_questions(monkeypatch):
    monkeypatch.setattr(
        mock_api,
        "get_mock_questions",
        lambda mock_interview_id: [
            {"mock_question_id": "q-1", "score": 80},
            {"mock_question_id": "q-2", "score": 90},
            {"mock_question_id": "q-3", "score": None},
        ],
    )
    monkeypatch.setattr(
        mock_api,
        "complete_mock_interview_session",
        lambda mock_interview_id, overall_score: {
            "mock_interview_id": mock_interview_id,
            "overall_score": overall_score,
        },
    )

    result = mock_api.complete_mock_interview_("mock-1")

    assert result["success"] is True
    assert result["overall_score"] == 85
