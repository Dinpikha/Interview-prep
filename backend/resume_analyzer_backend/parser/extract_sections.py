from __future__ import annotations
import re
from typing import Any

SECTION_ALIASES = {
    "summary": "summary",
    "professional summary": "summary",
    "objective": "summary",

    "education": "education",

    "work experience": "experience",
    "experience": "experience",
    "professional experience": "experience",

    "projects": "projects",
    "skills": "skills",

    "certifications": "certifications",
    "achievements": "achievements",
    "languages": "languages",
    "contact": "contact",
}


def _heading_level(line: str) -> int:
    """
    Returns markdown heading level.

    '# Title'      -> 1
    '## Summary'   -> 2
    '### Project'  -> 3
    """

    match = re.match(r"^(#+)\s+", line)

    if not match:
        return 0
    
    return len(match.group(1))


def _heading_text(line: str) -> str:
    """
    Removes markdown heading syntax.
    """

    return re.sub(r"^#+\s*", "", line).strip().strip("*")


def _normalize_section(name: str) -> str:
    """
    Converts heading names into standardized keys.
    """

    key = name.lower().strip()

    return SECTION_ALIASES.get(key, key.replace(" ", "_"))


def extract_resume_sections(
    markdown: str,
    links: Any = None,
) -> dict:
    """
    Convert markdown resume into structured sections.
    """

    result = {
        "title": None
    }

    current_section = None
    current_entry = None

    for raw_line in markdown.splitlines():

        line = raw_line.strip()

        if not line:
            continue

        level = _heading_level(line)

        # -------------------------
        # Resume Title
        # -------------------------
        if level == 1:
            result["title"] = _heading_text(line)
            continue

        # -------------------------
        # Major Section
        # -------------------------
        if level == 2:

            section_name = _normalize_section(
                _heading_text(line)
            )

            result[section_name] = {
                "content": [],
                "entries": []
            }

            current_section = result[section_name]
            current_entry = None

            continue

        # -------------------------
        # Entry inside section
        # -------------------------
        if level >= 3:

            if current_section is None:
                continue

            current_entry = {
                "title": _heading_text(line),
                "content": []
            }

            current_section["entries"].append(current_entry)

            continue

        # -------------------------
        # Normal text
        # -------------------------

        if current_entry is not None:
            current_entry["content"].append(line)

        elif current_section is not None:
            current_section["content"].append(line)

    if links is not None:
        result["links"] = links
    
    return result


