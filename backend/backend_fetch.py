from fastapi import FastAPI
from pydantic import BaseModel
import tempfile
import json
from fastapi import UploadFile,File,Form
from fastapi.middleware.cors import CORSMiddleware
from backend.api_file.model_response_api_file import ai_mentor_response_
from backend.api_file.resume_analyzer_api_file import resume_analyzer_
from backend.api_file.auth_route_api_file import auth_
from backend.api_file.create_session_api_file import create_session_
from backend.api_file.delete_user_api_file import delete_user_
from backend.api_file.return_summary_api_file import return_saved_summary

app=FastAPI()



class SessionRequest(BaseModel):
    user_id: str

class PromptRequest(BaseModel):
    user_prompt: str
    user_id: str
    session_id: str
    role: str

class user_request(BaseModel):
    username:str
    mode:str

class ai_mentor_chat(BaseModel):
    chat:str
    role:str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/ai_mentor")
def get_model_response(request: PromptRequest):
    response=ai_mentor_response_(request.user_id,request.user_prompt,request.session_id,request.role)
    return response


@app.post("/resume_analyzer")
async def get_extracted_text(pdf: UploadFile = File(...) ,user_id: str = Form(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        contents = await pdf.read()
        temp_file.write(contents)
        temp_path = temp_file.name
    # print("USER ID:", repr(user_id))
    response = resume_analyzer_(
        user_id=user_id,
        temp_path=temp_path
    )

    return response


@app.post('/auth')
def auth_route(request:user_request):
    response=auth_(username=request.username,mode=request.mode)
    return response
    

@app.post("/create_session")
def create_new_session(request: SessionRequest):
    response=create_session_(request.user_id)
    return response

@app.post('/delete_user')
def delete_user_route(username:user_request):
    response=delete_user_(username.username)
    return response

@app.post("/return_summary")
def return_summary(userid: SessionRequest):
    response=return_saved_summary(userid.user_id)
    return response