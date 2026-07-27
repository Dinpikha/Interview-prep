from backend.resume_analyzer_backend.checks.ats_checks import analyze_experience
from backend.ai.groq_client import groq_client
from backend.ai.prompts import score_calculator_prompt
from backend.ai.local_client import local_client
import json 
from pprint import pprint
def analyze_resume(link,resume_text,job_description,role):
  if resume_text!=None:

    links,markdown,analysis_json=analyze_experience(link)
  system_prompt,user_prompt=score_calculator_prompt(markdown=None,links=None,analysis_json=None,resume_text=resume_text,job_description=job_description,role=role)
  response=groq_client(user_prompt=user_prompt,system_prompt=system_prompt)

  return json.loads(response)
