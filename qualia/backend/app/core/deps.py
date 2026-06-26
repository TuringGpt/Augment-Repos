from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


bearer_scheme = HTTPBearer(auto_error=False)


async def get_bearer_token(credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme)) -> str:
    if credentials is None or credentials.scheme != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return token
