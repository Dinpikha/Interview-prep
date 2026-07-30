import os
import requests

try:
    from dotenv import load_dotenv

    load_dotenv()
except ModuleNotFoundError:
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as env_file:
            for line in env_file:
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                key, value = stripped.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _redact_key(key: str):
    if not key:
        return "missing"
    key = key.strip().strip('"').strip("'")
    if len(key) <= 12:
        return f"{key[:4]}..."
    return f"{key[:8]}...{key[-4:]}"


def should_search(user_prompt: str, web_search_enabled: bool = False) -> bool:
    prompt = (user_prompt or "").lower()
    current_markers = [
        "latest",
        "current",
        "today",
        "recent",
        "2025",
        "2026",
        "source",
        "resources",
        "links",
        "learn",
        "explain",
        "roadmap",
        "where can i learn",
        "best",
    ]
    return web_search_enabled or any(marker in prompt for marker in current_markers)


def tavily_search(query: str, max_results: int = 4):
    raw_key = os.getenv("TAVILY_API_KEY")
    api_key = raw_key.strip().strip('"').strip("'") if raw_key else ""
    if not api_key:
        print("[Tavily] TAVILY_API_KEY is not set. Restart backend after adding it to .env.")
        return []
    if not api_key.startswith("tvly-"):
        print(f"[Tavily] TAVILY_API_KEY has unexpected format: {_redact_key(api_key)}")
        return []

    print(f"[Tavily] Searching web. key={_redact_key(api_key)} query={query!r}")

    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "search_depth": "basic",
                "max_results": max_results,
                "include_answer": False,
            },
            timeout=12,
        )
    except requests.RequestException as e:
        print(f"[Tavily] Request failed before response: {type(e).__name__}: {e}")
        raise

    if not response.ok:
        print(f"[Tavily] Search failed status={response.status_code} body={response.text[:1000]}")
        if response.status_code in (402, 429):
            print("[Tavily] Usage cap or rate limit likely reached for this key.")
        response.raise_for_status()

    data = response.json()

    sources = []
    for item in data.get("results", []):
        url = item.get("url")
        title = item.get("title") or url
        if url:
            sources.append({
                "title": title,
                "url": url,
                "snippet": item.get("content", ""),
            })
    print(f"[Tavily] Search succeeded. results={len(sources)}")
    return sources
