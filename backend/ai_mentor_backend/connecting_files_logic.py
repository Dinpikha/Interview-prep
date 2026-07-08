from backend.ai_mentor_backend.check_if_related import check_prompt
from backend.ai_mentor_backend.get_response_from_model import model_reply

def ai_mentor(user_prompt):
    is_it_related=check_prompt(user_prompt)


    is_allowed=is_it_related["allowed"]
    intent=is_it_related["intent"]
    is_context_required=is_it_related["requires_context"]
    if is_allowed:
        response=model_reply(user_prompt)

    else:
        response=is_it_related["message"]

    return response
    