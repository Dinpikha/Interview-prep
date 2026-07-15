
from Database.db import delete_user


def delete_user_(username):
    try:
        
        response = delete_user(username)
        return {
            "success":True,
            "Response":response
        }
    except Exception as e:
        return {
            "success":False,
            "Response":e
        }
    
