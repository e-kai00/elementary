import pytest

from app import database


def test_database_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    database.get_engine.cache_clear()
    database.get_session_factory.cache_clear()
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match="Set DATABASE_URL"):
        database.get_session_factory()

    database_url = "postgresql+psycopg://example:example@127.0.0.1:1/elementary"
    monkeypatch.setenv("DATABASE_URL", database_url)
    engine = database.get_engine()
    try:
        factory = database.get_session_factory()
        assert engine.url.render_as_string(hide_password=False) == database_url
        assert database.get_engine() is engine
        assert database.get_session_factory() is factory
        with factory() as session:
            assert session.bind is engine
    finally:
        engine.dispose()
        database.get_session_factory.cache_clear()
        database.get_engine.cache_clear()
