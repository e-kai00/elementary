from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app import database
from app.models import User


def get_or_create_user(auth0_user_id: str, *, session: Session | None = None) -> User:
    if session is None:
        with database.get_session_factory().begin() as owned_session:
            user = get_or_create_user(auth0_user_id, session=owned_session)
            # Keep loaded fields available after the transaction commits and closes.
            owned_session.expunge(user)
            return user

    lookup = select(User).where(User.auth0_user_id == auth0_user_id)
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
    return user
