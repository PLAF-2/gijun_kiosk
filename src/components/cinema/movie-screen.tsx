import React, { useEffect, useRef, useState } from "react";
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
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  function updateScrollControls() {
    const carousel = carouselRef.current;
    if (!carousel) return;
    setCanScrollBack(carousel.scrollLeft > 1);
    setCanScrollForward(carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 1);
  }

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    updateScrollControls();
    const observer = new ResizeObserver(updateScrollControls);
    observer.observe(carousel);
    return () => observer.disconnect();
  }, [movies.length]);

  useEffect(() => {
    carouselRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "instant",
    });
    updateScrollControls();
  }, [selectedMovieId]);

  function moveCarousel(direction: number) {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section className="screen-card movie-screen">
      <div className="screen-heading">
        <p className="eyebrow">STEP 1</p>
        <h1>영화를 선택하세요</h1>
      </div>
      <div className="movie-browse-tools">
        <div className="movie-scroll-buttons" role="group" aria-label="영화 목록 이동">
          <button aria-label="이전 영화 보기" aria-controls="movie-carousel" disabled={!canScrollBack} onClick={() => moveCarousel(-1)} type="button">←</button>
          <button aria-label="다음 영화 보기" aria-controls="movie-carousel" disabled={!canScrollForward} onClick={() => moveCarousel(1)} type="button">→</button>
        </div>
      </div>
      <div className="movie-grid" id="movie-carousel" ref={carouselRef} onScroll={updateScrollControls} role="group" aria-label="영화 목록" tabIndex={0}>
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
          극장 선택
        </button>
      </div>
    </section>
  );
}
