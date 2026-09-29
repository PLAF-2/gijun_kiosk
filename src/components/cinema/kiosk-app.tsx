"use client";

import React, { useEffect, useState } from "react";
import { KioskHeader } from "@/components/cinema/kiosk-header";
import { MovieScreen } from "@/components/cinema/movie-screen";
import { StartScreen } from "@/components/cinema/start-screen";
import { readBookingStore, writeBookingStore } from "@/lib/cinema/booking-store";
import { getDemoDates, movies, toLocalDateKey } from "@/lib/cinema/catalog";
import type { BookingStep, BookingStore } from "@/lib/cinema/types";

const emptyStore: BookingStore = { version: 1, reservations: [] };

export function CinemaKioskApp() {
  const [step, setStep] = useState<BookingStep>("home");
  const [store, setStore] = useState<BookingStore>(emptyStore);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setStore(readBookingStore());
    setStoreLoaded(true);
  }, []);

  useEffect(() => {
    if (storeLoaded) writeBookingStore(store);
  }, [store, storeLoaded]);

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId);

  function handleStartBooking() {
    setSelectedMovieId(null);
    setSelectedDate(null);
    setStep("movie");
  }

  function handleSelectMovie(movieId: string) {
    setSelectedMovieId(movieId);
    setSelectedDate(null);
  }

  function handleContinueFromMovies() {
    if (!selectedMovie) return;
    setSelectedDate(toLocalDateKey(getDemoDates(new Date())[0].date));
    setStep("showtime");
  }

  function handleBack() {
    const previousStep: Partial<Record<BookingStep, BookingStep>> = {
      movie: "home",
      showtime: "movie",
      lookup: "home",
    };
    setStep(previousStep[step] ?? "home");
  }

  function handleHome() {
    setStep("home");
  }

  const stepLabels: Record<BookingStep, string> = {
    home: "시작",
    movie: "영화 선택",
    showtime: "상영 선택",
    seats: "좌석 선택",
    review: "예매 확인",
    complete: "예매 완료",
    lookup: "예매 조회·취소",
  };
  const stepNumbers: Record<BookingStep, number> = {
    home: 0,
    movie: 1,
    showtime: 2,
    seats: 3,
    review: 4,
    complete: 5,
    lookup: 0,
  };

  if (!storeLoaded) {
    return (
      <main aria-busy="true" className="cinema-shell">
        <p>예매 정보를 준비하고 있어요.</p>
      </main>
    );
  }

  let screen: React.ReactNode;
  switch (step) {
    case "home":
      screen = (
        <StartScreen
          onLookupBooking={() => setStep("lookup")}
          onStartBooking={handleStartBooking}
        />
      );
      break;
    case "movie":
      screen = (
        <MovieScreen
          movies={movies}
          onContinue={handleContinueFromMovies}
          onSelect={handleSelectMovie}
          selectedMovieId={selectedMovieId}
        />
      );
      break;
    case "showtime":
      screen = (
        <section className="screen-card">
          <div className="screen-heading">
            <p className="eyebrow">{selectedMovie?.title ?? "영화 예매"}</p>
            <h1>상영 시간 선택</h1>
          </div>
          <p>상영 시간과 좌석 화면을 준비하고 있어요.</p>
          {selectedDate ? <p>관람 날짜: {selectedDate}</p> : null}
        </section>
      );
      break;
    case "lookup":
      screen = (
        <section className="screen-card">
          <div className="screen-heading">
            <p className="eyebrow">BOOKING LOOKUP</p>
            <h1>예매 조회·취소</h1>
          </div>
          <p>예매 조회 기능을 준비하고 있어요.</p>
          <button className="secondary-button" onClick={handleHome} type="button">
            처음으로
          </button>
        </section>
      );
      break;
    default:
      screen = (
        <section className="screen-card">
          <h1>다음 예매 단계를 준비하고 있어요.</h1>
          <button className="secondary-button" onClick={handleHome} type="button">
            처음으로
          </button>
        </section>
      );
  }

  return (
    <main className="cinema-shell">
      <KioskHeader
        onBack={step === "home" ? undefined : handleBack}
        onHome={step === "home" ? undefined : handleHome}
        stepCount={5}
        stepLabel={stepLabels[step]}
        stepNumber={stepNumbers[step]}
      />
      {screen}
    </main>
  );
}
