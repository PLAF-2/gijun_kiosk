"use client";

import React, { useEffect, useState } from "react";
import { KioskHeader } from "@/components/cinema/kiosk-header";
import { MovieScreen } from "@/components/cinema/movie-screen";
import { SeatScreen } from "@/components/cinema/seat-screen";
import { ShowtimeScreen } from "@/components/cinema/showtime-screen";
import { StartScreen } from "@/components/cinema/start-screen";
import { canContinueWithSeats, getOccupiedSeatIds } from "@/lib/cinema/booking";
import { getDemoDates, getScreenings, movies } from "@/lib/cinema/catalog";
import { readBookingStore, writeBookingStore } from "@/lib/cinema/booking-store";
import type { BookingStep, BookingStore } from "@/lib/cinema/types";

const emptyStore: BookingStore = { version: 1, reservations: [] };

export type BookingSelectionState = {
  selectedDate: string | null;
  selectedScreeningId: string | null;
  selectedSeatIds: string[];
  audienceCount: number;
};

type BookingSelectionAction =
  | { type: "date"; date: string }
  | { type: "screening"; screeningId: string }
  | { type: "audience-count"; count: number }
  | { type: "toggle-seat"; seatId: string; occupied: boolean };

export function createInitialBookingSelection(date: string | null = null): BookingSelectionState {
  return {
    selectedDate: date,
    selectedScreeningId: null,
    selectedSeatIds: [],
    audienceCount: 1,
  };
}

export function updateBookingSelection(
  state: BookingSelectionState,
  action: BookingSelectionAction,
): BookingSelectionState {
  switch (action.type) {
    case "date":
      return state.selectedDate === action.date
        ? state
        : { ...state, selectedDate: action.date, selectedScreeningId: null, selectedSeatIds: [] };
    case "screening":
      return state.selectedScreeningId === action.screeningId
        ? state
        : { ...state, selectedScreeningId: action.screeningId, selectedSeatIds: [] };
    case "audience-count": {
      const requestedCount = Number.isFinite(action.count)
        ? Math.trunc(action.count)
        : state.audienceCount;
      const audienceCount = Math.max(1, Math.min(8, requestedCount));
      return {
        ...state,
        audienceCount,
        selectedSeatIds: state.selectedSeatIds.slice(0, audienceCount),
      };
    }
    case "toggle-seat":
      if (action.occupied) return state;
      if (state.selectedSeatIds.includes(action.seatId)) {
        return { ...state, selectedSeatIds: state.selectedSeatIds.filter((id) => id !== action.seatId) };
      }
      if (state.selectedSeatIds.length >= state.audienceCount) return state;
      return { ...state, selectedSeatIds: [...state.selectedSeatIds, action.seatId] };
  }
}

export function CinemaKioskApp() {
  const [step, setStep] = useState<BookingStep>("home");
  const [store, setStore] = useState<BookingStore>(emptyStore);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selection, setSelection] = useState<BookingSelectionState>(() => createInitialBookingSelection());

  useEffect(() => {
    setStore(readBookingStore());
    setStoreLoaded(true);
  }, []);

  useEffect(() => {
    if (storeLoaded) writeBookingStore(store);
  }, [store, storeLoaded]);

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId);
  const dates = getDemoDates(new Date()).map(({ key, date }) => ({
    key,
    label: date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }),
  }));
  const screenings = selectedMovie && selection.selectedDate
    ? getScreenings(selectedMovie.id, selection.selectedDate)
    : [];
  const selectedScreening = screenings.find((screening) => screening.id === selection.selectedScreeningId);

  function handleStartBooking() {
    setSelectedMovieId(null);
    setSelection(createInitialBookingSelection());
    setStep("movie");
  }

  function handleSelectMovie(movieId: string) {
    setSelectedMovieId(movieId);
    setSelection(createInitialBookingSelection());
  }

  function handleContinueFromMovies() {
    if (!selectedMovie) return;
    setSelection(createInitialBookingSelection(dates[0]?.key ?? null));
    setStep("showtime");
  }

  function handleSelectDate(date: string) {
    setSelection((current) => updateBookingSelection(current, { type: "date", date }));
  }

  function handleSelectScreening(screeningId: string) {
    setSelection((current) => updateBookingSelection(current, { type: "screening", screeningId }));
    setStep("seats");
  }

  function handleAudienceCountChange(count: number) {
    setSelection((current) => updateBookingSelection(current, { type: "audience-count", count }));
  }

  function handleToggleSeat(seatId: string) {
    if (!selectedScreening) return;
    const occupied = getOccupiedSeatIds(selectedScreening, store.reservations).has(seatId);
    setSelection((current) => updateBookingSelection(current, { type: "toggle-seat", seatId, occupied }));
  }

  function handleContinueFromSeats() {
    if (!selectedScreening || !canContinueWithSeats(selection.audienceCount, selection.selectedSeatIds)) return;
    setStep("review");
  }

  function handleBack() {
    const previousStep: Partial<Record<BookingStep, BookingStep>> = {
      movie: "home",
      showtime: "movie",
      seats: "showtime",
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
      screen = selectedMovie && selection.selectedDate ? (
        <ShowtimeScreen
          dates={dates}
          movie={selectedMovie}
          onSelectDate={handleSelectDate}
          onSelectScreening={handleSelectScreening}
          reservations={store.reservations}
          screenings={screenings}
          selectedDate={selection.selectedDate}
          selectedScreeningId={selection.selectedScreeningId}
        />
      ) : null;
      break;
    case "seats":
      screen = selectedScreening ? (
        <SeatScreen
          audienceCount={selection.audienceCount}
          onAudienceCountChange={handleAudienceCountChange}
          onContinue={handleContinueFromSeats}
          onToggleSeat={handleToggleSeat}
          reservations={store.reservations}
          screening={selectedScreening}
          selectedSeatIds={selection.selectedSeatIds}
        />
      ) : null;
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
