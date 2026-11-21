from fastapi import FastAPI

from app.routers import learning_sessions, users

app = FastAPI()


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(users.router)
app.include_router(learning_sessions.router)
