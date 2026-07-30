import json
import re
from fastapi import HTTPException
from pydantic import BaseModel, Field

from backend.ai.groq_client import groq_client
from backend.ai.prompts import mock_interview_question_prompt, mock_interview_score_prompt
from Database.db import (
    complete_mock_interview_session,
    create_mock_interview_session,
    get_mock_questions,
    get_previous_mock_questions,
    get_resume_profile,
    insert_metric,
    insert_mock_questions,
    skip_mock_question,
    update_mock_answer,
)


class MockQuestion(BaseModel):
    question_text: str
    question_type: str
    difficulty: str
    related_skill: str


class QuestionSet(BaseModel):
    questions: list[MockQuestion] = Field(min_length=1)


class AnswerScore(BaseModel):
    score: float = Field(ge=0, le=100)
    strengths: list[str] = []
    weaknesses: list[str] = []
    feedback: str


def _parse_json(raw: str):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def start_mock_interview_(user_id: str, interview_type: str, difficulty: str | None = None, role_focus: str | None = None, question_count: int = 5, session_id: str | None = None):
    question_count = max(3, min(question_count, 8))
    resume = get_resume_profile(user_id)
    previous_questions = get_previous_mock_questions(user_id)

    session = create_mock_interview_session(
        user_id=user_id,
        interview_type=interview_type,
        difficulty_level=difficulty,
        role_focus=role_focus,
        session_id=session_id,
    )

    prompt_context = {
        "interview_type": interview_type,
        "difficulty": difficulty or "medium",
        "role_focus": role_focus,
        "question_count": question_count,
        "resume_context": resume,
        "previous_questions_to_avoid": previous_questions,
    }

    try:
        raw = groq_client(
            system_prompt=mock_interview_question_prompt(prompt_context),
            user_prompt="Generate the question set now.",
            temperature=0.7,
        )
        parsed = QuestionSet.model_validate(_parse_json(raw))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=503, detail="Unable to generate mock interview questions.")

    try:
        questions = insert_mock_questions(
            session["mock_interview_id"],
            user_id,
            [question.model_dump() for question in parsed.questions],
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Unable to save generated questions. Please try again.")

    return {
        "success": True,
        "session": session,
        "questions": questions,
    }


def score_mock_answer_(user_id: str, mock_interview_id: str, mock_question_id: str, answer_text: str):
    questions = get_mock_questions(mock_interview_id)
    question = next((item for item in questions if item.get("mock_question_id") == mock_question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    try:
        raw = groq_client(
            system_prompt=mock_interview_score_prompt(question, answer_text),
            user_prompt="Score this answer now.",
            temperature=0.2,
        )
        score = AnswerScore.model_validate(_parse_json(raw))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=503, detail="Unable to score this answer.")

    update_mock_answer(
        mock_question_id=mock_question_id,
        answer_text=answer_text,
        score=score.score,
        strengths=score.strengths,
        weaknesses=score.weaknesses,
        feedback=score.feedback,
    )
    insert_metric(
        user_id=user_id,
        session_id=question.get("session_id"),
        category=question.get("related_skill") or question.get("question_type") or "mock_interview",
        score=score.score,
    )

    return {
        "success": True,
        "score": score.model_dump(),
    }


def complete_mock_interview_(mock_interview_id: str):
    questions = get_mock_questions(mock_interview_id)
    scored = [question for question in questions if question.get("score") is not None]
    overall_score = round(sum(float(question["score"]) for question in scored) / len(scored)) if scored else 0
    session = complete_mock_interview_session(mock_interview_id, overall_score)

    return {
        "success": True,
        "overall_score": overall_score,
        "session": session,
        "questions": get_mock_questions(mock_interview_id),
    }


def skip_mock_question_(mock_interview_id: str, mock_question_id: str):
    questions = get_mock_questions(mock_interview_id)
    question = next((item for item in questions if item.get("mock_question_id") == mock_question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")
    skip_mock_question(mock_question_id)
    return {"success": True}
