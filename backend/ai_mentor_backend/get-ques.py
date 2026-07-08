url="https://codeforces.com/api/problemset.problems"

from fastapi import FastAPI
import requests


app=FastAPI()

# @app.get('/getquestions')
# def get_questions():
  
    
    # # question_id=questions[]
    # return data.keys()

questions=requests.get(url=url)
data=questions.json()
print(data[ "result"]["problems"][0])
question_info=data[ "result"]["problems"][0]
question_contestId=question_info["contestId"]
question_index=question_info['index']
newurl=f"https://codeforces.com/problemset/problem/{question_contestId}/{question_index}"
get_question=requests.get(url=newurl)

# html_info=get_question.json()
print(get_question.text[:500])
print(get_question.status_code)
print(get_question.headers.get("Server"))