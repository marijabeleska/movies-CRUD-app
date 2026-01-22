from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    genre: Mapped[str] = mapped_column(String(80), nullable=False)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
