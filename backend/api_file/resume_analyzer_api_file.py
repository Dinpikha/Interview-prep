import os
from fastapi import HTTPException

from Database.db import (
    get_prev_summary,
    update_summary,
    insert_summary,
)

from backend.ai_mentor_backend.generate_new_summary import generate_new_summary
from backend.resume_analyzer_backend.pipeline import analyze_resume
from backend.resume_analyzer_backend.parser.extract_resume import get_text_and_links

def resume_analyzer_(user_id: str, temp_path: str, job_description=None):
    try:
        if not temp_path:
            raise HTTPException(status_code=400, detail="Resume PDF is required.")

        prev_summary = get_prev_summary(user_id)

        response = analyze_resume(temp_path, job_description)
        resume_content = get_text_and_links(temp_path)
        user_context = {
            "summary": prev_summary,
            "conversation": {
                "user": None,
                "assistant": None,
            },
            "metrics": None,
            "resume": resume_content,
        }

        try:
            new_summary = generate_new_summary(user_context)

            if prev_summary == "No Data":
                insert_summary(new_summary, user_id)
            else:
                update_summary(new_summary, user_id)

        except Exception as e:
            print("Summary update failed:", e)

        return {
            "success": True,
            "response": response,
        }

    except Exception as e:
        print(e)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        if temp_path:
            if os.path.exists(temp_path):
                os.remove(temp_path)
