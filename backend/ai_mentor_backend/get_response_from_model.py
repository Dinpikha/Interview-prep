from backend.ai.local_client import local_client
from backend.ai.prompts import ai_mentor_main_response
from backend.ai.groq_client import groq_client


def model_reply(user_prompt, previous_summary, progress_context=None, web_sources=None):
    system_prompt = ai_mentor_main_response(
        previous_summary=previous_summary,
        progress_context=progress_context,
        web_sources=web_sources,
    )
    response=groq_client(user_prompt=user_prompt,system_prompt=system_prompt)

    return response
