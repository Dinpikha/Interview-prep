
from Database.db import signup,login,user_exists_
from fastapi import HTTPException



def auth_(username:str
         ,mode:str):
        
    try:
        if mode == "login":
            user_exists=login(username)
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
        elif mode =='signup':
            if user_exists_(username):
                raise HTTPException(
                    status_code=409,
                    detail="Username Already Registered "
                )
            
            return {
                "success":True,
                'user_id':signup(username),
                
                
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