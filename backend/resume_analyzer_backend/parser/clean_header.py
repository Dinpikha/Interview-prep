HEADER_ALIASES = {
    "education": ["education", "academic background", "academics", "qualification"],
    "experience": ["experience", "work experience", "employment", "professional experience", "work history"],
    "skills": ["skills", "technical skills", "core competencies", "tech stack"],
    "projects": ["projects", "personal projects", "academic projects"],
    "achievements": ["achievements", "awards", "honors"],
    "summary": ["summary", "profile", "objective", "about"],
    "certifications": ["certifications", "licenses", "courses"],
    "extracurricular": ["extracurricular", "leadership", "activities"],
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
        # skip the top-level contact info block, keep it as-is
        if key == "content":
            normalized[key] = value
            continue

        new_key = normalize_header(key)  # apply your existing string-based function here

        if isinstance(value, dict):
            normalized[new_key] = normalize_resume_keys(value)  # recurse into nested dicts
        else:
            normalized[new_key] = value

    return normalized

