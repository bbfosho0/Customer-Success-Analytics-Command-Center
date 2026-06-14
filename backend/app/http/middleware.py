"""FastAPI middleware registration."""

from __future__ import annotations

import logging
import time
import uuid

from fastapi import FastAPI, Request

from ..utils.logging import log_event


def register_request_context_middleware(app: FastAPI, logger: logging.Logger) -> None:
    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):
        """Attach request IDs and emit one structured access log per request."""

        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        started_at = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
            log_event(
                logger,
                logging.ERROR,
                "request_failed",
                {
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            raise

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        log_event(
            logger,
            logging.INFO,
            "request_completed",
            {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response

