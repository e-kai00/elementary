from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI

from app.auth import get_current_user_id
from app.learning_sessions import (
    CompletedLearningSessionData,
    get_learning_sessions,
    save_learning_session,
)
from app.users import get_or_create_user

app = FastAPI()


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/me")
def me(
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> dict[str, UUID | str | datetime | None]:
    user = get_or_create_user(user_id)
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.astimezone(UTC),
    }


@app.post("/api/learning-sessions", response_model=CompletedLearningSessionData)
def create_learning_session(
    completed: CompletedLearningSessionData,
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> CompletedLearningSessionData:
    return save_learning_session(user_id, completed)


@app.get("/api/learning-sessions", response_model=list[CompletedLearningSessionData])
def learning_sessions(
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> list[CompletedLearningSessionData]:
    return get_learning_sessions(user_id)
