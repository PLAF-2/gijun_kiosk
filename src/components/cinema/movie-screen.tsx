import React from "react";
import type { Movie } from "@/lib/cinema/types";

type MovieScreenProps = {
  movies: Movie[];
  selectedMovieId: string | null;
  onSelect: (movieId: string) => void;
  onContinue: () => void;
};

export function MovieScreen({
  movies,
  selectedMovieId,
  onSelect,
  onContinue,
}: MovieScreenProps) {
  return (
    <section className="screen-card">
      <div className="screen-heading">
        <p className="eyebrow">STEP 1</p>
        <h1>영화를 선택하세요</h1>
      </div>
      <div className="movie-grid">
        {movies.map((movie) => {
          const isSelected = selectedMovieId === movie.id;
          return (
            <button
              aria-pressed={isSelected}
              className={`movie-card${isSelected ? " is-selected" : ""}`}
              key={movie.id}
              onClick={() => onSelect(movie.id)}
              type="button"
            >
              <img
                alt=""
                className={`movie-poster poster-${movie.posterTheme}`}
                src={movie.posterSrc}
              />
              <span className="movie-meta">
                <strong>{movie.title}</strong>
                <span>
                  {movie.ageRating} · {movie.runtimeMinutes}분
                </span>
                <span>{movie.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button
        className="primary-button"
        disabled={!selectedMovieId}
        onClick={onContinue}
        type="button"
      >
        상영 시간 선택
      </button>
    </section>
  );
}
