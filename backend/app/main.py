"""FastAPI application entry point for local support analytics APIs."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .routers import agents, auth, calls, health, metrics, settings as settings_router

app = FastAPI(title="AWS Serverless Support Analytics", version="0.1.0")

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(calls.router)
app.include_router(agents.router)
app.include_router(metrics.router)
app.include_router(settings_router.router)
app.include_router(auth.router)


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    """Landing route with API status context."""

    return {"message": "AWS Serverless Support Analytics API is ready."}
