from pydantic import BaseModel, Field

class MovieCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    year: int = Field(ge=1888, le=2100)
    genre: str = Field(min_length=1, max_length=80)
    rating: float | None = Field(default=None, ge=0, le=10)

class MovieUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    year: int | None = Field(default=None, ge=1888, le=2100)
    genre: str | None = Field(default=None, min_length=1, max_length=80)
    rating: float | None = Field(default=None, ge=0, le=10)

class MovieOut(BaseModel):
    id: int
    title: str
    year: int
    genre: str
    rating: float | None

    class Config:
        from_attributes = True
