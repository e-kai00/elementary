from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import selectinload

from app import database
from app.models.learning_session import LearningSession, LearningSessionAnswer
from app.schemas.learning_session import CompletedLearningSessionData
from app.services.users import get_or_create_user


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
