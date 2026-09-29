import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MovieScreen } from "@/components/cinema/movie-screen";
import { StartScreen } from "@/components/cinema/start-screen";
import { movies } from "@/lib/cinema/catalog";

test("start screen offers booking and lookup entry points", () => {
  const html = renderToStaticMarkup(
    <StartScreen onStartBooking={() => {}} onLookupBooking={() => {}} />,
  );

  assert.match(html, /오늘의 영화를 예매하세요/);
  assert.match(html, /예매 시작/);
  assert.match(html, /예매 조회·취소/);
  assert.doesNotMatch(html, /야키테이/);
});

test("movie screen renders each local poster with accessible title and metadata", () => {
  const html = renderToStaticMarkup(
    <MovieScreen
      movies={movies}
      selectedMovieId={null}
      onSelect={() => {}}
      onContinue={() => {}}
    />,
  );

  for (const movie of movies) {
    assert.match(html, new RegExp(`src="${movie.posterSrc}"`));
    assert.match(html, new RegExp(`>${movie.title}</strong>`));
    assert.match(html, new RegExp(`${movie.ageRating} · ${movie.runtimeMinutes}분`));
  }
  assert.equal((html.match(/alt=""/g) ?? []).length, movies.length);
  assert.equal((html.match(/class="movie-card/g) ?? []).length, movies.length);
});

test("movie selection is reflected with aria-pressed and gates continue", () => {
  const unselectedHtml = renderToStaticMarkup(
    <MovieScreen
      movies={movies}
      selectedMovieId={null}
      onSelect={() => {}}
      onContinue={() => {}}
    />,
  );
  const selectedHtml = renderToStaticMarkup(
    <MovieScreen
      movies={movies}
      selectedMovieId={movies[0].id}
      onSelect={() => {}}
      onContinue={() => {}}
    />,
  );

  assert.match(unselectedHtml, /<button[^>]*disabled=""[^>]*>상영 시간 선택/);
  assert.match(selectedHtml, /<button aria-pressed="true" class="movie-card is-selected"/);
  assert.match(selectedHtml, /<button class="primary-button" type="button">상영 시간 선택/);
});
