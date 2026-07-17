"""
Minimal GitHub OAuth "Authorization Code" flow client.

Flow:
  1. Frontend sends the user to
     https://github.com/login/oauth/authorize?client_id=...&scope=read:user user:email
  2. GitHub redirects back to GITHUB_REDIRECT_URI with ?code=...
  3. Frontend POSTs that code to our /auth/github endpoint
  4. We exchange the code for a GitHub access token (server-to-server,
     needs the client secret, so this MUST happen on the backend)
  5. We use that token to fetch the GitHub profile + primary email
"""
import os
import httpx

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI", "http://localhost:5173/auth/github/callback"
)


async def exchange_code_for_token(code: str) -> str:
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise ValueError(
            "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET are not set on the backend .env"
        )

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    if "access_token" not in data:
        raise ValueError(data.get("error_description", "GitHub OAuth exchange failed"))
    return data["access_token"]


async def fetch_github_profile(github_access_token: str) -> dict:
    headers = {
        "Authorization": f"Bearer {github_access_token}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        user_resp = await client.get("https://api.github.com/user", headers=headers)
        user_resp.raise_for_status()
        profile = user_resp.json()

        email = profile.get("email")
        if not email:
            # Private-by-default emails need this extra call.
            emails_resp = await client.get(
                "https://api.github.com/user/emails", headers=headers
            )
            if emails_resp.status_code == 200:
                emails = emails_resp.json()
                primary = next((e for e in emails if e.get("primary")), None)
                if primary:
                    email = primary["email"]
                elif emails:
                    email = emails[0]["email"]

    return {
        "provider_user_id": str(profile["id"]),
        "username": profile.get("login"),
        "email": email,
        "avatar_url": profile.get("avatar_url"),
    }
