from dotenv import load_dotenv
load_dotenv()
import os
from supabase import create_client, Client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)



def user_exists_(username: str):
    response = (
        supabase
        .table("users")
        .select("*")
        .eq("username", username)
        .execute()
    )

    return len(response.data) > 0

def signup(username: str):
    """
    Inserts a new user.
    """
    response= (supabase
        .table("users")
        .insert({
            "username": username
        })
        .execute()
    )
    return response.data[0]["user_id"]
def delete_user(user_name:str):
    return(
        supabase
        .table("users")
        .delete()
        .eq("username",user_name)
        .execute()
    )

def login(username:str):
    response=(supabase
        .table("users")
        .select("*")
        .eq("username", username)
        .execute()
    )
    return len(response.data)>0,response.data[0]["user_id"]


def create_session(user_id):
    response=(
        supabase
        .table("sessions")
        .insert({
            "user_id": user_id
        })
        .execute()
    )
    return response.data[0]["session_id"]


def enter_data(session_id, role, content,embeddings):
    return (
        supabase
        .table("messages")
        .insert({
            "session_id": session_id,
            "role": role,
            "content": content,
            "embedding":embeddings
            
        })
        .execute()
    )

def get_prev_summary(user_id:str):
    response=(
        supabase
        .table("user_memory")
        .select("*")
        .eq("user_id",user_id)
        .execute()

    )
    if len(response.data)==0:
        return 'No Data'
    return response


def insert_summary(summary:str,user_id):
    response=(
        supabase
        .table("user_memory")
        .insert({
            "user_id":user_id,
            "summary":summary
        })
        
        .execute()

    )
    
    return response


def update_summary(summary: str, user_id: str):
    response = (
        supabase
        .table("user_memory")
        .update({
            "summary": summary
        })
        .eq("user_id", user_id)
        .execute()
    )

    return response
