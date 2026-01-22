from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, get_db
from models import Movie
from schemas import MovieCreate, MovieUpdate, MovieOut

app = FastAPI(title="Movies CRUD API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "connected"}

@app.get("/api/movies", response_model=list[MovieOut])
def list_movies(db: Session = Depends(get_db)):
    return db.scalars(select(Movie).order_by(Movie.id.desc())).all()

@app.post("/api/movies", response_model=MovieOut, status_code=201)
def create_movie(payload: MovieCreate, db: Session = Depends(get_db)):
    movie = Movie(**payload.model_dump())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie

@app.put("/api/movies/{movie_id}", response_model=MovieOut)
def update_movie(movie_id: int, payload: MovieUpdate, db: Session = Depends(get_db)):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(movie, k, v)

    db.commit()
    db.refresh(movie)
    return movie

@app.delete("/api/movies/{movie_id}", status_code=204)
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    db.delete(movie)
    db.commit()
    return None
