import pytest


def test_database_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    database_url = "postgresql+psycopg://example:example@127.0.0.1:1/elementary"
    monkeypatch.setenv("DATABASE_URL", database_url)

    from app.database import engine, SessionLocal

    assert engine.url.render_as_string(hide_password=False) == database_url
    with SessionLocal() as session:
        assert session.bind is engine
    engine.dispose()
