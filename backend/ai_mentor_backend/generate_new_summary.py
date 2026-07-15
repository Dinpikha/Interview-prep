from backend.ai.local_client import local_client
from backend.ai.prompts import prompt_to_get_summary
from backend.ai.groq_client import groq_client


def generate_new_summary(user_context):
    system_prompt=prompt_to_get_summary(user_context=user_context)
    response=groq_client(system_prompt=system_prompt,user_prompt="")
    return response
