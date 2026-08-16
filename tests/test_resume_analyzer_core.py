from types import SimpleNamespace

import pytest
from pydantic import BaseModel
from langchain_core.output_parsers import PydanticOutputParser

from backend.resume_analyzer_backend.parser import resume_analyzer_core as core


class TinyModel(BaseModel):
    name: str
    items: list[str]


def groq_result(content, finish_reason="stop"):
    return SimpleNamespace(content=content, finish_reason=finish_reason, usage=None)


def feedback(present=True):
    return {
        "present": present,
        "score": 75 if present else 0,
        "feedback": "Specific feedback based on the available resume evidence.",
        "strengths": ["Specific strength"] if present else [],
        "weaknesses": ["Specific weakness"] if present else [],
        "suggestions": ["Specific suggestion"],
    }


def summary_feedback(present=True):
    return {
        "present": present,
        "score": 75 if present else 0,
        "feedback": "Specific summary feedback.",
        "suggestions": ["Emphasize FastAPI and React work."],
        "improved_rewrite": "Backend-focused developer with FastAPI and React project experience.",
    }


def section_breakdown():
    return {
        "summary": summary_feedback(False),
        "education": feedback(True),
        "experience": feedback(True),
        "projects": feedback(True),
        "skills": feedback(True),
        "achievements": feedback(False),
    }


def resume_summary():
    return core.ResumeSummary(
        overall_score=78,
        overall_review="The resume is clear and focused. The highest-priority fix is to add concrete evidence where available.",
        section_breakdown=section_breakdown(),
        experience_level="Entry",
        key_skills=["Python", "FastAPI"],
        notable_strengths=["Relevant backend projects"],
        potential_gaps=["No achievements section"],
        resume_quality_notes=["Add metrics only where evidence exists"],
    )


def resume_analysis():
    return core.ResumeAnalysis(
        overall_score=1,
        overall_review="The resume aligns with the backend role but needs clearer required-skill evidence.",
        section_breakdown=section_breakdown(),
        match_score=80,
        matching_skills=["Python", "FastAPI"],
        missing_skills=["SQL"],
        strengths=["Backend API experience"],
        weaknesses=["SQL is not shown"],
        experience_relevance="Projects are relevant to the backend JD.",
        recommendation="Moderate Fit",
        improvement_suggestions=["Show SQL evidence if the candidate has it."],
    )


def test_clean_llm_json_strips_fences_and_chatter():
    raw = 'Here is JSON:\n```json\n{"name": "resume", "items": ["a"]}\n```'
    assert core.clean_llm_json(raw) == '{"name": "resume", "items": ["a"]}'


def test_parse_retries_once_after_missing_required_field(monkeypatch):
    parser = PydanticOutputParser(pydantic_object=TinyModel)
    calls = []

    def fake_groq(**kwargs):
        calls.append(kwargs)
        return groq_result('{"name": "fixed", "items": ["one"]}')

    monkeypatch.setattr(core, "groq_client_with_metadata", fake_groq)

    parsed = core.parse_llm_json_with_retry(
        '{"name": "broken"}',
        parser,
        "tiny",
        source_prompt="original task",
    )

    assert parsed.name == "fixed"
    assert parsed.items == ["one"]
    assert len(calls) == 1


def test_parse_retries_when_finish_reason_is_length(monkeypatch):
    parser = PydanticOutputParser(pydantic_object=TinyModel)

    monkeypatch.setattr(
        core,
        "groq_client_with_metadata",
        lambda **kwargs: groq_result('{"name": "fixed", "items": ["one"]}'),
    )

    parsed = core.parse_llm_json_with_retry(
        '{"name": "cut off"',
        parser,
        "tiny",
        finish_reason="length",
        source_prompt="original task",
    )

    assert parsed.items == ["one"]


def test_resume_summary_parse_moves_misnested_root_fields_without_retry(monkeypatch):
    parser = PydanticOutputParser(pydantic_object=core.ResumeSummary)
    misplaced = {
        "overall_score": 78,
        "overall_review": "The resume is clear and focused.",
        "section_breakdown": {
            **section_breakdown(),
            "experience_level": "Entry",
            "key_skills": ["Python", "FastAPI"],
            "notable_strengths": ["Relevant backend projects"],
            "potential_gaps": ["No achievements section"],
            "resume_quality_notes": ["Add metrics only where evidence exists"],
        },
    }

    def fail_if_retry_is_called(**kwargs):
        raise AssertionError("Misnested ResumeSummary fields should be corrected before retry")

    monkeypatch.setattr(core, "groq_client_with_metadata", fail_if_retry_is_called)

    parsed = core.parse_llm_json_with_retry(
        core.json.dumps(misplaced),
        parser,
        "resume summary analysis",
    )
    dumped = parsed.model_dump()

    assert dumped["experience_level"] == "Entry"
    assert dumped["key_skills"] == ["Python", "FastAPI"]
    assert dumped["notable_strengths"] == ["Relevant backend projects"]
    assert dumped["potential_gaps"] == ["No achievements section"]
    assert dumped["resume_quality_notes"] == ["Add metrics only where evidence exists"]
    assert set(dumped["section_breakdown"].keys()) == set(core.RESUME_SECTION_NAMES)
    assert "experience_level" not in dumped["section_breakdown"]


def test_resume_summary_repair_prompt_calls_out_misnested_root_fields(monkeypatch):
    parser = PydanticOutputParser(pydantic_object=core.ResumeSummary)
    captured = {}

    def fake_groq(**kwargs):
        captured["prompt"] = kwargs["user_prompt"]
        return groq_result(resume_summary().model_dump_json())

    monkeypatch.setattr(core, "groq_client_with_metadata", fake_groq)

    parsed = core.parse_llm_json_with_retry(
        '{"overall_score": 78, "section_breakdown": {',
        parser,
        "resume summary analysis",
        finish_reason="length",
        source_prompt="original resume summary prompt",
    )

    assert parsed.experience_level == "Entry"
    assert "section_breakdown must contain only these keys" in captured["prompt"]
    assert "must be root-level siblings of section_breakdown" in captured["prompt"]


def test_optional_section_parse_failure_returns_none(monkeypatch):
    parser = PydanticOutputParser(pydantic_object=TinyModel)

    monkeypatch.setattr(
        core,
        "groq_client_with_metadata",
        lambda **kwargs: groq_result('{"name": "still missing items"}'),
    )

    assert core.structure_section("Skills: Python", parser, "Skills", required=False) is None


def test_required_section_parse_failure_raises(monkeypatch):
    parser = PydanticOutputParser(pydantic_object=TinyModel)

    monkeypatch.setattr(
        core,
        "groq_client_with_metadata",
        lambda **kwargs: groq_result('{"name": "still missing items"}'),
    )

    with pytest.raises(core.LLMStructuredOutputError):
        core.structure_section("Required section", parser, "Job Description", required=True)


def test_build_resume_normalized_text_keeps_multiple_entries():
    structured = {
        "summary": None,
        "education": core.EducationList(
            education=[
                core.Education(institution="ABC University", degree="B.Tech", duration="2021-2025"),
                core.Education(institution="XYZ School", degree="Higher Secondary", duration="2019-2021"),
            ]
        ),
        "experience": core.WorkExperienceList(
            experience=[
                core.WorkExperience(company="Acme", title="Backend Intern", duration="2024", responsibilities=["Built APIs"], technologies=["FastAPI"]),
                core.WorkExperience(company="Beta", title="React Intern", duration="2023", responsibilities=["Built UI"], technologies=["React"]),
            ]
        ),
        "projects": core.ProjectList(
            projects=[
                core.Project(name="Interview Prep", description="AI mentor app", technologies=["React", "FastAPI"]),
                core.Project(name="Resume Analyzer", description="Scoring pipeline", technologies=["Python"]),
            ]
        ),
        "skills": None,
        "achievements": None,
    }

    text = core.build_resume_normalized_text(structured)

    assert "ABC University" in text
    assert "XYZ School" in text
    assert "Acme" in text
    assert "Beta" in text
    assert "Interview Prep" in text
    assert "Resume Analyzer" in text


def test_run_without_jd_returns_resume_quality_analysis(monkeypatch):
    monkeypatch.setattr(
        core,
        "process_resume",
        lambda path: {
            "structured": {
                "summary": None,
                "education": [{"institution": "ABC", "degree": "B.Tech", "duration": "2025"}],
                "experience": None,
                "projects": {"projects": [{"name": "API", "description": "FastAPI app", "technologies": ["FastAPI"]}]},
                "skills": {"skill_sets": [{"category": "Backend", "skills": ["Python"]}]},
                "achievements": None,
            },
            "normalized_text": "Python FastAPI API project",
            "source_text": "PROJECTS API FastAPI",
        },
    )
    monkeypatch.setattr(core, "summarize_resume", lambda *args: resume_summary())

    result = core.run_full_analysis("resume.pdf")

    assert result["analysis_type"] == "summary"
    assert result["similarity_score"] is None
    assert result["analysis"]["overall_score"] == 78
    assert result["analysis"]["section_breakdown"]["achievements"]["present"] is False


def test_run_with_jd_computes_backend_weighted_overall_score(monkeypatch):
    monkeypatch.setattr(
        core,
        "process_resume",
        lambda path: {
            "structured": {
                "summary": None,
                "education": [],
                "experience": None,
                "projects": {"projects": [{"name": "API"}]},
                "skills": {"skill_sets": [{"category": "Backend", "skills": ["Python", "FastAPI"]}]},
                "achievements": None,
            },
            "normalized_text": "Python FastAPI",
            "source_text": "Python FastAPI",
        },
    )
    monkeypatch.setattr(
        core,
        "process_jd",
        lambda text: {
            "structured": core.JobDescription(
                title="Backend Developer",
                required_skills=["Python", "FastAPI", "SQL"],
                responsibilities=["Build APIs"],
                qualifications=["Backend experience"],
            ),
            "normalized_text": "Python FastAPI SQL backend",
        },
    )
    monkeypatch.setattr(core, "compute_similarity", lambda resume, jd: 0.5)
    monkeypatch.setattr(core, "analyze_resume_fit", lambda *args: resume_analysis())

    result = core.run_full_analysis("resume.pdf", "Need Python FastAPI SQL")

    assert result["analysis_type"] == "fit_analysis"
    assert result["analysis"]["match_score"] == 80
    assert result["analysis"]["overall_score"] == round(0.4 * 50 + 0.6 * 80)


def test_summary_prompt_preserves_raw_evidence_and_blocks_fabricated_metrics(monkeypatch):
    captured = {}

    def fake_groq(**kwargs):
        captured["prompt"] = kwargs["user_prompt"]
        return groq_result(resume_summary().model_dump_json())

    monkeypatch.setattr(core, "groq_client_with_metadata", fake_groq)

    result = core.summarize_resume(
        resume_normalized_text="Project: Interview Prep. Built with FastAPI.",
        resume_source_text="PROJECTS\nInterview Prep\nBuilt with FastAPI.",
        present_sections=["projects"],
    )

    assert result.overall_score == 78
    assert "EXTRACTED RESUME EVIDENCE" in captured["prompt"]
    assert "Do not invent percentages" in captured["prompt"]
    assert "if a useful metric is missing" in captured["prompt"]
