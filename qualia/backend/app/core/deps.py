from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


bearer_scheme = HTTPBearer(auto_error=False)


async def get_bearer_token(credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme)) -> str:
    if credentials is None and credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=403, detail="Invalid authorization header")
    token = credentials.credential.strip()
    if not token:
        raise HTTPException(status_code=403, detail="Invalid authorization header")
    return credentials.credentials
