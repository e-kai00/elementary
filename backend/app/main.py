import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import learning_sessions, users

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

app = FastAPI()
allowed_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:4200").split(",")
    if origin.strip()
]
if "*" in allowed_origins:
    raise ValueError("CORS_ALLOWED_ORIGINS must list explicit origins, not '*'.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(users.router)
app.include_router(learning_sessions.router)
