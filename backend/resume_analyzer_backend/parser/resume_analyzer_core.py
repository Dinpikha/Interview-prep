"""
Resume Analyzer Core
=====================
Functions are ordered to match the actual pipeline flow:

    1. Schemas
    2. Generic LLM structuring helper (shared utility)
    3. RESUME pipeline   (load -> normalize -> structure -> flatten)
    4. JD pipeline        (structure -> flatten)
    5. Similarity          (embed -> cosine)
    6. Analysis             (no-JD summary  OR  JD-based fit analysis)
    7. Orchestrator          (run_full_analysis - the one entrypoint a
                              pipeline.py / API route should call)

Read top to bottom and it reads like the actual data flow.
"""

from pydantic import BaseModel, ConfigDict, Field
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from typing import List, Optional, Tuple
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import logging
import re

from backend.ai.groq_client import groq_client_with_metadata
from backend.resume_analyzer_backend.parser.extract_resume import return_santized_structured_json
from backend.resume_analyzer_backend.parser.clean_header import normalize_resume_keys


# ---------------------------------------------------------------------------
# Logging / model loading
# ---------------------------------------------------------------------------

logger = logging.getLogger(__name__)

_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


class ResumeAnalyzerError(Exception):
    """Base error for controlled resume analyzer failures."""


class ResumeExtractionError(ResumeAnalyzerError):
    pass


class LLMStructuredOutputError(ResumeAnalyzerError):
    pass


class LLMTruncatedOutputError(LLMStructuredOutputError):
    pass


class JDProcessingError(ResumeAnalyzerError):
    pass


class EmbeddingError(ResumeAnalyzerError):
    pass


# ===========================================================================
# 1. SCHEMAS
# ===========================================================================

class Education(BaseModel):
    institution: str
    location: Optional[str] = None
    degree: str
    duration: str


class EducationList(BaseModel):
    education: List[Education]


class SummarySection(BaseModel):
    content: str
    improved_rewrite: Optional[str] = None


class WorkExperience(BaseModel):
    company: str
    title: str
    duration: str
    location: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)


class WorkExperienceList(BaseModel):
    experience: List[WorkExperience]


class Project(BaseModel):
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    impact: Optional[str] = None


class ProjectList(BaseModel):
    projects: List[Project]


class SkillSet(BaseModel):
    category: str
    skills: List[str]


class SkillList(BaseModel):
    skill_sets: List[SkillSet]


class Achievement(BaseModel):
    title: str
    year: Optional[str] = None


class AchievementList(BaseModel):
    achievements: List[Achievement]


class JobDescription(BaseModel):
    title: str
    required_skills: List[str]
    responsibilities: List[str]
    qualifications: List[str]
    experience_level: Optional[str] = None


class SummaryFeedback(BaseModel):
    present: bool
    score: Optional[int] = Field(default=None, description="Summary-specific score from 0 to 100 when present", ge=0, le=100)
    feedback: str
    suggestions: List[str]
    improved_rewrite: Optional[str] = None


class SectionFeedback(BaseModel):
    present: bool
    score: Optional[int] = Field(default=None, description="Section-specific score from 0 to 100 when present", ge=0, le=100)
    feedback: str = Field(description="Specific section feedback, including reasoned value when the section is missing")
    strengths: List[str] = Field(description="Section-specific strengths")
    weaknesses: List[str] = Field(description="Section-specific weaknesses")
    suggestions: List[str] = Field(description="Concrete section-specific improvement suggestions")


class SectionBreakdown(BaseModel):
    summary: Optional[SummaryFeedback] = None
    education: SectionFeedback
    experience: SectionFeedback
    projects: SectionFeedback
    skills: SectionFeedback
    achievements: SectionFeedback


class ResumeSummary(BaseModel):
    """Returned when no JD is provided - a standalone read of the resume."""
    overall_score: int = Field(description="Holistic resume quality score from 0 to 100", ge=0, le=100)
    overall_review: str = Field(description="2-4 sentence holistic review in connected prose")
    section_breakdown: SectionBreakdown = Field(description="Per-section resume feedback. Missing sections use present=false.")
    experience_level: str = Field(description="e.g. Entry, Mid, Senior, based on resume content")
    key_skills: List[str] = Field(description="Most prominent skills found in the resume")
    notable_strengths: List[str] = Field(description="What stands out positively")
    potential_gaps: List[str] = Field(description="Areas that seem thin, generic, or missing - not tied to any specific JD")
    resume_quality_notes: List[str] = Field(description="Structural/clarity feedback, e.g. missing quantified impact, unclear timelines")


class ResumeAnalysis(BaseModel):
    """Returned when a JD is provided - fit analysis against that JD."""
    overall_score: int = Field(description="Backend-overridden blended score from 0 to 100", ge=0, le=100)
    overall_review: str = Field(description="2-4 sentence holistic role-fit review in connected prose")
    section_breakdown: SectionBreakdown = Field(description="Per-section fit feedback. Missing sections use present=false.")
    match_score: int = Field(description="Overall fit score out of 100", ge=0, le=100)
    matching_skills: List[str] = Field(description="Skills from the resume that align with the JD")
    missing_skills: List[str] = Field(description="Required JD skills not found in the resume")
    strengths: List[str] = Field(description="Specific strengths of this candidate for this role")
    weaknesses: List[str] = Field(description="Gaps or concerns relative to the JD")
    experience_relevance: str = Field(description="Brief assessment of how relevant the candidate's experience/projects are")
    recommendation: str = Field(description="One of: Strong Fit, Moderate Fit, Weak Fit")
    improvement_suggestions: List[str] = Field(description="Concrete suggestions to improve resume for this JD")


class ResumeResult(BaseModel):
    structured: dict
    normalized_text: str
    source_text: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)


class JDResult(BaseModel):
    structured: JobDescription
    normalized_text: str


class FullAnalysisResult(BaseModel):
    """Typed return shape for run_full_analysis - same shape whether or not a JD was given."""
    resume: ResumeResult
    jd: Optional[JDResult] = None
    similarity_score: Optional[float] = None
    analysis: Optional[dict] = None       # ResumeSummary or ResumeAnalysis, dumped to dict
    analysis_type: str                    # "summary" | "fit_analysis"
    errors: List[str] = Field(default_factory=list)

    model_config = ConfigDict(arbitrary_types_allowed=True)


def model_to_dict(value):
    """Pydantic v1/v2 compatible dump helper."""
    if isinstance(value, BaseModel):
        if hasattr(value, "model_dump"):
            return value.model_dump()
        return value.dict()
    return value


RESUME_SECTION_NAMES = ["summary", "education", "experience", "projects", "skills", "achievements"]
RESUME_SUMMARY_ROOT_FIELDS = [
    "overall_score",
    "overall_review",
    "experience_level",
    "key_skills",
    "notable_strengths",
    "potential_gaps",
    "resume_quality_notes",
]

SECTION_PARSE_MAX_TOKENS = 1800
ANALYSIS_MAX_TOKENS = 6000
REPAIR_MAX_TOKENS = 6000
RAW_EVIDENCE_CHAR_LIMIT = 14000
REPAIR_RESPONSE_CHAR_LIMIT = 7000
REPAIR_CONTEXT_CHAR_LIMIT = 12000


# ===========================================================================
# 2. GENERIC LLM STRUCTURING HELPER (shared by resume + JD + analysis steps)
# ===========================================================================

def clean_llm_json(raw_response: str) -> str:
    """Normalize common LLM JSON wrappers before Pydantic parsing."""
    cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', (raw_response or "").strip())
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return cleaned[first_brace:last_brace + 1]
    return cleaned


def _parser_model(parser: PydanticOutputParser):
    return getattr(parser, "pydantic_object", None) or getattr(parser, "pydantic_schema", None)


def normalize_resume_summary_json_shape(cleaned_json: str, parser: PydanticOutputParser) -> str:
    """Move known ResumeSummary root fields out of section_breakdown when the LLM nests them incorrectly."""
    if _parser_model(parser) is not ResumeSummary:
        return cleaned_json

    try:
        payload = json.loads(cleaned_json)
    except json.JSONDecodeError:
        return cleaned_json

    section_breakdown = payload.get("section_breakdown")
    if not isinstance(payload, dict) or not isinstance(section_breakdown, dict):
        return cleaned_json

    for field_name in RESUME_SUMMARY_ROOT_FIELDS:
        if field_name not in payload and field_name in section_breakdown:
            payload[field_name] = section_breakdown[field_name]

    payload["section_breakdown"] = {
        section_name: section_breakdown[section_name]
        for section_name in RESUME_SECTION_NAMES
        if section_name in section_breakdown
    }
    return json.dumps(payload)


def _looks_truncated(response_text: str, finish_reason: str | None) -> bool:
    if finish_reason == "length":
        return True
    cleaned = (response_text or "").strip()
    return bool(cleaned) and cleaned.startswith("{") and not cleaned.endswith("}")


def _parse_llm_json(
    raw_response: str,
    parser: PydanticOutputParser,
    context_label: str,
):
    try:
        cleaned = clean_llm_json(raw_response)
        cleaned = normalize_resume_summary_json_shape(cleaned, parser)
        return parser.parse(cleaned)
    except Exception as exc:
        raise LLMStructuredOutputError(f"{context_label} JSON did not match the expected schema: {exc}") from exc


def _repair_llm_json(
    raw_response: str,
    parser: PydanticOutputParser,
    context_label: str,
    max_tokens: int,
    source_prompt: str | None = None,
):
    repair_prompt = (
        f"The previous LLM response for {context_label} was invalid or incomplete.\n"
        "Repair it into one complete JSON object that exactly follows the schema below.\n"
        "Return JSON only. No markdown, no commentary, no code fences.\n"
        "Do not invent resume facts, dates, technologies, metrics, companies, roles, or achievements.\n"
        "If a required array has no evidence, return an empty array. If a required string has no evidence, return an empty string. "
        "For missing resume sections, preserve present=false, score=0, strengths=[], weaknesses=[], and suggestions=[] unless the schema says otherwise.\n\n"
        "For ResumeSummary JSON specifically, section_breakdown must contain only these keys: "
        "summary, education, experience, projects, skills, achievements. "
        "The fields experience_level, key_skills, notable_strengths, potential_gaps, and resume_quality_notes "
        "must be root-level siblings of section_breakdown, never nested inside section_breakdown. "
        "If those fields are nested incorrectly, move the existing values to the root without changing them.\n\n"
        f"{parser.get_format_instructions()}\n\n"
        + (f"Original task context:\n{source_prompt[:REPAIR_CONTEXT_CHAR_LIMIT]}\n\n" if source_prompt else "")
        +
        "Invalid response to repair:\n"
        f"{(raw_response or '')[:REPAIR_RESPONSE_CHAR_LIMIT]}"
    )
    result = groq_client_with_metadata(
        system_prompt="You repair malformed structured JSON. Return only complete valid JSON.",
        user_prompt=repair_prompt,
        temperature=0,
        max_tokens=max_tokens,
    )
    logger.info(
        "LLM repair response for %s: finish_reason=%s length=%s",
        context_label,
        result.finish_reason,
        len(result.content),
    )
    if _looks_truncated(result.content, result.finish_reason):
        raise LLMTruncatedOutputError(f"{context_label} repair response was truncated.")
    return _parse_llm_json(result.content, parser, context_label)


def parse_llm_json_with_retry(
    raw_response: str,
    parser: PydanticOutputParser,
    context_label: str,
    finish_reason: str | None = None,
    max_tokens: int = REPAIR_MAX_TOKENS,
    source_prompt: str | None = None,
):
    try:
        if _looks_truncated(raw_response, finish_reason):
            raise LLMTruncatedOutputError(f"{context_label} response was truncated.")
        return _parse_llm_json(raw_response, parser, context_label)
    except LLMStructuredOutputError as exc:
        logger.warning(
            "LLM parse failed for %s; retrying once. finish_reason=%s response_length=%s error=%s",
            context_label,
            finish_reason,
            len(raw_response or ""),
            exc,
        )
        return _repair_llm_json(raw_response, parser, context_label, max_tokens, source_prompt=source_prompt)


def structure_section(
    content: str,
    parser: PydanticOutputParser,
    section_name: str,
    required: bool = False,
):
    """
    Run one chunk of text through the LLM and parse it into a Pydantic object.

    If parsing fails:
      - required=True  -> raises (caller has no sane fallback, e.g. the JD itself)
      - required=False -> logs and returns None (caller already handles missing
                           sections gracefully, e.g. an optional resume section)
    """
    prompt_template = PromptTemplate(
        template=(
            "Extract structured data from this resume section titled '{section_name}'.\n"
            "Return one complete valid JSON object only. No markdown fences or commentary.\n"
            "Every required schema field must be present. Arrays must be arrays.\n"
            "Use only facts present in the supplied section; do not invent dates, metrics, technologies, companies, or degrees.\n"
            "If evidence is missing for a nullable field, return null. If evidence is missing for an array, return an empty array.\n\n"
            "{format_instructions}\n\n"
            "Content:\n{content}"
        ),
        input_variables=["content", "section_name"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    filled_prompt = prompt_template.format(content=content, section_name=section_name)

    result = groq_client_with_metadata(
        system_prompt="You are a resume parsing assistant. Return only valid JSON, with no markdown formatting, no code fences, and no explanation text.",
        user_prompt=filled_prompt,
        temperature=0,
        max_tokens=SECTION_PARSE_MAX_TOKENS,
    )
    logger.info(
        "LLM section response for %s: finish_reason=%s length=%s required=%s",
        section_name,
        result.finish_reason,
        len(result.content),
        required,
    )

    try:
        return parse_llm_json_with_retry(
            result.content,
            parser,
            context_label=section_name,
            finish_reason=result.finish_reason,
            max_tokens=max(SECTION_PARSE_MAX_TOKENS, REPAIR_MAX_TOKENS // 2),
            source_prompt=filled_prompt,
        )
    except Exception as e:
        if required:
            raise
        logger.warning("Optional resume section '%s' could not be parsed and will be skipped: %s", section_name, e)
        return None


# ===========================================================================
# 3. RESUME PIPELINE
#    load_and_normalize_resume -> get_section_text -> structure_resume
#    -> build_resume_normalized_text -> process_resume
# ===========================================================================

def load_and_normalize_resume(pdf_path: str) -> dict:
    """Extract, unwrap the name key, and normalize section headers for a resume PDF."""
    try:
        resume_data = return_santized_structured_json(pdf_path)
    except Exception as exc:
        raise ResumeExtractionError(f"Resume extraction failed for '{pdf_path}': {exc}") from exc

    name_key = next((k for k in resume_data if k != "content"), None)
    if not name_key:
        available_keys = list(resume_data.keys()) if isinstance(resume_data, dict) else type(resume_data).__name__
        raise ResumeExtractionError(
            f"Could not find a usable top-level resume key in extracted data for '{pdf_path}'. "
            f"Available keys/shape: {available_keys}"
        )

    normalized = normalize_resume_keys(resume_data[name_key])
    logger.info(
        "Resume extracted and normalized: top_level=%s sections=%s",
        name_key,
        sorted(k for k in normalized.keys() if k != "content"),
    )
    return normalized


def get_section_text(resume: dict, section_name: str) -> str:
    """Handles flat, nested, and multi-entry markdown-derived sections."""
    section = resume.get(section_name)
    if not section:
        return ""
    return flatten_extracted_section(section)


def flatten_extracted_section(value, heading: str | None = None) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return f"{heading}\n{value}" if heading else value
    if isinstance(value, list):
        return "\n".join(str(item) for item in value if item)
    if not isinstance(value, dict):
        return str(value)

    parts = []
    content = value.get("content")
    if content:
        parts.append(f"{heading}\n{content}" if heading else str(content))
    for key, nested in value.items():
        if key == "content":
            continue
        nested_text = flatten_extracted_section(nested, key)
        if nested_text:
            parts.append(nested_text)
    return "\n\n".join(parts)


def build_resume_source_text(resume: dict) -> str:
    """Preserve extracted evidence so final scoring is not limited to flattened structured objects."""
    parts = []
    for section_name in RESUME_SECTION_NAMES:
        section_text = get_section_text(resume, section_name)
        if section_text:
            parts.append(f"{section_name.upper()}\n{section_text}")
    for section_name, value in resume.items():
        if section_name in RESUME_SECTION_NAMES or section_name == "content":
            continue
        section_text = flatten_extracted_section(value, section_name)
        if section_text:
            parts.append(section_text)
    source_text = "\n\n".join(parts)
    if len(source_text) > RAW_EVIDENCE_CHAR_LIMIT:
        logger.info("Resume source evidence truncated for prompt context: original_length=%s", len(source_text))
        return source_text[:RAW_EVIDENCE_CHAR_LIMIT]
    return source_text


def structure_resume(resume: dict) -> dict:
    """Run each section through the LLM structurer. Returns a dict of Pydantic objects (or None)."""
    summary_content = get_section_text(resume, "summary")
    education_content = get_section_text(resume, "education")
    experience_content = get_section_text(resume, "experience")
    projects_content = get_section_text(resume, "projects")
    skills_content = get_section_text(resume, "skills")
    achievements_content = get_section_text(resume, "achievements")

    logger.info(
        "Resume sections passed to structuring: %s",
        [name for name, content in {
            "summary": summary_content,
            "education": education_content,
            "experience": experience_content,
            "projects": projects_content,
            "skills": skills_content,
            "achievements": achievements_content,
        }.items() if content],
    )

    return {
        "summary": structure_section(
            summary_content, PydanticOutputParser(pydantic_object=SummarySection), "Professional Summary"
        ) if summary_content else None,
        "education": structure_section(
            education_content, PydanticOutputParser(pydantic_object=EducationList), "Education"
        ) if education_content else None,
        "experience": structure_section(
            experience_content, PydanticOutputParser(pydantic_object=WorkExperienceList), "Work Experience"
        ) if experience_content else None,
        "projects": structure_section(
            projects_content, PydanticOutputParser(pydantic_object=ProjectList), "Projects"
        ) if projects_content else None,
        "skills": structure_section(
            skills_content, PydanticOutputParser(pydantic_object=SkillList), "Skills"
        ) if skills_content else None,
        "achievements": structure_section(
            achievements_content, PydanticOutputParser(pydantic_object=AchievementList), "Achievements"
        ) if achievements_content else None,
    }


def build_resume_normalized_text(structured: dict) -> str:
    """Flatten structured resume objects into one clean text block for embedding + LLM analysis."""
    summary = structured.get("summary")
    education = structured.get("education")
    experience = structured.get("experience")
    projects = structured.get("projects")
    skills = structured.get("skills")
    achievements = structured.get("achievements")

    parts = []

    if summary:
        parts.append(f"Professional Summary: {summary.content}")

    if education:
        for e in education.education:
            parts.append(f"Education: {e.degree} from {e.institution} ({e.duration})")

    if experience:
        for job in experience.experience:
            resp = " ".join(job.responsibilities)
            tech = ", ".join(job.technologies)
            parts.append(
                f"Experience: {job.title} at {job.company} ({job.duration}). "
                f"{resp} Technologies: {tech}."
            )

    if projects:
        for p in projects.projects:
            tech = ", ".join(p.technologies)
            parts.append(f"Project: {p.name}. {p.description} Technologies: {tech}.")

    if skills:
        for s in skills.skill_sets:
            parts.append(f"Skills ({s.category}): {', '.join(s.skills)}")

    if achievements:
        for a in achievements.achievements:
            parts.append(f"Achievement: {a.title} ({a.year or 'N/A'})")

    return "\n".join(parts)


def process_resume(pdf_path: str) -> dict:
    """
    Full resume pipeline: load -> normalize headers -> structure via LLM -> flatten to text.
    Returns {"structured": {...plain dict/list data...}, "normalized_text": "..."}.
    """
    resume = load_and_normalize_resume(pdf_path)
    source_text = build_resume_source_text(resume)
    structured = structure_resume(resume)
    normalized_text = build_resume_normalized_text(structured)
    structured_response = {
        "summary": model_to_dict(structured.get("summary")),
        "education": model_to_dict(structured.get("education")).get("education", [])
        if structured.get("education") else [],
        "experience": model_to_dict(structured.get("experience")),
        "projects": model_to_dict(structured.get("projects")),
        "skills": model_to_dict(structured.get("skills")),
        "achievements": model_to_dict(structured.get("achievements")),
    }
    logger.info(
        "Resume processing complete: normalized_length=%s source_length=%s parsed_sections=%s",
        len(normalized_text),
        len(source_text),
        get_present_resume_sections(structured_response),
    )
    return {
        "structured": structured_response,
        "normalized_text": normalized_text,
        "source_text": source_text,
    }


# ===========================================================================
# 4. JD PIPELINE
#    structure_jd -> build_jd_normalized_text -> process_jd
# ===========================================================================

def structure_jd(jd_text: str) -> JobDescription:
    jd_parser = PydanticOutputParser(pydantic_object=JobDescription)
    return structure_section(jd_text, jd_parser, "Job Description", required=True)


def build_jd_normalized_text(jd: JobDescription) -> str:
    parts = [
        f"Job Title: {jd.title}",
        f"Required Skills: {', '.join(jd.required_skills)}",
        f"Responsibilities: {' '.join(jd.responsibilities)}",
        f"Qualifications: {' '.join(jd.qualifications)}",
    ]
    if jd.experience_level:
        parts.append(f"Experience Level: {jd.experience_level}")
    return "\n".join(parts)


def process_jd(jd_text: str) -> dict:
    """
    Full JD pipeline: structure via LLM -> flatten to text.
    Returns {"structured": JobDescription, "normalized_text": "..."}.
    """
    try:
        structured = structure_jd(jd_text)
        normalized_text = build_jd_normalized_text(structured)
        logger.info("JD processing complete: required_skills=%s normalized_length=%s", len(structured.required_skills), len(normalized_text))
        return {"structured": structured, "normalized_text": normalized_text}
    except ResumeAnalyzerError:
        raise
    except Exception as exc:
        raise JDProcessingError(f"Job description processing failed: {exc}") from exc


# ===========================================================================
# 5. SIMILARITY
#    get_embedding -> compute_similarity
# ===========================================================================

def get_embedding(text: str):
    return get_embedding_model().encode(text)


def compute_similarity(resume_text: str, jd_text: str) -> float:
    try:
        resume_embedding = get_embedding(resume_text)
        jd_embedding = get_embedding(jd_text)
        return float(cosine_similarity([resume_embedding], [jd_embedding])[0][0])
    except Exception as exc:
        raise EmbeddingError(f"Embedding similarity failed: {exc}") from exc


# ===========================================================================
# 6. ANALYSIS
#    summarize_resume()   -> used when there is NO JD
#    analyze_resume_fit() -> used when there IS a JD
# ===========================================================================

OVERALL_SCORE_SIMILARITY_WEIGHT = 0.4
OVERALL_SCORE_MATCH_WEIGHT = 0.6


def get_present_resume_sections(resume_structured: dict) -> List[str]:
    present_sections = []
    for section_name in RESUME_SECTION_NAMES:
        section = resume_structured.get(section_name)
        if isinstance(section, list):
            if section:
                present_sections.append(section_name)
        elif section:
            present_sections.append(section_name)
    return present_sections


def format_section_presence(present_sections: List[str]) -> Tuple[str, str]:
    absent_sections = [section for section in RESUME_SECTION_NAMES if section not in present_sections]
    present_text = ", ".join(present_sections) if present_sections else "none"
    absent_text = ", ".join(absent_sections) if absent_sections else "none"
    return present_text, absent_text


def compute_overall_fit_score(similarity_score: float, match_score: int) -> int:
    score = (
        OVERALL_SCORE_SIMILARITY_WEIGHT * similarity_score * 100
        + OVERALL_SCORE_MATCH_WEIGHT * match_score
    )
    return round(max(0, min(100, score)))


def attach_summary_rewrite(resume_result: dict, analysis_dict: dict) -> None:
    summary = resume_result.get("structured", {}).get("summary")
    summary_feedback = analysis_dict.get("section_breakdown", {}).get("summary") or {}
    rewrite = summary_feedback.get("improved_rewrite")
    if summary and rewrite:
        summary["improved_rewrite"] = rewrite


def summarize_resume(resume_normalized_text: str, resume_source_text: str, present_sections: List[str]) -> ResumeSummary:
    """Standalone resume read - no JD to compare against, so this always
    returns a real, useful object instead of None."""
    parser = PydanticOutputParser(pydantic_object=ResumeSummary)
    present_sections_text, absent_sections_text = format_section_presence(present_sections)

    prompt_template = PromptTemplate(
        template=(
            "You are an expert resume reviewer. Read the candidate's resume below and "
            "produce an honest, standalone analysis. There is no job description to compare "
            "against. Score the resume in overall_score from 0-100 based on completeness, "
            "clarity, impact, and structure.\n\n"
            "Use the structured resume text for consistency, and use the extracted resume evidence "
            "to preserve details that may have been lost during structuring. Every factual claim must "
            "come from the supplied resume evidence. Do not invent percentages, dates, companies, roles, "
            "technologies, achievements, user counts, performance gains, or education details. For rewrite "
            "suggestions, preserve the candidate's actual facts; if a useful metric is missing, suggest adding "
            "one only if the candidate has that evidence.\n\n"
            "Return one complete valid JSON object only. No markdown fences or commentary. Every required "
            "field must be present and arrays must be arrays.\n\n"
            "Important schema rule: section_breakdown must contain only summary, education, experience, "
            "projects, skills, and achievements. experience_level, key_skills, notable_strengths, "
            "potential_gaps, and resume_quality_notes must be root-level fields, not nested inside "
            "section_breakdown.\n\n"
            "Write overall_review as connected prose in 2-4 sentences. Cover the candidate's "
            "general strength, structure/formatting quality, and the single highest-priority fix.\n\n"
            "Produce section_breakdown for every section key: summary, education, experience, "
            "projects, skills, achievements. For PRESENT sections, set present=true and cite "
            "specific content from that section, such as named skills, projects, technologies, "
            "companies, degrees, or achievements. Suggestions must explain what detail to add "
            "and why it matters for this candidate. Never write generic advice like 'add more detail'.\n\n"
            "For ABSENT sections, set present=false, score=0, strengths=[], weaknesses=[], and "
            "write feedback explaining the specific value of adding that section based on what is "
            "actually present elsewhere in this resume. Suggestions should give concrete next steps "
            "for this candidate's apparent field and level, not boilerplate.\n\n"
            "For section_breakdown.summary: if present, critique weak/passive verbs, vagueness, "
            "and positioning, and include an actual improved_rewrite. If absent, set present=false "
            "and suggest what a good summary for this candidate should emphasize; include a draft "
            "improved_rewrite when enough resume context exists.\n\n"
            "PRESENT RESUME SECTIONS: {present_sections}\n"
            "ABSENT RESUME SECTIONS: {absent_sections}\n\n"
            "{format_instructions}\n\n"
            "STRUCTURED RESUME TEXT:\n{resume_text}\n\n"
            "EXTRACTED RESUME EVIDENCE:\n{resume_source_text}"
        ),
        input_variables=["resume_text", "resume_source_text", "present_sections", "absent_sections"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    filled_prompt = prompt_template.format(
        resume_text=resume_normalized_text,
        resume_source_text=resume_source_text,
        present_sections=present_sections_text,
        absent_sections=absent_sections_text,
    )

    result = groq_client_with_metadata(
        system_prompt="You are a fair, detail-oriented resume reviewer. Return only valid JSON.",
        user_prompt=filled_prompt,
        temperature=0.2,
        max_tokens=ANALYSIS_MAX_TOKENS,
    )
    logger.info(
        "LLM resume summary response: finish_reason=%s length=%s",
        result.finish_reason,
        len(result.content),
    )
    return parse_llm_json_with_retry(
        result.content,
        parser,
        context_label="resume summary analysis",
        finish_reason=result.finish_reason,
        max_tokens=ANALYSIS_MAX_TOKENS,
        source_prompt=filled_prompt,
    )


def analyze_resume_fit(
    resume_normalized_text: str,
    resume_source_text: str,
    jd: JobDescription,
    jd_normalized_text: str,
    similarity_score: float,
    present_sections: List[str],
) -> ResumeAnalysis:
    """JD-based fit analysis. Takes the structured JD (not just flattened text) so the
    LLM can weigh 'required_skills' differently from 'responsibilities' / 'qualifications'."""
    parser = PydanticOutputParser(pydantic_object=ResumeAnalysis)
    present_sections_text, absent_sections_text = format_section_presence(present_sections)

    prompt_template = PromptTemplate(
        template=(
            "You are an expert ATS resume analyst. Compare the candidate's resume against "
            "the job description and produce a detailed, honest fit analysis.\n\n"
            "A vector similarity score between the two has already been computed: {similarity_score:.2f} "
            "(0 = no overlap, 1 = perfect semantic overlap). Use this as one signal, not the sole basis "
            "for match_score. The backend will compute final overall_score later as a weighted blend, "
            "so still include an overall_score field but treat match_score as your independent role-fit "
            "judgment from 0-100.\n\n"
            "Treat 'Required Skills' below as must-haves and weigh missing ones heavily. Treat "
            "'Responsibilities' and 'Qualifications' as supporting context, not hard requirements "
            "unless clearly mandatory.\n\n"
            "Use the structured resume text for consistency, and use the extracted resume evidence "
            "to preserve details that may have been lost during structuring. Every factual claim must "
            "come from the supplied resume evidence or the supplied JD. Do not invent percentages, dates, "
            "companies, roles, technologies, achievements, user counts, performance gains, or education details. "
            "For improved bullets or summary rewrites, preserve actual facts and leave missing metrics unspecified.\n\n"
            "Return one complete valid JSON object only. No markdown fences or commentary. Every required "
            "field must be present and arrays must be arrays.\n\n"
            "Write overall_review as connected prose in 2-4 sentences. Cover role alignment, "
            "structure/formatting quality, and the single highest-priority fix for this JD.\n\n"
            "Produce section_breakdown for every section key: summary, education, experience, "
            "projects, skills, achievements. For PRESENT sections, set present=true and cite "
            "specific content from that section, such as named skills, projects, technologies, "
            "companies, degrees, or achievements. Suggestions must explain what detail to add "
            "and why it matters for this JD. Never write generic advice like 'add more detail'.\n\n"
            "For ABSENT sections, set present=false, score=0, strengths=[], weaknesses=[], and "
            "write feedback explaining the specific value of adding that section based on what is "
            "actually present elsewhere in this resume and what this JD requires. Suggestions should "
            "give concrete next steps for this candidate and role, not boilerplate.\n\n"
            "For section_breakdown.summary: if present, critique weak/passive verbs, vagueness, "
            "and positioning for this role, and include an actual improved_rewrite. If absent, set "
            "present=false and suggest what a role-targeted summary should emphasize; include a draft "
            "improved_rewrite when enough resume context exists.\n\n"
            "PRESENT RESUME SECTIONS: {present_sections}\n"
            "ABSENT RESUME SECTIONS: {absent_sections}\n\n"
            "{format_instructions}\n\n"
            "STRUCTURED RESUME TEXT:\n{resume_text}\n\n"
            "EXTRACTED RESUME EVIDENCE:\n{resume_source_text}\n\n"
            "JOB TITLE: {jd_title}\n"
            "REQUIRED SKILLS: {jd_required_skills}\n"
            "RESPONSIBILITIES: {jd_responsibilities}\n"
            "QUALIFICATIONS: {jd_qualifications}\n"
            "EXPERIENCE LEVEL: {jd_experience_level}\n\n"
            "FULL JD TEXT (for reference):\n{jd_text}"
        ),
        input_variables=[
            "resume_text", "jd_text", "similarity_score",
            "resume_source_text",
            "jd_title", "jd_required_skills", "jd_responsibilities",
            "jd_qualifications", "jd_experience_level",
            "present_sections", "absent_sections",
        ],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    filled_prompt = prompt_template.format(
        resume_text=resume_normalized_text,
        resume_source_text=resume_source_text,
        jd_text=jd_normalized_text,
        similarity_score=similarity_score,
        jd_title=jd.title,
        jd_required_skills=", ".join(jd.required_skills),
        jd_responsibilities=" ".join(jd.responsibilities),
        jd_qualifications=" ".join(jd.qualifications),
        jd_experience_level=jd.experience_level or "Not specified",
        present_sections=present_sections_text,
        absent_sections=absent_sections_text,
    )

    result = groq_client_with_metadata(
        system_prompt="You are a fair, detail-oriented resume screening assistant. Return only valid JSON.",
        user_prompt=filled_prompt,
        temperature=0.2,
        max_tokens=ANALYSIS_MAX_TOKENS,
    )
    logger.info(
        "LLM fit analysis response: finish_reason=%s length=%s",
        result.finish_reason,
        len(result.content),
    )
    return parse_llm_json_with_retry(
        result.content,
        parser,
        context_label="JD fit analysis",
        finish_reason=result.finish_reason,
        max_tokens=ANALYSIS_MAX_TOKENS,
        source_prompt=filled_prompt,
    )


# ===========================================================================
# 7. ORCHESTRATOR - the one function a pipeline.py / API route needs to call
# ===========================================================================

def _run_without_jd(resume_result: dict) -> dict:
    present_sections = get_present_resume_sections(resume_result["structured"])
    summary = summarize_resume(
        resume_result["normalized_text"],
        resume_result.get("source_text", ""),
        present_sections,
    )
    analysis_dict = model_to_dict(summary)
    attach_summary_rewrite(resume_result, analysis_dict)
    return {
        "resume": resume_result,
        "jd": None,
        "similarity_score": None,
        "analysis": analysis_dict,
        "analysis_type": "summary",
        "errors": [],
    }


def _run_with_jd(resume_result: dict, jd_text: str) -> dict:
    jd_result = process_jd(jd_text)
    present_sections = get_present_resume_sections(resume_result["structured"])

    similarity_score = compute_similarity(
        resume_result["normalized_text"], jd_result["normalized_text"]
    )

    analysis = analyze_resume_fit(
        resume_result["normalized_text"],
        resume_result.get("source_text", ""),
        jd_result["structured"],
        jd_result["normalized_text"],
        similarity_score,
        present_sections,
    )
    analysis_dict = model_to_dict(analysis)
    analysis_dict["overall_score"] = compute_overall_fit_score(
        similarity_score, analysis.match_score
    )
    attach_summary_rewrite(resume_result, analysis_dict)

    return {
        "resume": resume_result,
        "jd": {
            "structured": model_to_dict(jd_result["structured"]),
            "normalized_text": jd_result["normalized_text"],
        },
        "similarity_score": similarity_score,
        "analysis": analysis_dict,
        "analysis_type": "fit_analysis",
        "errors": [],
    }


def _empty_resume_result() -> dict:
    return {
        "structured": {
            "summary": None,
            "education": [],
            "experience": None,
            "projects": None,
            "skills": None,
            "achievements": None,
        },
        "normalized_text": "",
    }


def run_full_analysis(resume_pdf_path: str, jd_text: str = "") -> dict:
    """
    End-to-end entrypoint.

    - With a JD:    resume + JD -> similarity score + ResumeAnalysis (fit against that JD)
    - Without a JD: resume only -> ResumeSummary (standalone read, no score)

    Returns a dict shaped like FullAnalysisResult, always with a populated
    'analysis' field so the frontend never has to special-case "no JD = nothing":

        {
            "resume": {"structured": {...}, "normalized_text": "..."},
            "jd": {"structured": JobDescription, "normalized_text": "..."} | None,
            "similarity_score": float | None,
            "analysis": {...},              # ResumeSummary or ResumeAnalysis, as a dict
            "analysis_type": "summary" | "fit_analysis",
            "errors": [],
        }
    """
    try:
        resume_result = process_resume(resume_pdf_path)
    except Exception as e:
        return {
            "resume": _empty_resume_result(),
            "jd": None,
            "similarity_score": None,
            "analysis": None,
            "analysis_type": "fit_analysis" if jd_text and jd_text.strip() else "summary",
            "errors": [f"Resume parsing failed for '{resume_pdf_path}': {e}"],
        }

    if not jd_text or not jd_text.strip():
        try:
            return _run_without_jd(resume_result)
        except Exception as exc:
            logger.exception("Resume-only analysis failed")
            return {
                "resume": resume_result,
                "jd": None,
                "similarity_score": None,
                "analysis": None,
                "analysis_type": "summary",
                "errors": [str(exc)],
            }

    try:
        return _run_with_jd(resume_result, jd_text)
    except Exception as exc:
        logger.exception("JD-based resume analysis failed")
        return {
            "resume": resume_result,
            "jd": None,
            "similarity_score": None,
            "analysis": None,
            "analysis_type": "fit_analysis",
            "errors": [str(exc)],
        }
