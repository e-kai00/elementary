import os
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("Set DATABASE_URL to a postgresql+psycopg:// connection URL.")
    return create_engine(database_url, pool_pre_ping=True)


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine())
