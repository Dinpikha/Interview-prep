from Database.db import create_session
from fastapi import HTTPException

def create_session_(user_id:str):
    try:
        session_id = create_session(user_id)
        
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