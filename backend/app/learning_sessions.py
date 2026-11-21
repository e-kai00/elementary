from typing import Literal
from uuid import UUID

from fastapi import HTTPException
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StrictBool
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import selectinload

from app import database
from app.models import LearningSession, LearningSessionAnswer
from app.users import get_or_create_user


CardType = Literal[
    "name-to-symbol",
    "symbol-to-name",
    "name-to-atomic-number",
    "name-to-group",
    "name-to-category",
]


class LearningSessionAnswerData(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True, from_attributes=True)

    element_id: int = Field(alias="elementId", strict=True, ge=1, le=20)
    card_type: CardType = Field(alias="cardType")
    selected_answer: str = Field(alias="selectedAnswer", min_length=1, pattern=r"\S")
    correct_answer: str = Field(alias="correctAnswer", min_length=1, pattern=r"\S")
    is_correct: StrictBool = Field(alias="isCorrect")


class CompletedLearningSessionData(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True, from_attributes=True)

    id: UUID
    level_id: int = Field(alias="levelId", strict=True, ge=1, le=6)
    completed_at: AwareDatetime = Field(alias="completedAt")
    answers: list[LearningSessionAnswerData] = Field(min_length=10, max_length=10)


def save_learning_session(
    auth0_user_id: str, completed: CompletedLearningSessionData
) -> CompletedLearningSessionData:
    with database.get_session_factory().begin() as session:
        user = get_or_create_user(auth0_user_id, session=session)
        inserted_id = session.scalar(
            insert(LearningSession)
            .values(
                id=completed.id,
                user_id=user.id,
                level_id=completed.level_id,
                completed_at=completed.completed_at,
            )
            .on_conflict_do_nothing(index_elements=[LearningSession.id])
            .returning(LearningSession.id)
        )
        if inserted_id is not None:
            session.add_all(
                LearningSessionAnswer(
                    session_id=completed.id, position=position, **answer.model_dump()
                )
                for position, answer in enumerate(completed.answers)
            )
            session.flush()

        # A conflicting INSERT waits for its transaction to finish. Under READ
        # COMMITTED this SELECT sees the complete session and its ordered answers.
        stored = session.scalars(
            select(LearningSession)
            .where(LearningSession.id == completed.id)
            .options(selectinload(LearningSession.answers))
        ).one()
        if stored.user_id != user.id:
            raise HTTPException(status_code=409, detail="Session ID is already in use")
        result = CompletedLearningSessionData.model_validate(stored)
        if result != completed:
            raise HTTPException(status_code=409, detail="Session ID is already in use")
        return result


def get_learning_sessions(auth0_user_id: str) -> list[CompletedLearningSessionData]:
    with database.get_session_factory().begin() as session:
        user = get_or_create_user(auth0_user_id, session=session)
        sessions = session.scalars(
            select(LearningSession)
            .where(LearningSession.user_id == user.id)
            .order_by(LearningSession.completed_at.desc(), LearningSession.id.desc())
            .options(selectinload(LearningSession.answers))
        ).all()
        return [CompletedLearningSessionData.model_validate(item) for item in sessions]
