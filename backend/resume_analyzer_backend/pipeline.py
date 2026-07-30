"""
pipeline.py

Thin entry-point that wires together resume_analyzer_core.
Run this file directly to test the full resume <-> JD pipeline end to end.
"""

from backend.resume_analyzer_backend.parser.resume_analyzer_core import run_full_analysis


def analyze_resume(resume_path: str, jd_text: str):
    """Wrapper around run_full_analysis — call this from a route, script, or test."""
    result = run_full_analysis(resume_path, jd_text)
    return result


if __name__ == "__main__":
    RESUME_PATH = "/home/Dipika/Downloads/Core_resume.pdf"
    JD_TEXT = """
    We are looking for a Machine Learning Engineer with 2+ years of experience.
    Required skills: Python, SQL, XGBoost, FastAPI, LangGraph.
    Responsibilities: Build and deploy ML pipelines, collaborate with cross-functional teams.
    Qualifications: Bachelor's degree in Computer Science, Electronics, or a related field.
    """

    result = analyze_resume(RESUME_PATH, JD_TEXT)

    print("=" * 60)
    print(f"Similarity score: {result['similarity_score']:.2f}")
    print("=" * 60)
    print(result["analysis"])