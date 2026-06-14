"""FastAPI application entry point for local support analytics APIs."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .http.errors import register_error_handlers
from .http.middleware import register_request_context_middleware
from .routers import (
    agents,
    auth,
    calls,
    customer_analytics,
    health,
    metrics,
    settings as settings_router,
)
from .utils.logging import configure_logging


configure_logging(settings.log_level)
logger = logging.getLogger("backend.app.request")


def create_app() -> FastAPI:
    app = FastAPI(title="AWS Serverless Support Analytics", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )

    register_request_context_middleware(app, logger)
    register_error_handlers(app)

    app.include_router(health.router)
    app.include_router(calls.router)
    app.include_router(agents.router)
    app.include_router(metrics.router)
    app.include_router(customer_analytics.router)
    app.include_router(settings_router.router)
    app.include_router(auth.router)

    @app.get("/", tags=["root"])
    async def root() -> dict[str, str]:
        """Landing route with API status context."""

        return {"message": "AWS Serverless Support Analytics API is ready."}

    return app


app = create_app()
