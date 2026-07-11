
from backend.resume_analyzer_backend.parser.extract_sections import extract_resume_sections
from backend.resume_analyzer_backend.parser.extract_resume import get_text_and_links




import re

ACTION_VERBS = {
    "built", "developed", "implemented", "designed", "created",
    "optimized", "led", "managed", "improved", "engineered",
    "integrated", "collaborated", "automated", "deployed"
}


def check_experience_exists(experience):
    """
    Checks whether an experience section exists.
    """
    if not experience["entries"]:
        return {
            "score": 0,
            "issues": ["No experience section found."],
            "suggestions": ["Add internships, jobs or freelance experience."]
        }

    return {
        "score": 100,
        "issues": [],
        "suggestions": []
    }


def count_experience_entries(experience):
    """
    Returns the number of experience entries.
    """
    return len(experience["entries"])


def count_bullet_points(experience):
    """
    Counts bullet points across all experiences.
    """
    total = 0

    for entry in experience["entries"]:
        for line in entry["content"]:
            if line.strip().startswith("-"):
                total += 1

    return total


def extract_dates(experience):
    """
    Returns all detected employment dates.
    """

    pattern = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}.*?(Present|Current|[A-Za-z]{3,9}\s+\d{4})|\d{4}\s*[-–]\s*(Present|Current|\d{4})"

    dates = []

    for entry in experience["entries"]:
        for line in entry["content"]:
            if re.search(pattern, line, re.IGNORECASE):
                dates.append(line)

    return dates


def check_action_verbs(experience):
    """
    Counts bullets starting with strong action verbs.
    """

    strong = 0
    weak = []

    for entry in experience["entries"]:

        for line in entry["content"]:

            if not line.startswith("-"):
                continue

            words = re.findall(r"[A-Za-z]+", line.lower())

            if not words:
                continue

            first_word = words[0]

            if first_word in ACTION_VERBS:
                strong += 1
            else:
                weak.append(line)

    return {
        "strong_action_verbs": strong,
        "weak_bullets": weak
    }


def check_quantified_impact(experience):
    """
    Detects bullets containing measurable impact.
    """

    quantified = []
    missing = []

    pattern = r"\d+|%|\$|x\b|million|thousand"

    for entry in experience["entries"]:

        for line in entry["content"]:

            if not line.startswith("-"):
                continue

            if re.search(pattern, line, re.IGNORECASE):
                quantified.append(line)
            else:
                missing.append(line)

    return {
        "quantified": quantified,
        "missing_numbers": missing
    }




def analyze_experience(link):
    links,markdown=get_text_and_links(link)
    sections=extract_resume_sections(markdown,links)
    experience=sections['experience']
    analysis_json={
        "experience_exists": check_experience_exists(experience),
        "experience_entries": count_experience_entries(experience),
        "bullet_points": count_bullet_points(experience),
        "dates": extract_dates(experience),
        "action_verbs": check_action_verbs(experience),
        "quantified_impact": check_quantified_impact(experience)

    }
        
    return links,markdown,analysis_json
