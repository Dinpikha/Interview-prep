from pydantic import BaseModel,Field
from langchain_core.output_parsers import PydanticOutputParser
from backend.ai.groq_client import groq_client
from typing import List
from langchain_core.prompts import PromptTemplate


class ResumeAnalysis(BaseModel):
    match_score: int = Field(description="Overall fit score out of 100")
    matching_skills: List[str] = Field(description="Skills from the resume that align with the JD")
    missing_skills: List[str] = Field(description="Required JD skills not found in the resume")
    strengths: List[str] = Field(description="Specific strengths of this candidate for this role")
    weaknesses: List[str] = Field(description="Gaps or concerns relative to the JD")
    experience_relevance: str = Field(description="Brief assessment of how relevant the candidate's experience/projects are")
    recommendation: str = Field(description="One of: Strong Fit, Moderate Fit, Weak Fit")
    improvement_suggestions: List[str] = Field(description="Concrete suggestions to improve resume for this JD")



def analyze_resume_fit(resume_normalized_text, jd_normalized_text, similarity_score):
    parser = PydanticOutputParser(pydantic_object=ResumeAnalysis)

    prompt_template = PromptTemplate(
        template=(
            "You are an expert ATS resume analyst. Compare the candidate's resume against "
            "the job description and produce a detailed, honest fit analysis.\n\n"
            "A vector similarity score between the two has already been computed: {similarity_score:.2f} "
            "(0 = no overlap, 1 = perfect semantic overlap). Use this as one signal, not the sole basis "
            "for your score — weigh actual skill/experience alignment more heavily.\n\n"
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
        user_prompt=filled_prompt
    )

    return parser.parse(raw_response)