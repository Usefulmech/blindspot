from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze, decisions, share
from services.ai.cencori_client import cencori_available
from db.supabase_client import supabase_available
from services.config import get_settings

app = FastAPI(title="Blindspot API", version="2.0.0")

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # add prod URL on deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(decisions.router)
app.include_router(share.router)


@app.get("/api/health")
async def health():
    """
    Returns API status + Cencori gateway health + Supabase connectivity.
    Useful for frontend to check if the backend is ready before submission.
    """
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0",
        "services": {
            "cencori_gateway": "configured" if cencori_available() else "not configured",
            "supabase": "configured" if supabase_available() else "not configured",
            "numbeo": "configured" if settings.numbeo_configured else "not configured",
            "open_exchange_rates": "configured" if settings.fx_configured else "not configured",
        },
    }


@app.get("/")
async def root():
    return {"message": "Blindspot API v2 — visit /docs for the interactive API reference."}
