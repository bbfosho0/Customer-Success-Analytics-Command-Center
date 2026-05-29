"""Standard pagination dependency placeholder."""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Simple pagination envelope."""

    page: Annotated[int, Field(ge=1)] = 1
    per_page: Annotated[int, Field(ge=1, le=200)] = 50
