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
    <section className="screen-card movie-screen">
      <div className="screen-heading">
        <p className="eyebrow">STEP 1</p>
        <h1>영화를 선택하세요</h1>
        <p className="screen-description">보고 싶은 포스터를 터치해 주세요. · {movies.length}편의 영화</p>
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
                src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${movie.posterSrc}`}
              />
              {isSelected ? <span className="movie-selected-mark" aria-hidden="true">✓ 선택</span> : null}
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
      <div className="movie-continue">
        <p aria-live="polite">{movies.find((movie) => movie.id === selectedMovieId)?.title ?? "영화를 선택하면 다음 단계로 이동할 수 있어요."}</p>
        <button
        className="primary-button"
        disabled={!selectedMovieId}
        onClick={onContinue}
        type="button"
      >
        상영 시간 선택
      </button>
      </div>
    </section>
  );
}
