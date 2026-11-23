import os
from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, create_engine, inspect
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.schema import CreateSchema, DropSchema

from app import database


@pytest.fixture
def postgres_database(monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[Engine, sessionmaker[Session]]]:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set TEST_DATABASE_URL to a dedicated PostgreSQL test database.")
    schema = f"test_learning_{uuid4().hex}"
    admin = create_engine(url)
    if admin.dialect.name != "postgresql":
        admin.dispose()
        pytest.fail("Integration tests require PostgreSQL.")
    with admin.begin() as connection:
        connection.execute(CreateSchema(schema))
    engine = create_engine(
        url,
        isolation_level="READ COMMITTED",
        connect_args={"options": f"-csearch_path={schema},public -ctimezone=UTC"},
    )
    monkeypatch.setenv("DATABASE_URL", url)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(database, "get_engine", lambda: engine)
    monkeypatch.setattr(database, "get_session_factory", lambda: factory)
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    try:
        command.upgrade(config, "head")
        command.check(config)
        yield engine, factory
        command.downgrade(config, "base")
        assert not inspect(engine).has_table("users", schema=schema)
    finally:
        engine.dispose()
        try:
            with admin.begin() as connection:
                connection.execute(DropSchema(schema, cascade=True))
        finally:
            admin.dispose()
