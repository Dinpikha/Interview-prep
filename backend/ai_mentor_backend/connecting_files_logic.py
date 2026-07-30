from backend.ai_mentor_backend.check_if_related import check_prompt
from backend.ai_mentor_backend.get_response_from_model import model_reply
from backend.ai_mentor_backend.web_search import should_search, tavily_search
from Database.db import get_progress_context

def _needs_progress_context(classification, user_prompt):
    prompt = (user_prompt or "").lower()
    progress_markers = ["progress", "how am i doing", "dashboard", "score", "scores", "improve", "trend"]
    return classification.get("requires_context") or any(marker in prompt for marker in progress_markers)


def ai_mentor(user_prompt, user_summary, user_id=None, web_search_enabled=False):
    is_it_related=(check_prompt(user_prompt))
    is_allowed=is_it_related["allowed"]
    sources = []
    progress_context = None

    search_needed = should_search(user_prompt, web_search_enabled)

    if is_allowed or search_needed:
        if user_id and _needs_progress_context(is_it_related, user_prompt):
            progress_context = get_progress_context(user_id)

        if search_needed:
            try:
                sources = tavily_search(user_prompt)
            except Exception as e:
                print("Web search failed:", e)
                sources = []

        response=(model_reply(
            user_prompt=user_prompt,
            previous_summary=user_summary,
            progress_context=progress_context,
            web_sources=sources,
        ))

    else:
        response=is_it_related["message"]

    return {"response": response, "sources": sources}
# print(ai_mentor('help me prepare to become a software engineer  ','no summary'))
