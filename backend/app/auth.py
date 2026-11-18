import os
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _get_jwks_client(domain: str) -> jwt.PyJWKClient:
    # Reuse the client so its expiring JWKS cache and key-rotation handling work.
    return jwt.PyJWKClient(f"https://{domain}/.well-known/jwks.json", timeout=5)


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> str:
    unauthorized = HTTPException(
        status_code=401,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    domain = os.environ.get("AUTH0_DOMAIN", "").strip().rstrip("/")
    audience = os.environ.get("AUTH0_AUDIENCE", "").strip()
    if not domain or not audience:
        raise HTTPException(status_code=503, detail="Authentication is not configured")

    try:
        header = jwt.get_unverified_header(credentials.credentials)
        if (
            header.get("alg") != "RS256"
            or not isinstance(header.get("kid"), str)
            or not header["kid"]
        ):
            raise unauthorized

        signing_key = _get_jwks_client(domain).get_signing_key_from_jwt(credentials.credentials)
        claims = jwt.decode(
            credentials.credentials,
            signing_key,
            algorithms=["RS256"],
            issuer=f"https://{domain}/",
            audience=audience,
            options={"require": ["exp", "iss", "aud", "sub"]},
        )
        subject = claims["sub"]
        if not isinstance(subject, str) or not subject.strip():
            raise unauthorized
        return subject
    except jwt.PyJWTError:
        raise unauthorized from None
