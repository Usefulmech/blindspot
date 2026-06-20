"""
Resolve the authenticated user ID from an Authorization header.

If a valid Supabase Bearer token is present, verifies it against Supabase Auth
and returns the user's UUID. Falls back to the session_id from the request body
so local dev (without a token) still works.
"""
from db.supabase_client import get_supabase_client, supabase_available


async def resolve_user_id(authorization: str | None, fallback_session_id: str) -> str:
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        if token and supabase_available():
            try:
                client = get_supabase_client()
                resp = client.auth.get_user(token)
                if resp.user:
                    return resp.user.id
            except Exception as e:
                print(f"⚠ JWT verification failed: {e}")
    return fallback_session_id
