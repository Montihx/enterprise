import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
from app.core.logging import logger

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Inject context into structured logging
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id, 
            path=request.url.path, 
            method=request.method,
            client=request.client.host if request.client else "internal"
        )
        
        try:
            response = await call_next(request)
        except Exception as e:
            logger.exception("Cluster Fault: Request processing failure", error=str(e))
            return Response(
                content='{"detail": "Kitsu Core Error: Neural link interrupted"}',
                status_code=500,
                media_type="application/json"
            )
        
        process_time = time.time() - start_time
        response.headers["X-Kitsu-Node"] = "node-primary-alpha"
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        
        # Audit log for metrics collection
        if response.status_code >= 400:
            logger.warning("Request resolved with non-2xx status", status_code=response.status_code)
        
        return response
