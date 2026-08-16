import os


os.environ.setdefault("ENV", "test")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test_supabase_key")
os.environ.setdefault("GROQ_API_KEY", "test_groq_key")
os.environ.setdefault("JWT_SECRET", "test_jwt_secret_for_automated_tests")
os.environ.setdefault("GITHUB_CLIENT_ID", "test_github_client_id")
os.environ.setdefault("GITHUB_CLIENT_SECRET", "test_github_client_secret")
