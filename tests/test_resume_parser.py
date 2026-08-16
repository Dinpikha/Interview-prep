from pathlib import Path

import fitz

from backend.resume_analyzer_backend.parser.clean_header import normalize_header, normalize_resume_keys
from backend.resume_analyzer_backend.parser.extract_resume import return_santized_structured_json
from backend.resume_analyzer_backend.parser.resume_analyzer_core import get_section_text


def test_header_aliases_normalize_to_canonical_sections():
    aliases = {
        "Profile Summary": "summary",
        "Professional Summary": "summary",
        "Work Experience": "experience",
        "Internships": "experience",
        "Technical Skills": "skills",
        "Technology": "skills",
        "Personal Projects": "projects",
        "Academic Projects": "projects",
        "Awards": "achievements",
        "Honors": "achievements",
        "Certificates": "certifications",
        "Certifications": "certifications",
    }

    for raw_heading, canonical in aliases.items():
        assert normalize_header(raw_heading) == canonical


def test_normalize_resume_keys_recurses_nested_sections():
    raw = {
        "Candidate": {
            "Profile Summary": {"content": "Backend developer"},
            "Personal Projects": {
                "Interview Prep": {"content": "React and FastAPI app"},
            },
            "Technical Skills": {"content": "Python, FastAPI"},
        }
    }

    normalized = normalize_resume_keys(raw)["candidate"]

    assert "summary" in normalized
    assert "projects" in normalized
    assert "skills" in normalized
    assert normalized["projects"]["interview prep"]["content"] == "React and FastAPI app"


def test_get_section_text_preserves_nested_entries():
    resume = {
        "experience": {
            "Backend Intern": {"content": "Built FastAPI APIs"},
            "Software Intern": {"content": "Built React dashboards"},
        }
    }

    text = get_section_text(resume, "experience")

    assert "Backend Intern" in text
    assert "Built FastAPI APIs" in text
    assert "Software Intern" in text
    assert "Built React dashboards" in text


def test_synthetic_pdf_extraction_and_normalization_preserve_sections(tmp_path):
    source = Path("tests/fixtures/sample_resume_source.txt").read_text()
    pdf_path = tmp_path / "sample_resume.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_textbox(fitz.Rect(40, 40, 560, 780), source, fontsize=11)
    doc.save(pdf_path)
    doc.close()

    extracted = return_santized_structured_json(str(pdf_path))
    normalized = normalize_resume_keys(extracted)

    assert "summary" in normalized
    assert "education" in normalized
    assert "experience" in normalized
    assert "projects" in normalized
    assert "skills" in normalized
    assert "achievements" in normalized
    assert "certifications" in normalized
    assert "FastAPI" in get_section_text(normalized, "experience")
    assert "Interview Prep Platform" in get_section_text(normalized, "projects")
