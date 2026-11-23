from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_user_id
from app.main import app


def test_me_uses_verified_identity_and_returns_internal_profile(monkeypatch: pytest.MonkeyPatch) -> None:
    user = SimpleNamespace(
        id=uuid4(), username=None, name=None, email=None, created_at=datetime.now(UTC)
    )
    lookup = Mock(return_value=user)
    monkeypatch.setattr("app.routers.users.get_or_create_user", lookup)
    app.dependency_overrides[get_current_user_id] = lambda: "auth0|verified-user"
    try:
        with TestClient(app) as client:
            response = client.get("/api/me", params={"auth0_user_id": "auth0|untrusted"})
    finally:
        app.dependency_overrides.pop(get_current_user_id, None)

    assert response.status_code == 200
    profile = response.json()
    assert profile == {
        "id": str(user.id),
        "username": None,
        "name": None,
        "email": None,
        "created_at": profile["created_at"],
    }
    assert datetime.fromisoformat(profile["created_at"]) == user.created_at
    lookup.assert_called_once_with("auth0|verified-user")
