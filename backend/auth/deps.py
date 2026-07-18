"""
Drop `Depends(get_current_user)` onto any route that should require login,
e.g.:

    @app.post("/ai_mentor")
    def get_model_response(request: PromptRequest, user=Depends(get_current_user)):
        ...

`user` will be `{"user_id": ..., "username": ...}` decoded straight out of
the access token — no extra DB hit needed for the common case.
"""
from fastapi import Header, HTTPException
from backend.auth.security import decode_access_token


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")

    return {"user_id": payload["sub"], "username": payload["username"]}


async def get_optional_user(authorization: str | None = Header(default=None)) -> dict | None:

    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    try:
        payload = decode_access_token(authorization.split(" ", 1)[1].strip())
        return {"user_id": payload["sub"], "username": payload["username"]}
    except ValueError:
        return None
