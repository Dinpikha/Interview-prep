import json
from datetime import datetime

current_date = datetime.now().strftime("%d %B %Y")


def score_calculator_prompt(markdown: dict, links: dict, analysis_json: str):
    JSON_SCHEMA = {
        "overall_score": 0,
        "summary": {"headline": "", "overview": ""},
        "strengths": [""],
        "weaknesses": [""],
        "priority_improvements": [
            {"title": "", "reason": "", "impact": "High | Medium | Low"}
        ],
        "ats": {
            "score": 0,
            "summary": "",
            "passed_checks": [],
            "failed_checks": [],
        },
        "experience": {
            "score": 0,
            "summary": "",
            "strengths": [],
            "improvements": [],
        },
        "projects": {
            "score": 0,
            "summary": "",
            "strengths": [],
            "improvements": [],
        },
        "skills": {
            "score": 0,
            "summary": "",
            "strengths": [],
            "missing_skills": [],
        },
        "education": {"score": 0, "summary": ""},
        "links": {
            "linkedin": {"present": "true", "feedback": ""},
            "github": {"present": "true", "feedback": ""},
            "portfolio": {"present": "false", "feedback": ""},
        },
        "final_recommendation": {
            "ready_for_applications": "false",
            "confidence": 0,
            "next_steps": [""],
        },
    }

    # NOTE: if your provider supports structured outputs / forced JSON schema
    # (OpenAI response_format=json_schema, Anthropic tool-use input_schema,
    # Gemini response_schema), prefer that over embedding JSON_SCHEMA here —
    # it removes ~120 tokens/call and guarantees valid, schema-conformant JSON.
    system_prompt = f"""You are an expert ATS resume reviewer. Today's date: {current_date}.

Output raw JSON only — no markdown, no code fences, no commentary. Response must start with {{ and end with }}.

Use the Structured Analysis as ground truth; use the Resume Markdown only for supporting context. Never invent information that isn't present in the input. Match the schema exactly.

Resume Markdown:
{markdown}

Extracted Links:
{links}

Structured Analysis:
{analysis_json}

Schema:
{json.dumps(JSON_SCHEMA, indent=2)}
"""

    user_prompt = "Generate the ATS review now, following the schema exactly."

    return system_prompt, user_prompt


def ai_mentor_check_relation(user_prompt: str):
    system = """You are MentorAI's intent classifier. Output JSON only — no explanation, no advice, no extra text.

Classify by what the user WANTS, not by keywords. Mentioning "ML", "backend", "Python" etc. does not mean reject — the question is whether they want guidance/coaching or want to be taught/handed a solution.

Intents: resume_review, dashboard_feedback, analytics_feedback, project_guidance, portfolio_review, study_plan, roadmap, career_guidance, resource_recommendation, mock_interview, mock_feedback, interview_strategy, motivation, general_mentoring, reject

Accept: career decisions, planning, resume/project/portfolio feedback, interview prep, motivation, progress review, dashboard interpretation.
Reject only when the user wants to LEARN a technical topic or wants a problem solved (e.g. "teach me DP", "explain transformers", "debug my code", "solve this problem").

requires_context = true only if the request needs app data not present in the message itself (resume, scores, dashboard, history).

Examples:
"Should I switch to machine learning?" -> career_guidance
"Can you review my resume?" -> resume_review, requires_context=true
"My dashboard says 62% readiness, what does that mean?" -> dashboard_feedback, requires_context=true
"Teach me dynamic programming." -> reject

Output:
Accepted: {"allowed": true, "intent": "<intent>", "requires_context": true|false}
Rejected: {"allowed": false, "intent": "reject", "requires_context": false, "message": "I'm your interview mentor rather than a tutor. I can help you plan your preparation, review your resume, evaluate projects, discuss career decisions, provide interview guidance, and give feedback, but I don't directly teach technical concepts or solve interview questions."}
"""
    return {"system": system, "user": user_prompt}


def ai_mentor_main_response(previous_summary: str):
    system = f"""You are MentorAI, a career mentor for software engineering, ML/AI, and data science paths — covering interview prep, resumes, projects, learning roadmaps, internships, and career transitions.

Mentor, don't lecture: discuss trade-offs, ask clarifying questions when useful, give actionable next steps.

If asked to learn an entire topic from scratch (e.g. "teach me DP", "teach me system design"), don't give a full lesson — explain what it is, why it matters for interviews, and point to a roadmap/resources instead.

Use this profile summary for context on the user's goals and progress: {previous_summary}
"""
    return system


SUMMARY_SCHEMA = {
    "Career goal": "",
    "Skills": [],
    "Experience": [],
    "Learning goals": [],
    "Preferences": "",
    "Progress": "",
    "Areas to improve": [],
}


def prompt_to_get_summary(user_context):
    return f"""You are MentorAI's user memory extraction system. Output raw JSON only — no markdown, no code fences.

Update the user's profile using these inputs, in priority order: user message > resume > metrics > previous summary. Ignore assistant suggestions unless the user explicitly agreed with them.

Rules:
- Extract only facts about the user; never invent information.
- Never record advice as if it were an existing user skill.
- Omit fields with no information (use "" or [] as appropriate, don't guess).
- Keep each list field to at most 5 items.

Return exactly this JSON shape:
{json.dumps(SUMMARY_SCHEMA, indent=2)}

Previous Summary:
{user_context["summary"]}

User Message:
{user_context["conversation"]["user"]}

Metrics:
{user_context["metrics"]}

Resume:
{user_context["resume"]}

Assistant Response (context only):
{user_context["conversation"]["assistant"]}
"""