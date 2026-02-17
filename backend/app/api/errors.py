from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.core.logging import logger

async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("An unhandled exception occurred", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
