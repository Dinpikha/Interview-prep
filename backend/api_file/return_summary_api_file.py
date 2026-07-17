from fastapi import HTTPException
from Database.db import get_prev_summary
import json 

def return_saved_summary(user_id:str):
    try:
        summary = get_prev_summary(user_id)

        if summary == "No Data":
            return {
                "success": True,
                "summary": None
            }
        data= summary.data[0]["summary"]
        return {
            "success": True,
            "summary":json.loads(data)
        }

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve your profile summary."
        )
    