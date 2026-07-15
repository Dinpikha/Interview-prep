from backend.ai.local_client import local_client
from backend.ai.prompts import ai_mentor_main_response
from backend.ai.groq_client import groq_client


def model_reply(user_prompt,previous_summary): 
    system_prompt=ai_mentor_main_response(previous_summary=previous_summary)
    response=groq_client(user_prompt=user_prompt,system_prompt=system_prompt)

    return response


print(model_reply('hi i am dipika ','there is no summary '))
print(type(model_reply('heyy','')))