from fastapi import FastAPI
from pydantic import BaseModel
import tempfile,os
from fastapi import UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from backend.ai_mentor_backend.connecting_files_logic import ai_mentor
from Database.db import signup,login,delete_user,user_exists_,create_session,enter_data,get_prev_summary,update_summary,insert_summary
from fastapi import HTTPException
from backend.ai_mentor_backend.get_embeddings import get_embeddings
from backend.ai_mentor_backend.get_summary import get_summary
from backend.resume_analyzer_backend.scoring.score_calculator import analyze_resume
app=FastAPI()

frontend_url="http://localhost:5174/ai-mentor"

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




@app.post("/get_model_response")
def get_model_response(request: PromptRequest):

    # Get previous summary
    try:
        prev_summary = get_prev_summary(request.user_id)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your profile information."
        )

    # Generate user embedding
    try:
        user_embedding = get_embeddings(request.user_prompt)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=503,
            detail="Embedding service is currently unavailable."
        )

    # Save user message
    try:
        enter_data(
            request.session_id,
            request.role,
            request.user_prompt,
            user_embedding
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Unable to save your message."
        )

    # Generate AI response
    try:
        response = ai_mentor(request.user_prompt, prev_summary)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=503,
            detail="MentorAI is currently unavailable. Please try again later."
        )

    # Generate assistant embedding
    try:
        assistant_embedding = get_embeddings(response)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=503,
            detail="Embedding service is currently unavailable."
        )

    # Save assistant response
    try:
        enter_data(
            request.session_id,
            "assistant",
            response,
            assistant_embedding
        )
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Unable to save the conversation."
        )

    # Update user summary
    try:
        user_context = {
            "summary": prev_summary,
            "conversation": {
                "user": request.user_prompt,
                "assistant": response
            },
            "metrics": None,
            "resume": None
        }

        new_summary = get_summary(user_context)

        if prev_summary == "No Data":
            insert_summary(new_summary, user_id=request.user_id)
        else:
            update_summary(new_summary, user_id=request.user_id)

    except Exception as e:
        # Don't fail the chat because memory update failed.
        print("Summary update failed:", e)

    return {
        "success": True,
        "response": response
    }






@app.post("/extract_text")
async def get_extracted_text(pdf: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        contents = await pdf.read()
        temp_file.write(contents)
        temp_path = temp_file.name

    try:
        response= analyze_resume(temp_path)

        return {
            "success": True,
            "response":response
        }

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        os.remove(temp_path)


@app.post('/auth')
def auth_route(request:user_request):
    
        
    try:
        if request.mode == "login":
            user_exists=login(request.username)
            if not user_exists[0]:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )

            return {
                "success": True,
                'user_id':user_exists[1],
                "message":"Login Successful"
            }
        elif request.mode =='signup':
            if user_exists_(request.username):
                raise HTTPException(
                    status_code=409,
                    detail="Username Already Registered "
                )
            
            return {
                "success":True,
                'user_id':signup(request.username),
                
                
            }
        raise HTTPException(
            status_code=400,
            detail='Invalid mode'
        )
    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail="Authentication service is temporarily unavailable."
        )



@app.post("/create_session")
def create_new_session(request: SessionRequest):
    try:
        session_id = create_session(request.user_id)

        return {
            "success": True,
            "session_id": session_id
        }

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Unable to create a new session."
        )
    

@app.post('/delete_user')
def delete_user_route(username:user_request):
    try:
        
        response = delete_user(username.username)
        return {
            "success":True,
            "Response":response
        }
    except Exception as e:
        return {
            "success":False,
            "Response":e
        }
    


@app.post("/return_summary")
def return_summary(userid: SessionRequest):
    try:
        summary = get_prev_summary(userid.user_id)

        if summary == "No Data":
            return {
                "success": True,
                "summary": None
            }

        return {
            "success": True,
            "summary": summary.data[0]["summary"]
        }

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your profile summary."
        )