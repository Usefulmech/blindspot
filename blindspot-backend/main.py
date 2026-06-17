from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from routers import analyze, decisions, share

app = FastAPI(title="Blindspot API", version="1.0.0")

# Configure CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Add production URLs when deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(analyze.router)
app.include_router(decisions.router)
app.include_router(share.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Blindspot API"}
