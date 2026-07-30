from pydantic import BaseModel, Field
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from typing import List, Optional
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re 
from backend.ai.groq_client import groq_client
from backend.resume_analyzer_backend.parser.extract_resume import return_santized_structured_json
from backend.resume_analyzer_backend.parser.clean_header import normalize_resume_keys


# ---------------------------------------------------------------------------
# Embedding model (loaded once, reused across calls)
# ---------------------------------------------------------------------------

_embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class Education(BaseModel):
    institution: str
    location: Optional[str] = None
    degree: str
    duration: str


class Project(BaseModel):
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    impact: Optional[str] = None


class SkillSet(BaseModel):
    category: str
    skills: List[str]


class Achievement(BaseModel):
    title: str
    year: Optional[str] = None


class ProjectList(BaseModel):
    projects: List[Project]


class SkillList(BaseModel):
    skill_sets: List[SkillSet]


class AchievementList(BaseModel):
    achievements: List[Achievement]


class JobDescription(BaseModel):
    title: str
    required_skills: List[str]
    responsibilities: List[str]
    qualifications: List[str]
    experience_level: Optional[str] = None


class ResumeAnalysis(BaseModel):
    match_score: int = Field(description="Overall fit score out of 100")
    matching_skills: List[str] = Field(description="Skills from the resume that align with the JD")
    missing_skills: List[str] = Field(description="Required JD skills not found in the resume")
    strengths: List[str] = Field(description="Specific strengths of this candidate for this role")
    weaknesses: List[str] = Field(description="Gaps or concerns relative to the JD")
    experience_relevance: str = Field(description="Brief assessment of how relevant the candidate's experience/projects are")
    recommendation: str = Field(description="One of: Strong Fit, Moderate Fit, Weak Fit")
    improvement_suggestions: List[str] = Field(description="Concrete suggestions to improve resume for this JD")


# ---------------------------------------------------------------------------
# Generic LLM structuring helper
# ---------------------------------------------------------------------------

def structure_section(content: str, parser: PydanticOutputParser, section_name: str):
    prompt_template = PromptTemplate(
        template=(
            "Extract structured data from this resume section titled '{section_name}'.\n"
            "{format_instructions}\n\n"
            "Content:\n{content}"
        ),
        input_variables=["content", "section_name"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    filled_prompt = prompt_template.format(content=content, section_name=section_name)
    raw_response = groq_client(
        system_prompt="You are a resume parsing assistant. Return only valid JSON, with no markdown formatting, no code fences, and no explanation text.",
        user_prompt=filled_prompt,
    )

    # Strip markdown code fences if present
    cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw_response.strip())

    try:
        return parser.parse(cleaned)
    except Exception as e:
        print("---- RAW LLM OUTPUT THAT FAILED TO PARSE ----")
        print(raw_response)
        print("----------------------------------------------")
        raise



# ---------------------------------------------------------------------------
# Resume-side helpers
# ---------------------------------------------------------------------------

def get_section_text(resume: dict, section_name: str) -> str:
    """Handles both flat ({'content': ...}) and multi-entry (nested title -> content) sections."""
    section = resume.get(section_name)
    if not section:
        return ""
    if "content" in section:
        return section["content"]
    parts = []
    for entry_title, entry_data in section.items():
        if isinstance(entry_data, dict) and "content" in entry_data:
            parts.append(f"{entry_title}\n{entry_data['content']}")
    return "\n\n".join(parts)


def load_and_normalize_resume(pdf_path: str) -> dict:
    """Extract, unwrap the name key, and normalize section headers for a resume PDF."""
    resume_data = return_santized_structured_json(pdf_path)
    name_key = next(k for k in resume_data if k != "content")
    return normalize_resume_keys(resume_data[name_key])


def structure_resume(resume: dict) -> dict:
    """Run each section through the LLM structurer. Returns a dict of Pydantic objects (or None)."""
    education_content = get_section_text(resume, "education")
    projects_content = get_section_text(resume, "projects")
    skills_content = get_section_text(resume, "skills")
    achievements_content = get_section_text(resume, "achievements")

    return {
        "education": structure_section(
            education_content, PydanticOutputParser(pydantic_object=Education), "Education"
        ) if education_content else None,
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
    """Flatten structured resume objects into one clean text block for embedding."""
    education = structured.get("education")
    projects = structured.get("projects")
    skills = structured.get("skills")
    achievements = structured.get("achievements")

    parts = []

    if education:
        parts.append(f"Education: {education.degree} from {education.institution} ({education.duration})")

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
    Returns {"structured": {...pydantic objects...}, "normalized_text": "..."}.
    """
    resume = load_and_normalize_resume(pdf_path)
    structured = structure_resume(resume)
    normalized_text = build_resume_normalized_text(structured)
    return {"structured": structured, "normalized_text": normalized_text}


# ---------------------------------------------------------------------------
# JD-side helpers
# ---------------------------------------------------------------------------

def structure_jd(jd_text: str) -> JobDescription:
    jd_parser = PydanticOutputParser(pydantic_object=JobDescription)
    return structure_section(jd_text, jd_parser, "Job Description")


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
    structured = structure_jd(jd_text)
    normalized_text = build_jd_normalized_text(structured)
    return {"structured": structured, "normalized_text": normalized_text}


# ---------------------------------------------------------------------------
# Embedding + similarity
# ---------------------------------------------------------------------------

def get_embedding(text: str):
    return _embedding_model.encode(text)


def compute_similarity(resume_text: str, jd_text: str) -> float:
    resume_embedding = get_embedding(resume_text)
    jd_embedding = get_embedding(jd_text)
    return float(cosine_similarity([resume_embedding], [jd_embedding])[0][0])


# ---------------------------------------------------------------------------
# Final LLM analysis (explainable score + strengths/weaknesses)
# ---------------------------------------------------------------------------

def analyze_resume_fit(resume_normalized_text: str, jd_normalized_text: str, similarity_score: float) -> ResumeAnalysis:
    parser = PydanticOutputParser(pydantic_object=ResumeAnalysis)

    prompt_template = PromptTemplate(
        template=(
            "You are an expert ATS resume analyst. Compare the candidate's resume against "
            "the job description and produce a detailed, honest fit analysis.\n\n"
            "A vector similarity score between the two has already been computed: {similarity_score:.2f} "
            "(0 = no overlap, 1 = perfect semantic overlap). Use this as one signal, not the sole basis "
            "for your score - weigh actual skill/experience alignment more heavily.\n\n"
            "{format_instructions}\n\n"
            "RESUME:\n{resume_text}\n\n"
            "JOB DESCRIPTION:\n{jd_text}"
        ),
        input_variables=["resume_text", "jd_text", "similarity_score"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    filled_prompt = prompt_template.format(
        resume_text=resume_normalized_text,
        jd_text=jd_normalized_text,
        similarity_score=similarity_score,
    )

    raw_response = groq_client(
        system_prompt="You are a fair, detail-oriented resume screening assistant. Return only valid JSON.",
        user_prompt=filled_prompt,
    )

    return parser.parse(raw_response)


# ---------------------------------------------------------------------------
# Top-level orchestrator - the one function a pipeline.py needs to call
# ---------------------------------------------------------------------------

def run_full_analysis(resume_pdf_path: str, jd_text: str = "") -> dict:
    """
    End-to-end: resume PDF + JD text -> similarity score + full LLM analysis.

    Returns:
        {
            "resume": {"structured": {...}, "normalized_text": "..."},
            "jd": {"structured": JobDescription, "normalized_text": "..."},
            "similarity_score": float,
            "analysis": ResumeAnalysis,
        }
    """
    resume_result = process_resume(resume_pdf_path)

    if not jd_text or not jd_text.strip():
        return{
            "resume": resume_result,
            "jd": None,
            "similarity_score": None,
            "analysis": None,
        }
    jd_result = process_jd(jd_text)

    similarity_score = compute_similarity(
        resume_result["normalized_text"], jd_result["normalized_text"]
    )

    analysis = analyze_resume_fit(
        resume_result["normalized_text"], jd_result["normalized_text"], similarity_score
    )

    return {
        "resume": resume_result,
        "jd": jd_result,
        "similarity_score": similarity_score,
        "analysis": analysis,
    }
