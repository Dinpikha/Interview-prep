from fastapi import FastAPI
from pydantic import BaseModel
import tempfile,os
from fastapi import UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from backend.ai_mentor_backend.connecting_files_logic import ai_mentor
from backend.resume_analyzer_backend.read_doc import get_text_and_links
app=FastAPI()

frontend_url="http://localhost:5174/ai-mentor"

class promptrequest(BaseModel):
    user_prompt:str


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/get_model_response")
def get_model_response(request:promptrequest):
    response = ai_mentor(request.user_prompt)

    return {
        "response": response
    }


@app.post("/extract_text")
async def get_extracted_text(
    pdf:UploadFile=File(...)
):
    with tempfile.NamedTemporaryFile(delete=False,suffix='.pdf') as temp_file:
        contents=await pdf.read()
        temp_file.write(contents)
        temp_path=temp_file.name

    try:
        links, text = get_text_and_links(temp_path)

        return {
            "links": links,
            "text": text
        }

    finally:
        os.remove(temp_path)


