
from backend.ai_mentor_backend.connecting_files_logic import ai_mentor
from Database.db import enter_data,get_prev_summary,update_summary,insert_summary
from fastapi import HTTPException
from backend.ai_mentor_backend.get_embeddings import get_embeddings
from backend.ai_mentor_backend.generate_new_summary import generate_new_summary




def ai_mentor_response_(user_id:str
                        ,user_prompt:str
                        ,session_id:str
                        ,role:str):
       
    try:
        prev_summary = get_prev_summary(user_id)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your profile information."
        )

    # Generate user embedding
    try:
        user_embedding = get_embeddings(user_prompt)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=503,
            detail="Embedding service is currently unavailable."
        )

    # Save user message
    try:
        enter_data(
            session_id,
            role,
            user_prompt,
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
        response = ai_mentor(user_prompt, prev_summary)
        # print(response)
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
            session_id,
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
                "user": user_prompt,
                "assistant": response
            },
            "metrics": None,
            "resume": None
        }

        new_summary = generate_new_summary(user_context)

        if prev_summary == "No Data":
            insert_summary(new_summary, user_id=user_id)
        else:
            update_summary(new_summary, user_id=user_id)

    except Exception as e:
        # Don't fail the chat because memory update failed.
        print("Summary update failed:", e)

    return {
        "success": True,
        "response": response
    }
