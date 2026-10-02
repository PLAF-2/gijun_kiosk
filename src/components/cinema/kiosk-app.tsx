"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookingReviewScreen } from "@/components/cinema/booking-review-screen";
import { CompleteScreen } from "@/components/cinema/complete-screen";
import { KioskHeader } from "@/components/cinema/kiosk-header";
import { LookupScreen } from "@/components/cinema/lookup-screen";
import { MovieScreen } from "@/components/cinema/movie-screen";
import { PaymentScreen } from "@/components/cinema/payment-screen";
import { SeatScreen } from "@/components/cinema/seat-screen";
import { ShowtimeScreen } from "@/components/cinema/showtime-screen";
import { StartScreen } from "@/components/cinema/start-screen";
import { TheaterScreen } from "@/components/cinema/theater-screen";
import { MovieAtmosphere, getMovieAtmosphereStyle, movieAtmosphereShellClass } from "@/components/cinema/movie-atmosphere";
import { CinemaDiscoveries } from "@/components/cinema/cinema-discoveries";
import type { CinemaStampId } from "@/lib/cinema/collectibles";
import { cancelReservation, canContinueWithSeats, computeBookingTotal, createReservation, getCancellationExpiry, getOccupiedSeatIds, purgeExpiredCancellations, stampLegacyCancellations } from "@/lib/cinema/booking";
import { getDemoDates, getScreenings, movies } from "@/lib/cinema/catalog";
import { readBookingStore, readBookingStoreSnapshot, writeBookingStore } from "@/lib/cinema/booking-store";
import { isValidOptionalPhoneNumber, normalizePhoneNumber } from "@/lib/cinema/contact";
import { calculateBookingPrice, createDiscountSelection } from "@/lib/cinema/discounts";
import { regions, theaters } from "@/lib/cinema/theaters";
import type { BookingStep, BookingStore, DiscountSelection, Movie, PaymentMethod, Reservation, Screening } from "@/lib/cinema/types";

const emptyStore: BookingStore = { version: 1, reservations: [] };

type DemoPaymentInput = {
  movie: Movie;
  screening: Screening;
  audienceCount: number;
  seatIds: string[];
  reservations: Reservation[];
  now?: Date;
  phoneNumber?: string;
  paymentMethod?: PaymentMethod;
  discounts?: DiscountSelection;
};

export type DemoPaymentResult =
  | { status: "invalid" }
  | { status: "invalid-discount" }
  | { status: "occupied"; occupiedSeatIds: string[] }
  | { status: "success"; reservation: Reservation };

export function attemptDemoPayment(input: DemoPaymentInput): DemoPaymentResult {
  if (
    input.movie.id !== input.screening.movieId ||
    !isValidOptionalPhoneNumber(input.phoneNumber) ||
    !canContinueWithSeats(input.audienceCount, input.seatIds) ||
    input.seatIds.some((seatId) => !input.screening.seats.some((seat) => seat.id === seatId))
  ) {
    return { status: "invalid" };
  }

  const occupied = getOccupiedSeatIds(input.screening, input.reservations);
  if (!calculateBookingPrice(input.screening.ticketPrice, input.audienceCount, input.discounts)) {
    return { status: "invalid-discount" };
  }
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
      input.phoneNumber,
      input.paymentMethod,
      input.discounts,
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
  const [selectedRegionId, setSelectedRegionId] = useState(regions[0].id);
  const [selectedTheaterId, setSelectedTheaterId] = useState<string | null>(null);
  const [selection, setSelection] = useState<BookingSelectionState>(() => createInitialBookingSelection());
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [discounts, setDiscounts] = useState<DiscountSelection>(createDiscountSelection);
  const [foundStampIds, setFoundStampIds] = useState<CinemaStampId[]>([]);

  function discoverStamp(id: CinemaStampId) {
    setFoundStampIds((current) => current.includes(id) ? current : [...current, id]);
  }

  useEffect(() => {
    const loaded = readBookingStore();
    const reservations = purgeExpiredCancellations(stampLegacyCancellations(loaded.reservations));
    const prepared = reservations === loaded.reservations ? loaded : { ...loaded, reservations };
    if (prepared !== loaded) {
      hasUnsavedChangesRef.current = !writeBookingStore(prepared);
      setStorageWarning(hasUnsavedChangesRef.current);
    }
    setStore(prepared);
    setStoreLoaded(true);
  }, []);

  useEffect(() => {
    if (!storeLoaded) return;
    let timer: number | undefined;

    function cleanAndSchedule() {
      window.clearTimeout(timer);
      const now = Date.now();
      const remaining = purgeExpiredCancellations(store.reservations, now);
      if (remaining !== store.reservations) {
        const remainingIds = new Set(remaining.map((reservation) => reservation.id));
        const expiredIds = new Set(store.reservations.filter((reservation) => !remainingIds.has(reservation.id)).map((reservation) => reservation.id));
        const persisted = readBookingStoreSnapshot();
        const base = persisted ?? store;
        const combined = new Map(base.reservations.map((reservation) => [reservation.id, reservation]));
        // Preserve unsaved memory records without overwriting another tab's newer bookings.
        if (hasUnsavedChangesRef.current && persisted) {
          for (const reservation of store.reservations) {
            const saved = combined.get(reservation.id);
            if (!saved || (reservation.status === "cancelled" && saved.status === "booked")) {
              combined.set(reservation.id, reservation);
            }
          }
        }
        const reservations = purgeExpiredCancellations([...combined.values()], now).filter((reservation) => !expiredIds.has(reservation.id));
        const nextStore = { ...base, reservations };
        hasUnsavedChangesRef.current = !writeBookingStore(nextStore);
        setStorageWarning(hasUnsavedChangesRef.current);
        setStore(nextStore);
        return;
      }
      const deadlines = store.reservations.map(getCancellationExpiry).filter((deadline): deadline is number => deadline !== null);
      if (deadlines.length > 0) {
        timer = window.setTimeout(cleanAndSchedule, Math.min(2_147_483_647, Math.max(0, Math.min(...deadlines) - Date.now())));
      }
    }

    function onVisibilityChange() {
      if (!document.hidden) cleanAndSchedule();
    }

    cleanAndSchedule();
    window.addEventListener("focus", cleanAndSchedule);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", cleanAndSchedule);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [store, storeLoaded]);

  useEffect(() => {
    if (storeLoaded && step === "complete" && activeReservationId && !store.reservations.some((reservation) => reservation.id === activeReservationId)) {
      setActiveReservationId(null);
      setStep("home");
    }
  }, [store, storeLoaded, step, activeReservationId]);

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId);
  const selectedTheater = theaters.find((theater) => theater.id === selectedTheaterId);
  const dates = getDemoDates(new Date()).map(({ key, date }) => ({
    key,
    label: date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }),
  }));
  const screenings = useMemo(() => selectedMovie && selectedTheater && selection.selectedDate
    ? getScreenings(selectedMovie.id, selection.selectedDate, selectedTheater.id)
    : [], [selectedMovie, selectedTheater, selection.selectedDate]);
  const selectedScreening = screenings.find((screening) => screening.id === selection.selectedScreeningId);
  const priceBreakdown = selectedScreening ? calculateBookingPrice(selectedScreening.ticketPrice, selection.audienceCount, discounts) : null;
  const activeReservation = store.reservations.find((reservation) => reservation.id === activeReservationId);

  function handleStartBooking() {
    setDiscounts(createDiscountSelection());
    setPhoneNumber("");
    setPaymentMethod("card");
    setBookingError(null);
    setStorageWarning(false);
    setActiveReservationId(null);
    setSelectedMovieId(null);
    setSelectedTheaterId(null);
    setSelection(createInitialBookingSelection());
    setStep("movie");
  }

  function handleSelectMovie(movieId: string) {
    if (selectedMovieId !== movieId) {
      setDiscounts(createDiscountSelection());
      setSelectedMovieId(movieId);
      setSelectedTheaterId(null);
      setSelection(createInitialBookingSelection());
    }
    setBookingError(null);
    setStep("theater");
  }

  function handleContinueFromMovies() {
    if (!selectedMovie) return;
    setStep("theater");
  }

  function handleSelectRegion(regionId: string) {
    if (regionId === selectedRegionId) return;
    setDiscounts(createDiscountSelection());
    setSelectedRegionId(regionId);
    setSelectedTheaterId(null);
    setSelection((current) => createInitialBookingSelection(current.selectedDate));
    setBookingError(null);
  }

  function handleSelectTheater(theaterId: string) {
    const theater = theaters.find((entry) => entry.id === theaterId && entry.regionId === selectedRegionId);
    if (!theater || theaterId === selectedTheaterId) return;
    setDiscounts(createDiscountSelection());
    setSelectedTheaterId(theaterId);
    setSelection((current) => createInitialBookingSelection(current.selectedDate));
    setBookingError(null);
  }

  function handleContinueFromTheaters() {
    if (!selectedMovie || !selectedTheater) return;
    setSelection((current) => current.selectedDate
      ? current
      : createInitialBookingSelection(dates[0]?.key ?? null));
    setStep("showtime");
  }

  function handleSelectDate(date: string) {
    if (date !== selection.selectedDate) setDiscounts(createDiscountSelection());
    setSelection((current) => updateBookingSelection(current, { type: "date", date }));
  }

  function handleSelectScreening(screeningId: string) {
    if (screeningId !== selection.selectedScreeningId) setDiscounts(createDiscountSelection());
    setSelection((current) => updateBookingSelection(current, { type: "screening", screeningId }));
    setStep("seats");
  }

  function handleAudienceCountChange(count: number) {
    if (count !== selection.audienceCount) setDiscounts(createDiscountSelection());
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
    if (!selectedMovie || !selectedScreening || !isValidOptionalPhoneNumber(phoneNumber)) return;

    const result = attemptDemoPayment({
      movie: selectedMovie,
      screening: selectedScreening,
      audienceCount: selection.audienceCount,
      seatIds: selection.selectedSeatIds,
      reservations: store.reservations,
      phoneNumber,
      paymentMethod,
      discounts,
    });
    if (result.status === "invalid-discount") {
      setBookingError("혜택 인원과 혜택 적용 조건을 다시 확인해 주세요.");
      setStep("review");
      return;
    }
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
    hasUnsavedChangesRef.current = update.storageWarning;
    setStore(update.store);
    setStorageWarning(update.storageWarning);
    setActiveReservationId(result.reservation.id);
    setBookingError(null);
    setStep("complete");
  }

  function handleCancelReservation(reservationId: string) {
    const update = cancelReservationInStore(store, reservationId);
    hasUnsavedChangesRef.current = update.storageWarning;
    setStore(update.store);
    setStorageWarning(update.storageWarning);
  }

  function handleBack() {
    const previousStep: Partial<Record<BookingStep, BookingStep>> = {
      movie: "home",
      theater: "movie",
      showtime: "theater",
      seats: "showtime",
      review: "seats",
      payment: "review",
      lookup: "home",
    };
    setStep(previousStep[step] ?? "home");
  }

  function handleHome() {
    setFoundStampIds([]);
    setBookingError(null);
    setActiveReservationId(null);
    setStep("home");
  }

  const stepLabels: Record<BookingStep, string> = {
    home: "",
    movie: "영화 선택",
    theater: "극장 선택",
    showtime: "상영 선택",
    seats: "좌석 선택",
    review: "예매 확인",
    payment: "결제",
    complete: "예매 완료",
    lookup: "예매 조회·취소",
  };
  const stepNumbers: Record<BookingStep, number> = {
    home: 0,
    movie: 1,
    theater: 2,
    showtime: 3,
    seats: 4,
    review: 5,
    payment: 6,
    complete: 7,
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
          onLookupBooking={() => {
            setStorageWarning(false);
            setStep("lookup");
          }}
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
    case "theater":
      screen = selectedMovie ? (
        <TheaterScreen movie={selectedMovie} regionId={selectedRegionId} selectedTheaterId={selectedTheaterId} onRegionChange={handleSelectRegion} onSelect={handleSelectTheater} onContinue={handleContinueFromTheaters} />
      ) : null;
      break;
    case "showtime":
      screen = selectedMovie && selectedTheater && selection.selectedDate ? (
        <ShowtimeScreen
          theaterName={selectedTheater.name}
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
          key={selectedScreening.id}
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
          phoneNumber={phoneNumber}
          onPhoneNumberChange={(value) => setPhoneNumber(normalizePhoneNumber(value))}
          audienceCount={selection.audienceCount}
          movie={selectedMovie}
          discounts={discounts}
          priceBreakdown={priceBreakdown ?? undefined}
          bookingError={bookingError}
          onDiscountsChange={(value) => { setDiscounts(value); setBookingError(null); }}
          onBack={() => setStep("seats")}
          onPay={() => {
            if (!priceBreakdown) { setBookingError("혜택 적용 조건을 확인해 주세요."); return; }
            setBookingError(null);
            setStep("payment");
          }}
          screening={selectedScreening}
          seatIds={selection.selectedSeatIds}
          total={priceBreakdown?.total ?? computeBookingTotal(selectedScreening.ticketPrice, selection.audienceCount)}
        />
      ) : null;
      break;
    case "payment":
      screen = selectedScreening ? (
        <PaymentScreen total={priceBreakdown?.total ?? computeBookingTotal(selectedScreening.ticketPrice, selection.audienceCount)} priceBreakdown={priceBreakdown ?? undefined} method={paymentMethod} onMethodChange={setPaymentMethod} onPay={handleDemoPayment} onBack={() => setStep("review")} />
      ) : null;
      break;
    case "complete":
      screen = activeReservation ? (
        <CompleteScreen
          cancelled={activeReservation.status === "cancelled"}
          onCancel={() => handleCancelReservation(activeReservation.id)}
          onHome={handleHome}
          reservation={activeReservation}
          foundStampIds={foundStampIds}
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
        <LookupScreen
          onCancelReservation={handleCancelReservation}
          onHome={handleHome}
          reservations={store.reservations}
          storageWarning={storageWarning}
        />
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

  const atmosphereMovieId = step === "home" || step === "lookup" ? undefined : selectedMovie?.id;

  return (
    <>
    <MovieAtmosphere movieId={atmosphereMovieId} />
    <main className={`cinema-shell${atmosphereMovieId ? ` ${movieAtmosphereShellClass}` : ""}`} style={{ ...getMovieAtmosphereStyle(atmosphereMovieId), position: "relative", zIndex: 1 }}>
      <KioskHeader
        onBack={step === "home" ? undefined : handleBack}
        onHome={step === "home" ? undefined : handleHome}
        onDiscoverLogo={() => discoverStamp("reel")}
        stepCount={7}
        stepLabel={stepLabels[step]}
        stepNumber={stepNumbers[step]}
      />
      {step !== "lookup" ? <CinemaDiscoveries movieId={atmosphereMovieId} foundStampIds={foundStampIds} onDiscover={discoverStamp} /> : null}
      {screen}
    </main>
    </>
  );
}
