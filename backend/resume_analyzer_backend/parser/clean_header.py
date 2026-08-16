HEADER_ALIASES = {
    "education": [
        "education", "academic background", "academics", "qualification",
        "qualifications", "academic qualifications", "education details",
    ],
    "experience": [
        "experience", "work experience", "employment", "professional experience",
        "work history", "internships", "internship experience", "industry experience",
        "professional background",
    ],
    "skills": [
        "skills", "technical skills", "core competencies", "tech stack",
        "technology", "technologies", "tools and technologies", "technical expertise",
        "programming skills",
    ],
    "projects": [
        "projects", "personal projects", "academic projects", "project experience",
        "selected projects", "key projects",
    ],
    "achievements": [
        "achievements", "awards", "honors", "awards and honors",
        "accomplishments", "recognition",
    ],
    "summary": [
        "summary", "professional summary", "profile summary", "career summary",
        "profile", "objective", "career objective", "about", "about me",
    ],
    "certifications": [
        "certifications", "certificates", "licenses", "courses",
        "certifications and courses", "training",
    ],
    "extracurricular": ["extracurricular", "leadership", "activities", "volunteering"],
}



def normalize_header(raw_header: str) -> str:
    cleaned = raw_header.strip().lower()
    for canonical, aliases in HEADER_ALIASES.items():
        if cleaned in aliases or any(alias in cleaned for alias in aliases):
            return canonical
    return cleaned 


def normalize_resume_keys(data: dict) -> dict:
    """Recursively walk the resume dict and normalize every section header key."""
    normalized = {}
    for key, value in data.items():

        if key == "content":
            normalized[key] = value
            continue

        new_key = normalize_header(key)

        if isinstance(value, dict):
            normalized[new_key] = normalize_resume_keys(value)
        else:
            normalized[new_key] = value

    return normalized
