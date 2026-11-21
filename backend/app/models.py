from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("username", name="uq_users_username"),)

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    auth0_user_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    username: Mapped[str | None] = mapped_column(String)
    name: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    learning_sessions: Mapped[list["LearningSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    # This UUID comes from CompletedLearningSession.id; do not generate a replacement.
    id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    level_id: Mapped[int] = mapped_column(Integer)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="learning_sessions")
    answers: Mapped[list["LearningSessionAnswer"]] = relationship(
        back_populates="session",
        order_by="LearningSessionAnswer.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class LearningSessionAnswer(Base):
    __tablename__ = "learning_session_answers"
    __table_args__ = (
        UniqueConstraint("session_id", "position", name="uq_learning_session_answers_session_position"),
        CheckConstraint("position >= 0", name="ck_learning_session_answers_position"),
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    session_id: Mapped[UUID] = mapped_column(ForeignKey("learning_sessions.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)
    element_id: Mapped[int] = mapped_column(Integer)
    card_type: Mapped[str] = mapped_column(String)
    selected_answer: Mapped[str] = mapped_column(String)
    correct_answer: Mapped[str] = mapped_column(String)
    is_correct: Mapped[bool] = mapped_column(Boolean)

    session: Mapped[LearningSession] = relationship(back_populates="answers")
