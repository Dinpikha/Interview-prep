from backend.ai_mentor_backend.check_if_related import check_prompt
from backend.ai_mentor_backend.get_response_from_model import model_reply

def ai_mentor(user_prompt,user_summary):
    is_it_related=(check_prompt(user_prompt))["assistant_response"]


    is_allowed=is_it_related["allowed"]
    if is_allowed:
        response=(model_reply(user_prompt,user_summary))["assistant_response"]

    else:
        response=is_it_related["message"]

    return response
    