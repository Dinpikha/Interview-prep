from fastapi import FastAPI, Depends
from pydantic import BaseModel, EmailStr
import tempfile
from fastapi import UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from backend.api_file.model_response_api_file import ai_mentor_response_
from backend.api_file.resume_analyzer_api_file import resume_analyzer_
from backend.api_file.create_session_api_file import create_session_
from backend.api_file.delete_user_api_file import delete_user_
from backend.api_file.return_summary_api_file import return_saved_summary
from backend.api_file.mock_interview_api_file import (
    complete_mock_interview_,
    score_mock_answer_,
    skip_mock_question_,
    start_mock_interview_,
)
from backend.ai.groq_client import groq_transcribe_audio
from backend.api_file import auth_route_api_file as auth
from backend.auth.deps import get_current_user

app = FastAPI()


class SessionRequest(BaseModel):
    user_id: str


class PromptRequest(BaseModel):
    user_prompt: str
    user_id: str
    session_id: str | None = None
    role: str
    web_search: bool = False


class ai_mentor_chat(BaseModel):
    chat: str
    role: str


class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    identifier: str 
    password: str


class GithubCodeRequest(BaseModel):
    code: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class SetPasswordRequest(BaseModel):
    new_password:str 

class DeleteUserRequest(BaseModel):
    username: str


class DashboardRequest(BaseModel):
    user_id: str


class StartMockInterviewRequest(BaseModel):
    user_id: str
    interview_type: str
    difficulty: str | None = None
    role_focus: str | None = None
    question_count: int = 5
    session_id: str | None = None


class ScoreMockAnswerRequest(BaseModel):
    user_id: str
    mock_interview_id: str
    mock_question_id: str
    answer_text: str


class CompleteMockInterviewRequest(BaseModel):
    mock_interview_id: str


class SkipMockQuestionRequest(BaseModel):
    mock_interview_id: str
    mock_question_id: str


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_origin_regex=r"https://interviewprep.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_route():
    return {"status": "ok"}



@app.post("/auth/signup")
def signup_route(request: SignupRequest):
    return auth.signup_local(request.username, request.email, request.password)


@app.post("/auth/login")
def login_route(request: LoginRequest):
    return auth.login_local(request.identifier, request.password)


@app.post("/auth/github")
async def github_login_route(request: GithubCodeRequest):
    return await auth.github_oauth_login(request.code)


@app.post("/auth/refresh")
def refresh_route(request: RefreshRequest):
    return auth.refresh_session(request.refresh_token)


@app.post("/auth/logout")
def logout_route(request: LogoutRequest):
    return auth.logout(request.refresh_token)


@app.post("/auth/forgot-password")
def forgot_password_route(request: ForgotPasswordRequest):
    return auth.forgot_password(request.email)


@app.post("/auth/reset-password")
def reset_password_route(request: ResetPasswordRequest):
    return auth.reset_password(request.token, request.new_password)


@app.post("/auth/change-password")
def change_password_route(
    request: ChangePasswordRequest, user: dict = Depends(get_current_user)
):
    return auth.change_password(user["user_id"], request.current_password, request.new_password)


@app.post("/auth/set-password")
def set_password_route(
    request: SetPasswordRequest, user: dict = Depends(get_current_user)
):
    return auth.set_initial_password(user["user_id"],request.new_password)

@app.get("/auth/me")
def me_route(user: dict = Depends(get_current_user)):
    return {"success": True, "user": user}



@app.post("/ai_mentor")
def get_model_response(request: PromptRequest):
    response = ai_mentor_response_(request.user_id, request.user_prompt, request.session_id, request.role, request.web_search)
    return response


@app.post("/resume_analyzer")
async def get_extracted_text(
    pdf: UploadFile | None = File(None),
    user_id: str = Form(...),
    job_description: str | None = Form(None),
):  
    temp_path=None
    if pdf:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            contents = await pdf.read()
            temp_file.write(contents)
            temp_path = temp_file.name
        
    response = resume_analyzer_(user_id=user_id, temp_path=temp_path, job_description=job_description)
    return response


@app.post("/create_session")
def create_new_session(request: SessionRequest):
    response = create_session_(request.user_id)
    return response


@app.post("/delete_user")
def delete_user_route(request: DeleteUserRequest):
    response = delete_user_(request.username)
    return response


@app.post("/return_summary")
def return_summary(userid: SessionRequest):
    response = return_saved_summary(userid.user_id)
    return response


@app.post("/dashboard")
def dashboard_route(request: DashboardRequest):
    from Database.db import get_dashboard_data

    return get_dashboard_data(request.user_id)


@app.post("/mock_interview/start")
def start_mock_interview_route(request: StartMockInterviewRequest):
    return start_mock_interview_(
        user_id=request.user_id,
        interview_type=request.interview_type,
        difficulty=request.difficulty,
        role_focus=request.role_focus,
        question_count=request.question_count,
        session_id=request.session_id,
    )


@app.post("/mock_interview/answer")
def score_mock_answer_route(request: ScoreMockAnswerRequest):
    return score_mock_answer_(
        user_id=request.user_id,
        mock_interview_id=request.mock_interview_id,
        mock_question_id=request.mock_question_id,
        answer_text=request.answer_text,
    )


@app.post("/mock_interview/complete")
def complete_mock_interview_route(request: CompleteMockInterviewRequest):
    return complete_mock_interview_(request.mock_interview_id)


@app.post("/mock_interview/skip")
def skip_mock_question_route(request: SkipMockQuestionRequest):
    return skip_mock_question_(request.mock_interview_id, request.mock_question_id)


@app.post("/mock_interview/transcribe")
async def transcribe_mock_answer_route(audio: UploadFile = File(...)):
    temp_path = None
    try:
        suffix = f".{audio.filename.split('.')[-1]}" if audio.filename and "." in audio.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            contents = await audio.read()
            temp_file.write(contents)
            temp_path = temp_file.name
        return {"success": True, "text": groq_transcribe_audio(temp_path)}
    finally:
        if temp_path:
            import os
            if os.path.exists(temp_path):
                os.remove(temp_path)
