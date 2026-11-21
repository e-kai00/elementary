from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import get_current_user_id
from app.schemas.learning_session import CompletedLearningSessionData
from app.services.learning_sessions import get_learning_sessions, save_learning_session

router = APIRouter()


@router.post("/api/learning-sessions", response_model=CompletedLearningSessionData)
def create_learning_session(
    completed: CompletedLearningSessionData,
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> CompletedLearningSessionData:
    return save_learning_session(user_id, completed)


@router.get("/api/learning-sessions", response_model=list[CompletedLearningSessionData])
def learning_sessions(
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> list[CompletedLearningSessionData]:
    return get_learning_sessions(user_id)
