"""Create completed learning sessions and their ordered answers."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_learning_sessions"
down_revision: str | None = "0001_create_users"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "learning_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("level_id", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_learning_sessions_user_id", "learning_sessions", ["user_id"])
    op.create_table(
        "learning_session_answers",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("element_id", sa.Integer(), nullable=False),
        sa.Column("card_type", sa.String(), nullable=False),
        sa.Column("selected_answer", sa.String(), nullable=False),
        sa.Column("correct_answer", sa.String(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["session_id"], ["learning_sessions.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "session_id", "position", name="uq_learning_session_answers_session_position"
        ),
        sa.CheckConstraint("position >= 0", name="ck_learning_session_answers_position"),       
    )


def downgrade() -> None:
    op.drop_table("learning_session_answers")
    op.drop_index("ix_learning_sessions_user_id", table_name="learning_sessions")
    op.drop_table("learning_sessions")
