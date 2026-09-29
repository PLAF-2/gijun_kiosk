"use client";

import React, { useEffect, useState } from "react";
import { BookingReviewScreen } from "@/components/cinema/booking-review-screen";
import { CompleteScreen } from "@/components/cinema/complete-screen";
import { KioskHeader } from "@/components/cinema/kiosk-header";
import { MovieScreen } from "@/components/cinema/movie-screen";
import { SeatScreen } from "@/components/cinema/seat-screen";
import { ShowtimeScreen } from "@/components/cinema/showtime-screen";
import { StartScreen } from "@/components/cinema/start-screen";
import { cancelReservation, canContinueWithSeats, computeBookingTotal, createReservation, getOccupiedSeatIds } from "@/lib/cinema/booking";
import { getDemoDates, getScreenings, movies } from "@/lib/cinema/catalog";
import { readBookingStore, writeBookingStore } from "@/lib/cinema/booking-store";
import type { BookingStep, BookingStore, Movie, Reservation, Screening } from "@/lib/cinema/types";

const emptyStore: BookingStore = { version: 1, reservations: [] };

type DemoPaymentInput = {
  movie: Movie;
  screening: Screening;
  audienceCount: number;
  seatIds: string[];
  reservations: Reservation[];
  now?: Date;
};

export type DemoPaymentResult =
  | { status: "invalid" }
  | { status: "occupied"; occupiedSeatIds: string[] }
  | { status: "success"; reservation: Reservation };

export function attemptDemoPayment(input: DemoPaymentInput): DemoPaymentResult {
  if (
    input.movie.id !== input.screening.movieId ||
    !canContinueWithSeats(input.audienceCount, input.seatIds) ||
    input.seatIds.some((seatId) => !input.screening.seats.some((seat) => seat.id === seatId))
  ) {
    return { status: "invalid" };
  }

  const occupied = getOccupiedSeatIds(input.screening, input.reservations);
  const occupiedSeatIds = input.seatIds.filter((seatId) => occupied.has(seatId));
  if (occupiedSeatIds.length > 0) return { status: "occupied", occupiedSeatIds };

  return {
    status: "success",
    reservation: createReservation(
      input.movie,
      input.screening,
      input.audienceCount,
      input.seatIds,
      input.reservations.map((entry) => entry.code),
      input.now,
    ),
  };
}

type PersistBookingStore = (store: BookingStore) => boolean;

export function addReservationToStore(
  store: BookingStore,
  reservation: Reservation,
  persist: PersistBookingStore = writeBookingStore,
) {
  const nextStore = { ...store, reservations: [...store.reservations, reservation] };
  let persisted = false;
  try {
    persisted = persist(nextStore);
  } catch {
    persisted = false;
  }
  return { store: nextStore, storageWarning: !persisted };
}

export function cancelReservationInStore(
  store: BookingStore,
  reservationId: string,
  persist: PersistBookingStore = writeBookingStore,
) {
  const nextStore: BookingStore = {
    ...store,
    reservations: cancelReservation(store.reservations, reservationId),
  };
  let persisted = false;
  try {
    persisted = persist(nextStore);
  } catch {
    persisted = false;
  }
  return { store: nextStore, storageWarning: !persisted };
}

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
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);

  useEffect(() => {
    setStore(readBookingStore());
    setStoreLoaded(true);
  }, []);

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId);
  const dates = getDemoDates(new Date()).map(({ key, date }) => ({
    key,
    label: date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }),
  }));
  const screenings = selectedMovie && selection.selectedDate
    ? getScreenings(selectedMovie.id, selection.selectedDate)
    : [];
  const selectedScreening = screenings.find((screening) => screening.id === selection.selectedScreeningId);
  const activeReservation = store.reservations.find((reservation) => reservation.id === activeReservationId);

  function handleStartBooking() {
    setBookingError(null);
    setStorageWarning(false);
    setActiveReservationId(null);
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
    setBookingError(null);
    setSelection((current) => updateBookingSelection(current, { type: "audience-count", count }));
  }

  function handleToggleSeat(seatId: string) {
    if (!selectedScreening) return;
    setBookingError(null);
    const occupied = getOccupiedSeatIds(selectedScreening, store.reservations).has(seatId);
    setSelection((current) => updateBookingSelection(current, { type: "toggle-seat", seatId, occupied }));
  }

  function handleContinueFromSeats() {
    if (!selectedScreening || !canContinueWithSeats(selection.audienceCount, selection.selectedSeatIds)) return;
    setBookingError(null);
    setStep("review");
  }

  function handleDemoPayment() {
    if (!selectedMovie || !selectedScreening) return;

    const result = attemptDemoPayment({
      movie: selectedMovie,
      screening: selectedScreening,
      audienceCount: selection.audienceCount,
      seatIds: selection.selectedSeatIds,
      reservations: store.reservations,
    });
    if (result.status === "invalid") {
      setBookingError("인원에 맞는 좌석을 다시 선택해 주세요.");
      setSelection((current) => ({ ...current, selectedSeatIds: [] }));
      setStep("seats");
      return;
    }
    if (result.status === "occupied") {
      setBookingError("선택한 좌석이 방금 판매되었습니다. 좌석을 다시 선택해 주세요.");
      setSelection((current) => ({ ...current, selectedSeatIds: [] }));
      setStep("seats");
      return;
    }

    const update = addReservationToStore(store, result.reservation);
    setStore(update.store);
    setStorageWarning(update.storageWarning);
    setActiveReservationId(result.reservation.id);
    setBookingError(null);
    setStep("complete");
  }

  function handleCancelReservation(reservationId: string) {
    const update = cancelReservationInStore(store, reservationId);
    setStore(update.store);
    setStorageWarning(update.storageWarning);
  }

  function handleBack() {
    const previousStep: Partial<Record<BookingStep, BookingStep>> = {
      movie: "home",
      showtime: "movie",
      seats: "showtime",
      review: "seats",
      lookup: "home",
    };
    setStep(previousStep[step] ?? "home");
  }

  function handleHome() {
    setBookingError(null);
    setActiveReservationId(null);
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
          bookingError={bookingError}
        />
      ) : null;
      break;
    case "review":
      screen = selectedMovie && selectedScreening ? (
        <BookingReviewScreen
          audienceCount={selection.audienceCount}
          movie={selectedMovie}
          onBack={() => setStep("seats")}
          onPay={handleDemoPayment}
          screening={selectedScreening}
          seatIds={selection.selectedSeatIds}
          total={computeBookingTotal(selectedScreening.ticketPrice, selection.audienceCount)}
        />
      ) : null;
      break;
    case "complete":
      screen = activeReservation ? (
        <CompleteScreen
          cancelled={activeReservation.status === "cancelled"}
          onCancel={() => handleCancelReservation(activeReservation.id)}
          onHome={handleHome}
          reservation={activeReservation}
          storageWarning={storageWarning}
        />
      ) : (
        <section className="screen-card">
          <div className="screen-heading"><h1>예매 내역을 찾을 수 없습니다</h1></div>
          <button className="primary-button" onClick={handleHome} type="button">처음으로</button>
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
