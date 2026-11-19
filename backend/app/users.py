from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

if TYPE_CHECKING:
    from app.models import User


def get_or_create_user(auth0_user_id: str) -> User:
    # Load database configuration only for an authenticated user lookup.
    from app.database import SessionLocal
    from app.models import User

    lookup = select(User).where(User.auth0_user_id == auth0_user_id)
    with SessionLocal.begin() as session:
        user = session.scalar(lookup)
        if user is None:
            session.execute(
                insert(User)
                .values(auth0_user_id=auth0_user_id)
                .on_conflict_do_nothing(index_elements=[User.auth0_user_id])
            )
            # A racing insert waits for the winner. A new SELECT under PostgreSQL's
            # default READ COMMITTED isolation sees that committed user.
            user = session.scalars(lookup).one()

        # Keep loaded fields available after the transaction commits and closes.
        session.expunge(user)
        return user
