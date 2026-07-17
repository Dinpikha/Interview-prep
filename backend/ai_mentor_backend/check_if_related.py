from backend.ai.local_client import local_client
from backend.ai.prompts import ai_mentor_check_relation
from backend.ai.groq_client import groq_client
import json 

def check_prompt(user_prompt): 
    resp=ai_mentor_check_relation(user_prompt)
    system,user=resp['system'],resp['user']
    response=groq_client(system_prompt=system,user_prompt=user)

    return json.loads(response)


