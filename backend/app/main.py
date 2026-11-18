from typing import Annotated

from fastapi import Depends, FastAPI

from app.auth import get_current_user_id

app = FastAPI()


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/me")
def me(user_id: Annotated[str, Depends(get_current_user_id)]) -> dict[str, str]:
    return {"user_id": user_id}
