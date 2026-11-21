from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth import get_current_user_id
from app.services.users import get_or_create_user

router = APIRouter()


@router.get("/api/me")
def me(
    user_id: Annotated[str, Depends(get_current_user_id)],
) -> dict[str, UUID | str | datetime | None]:
    user = get_or_create_user(user_id)
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.astimezone(UTC),
    }
