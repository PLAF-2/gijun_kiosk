# Cinema Reservation Kiosk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Yakitei ordering demo with a Korean-language, touch-friendly cinema reservation kiosk demo that supports booking and cancellation.

**Architecture:** Keep the current Next.js App Router shell and replace its customer-facing flow. Put sample cinema data, booking rules, and local persistence in focused `src/lib/cinema` modules; render the flow from small screens coordinated by a single client-side `KioskApp`. Store reservations in versioned `localStorage` so the same browser can look them up, cancel them, and release their seats.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, global CSS, static export for GitHub Pages, browser `localStorage`.

---

## File Map

### Create

- `src/lib/cinema/types.ts` — movie, local poster path, screening, seat, reservation, and booking-step types.
- `src/lib/cinema/catalog.ts` — user-selected movie metadata, local poster paths, date generation, CGV-style sample ticket pricing, screening generation, and seat layout.
- `src/lib/cinema/booking.ts` — ticket total, occupied-seat calculation, reservation creation, lookup, and cancellation helpers.
- `src/lib/cinema/booking.test.ts` — booking price, seat-count validation, occupancy, and cancellation seat-release checks.
- `public/posters/` — ten optimized local movie poster images supplied by the user.
- `src/lib/cinema/booking-store.ts` — safe versioned `localStorage` read/write operations.
- `src/components/cinema/kiosk-app.tsx` — client state machine and callbacks for booking and cancellation.
- `src/components/cinema/kiosk-header.tsx` — brand, progress indicator, and navigation controls.
- `src/components/cinema/start-screen.tsx` — start booking and booking lookup/cancel entry points.
- `src/components/cinema/movie-screen.tsx` — poster-led sample movie selection.
- `src/components/cinema/showtime-screen.tsx` — date and showtime selection.
- `src/components/cinema/seat-screen.tsx` — audience count, seat map, and selected-seat summary.
- `src/components/cinema/booking-review-screen.tsx` — review and simulated payment action.
- `src/components/cinema/complete-screen.tsx` — reservation receipt and immediate cancellation entry.
- `src/components/cinema/lookup-screen.tsx` — reservation-number lookup, booking details, and cancellation confirmation.

### Modify

- `src/app/page.tsx` — render the cinema `KioskApp`.
- `src/app/layout.tsx` — change metadata to a cinema reservation kiosk and keep Korean document language.
- `src/app/globals.css` — replace restaurant styling with the approved navy, high-contrast, landscape kiosk system.
- `package.json` — rename the package from `yakitei-kiosk` to `cinema-reservation-kiosk`; point the test command at the new cinema booking test.
- `README.md` — document the cinema demo, its booking/cancellation flow, and local run/build commands.

### Remove after the new app is wired

- `src/components/kiosk/` — old restaurant ordering screens and their test.
- `src/lib/kiosk/` — Yakitei menu and topping recommendation logic and its test.
- `public/yakitei-teriyaki-yakisoba.png`
- `public/yakitei-salt-yakisoba.png`
- `public/yakitei-cola.png`
- `public/yakitei-cider.png`
- `public/yakitei-draft-beer.png`
- `public/yakitei-highball.png`
- `public/yakitei-kiosk-mockup.svg`
- `public/yakitei-kiosk-background.svg`

Keep existing recommendation and Supabase modules outside the replaced kiosk flow untouched; they are not needed by the new home page and can be evaluated separately later.

## Implementation Tasks

### Task 1: Define cinema data and deterministic sample screens

**Files:**
- Create: `src/lib/cinema/types.ts`
- Create: `src/lib/cinema/catalog.ts`

- [ ] **Step 1: Define the domain types**

Add the shared model before building components:

```ts
export type Movie = {
  id: string;
  title: string;
  ageRating: "전체" | "12세" | "15세";
  runtimeMinutes: number;
  description: string;
  posterTheme: "violet" | "teal" | "amber" | "blue";
};

export type Seat = {
  id: string;
  row: string;
  number: number;
};

export type Screening = {
  id: string;
  movieId: string;
  date: string;
  startTime: string;
  auditorium: string;
  ticketPrice: number;
  seats: Seat[];
  blockedSeatIds: string[];
};

export type ReservationStatus = "booked" | "cancelled";

export type Reservation = {
  id: string;
  code: string;
  screeningId: string;
  movieId: string;
  movieTitle: string;
  screeningDate: string;
  startTime: string;
  auditorium: string;
  audienceCount: number;
  seatIds: string[];
  total: number;
  status: ReservationStatus;
  createdAt: string;
};

export type BookingStep =
  | "home"
  | "movie"
  | "showtime"
  | "seats"
  | "review"
  | "complete"
  | "lookup";

export type BookingStore = {
  version: 1;
  reservations: Reservation[];
};
```

- [ ] **Step 2: Add fictional movies and date helpers**

Create four original demo titles and local CSS poster themes. Keep dates as local calendar keys to avoid shifting the selected day through UTC conversion:

```ts
import type { Movie, Screening, Seat } from "@/lib/cinema/types";

export const movies: Movie[] = [
  { id: "starlight-post", title: "별빛 우체국", ageRating: "전체", runtimeMinutes: 108, description: "밤하늘의 편지가 이어 주는 작은 기적", posterTheme: "violet" },
  { id: "last-wave", title: "마지막 파도", ageRating: "15세", runtimeMinutes: 121, description: "모두가 떠난 해안에서 시작된 여름", posterTheme: "teal" },
  { id: "today-us", title: "오늘의 우리", ageRating: "12세", runtimeMinutes: 96, description: "오래된 친구들이 다시 만난 하루", posterTheme: "amber" },
  { id: "monday-detective", title: "월요일의 탐정", ageRating: "12세", runtimeMinutes: 113, description: "평범한 출근길에 벌어진 뜻밖의 사건", posterTheme: "blue" },
];

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDemoDates(today: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    return { key: toLocalDateKey(date), date };
  });
}
```

- [ ] **Step 3: Generate screenings and seat maps**

Use stable screening IDs and the same 32 seats for each sample screening. Mark a small, deterministic set as unavailable to make the map look active:

```ts
export function createSeatMap(): Seat[] {
  return ["A", "B", "C", "D"].flatMap((row) =>
    Array.from({ length: 8 }, (_, index) => ({
      id: `${row}${index + 1}`,
      row,
      number: index + 1,
    })),
  );
}

const showtimes = ["10:20", "13:10", "16:00", "19:15"];

export function getScreenings(movieId: string, date: string): Screening[] {
  return showtimes.map((startTime, index) => ({
    id: `${movieId}:${date}:${startTime.replace(":", "")}`,
    movieId,
    date,
    startTime,
    auditorium: `상영관 ${index + 1}`,
    ticketPrice: 12000,
    seats: createSeatMap(),
    blockedSeatIds: index === 0 ? ["A1", "A2", "D7"] : ["B4", "C5"],
  }));
}
```

- [ ] **Step 4: Review the data module boundaries**

Keep catalog generation free of React and browser APIs. Components receive `Movie`, `Screening`, and `Seat` values instead of rebuilding the cinema data themselves.

- [ ] **Step 5: Commit the cinema catalog**

```bash
git add src/lib/cinema/types.ts src/lib/cinema/catalog.ts
git commit -m "feat: add cinema demo catalog"
```

### Task 2: Implement booking and seat rules with focused tests

**Files:**
- Create: `src/lib/cinema/booking.ts`
- Test: `src/lib/cinema/booking.test.ts`

- [ ] **Step 1: Write the booking behavior tests**

Add tests for the ticket total, exact seat count, occupancy, and cancellation releasing booked seats:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { cancelReservation, canContinueWithSeats, computeBookingTotal, createReservation, findReservation, getOccupiedSeatIds } from "@/lib/cinema/booking";
import { getScreenings, movies } from "@/lib/cinema/catalog";
import type { Reservation } from "@/lib/cinema/types";

const screening = getScreenings("today-us", "2026-09-29")[0];
const booking: Reservation = {
  id: "reservation-1",
  code: "C123456",
  screeningId: screening.id,
  movieId: screening.movieId,
  movieTitle: "오늘의 우리",
  screeningDate: screening.date,
  startTime: screening.startTime,
  auditorium: screening.auditorium,
  audienceCount: 2,
  seatIds: ["A3", "A4"],
  total: 24000,
  status: "booked",
  createdAt: "2026-09-29T00:00:00.000Z",
};

test("ticket total multiplies the sample ticket price by audience count", () => {
  assert.equal(computeBookingTotal(12000, 2), 24000);
});

test("reservation creation records the screening and lookup ignores code casing", () => {
  const created = createReservation(movies[0], screening, 1, ["A3"], [], new Date("2026-09-29T00:00:00.000Z"));
  assert.match(created.code, /^C\d{6}$/);
  assert.equal(created.movieTitle, movies[0].title);
  assert.equal(findReservation([created], created.code.toLowerCase())?.id, created.id);
});

test("seat selection is valid only when seat count matches audience count", () => {
  assert.equal(canContinueWithSeats(2, ["A3", "A4"]), true);
  assert.equal(canContinueWithSeats(2, ["A3"]), false);
  assert.equal(canContinueWithSeats(2, ["A3", "A3"]), false);
});

test("booked seats become available again after cancellation", () => {
  const occupied = getOccupiedSeatIds(screening, [booking]);
  assert.equal(occupied.has("A3"), true);

  const cancelled = cancelReservation([booking], booking.id);
  const released = getOccupiedSeatIds(screening, cancelled);
  assert.equal(released.has("A3"), false);
  assert.equal(released.has("A1"), true);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --import tsx --test src/lib/cinema/booking.test.ts`  
Expected: FAIL because `src/lib/cinema/booking.ts` does not exist yet.

- [ ] **Step 3: Implement price, occupancy, and seat-count helpers**

In `booking.ts`, add this code:

```ts
import type { Movie, Reservation, Screening } from "@/lib/cinema/types";

export function computeBookingTotal(ticketPrice: number, audienceCount: number) {
  return ticketPrice * audienceCount;
}

export function getOccupiedSeatIds(screening: Screening, reservations: Reservation[]) {
  const bookedSeatIds = reservations
    .filter((reservation) => reservation.screeningId === screening.id && reservation.status === "booked")
    .flatMap((reservation) => reservation.seatIds);
  return new Set([...screening.blockedSeatIds, ...bookedSeatIds]);
}

export function canContinueWithSeats(audienceCount: number, seatIds: string[]) {
  return audienceCount > 0 && seatIds.length === audienceCount && new Set(seatIds).size === seatIds.length;
}
```

- [ ] **Step 4: Add reservation creation, lookup, and cancellation**

Append the following functions to `booking.ts`; they use the same names and fields as the shared type file:

```ts
export function createReservation(
  movie: Movie,
  screening: Screening,
  audienceCount: number,
  seatIds: string[],
  existingCodes: string[],
  now = new Date(),
) {
  const usedCodes = new Set(existingCodes);
  let code = "";
  do {
    code = `C${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
  } while (usedCodes.has(code));

  return {
    id: crypto.randomUUID(),
    code,
    screeningId: screening.id,
    movieId: screening.movieId,
    movieTitle: movie.title,
    screeningDate: screening.date,
    startTime: screening.startTime,
    auditorium: screening.auditorium,
    audienceCount,
    seatIds: [...seatIds],
    total: computeBookingTotal(screening.ticketPrice, audienceCount),
    status: "booked" as const,
    createdAt: now.toISOString(),
  };
}

export function findReservation(reservations: Reservation[], code: string) {
  const normalizedCode = code.trim().toUpperCase();
  return reservations.find((reservation) => reservation.code === normalizedCode) ?? null;
}

export function cancelReservation(reservations: Reservation[], reservationId: string) {
  return reservations.map((reservation) =>
    reservation.id === reservationId && reservation.status === "booked"
      ? { ...reservation, status: "cancelled" as const }
      : reservation,
  );
}
```

- [ ] **Step 5: Run the focused test and confirm it passes**

Run: `node --import tsx --test src/lib/cinema/booking.test.ts`  
Expected: all four tests pass.

- [ ] **Step 6: Commit the booking rules**

```bash
git add src/lib/cinema/booking.ts src/lib/cinema/booking.test.ts
git commit -m "feat: add cinema booking rules"
```

- [ ] **Step 7: Keep booking mutations in one place**

All screens call `KioskApp` callbacks. They do not modify reservation arrays or seat occupancy directly.

### User-approved scope update: selected films, posters, and CGV-style demo prices

After the original four placeholder films were added, the user supplied ten poster images and requested these titles for the kiosk. This update supersedes the four fictional placeholders in Task 1. Use these entries and keep their display order:

| ID | Korean title | Rating | Runtime | Poster path |
| --- | --- | --- | ---: | --- |
| `chiikawa-mermaid-island` | 극장판 치이카와: 인어 섬의 비밀 | 전체 | 99분 | `/posters/chiikawa.jpg` |
| `home-alone` | 나 홀로 집에 | 전체 | 103분 | `/posters/home-alone.jpg` |
| `la-la-land` | 라라랜드 | 12세 | 128분 | `/posters/la-la-land.jpg` |
| `manyak-e-woori` | 만약에 우리 | 15세 | 115분 | `/posters/if-we-were-us.jpg` |
| `moana-2026` | 모아나 | 전체 | 115분 | `/posters/moana.jpg` |
| `the-odyssey` | 오디세이 | 15세 | 172분 | `/posters/the-odyssey.jpg` |
| `oneul-bam-segyeeseo` | 오늘 밤, 세계에서 이 사랑이 사라진다 해도 | 12세 | 121분 | `/posters/even-if-this-love-disappears-tonight.jpg` |
| `arrietty` | 마루 밑 아리에티 | 전체 | 94분 | `/posters/arrietty.jpg` |
| `begin-again` | 비긴 어게인 | 15세 | 104분 | `/posters/begin-again.jpg` |
| `jurassic-world-rebirth` | 쥬라기 월드: 새로운 시작 | 12세 | 133분 | `/posters/jurassic-world-rebirth.jpg` |

The user also delegated showtimes and seats, so keep the four demo showtimes (10:20, 13:10, 16:00, 19:15) and 4x8 seats. Use standard adult 2D example prices: 14,000원 Monday–Thursday and 15,000원 Friday–Sunday. All showtimes begin after 10:00. Since CGV states that ticket rates and time bands can vary by theater, label the UI price as a general 2D example and do not imply live CGV integration. Do not add runtime movie editing or poster upload screens; these user-supplied entries form the seeded catalog.

### Task 2A: Replace placeholders with the user-supplied movie catalog and pricing

**Files:**
- Modify: `src/lib/cinema/types.ts`
- Modify: `src/lib/cinema/catalog.ts`
- Modify: `src/lib/cinema/catalog.test.ts`
- Use: ten image files under `public/posters/` from the update above

- [ ] **Step 1: Extend Movie and replace the sample movies**

Add `posterSrc: string` to `Movie`. Replace the four fictional placeholder movies with the ten user-selected entries and exact titles, age ratings, runtimes, and poster paths listed in the scope update. Use short Korean descriptions that identify each movie without repeating poster text. The local posters must be available without network access.

- [ ] **Step 2: Add weekday and weekend 2D demo prices**

Generate a ticket price from the local calendar date key: 14,000원 Monday–Thursday and 15,000원 Friday–Sunday. Do not parse the date through UTC. Keep the screening times at 10:20, 13:10, 16:00, and 19:15 and the existing deterministic 4x8 seat maps.

- [ ] **Step 3: Write/extend catalog tests before changing behavior**

Verify the exact ten movie IDs/titles/poster paths and required ratings/runtimes, a weekday price of 14,000원, a Saturday or Sunday price of 15,000원, and the existing local date, stable screening, seat-map, and blocked-seat behavior. Run the focused catalog tests red before implementation and green afterward.

- [ ] **Step 4: Check every poster asset**

Confirm that each `posterSrc` points to an existing local file in `public/posters`. Keep descriptions and poster metadata in the catalog; do not add file upload/storage behavior.

- [ ] **Step 5: Commit the selected movie catalog**

```bash
git add src/lib/cinema/types.ts src/lib/cinema/catalog.ts src/lib/cinema/catalog.test.ts public/posters
git commit -m "feat: add selected cinema posters and CGV-style prices"
```

### Task 3: Add safe local booking persistence

**Files:**
- Create: `src/lib/cinema/booking-store.ts`
- Test: `src/lib/cinema/booking-store.test.ts`

- [ ] **Step 1: Define the storage key and empty store**

```ts
import type { BookingStore } from "@/lib/cinema/types";

const STORAGE_KEY = "cinema-kiosk-bookings-v1";

export function createEmptyBookingStore(): BookingStore {
  return { version: 1, reservations: [] };
}
```

- [ ] **Step 2: Read, validate, and write browser storage safely**

Check the stored object shape before trusting it. Server rendering and storage failures must fall back to an empty store:

```ts
import type { Reservation } from "@/lib/cinema/types";

function isReservation(value: unknown): value is Reservation {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" &&
    typeof item.code === "string" &&
    typeof item.screeningId === "string" &&
    typeof item.movieId === "string" &&
    typeof item.movieTitle === "string" &&
    typeof item.screeningDate === "string" &&
    typeof item.startTime === "string" &&
    typeof item.auditorium === "string" &&
    typeof item.audienceCount === "number" &&
    Array.isArray(item.seatIds) && item.seatIds.every((seatId) => typeof seatId === "string") &&
    typeof item.total === "number" &&
    (item.status === "booked" || item.status === "cancelled") &&
    typeof item.createdAt === "string";
}

export function readBookingStore(): BookingStore {
  if (typeof window === "undefined") return createEmptyBookingStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyBookingStore();

    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" && value !== null &&
      "version" in value && value.version === 1 &&
      "reservations" in value && Array.isArray(value.reservations) &&
      value.reservations.every(isReservation)
    ) {
      return value as BookingStore;
    }
  } catch {
    return createEmptyBookingStore();
  }

  return createEmptyBookingStore();
}

export function writeBookingStore(store: BookingStore) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Keep storage fallback visible but non-blocking**

The app should still permit an in-memory demo booking if storage writing fails. Show a small message that lookup will not survive a reload in that browser session.

- [ ] **Step 4: Commit local reservation persistence**

```bash
git add src/lib/cinema/booking-store.ts
git commit -m "feat: persist cinema demo bookings locally"
```

### Task 4: Add the cinema kiosk shell and home/movie steps

This is an incremental checkpoint: implement the home and movie screens in this task. Do not import the showtime, seat, review, completion, or lookup screens from the later tasks before those files exist. Hydrate the booking store after mount. The showtime and lookup entry points may render temporary placeholders until Tasks 5–7 replace them with working flows.

**Files:**
- Create: `src/components/cinema/kiosk-header.tsx`
- Create: `src/components/cinema/start-screen.tsx`
- Create: `src/components/cinema/movie-screen.tsx`
- Create: `src/components/cinema/kiosk-app.tsx`
- Test: `src/components/cinema/kiosk-app.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Build the shared header**

Expose only the current step and back/home callbacks; avoid duplicating progress markup across screens:

```tsx
type KioskHeaderProps = {
  stepLabel: string;
  stepNumber: number;
  stepCount: number;
  onHome?: () => void;
  onBack?: () => void;
};

export function KioskHeader({ stepLabel, stepNumber, stepCount, onHome, onBack }: KioskHeaderProps) {
  return (
    <header className="cinema-header">
      <div className="cinema-brand">CINEMA <span>RESERVATION</span></div>
      <p aria-live="polite">{stepNumber} / {stepCount} · {stepLabel}</p>
      <nav aria-label="키오스크 이동">
        {onBack ? <button type="button" onClick={onBack}>이전</button> : null}
        {onHome ? <button type="button" onClick={onHome}>처음으로</button> : null}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Add a home screen with both entry points**

The primary action starts a reservation. The secondary action opens booking lookup and cancellation:

```tsx
type StartScreenProps = {
  onStartBooking: () => void;
  onLookupBooking: () => void;
};

export function StartScreen({ onStartBooking, onLookupBooking }: StartScreenProps) {
  return (
    <section className="screen-card cinema-home">
      <p className="eyebrow">MOVIE RESERVATION</p>
      <h1>오늘의 영화를 예매하세요</h1>
      <p>영화와 상영 시간을 고른 뒤 좌석을 선택해 주세요.</p>
      <div className="home-actions">
        <button className="primary-button" type="button" onClick={onStartBooking}>
          예매 시작
        </button>
        <button className="secondary-button" type="button" onClick={onLookupBooking}>
          예매 조회·취소
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add poster-led movie cards**

Render each movie's local `posterSrc` image and keep the title, age rating, runtime, and description as HTML text. Use an empty alt value for the image because the same button contains its movie title. Each card has a clear selected state:

```tsx
import type { Movie } from "@/lib/cinema/types";

type MovieScreenProps = {
  movies: Movie[];
  selectedMovieId: string | null;
  onSelect: (movieId: string) => void;
  onContinue: () => void;
};

export function MovieScreen({ movies, selectedMovieId, onSelect, onContinue }: MovieScreenProps) {
  return (
    <section className="screen-card">
      <div className="screen-heading"><p className="eyebrow">STEP 1</p><h1>영화를 선택하세요</h1></div>
      <div className="movie-grid">
        {movies.map((movie) => (
          <button
            aria-pressed={selectedMovieId === movie.id}
            className={`movie-card ${selectedMovieId === movie.id ? "is-selected" : ""}`}
            key={movie.id}
            onClick={() => onSelect(movie.id)}
            type="button"
          >
            <img alt="" className={`movie-poster poster-${movie.posterTheme}`} src={movie.posterSrc} />
            <span className="movie-meta"><strong>{movie.title}</strong><span>{movie.ageRating} · {movie.runtimeMinutes}분</span><span>{movie.description}</span></span>
          </button>
        ))}
      </div>
      <button className="primary-button" disabled={!selectedMovieId} onClick={onContinue} type="button">
        상영 시간 선택
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Wire the initial client state machine**

Use the `BookingStep` union from `types.ts`; initialize the store after mount to avoid reading `localStorage` during server rendering. Do not write the initial empty store before the read finishes, because that would erase existing bookings:

```ts
"use client";

import { useEffect, useState } from "react";
import { canContinueWithSeats, cancelReservation, computeBookingTotal, createReservation, getOccupiedSeatIds } from "@/lib/cinema/booking";
import { getDemoDates, getScreenings, movies } from "@/lib/cinema/catalog";
import { readBookingStore, writeBookingStore } from "@/lib/cinema/booking-store";
import { BookingReviewScreen } from "@/components/cinema/booking-review-screen";
import { CompleteScreen } from "@/components/cinema/complete-screen";
import { KioskHeader } from "@/components/cinema/kiosk-header";
import { LookupScreen } from "@/components/cinema/lookup-screen";
import { MovieScreen } from "@/components/cinema/movie-screen";
import { SeatScreen } from "@/components/cinema/seat-screen";
import { ShowtimeScreen } from "@/components/cinema/showtime-screen";
import { StartScreen } from "@/components/cinema/start-screen";
import type { BookingStep, BookingStore } from "@/lib/cinema/types";

export function CinemaKioskApp() {
const [step, setStep] = useState<BookingStep>("home");
const [store, setStore] = useState<BookingStore>({ version: 1, reservations: [] });
const [storeLoaded, setStoreLoaded] = useState(false);
const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [selectedScreeningId, setSelectedScreeningId] = useState<string | null>(null);
const [audienceCount, setAudienceCount] = useState(1);
const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
const [bookingError, setBookingError] = useState("");
const [storageWarning, setStorageWarning] = useState(false);
const selectedMovie = movies.find((movie) => movie.id === selectedMovieId) ?? null;
const screenings = selectedMovie && selectedDate ? getScreenings(selectedMovie.id, selectedDate) : [];
const selectedScreening = screenings.find((screening) => screening.id === selectedScreeningId) ?? null;
const activeReservation = store.reservations.find((entry) => entry.id === activeReservationId) ?? null;

useEffect(() => {
  setStore(readBookingStore());
  setStoreLoaded(true);
}, []);

useEffect(() => {
  if (storeLoaded) writeBookingStore(store);
}, [store, storeLoaded]);

if (!storeLoaded) {
  return <main className="cinema-shell" aria-busy="true"><p>예매 정보를 준비하고 있어요.</p></main>;
}

function handleStartBooking() {
  setSelectedMovieId(null);
  setSelectedDate(null);
  setSelectedScreeningId(null);
  setAudienceCount(1);
  setSelectedSeatIds([]);
  setStep("movie");
}

function handleSelectMovie(movieId: string) {
  setSelectedMovieId(movieId);
  setSelectedDate(null);
  setSelectedScreeningId(null);
  setSelectedSeatIds([]);
}

function handleContinueFromMovies() {
  if (!selectedMovie) return;
  setSelectedDate(getDemoDates(new Date())[0].key);
  setStep("showtime");
}

function handleSelectDate(date: string) {
  setSelectedDate(date);
  setSelectedScreeningId(null);
  setSelectedSeatIds([]);
}

function handleHome() {
  setStep("home");
  setActiveReservationId(null);
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
  home: 0, movie: 1, showtime: 2, seats: 3, review: 4, complete: 5, lookup: 0,
};
```

In the payment handler, if `writeBookingStore(nextStore)` returns `false`, retain `nextStore` in React state and show the user that the demo booking will not survive a reload.

Render one screen per step and pass state down as props; do not keep separate copies of the selected movie or screening in child components:

```tsx
const dateOptions = getDemoDates(new Date()).map(({ key, date }) => ({
  key,
  label: new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }).format(date),
}));
const screen = (() => {
  switch (step) {
    case "home": return <StartScreen onStartBooking={handleStartBooking} onLookupBooking={() => setStep("lookup")} />;
    case "movie": return <MovieScreen movies={movies} selectedMovieId={selectedMovieId} onSelect={handleSelectMovie} onContinue={handleContinueFromMovies} />;
    case "showtime": return selectedMovie && selectedDate ? <ShowtimeScreen movie={selectedMovie} dates={dateOptions} selectedDate={selectedDate} screenings={screenings} reservations={store.reservations} selectedScreeningId={selectedScreeningId} onSelectDate={handleSelectDate} onSelectScreening={handleSelectScreening} /> : null;
    case "seats": return selectedScreening ? <SeatScreen screening={selectedScreening} reservations={store.reservations} audienceCount={audienceCount} selectedSeatIds={selectedSeatIds} onAudienceCountChange={handleAudienceCountChange} onToggleSeat={handleToggleSeat} onContinue={() => setStep("review")} /> : null;
    case "review": return selectedMovie && selectedScreening ? <BookingReviewScreen movie={selectedMovie} screening={selectedScreening} audienceCount={audienceCount} seatIds={selectedSeatIds} total={computeBookingTotal(selectedScreening.ticketPrice, audienceCount)} onBack={() => setStep("seats")} onPay={handleDemoPayment} /> : null;
    case "complete": return activeReservation && selectedMovie && selectedScreening ? <CompleteScreen reservation={activeReservation} movie={selectedMovie} screening={selectedScreening} cancelled={activeReservation.status === "cancelled"} onCancel={() => handleCancelReservation(activeReservation.id)} onHome={handleHome} /> : null;
    case "lookup": return <LookupScreen reservations={store.reservations} onCancelReservation={handleCancelReservation} onHome={handleHome} />;
  }
})();

return <main className="cinema-shell"><KioskHeader stepLabel={stepLabels[step]} stepNumber={stepNumbers[step]} stepCount={5} onHome={step === "home" ? undefined : handleHome} onBack={step === "home" ? undefined : handleBack} />{bookingError ? <p role="alert">{bookingError}</p> : null}{screen}{storageWarning ? <p role="status">이 브라우저에서는 예매 내역이 새로고침 후 유지되지 않습니다.</p> : null}</main>;
}
```

- [ ] **Step 5: Replace the App Router entry and metadata**

`src/app/page.tsx` renders only `CinemaKioskApp`. Change metadata to `영화관 키오스크` and a Korean-language description; preserve `<html lang="ko">`:

```tsx
// src/app/page.tsx
import { CinemaKioskApp } from "@/components/cinema/kiosk-app";

export default function HomePage() {
  return <CinemaKioskApp />;
}
```

```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "영화관 키오스크",
  description: "영화와 좌석을 선택하고 예매를 관리하는 시연용 키오스크",
};
```

### Task 5: Add date, screening, and seat selection

**Files:**
- Create: `src/components/cinema/showtime-screen.tsx`
- Create: `src/components/cinema/seat-screen.tsx`
- Test: `src/components/cinema/showtime-seat-screen.test.tsx`
- Modify: `src/components/cinema/kiosk-app.tsx`

- [ ] **Step 1: Render the seven local demo dates and showtimes**

The screen receives `movie`, `dates`, and `screenings` as props and reports a selected screening ID. It does not generate data or write storage:

```tsx
import { getOccupiedSeatIds } from "@/lib/cinema/booking";
import type { Movie, Reservation, Screening } from "@/lib/cinema/types";

type DateOption = { key: string; label: string };
type ShowtimeScreenProps = {
  movie: Movie;
  dates: DateOption[];
  selectedDate: string;
  screenings: Screening[];
  reservations: Reservation[];
  selectedScreeningId: string | null;
  onSelectDate: (date: string) => void;
  onSelectScreening: (screeningId: string) => void;
};

export function ShowtimeScreen(props: ShowtimeScreenProps) {
  return (
    <section className="screen-card">
      <div className="screen-heading"><p className="eyebrow">{props.movie.title}</p><h1>날짜와 시간을 선택하세요</h1></div>
      <div aria-label="상영 날짜" className="date-options">
        {props.dates.map((date) => (
          <button aria-pressed={date.key === props.selectedDate} key={date.key} onClick={() => props.onSelectDate(date.key)} type="button">{date.label}</button>
        ))}
      </div>
      <div aria-label="상영 시간" className="showtime-grid">
        {props.screenings.map((screening) => {
          const occupied = getOccupiedSeatIds(screening, props.reservations);
          return (
            <button aria-pressed={screening.id === props.selectedScreeningId} key={screening.id} onClick={() => props.onSelectScreening(screening.id)} type="button">
              <strong>{screening.startTime}</strong><span>{screening.auditorium}</span>
              <span>잔여 좌석 {screening.seats.length - occupied.size}석</span>
              <span>{screening.ticketPrice.toLocaleString("ko-KR")}원 / 1인</span>
            </button>
          );
        })}
      </div>
      <p className="pricing-note">CGV 일반 2D 성인 기준 예시 요금이며, 실제 금액은 지점에 따라 다를 수 있습니다.</p>
    </section>
  );
}
```

When a screening has no available seats, label it `매진` and disable its button. Give each labeled date, showtime, audience, seat-legend, and seat-map group a semantic `role="group"`.

- [ ] **Step 2: Reset downstream selections when screening changes**

Changing either date or showtime clears the screening and seats. Selecting a new showtime starts with a clean seat map:

```ts
function handleSelectDate(date: string) {
  setSelectedDate(date);
  setSelectedScreeningId(null);
  setSelectedSeatIds([]);
}

function handleSelectScreening(screeningId: string) {
  if (screeningId !== selectedScreeningId) setSelectedSeatIds([]);
  setSelectedScreeningId(screeningId);
  setStep("seats");
}
```

- [ ] **Step 3: Add audience count and seat-map interactions**

Use `getOccupiedSeatIds(screening, store.reservations)` to disable seeded and booked seats. Remove a selected seat when tapped again; refuse new seats once the audience count is reached. Show the ticket total based on `screening.ticketPrice`, and include the CGV general adult 2D example-price note on the showtime/seat flow. Expose the interaction through explicit props:

```tsx
import { canContinueWithSeats, getOccupiedSeatIds } from "@/lib/cinema/booking";
import type { Reservation, Screening } from "@/lib/cinema/types";

type SeatScreenProps = {
  screening: Screening;
  reservations: Reservation[];
  audienceCount: number;
  selectedSeatIds: string[];
  onAudienceCountChange: (count: number) => void;
  onToggleSeat: (seatId: string) => void;
  onContinue: () => void;
};

export function SeatScreen(props: SeatScreenProps) {
  const occupiedSeatIds = getOccupiedSeatIds(props.screening, props.reservations);
  const rows = ["A", "B", "C", "D"].map((row) => [row, props.screening.seats.filter((seat) => seat.row === row)] as const);
  const canContinue = canContinueWithSeats(props.audienceCount, props.selectedSeatIds);

  return (
    <section className="screen-card">
      <div className="screen-heading"><p className="eyebrow">{props.screening.date} · {props.screening.startTime}</p><h1>인원과 좌석을 선택하세요</h1></div>
      <div aria-label="관람 인원" className="audience-picker">
        <button aria-label="인원 줄이기" disabled={props.audienceCount <= 1} onClick={() => props.onAudienceCountChange(props.audienceCount - 1)} type="button">−</button>
        <span>{props.audienceCount}명</span>
        <button aria-label="인원 늘리기" disabled={props.audienceCount >= 8} onClick={() => props.onAudienceCountChange(props.audienceCount + 1)} type="button">＋</button>
      </div>
      <div className="screen-indicator">SCREEN</div>
      <div aria-label="좌석 상태 안내" className="seat-legend"><span>선택 가능</span><span>선택됨</span><span>선택 불가</span></div>
      <div className="seat-map">
        {rows.map(([row, seats]) => (
          <div className="seat-row" key={row}>
            <span aria-hidden="true">{row}</span>
            {seats.map((seat) => {
              const occupied = occupiedSeatIds.has(seat.id);
              const selected = props.selectedSeatIds.includes(seat.id);
              return (
                <button
                  aria-label={`${row}열 ${seat.number}번 좌석${occupied ? " 선택 불가" : selected ? " 선택됨" : " 선택 가능"}`}
                  aria-pressed={selected}
                  className={`seat ${occupied ? "seat-taken" : selected ? "seat-selected" : "seat-open"}`}
                  disabled={occupied}
                  key={seat.id}
                  onClick={() => props.onToggleSeat(seat.id)}
                  type="button"
                >{seat.number}</button>
              );
            })}
          </div>
        ))}
      </div>
      <p>{props.selectedSeatIds.length} / {props.audienceCount}석 선택 · {(props.screening.ticketPrice * props.audienceCount).toLocaleString("ko-KR")}원</p>
      <button className="primary-button" disabled={!canContinue} onClick={props.onContinue} type="button">예매 내용 확인</button>
    </section>
  );
}
```

In `KioskApp`, changing audience count trims excess selected seats; tapping an unavailable seat or selecting more than the audience count has no effect:

```ts
function handleAudienceCountChange(nextCount: number) {
  setAudienceCount(nextCount);
  setSelectedSeatIds((current) => current.slice(0, nextCount));
}

function handleToggleSeat(seatId: string) {
  if (!selectedScreening) return;
  const occupied = getOccupiedSeatIds(selectedScreening, store.reservations);
  if (occupied.has(seatId)) return;

    setBookingError("");
    setSelectedSeatIds((current) => {
    if (current.includes(seatId)) return current.filter((id) => id !== seatId);
    if (current.length >= audienceCount) return current;
    return [...current, seatId];
  });
}
```

- [ ] **Step 4: Require exactly one seat per attendee**

Keep the continue action disabled until `canContinueWithSeats(audienceCount, selectedSeatIds)` returns `true`. Render row labels, screen position, occupied state labels, selected count, and total price.

- [ ] **Step 5: Commit the booking selection flow**

```bash
git add src/components/cinema src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add cinema movie and seat selection"
```

### Task 6: Add review, simulated payment, and immediate cancellation

**Files:**
- Create: `src/components/cinema/booking-review-screen.tsx`
- Create: `src/components/cinema/complete-screen.tsx`
- Modify: `src/components/cinema/kiosk-app.tsx`

- [ ] **Step 1: Render the booking review**

Show movie, date, auditorium, start time, audience count, seats, and total. The only payment control is explicitly labeled `데모 결제 완료`:

```tsx
import type { Movie, Screening } from "@/lib/cinema/types";

type BookingReviewScreenProps = {
  movie: Movie;
  screening: Screening;
  audienceCount: number;
  seatIds: string[];
  total: number;
  onBack: () => void;
  onPay: () => void;
};

export function BookingReviewScreen(props: BookingReviewScreenProps) {
  return (
    <section className="screen-card">
      <div className="screen-heading"><p className="eyebrow">FINAL CHECK</p><h1>예매 내용을 확인하세요</h1></div>
      <dl className="booking-summary">
        <div><dt>영화</dt><dd>{props.movie.title}</dd></div>
        <div><dt>상영</dt><dd>{props.screening.date} {props.screening.startTime} · {props.screening.auditorium}</dd></div>
        <div><dt>인원</dt><dd>{props.audienceCount}명</dd></div>
        <div><dt>좌석</dt><dd>{props.seatIds.join(", ")}</dd></div>
        <div><dt>결제 금액</dt><dd>{props.total.toLocaleString("ko-KR")}원</dd></div>
      </dl>
      <div className="screen-actions">
        <button className="secondary-button" onClick={props.onBack} type="button">좌석 다시 선택</button>
        <button className="primary-button" onClick={props.onPay} type="button">데모 결제 완료</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create and persist the reservation on demo payment**

Recheck the seat count and occupancy inside the callback before creating a reservation. Add the reservation to the store, persist it, set `activeReservationId`, and show the completion screen. This prevents a stale screen from booking a seat that became occupied earlier in the current browser.

```ts
function handleDemoPayment() {
  if (!selectedMovie || !selectedScreening || !canContinueWithSeats(audienceCount, selectedSeatIds)) return;
  const occupied = getOccupiedSeatIds(selectedScreening, store.reservations);
  if (selectedSeatIds.some((seatId) => occupied.has(seatId))) {
    setBookingError("선택한 좌석이 방금 판매되었습니다. 좌석을 다시 선택해 주세요.");
    setSelectedSeatIds([]);
    setStep("seats");
    return;
  }

  const reservation = createReservation(
    selectedMovie,
    selectedScreening,
    audienceCount,
    selectedSeatIds,
    store.reservations.map((entry) => entry.code),
  );
  const nextStore = { ...store, reservations: [...store.reservations, reservation] };
  setStore(nextStore);
  setStorageWarning(!writeBookingStore(nextStore));
  setActiveReservationId(reservation.id);
  setStep("complete");
}
```

- [ ] **Step 3: Render the completion receipt**

Show the reservation number prominently with film and seat details. Include `예매 취소` and `처음으로` actions:

```tsx
import { useState } from "react";
import type { Movie, Reservation, Screening } from "@/lib/cinema/types";

type CompleteScreenProps = {
  reservation: Reservation;
  movie: Movie;
  screening: Screening;
  cancelled: boolean;
  onCancel: () => void;
  onHome: () => void;
};

export function CompleteScreen(props: CompleteScreenProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="screen-card completion-card">
      <p className="eyebrow">{props.cancelled ? "CANCELLATION COMPLETE" : "RESERVATION COMPLETE"}</p>
      <h1>{props.cancelled ? "예매가 취소되었습니다" : "예매가 완료되었습니다"}</h1>
      <p className="reservation-code">{props.reservation.code}</p>
      <p>{props.movie.title} · {props.screening.date} {props.screening.startTime}</p>
      <p>{props.reservation.seatIds.join(", ")} · {props.reservation.audienceCount}명</p>
      <div className="screen-actions">
        {!props.cancelled && !confirming ? <button className="secondary-button" onClick={() => setConfirming(true)} type="button">예매 취소</button> : null}
        {confirming && !props.cancelled ? <div role="alertdialog" aria-modal="true" aria-label="예매 취소 확인">
          <p>이 예매를 취소할까요?</p>
          <button className="secondary-button" onClick={() => setConfirming(false)} type="button">계속 예매 유지</button>
          <button className="danger-button" onClick={props.onCancel} type="button">취소 확정</button>
        </div> : null}
        <button className="primary-button" onClick={props.onHome} type="button">처음으로</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Confirm and apply immediate cancellation**

Show a confirmation dialog before calling `cancelReservation`. After confirmation, persist the cancelled status, keep the receipt visible with a `취소 완료` state, and let occupied-seat calculation release the seats.

Use one callback for both cancellation entry points:

```ts
function handleCancelReservation(reservationId: string) {
  const nextStore = {
    version: 1 as const,
    reservations: cancelReservation(store.reservations, reservationId),
  };
  setStore(nextStore);
  setStorageWarning(!writeBookingStore(nextStore));
}
```

The completion screen reads the updated reservation from `store` through `activeReservation`. The lookup screen updates its displayed result to `status: "cancelled"` after calling this callback.

### Task 7: Add booking lookup and later cancellation

**Files:**
- Create: `src/components/cinema/lookup-screen.tsx`
- Modify: `src/components/cinema/kiosk-app.tsx`

- [ ] **Step 1: Add a kiosk-friendly reservation-number input**

Accept uppercase letters and digits, show a large numeric/letter keypad, and include a clear action. Normalize lookup input with `trim().toUpperCase()`:

```tsx
import { useState } from "react";
import { findReservation } from "@/lib/cinema/booking";
import type { Reservation } from "@/lib/cinema/types";

type LookupScreenProps = {
  reservations: Reservation[];
  onCancelReservation: (reservationId: string) => void;
  onHome: () => void;
};

export function LookupScreen(props: LookupScreenProps) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Reservation | null | "not-found">(null);
  const [confirming, setConfirming] = useState(false);

  function lookup() {
    const found = findReservation(props.reservations, code);
    setResult(found ?? "not-found");
    setConfirming(false);
  }

  function cancelCurrentReservation(reservation: Reservation) {
    props.onCancelReservation(reservation.id);
    setResult({ ...reservation, status: "cancelled" });
    setConfirming(false);
  }

  return (
    <section className="screen-card">
      <div className="screen-heading"><p className="eyebrow">BOOKING LOOKUP</p><h1>예매 번호를 입력하세요</h1></div>
      <label className="lookup-field">예매 번호
        <input autoCapitalize="characters" maxLength={7} onChange={(event) => { setCode(event.target.value); setResult(null); }} value={code} />
      </label>
      <div aria-label="예매 번호 입력" className="keypad">
        <button onClick={() => setCode((value) => value ? value : "C")} type="button">C</button>
        {[..."0123456789"].map((digit) => <button key={digit} onClick={() => setCode((value) => value.length < 7 ? `${value}${digit}` : value)} type="button">{digit}</button>)}
        <button onClick={() => setCode("")} type="button">지우기</button>
        <button onClick={lookup} type="button">조회</button>
      </div>
      {result === "not-found" ? <p role="alert">예매 내역을 찾을 수 없습니다.</p> : null}
      {result && result !== "not-found" ? <ReservationResult reservation={result} confirming={confirming} onConfirm={() => setConfirming(true)} onDismiss={() => setConfirming(false)} onCancel={() => cancelCurrentReservation(result)} /> : null}
      <button className="secondary-button" onClick={props.onHome} type="button">처음으로</button>
    </section>
  );
}

type ReservationResultProps = {
  reservation: Reservation;
  confirming: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  onCancel: () => void;
};

function ReservationResult(props: ReservationResultProps) {
  return (
    <article className="reservation-result">
      <h2>{props.reservation.movieTitle}</h2>
      <p>{props.reservation.screeningDate} {props.reservation.startTime} · {props.reservation.auditorium} · {props.reservation.seatIds.join(", ")}</p>
      <p>{props.reservation.audienceCount}명 · {props.reservation.total.toLocaleString("ko-KR")}원 · {props.reservation.status === "booked" ? "예매 완료" : "취소 완료"}</p>
      {props.reservation.status === "cancelled" ? <p>이미 취소된 예매입니다.</p> : null}
      {props.reservation.status === "booked" && !props.confirming ? <button className="danger-button" onClick={props.onConfirm} type="button">예매 취소</button> : null}
      {props.reservation.status === "booked" && props.confirming ? <div role="alertdialog" aria-modal="true" aria-label="예매 취소 확인">
        <p>이 예매를 취소하면 좌석이 다시 선택 가능해집니다. 계속할까요?</p>
        <button className="secondary-button" onClick={props.onDismiss} type="button">돌아가기</button>
        <button className="danger-button" onClick={props.onCancel} type="button">취소 확정</button>
      </div> : null}
    </article>
  );
}
```

- [ ] **Step 2: Show matching booking details and status**

After lookup, display movie, screening time, audience count, seats, total, and booking status. Unknown codes show `예매 내역을 찾을 수 없습니다`; cancelled codes show `이미 취소된 예매입니다`.

- [ ] **Step 3: Confirm and apply lookup-based cancellation**

For an active reservation, require a second confirmation action, update the store using the same `cancelReservation` helper as the completion screen, and show a clear cancellation result. Allow another lookup without returning to the home page.

- [ ] **Step 4: Commit booking and cancellation screens**

```bash
git add src/components/cinema src/lib/cinema/booking.ts src/lib/cinema/booking.test.ts
git commit -m "feat: add cinema reservation cancellation"
```

### Task 8: Apply the visual system and clean up the restaurant demo

**Files:**
- Modify: `src/app/globals.css`
- Modify: `package.json`
- Modify: `README.md`
- Remove: Yakitei files listed under “Remove after the new app is wired”

- [ ] **Step 1: Replace the global restaurant palette and layout**

Use named cinema variables and a 16:9-first layout. Keep touch controls at least 56px high, support keyboard focus, and pair seat colors with text or symbols:

```css
:root {
  color-scheme: dark;
  --cinema-bg: #080d18;
  --cinema-panel: #111a2a;
  --cinema-panel-raised: #19253a;
  --cinema-line: #2a3954;
  --cinema-ink: #f4f6fb;
  --cinema-muted: #aab5c8;
  --cinema-accent: #8b7cff;
  --cinema-seat-open: #24344c;
  --cinema-seat-taken: #6f7888;
  --cinema-danger: #ff7e86;
  font-family: "Pretendard", "Noto Sans KR", sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body { background: var(--cinema-bg); color: var(--cinema-ink); }
button, input { font: inherit; }
button { min-height: 56px; border-radius: 14px; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.55; }

.cinema-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.cinema-brand { font-size: 24px; font-weight: 900; letter-spacing: 0.08em; }
.cinema-brand span, .eyebrow { color: var(--cinema-accent); }
.screen-card { padding: clamp(22px, 3vw, 42px); background: var(--cinema-panel); border: 1px solid var(--cinema-line); border-radius: 28px; }
.screen-heading { margin-bottom: 24px; }
.screen-heading h1 { margin: 8px 0; font-size: clamp(32px, 4vw, 52px); }
.movie-meta { display: grid; gap: 6px; color: var(--cinema-muted); }
.movie-meta strong { color: var(--cinema-ink); font-size: 20px; }
.home-actions, .screen-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 24px; }
.primary-button, .secondary-button, .danger-button { padding: 0 24px; border: 0; font-weight: 800; }
.primary-button { background: var(--cinema-accent); color: #080d18; }
.secondary-button { background: var(--cinema-panel-raised); color: var(--cinema-ink); }
.danger-button { background: var(--cinema-danger); color: #1a0b12; }
.date-options, .showtime-grid { display: flex; flex-wrap: wrap; gap: 12px; margin: 18px 0; }
.date-options button, .showtime-grid button { display: grid; gap: 4px; padding: 12px 18px; color: var(--cinema-ink); background: var(--cinema-panel-raised); border: 1px solid var(--cinema-line); }
.date-options button[aria-pressed="true"], .showtime-grid button[aria-pressed="true"] { border-color: var(--cinema-accent); }
.booking-summary { display: grid; gap: 14px; }
.booking-summary div { display: flex; justify-content: space-between; gap: 20px; }
.booking-summary dt { color: var(--cinema-muted); }
.booking-summary dd { margin: 0; text-align: right; }
.seat-legend { display: flex; justify-content: center; gap: 18px; color: var(--cinema-muted); }
.pricing-note { color: var(--cinema-muted); font-size: 14px; }

.cinema-shell {
  width: min(1680px, calc(100% - 48px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 0 40px;
}

@media (max-width: 900px) {
  .cinema-shell { width: min(100% - 28px, 720px); }
  .cinema-header { align-items: flex-start; flex-wrap: wrap; }
  .booking-summary div { align-items: flex-start; }
}
```

- [ ] **Step 2: Display the supplied local poster images**

Display the supplied local JPEG posters with a consistent portrait crop, plus visible seat states. The ten movie cards should fit a 16:9 kiosk view without making posters too small; allow vertical scrolling at narrower sizes. Keep the title and rating as actual HTML text for accessibility and reliable rendering:

```css
.movie-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 18px; }
.movie-card { display: grid; gap: 14px; padding: 12px; text-align: left; color: var(--cinema-ink); background: var(--cinema-panel); border: 2px solid var(--cinema-line); border-radius: 20px; }
.movie-card.is-selected { border-color: var(--cinema-accent); box-shadow: 0 0 0 3px rgb(139 124 255 / 22%); }
.movie-poster { display: block; width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 14px; background: var(--cinema-panel-raised); }
.seat-map { display: grid; gap: 12px; width: fit-content; margin: 24px auto; }
.seat-row { display: flex; align-items: center; gap: 10px; }
.seat { width: 56px; min-height: 56px; border: 0; border-radius: 12px 12px 7px 7px; color: var(--cinema-ink); }
.seat-open { background: var(--cinema-seat-open); }
.seat-selected { background: var(--cinema-accent); color: #080d18; }
.seat-taken { background: var(--cinema-seat-taken); color: #fff; cursor: not-allowed; }
.seat:focus-visible, button:focus-visible, input:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }

@media (max-width: 1400px) {
  .movie-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 1050px) {
  .movie-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .movie-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .seat-row { gap: 5px; }
  .seat { width: 40px; min-height: 56px; }
}
```

- [ ] **Step 3: Update package identity and README**

Set the package name to `cinema-reservation-kiosk` and replace the old test paths with the new booking test:

```json
{
  "name": "cinema-reservation-kiosk",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "test": "node --import tsx --test src/lib/cinema/catalog.test.ts src/lib/cinema/booking.test.ts src/lib/cinema/booking-store.test.ts"
  }
}
```

Rewrite the README to describe the cinema demo, the ten user-selected movies and local posters, sample showtimes and CGV-style example prices, browser-local reservation storage, both cancellation paths, and `npm run dev`, `npm test`, and `npm run build` commands.

- [ ] **Step 4: Remove obsolete restaurant components and assets**

Remove only the Yakitei kiosk component/data files and listed Yakitei image/mockup assets after `page.tsx` no longer imports them. Do not delete recommendation modules, Supabase modules, unrelated project specs, or user-generated temporary files.

### Task 9: Inspect the finished flow and build the static export

**Files:**
- No additional source files.

- [ ] **Step 1: Review every screen state in the browser**

Walk through home, movie, showtime, seat selection, review, completion, immediate cancellation, booking lookup, successful lookup cancellation, unknown reservation, and already-cancelled reservation.

- [ ] **Step 2: Check reservation state across a reload**

Create a booking, reload the same browser, look it up by reservation number, cancel it, and confirm its seats are available again when selecting the same screening.

- [ ] **Step 3: Check narrow and kiosk landscape layouts**

Confirm 16:9 touch layout at kiosk width and stacked layout at narrow width. Confirm movie details, seat labels, errors, totals, and action labels remain visible.

- [ ] **Step 4: Build the GitHub Pages export**

Run `npm run build` and confirm Next.js completes static export without a server-only API dependency.

- [ ] **Step 5: Commit the completed cinema kiosk**

Stage only cinema source, metadata, styling, README, package metadata, and removed Yakitei kiosk assets; leave unrelated pre-existing workspace changes unstaged.

```bash
git add src/app/globals.css README.md package.json
git add -u -- src/components/kiosk src/lib/kiosk public/yakitei-teriyaki-yakisoba.png public/yakitei-salt-yakisoba.png public/yakitei-cola.png public/yakitei-cider.png public/yakitei-draft-beer.png public/yakitei-highball.png public/yakitei-kiosk-mockup.svg public/yakitei-kiosk-background.svg
git commit -m "style: replace Yakitei demo with cinema kiosk"
```

## Self-Review

- **Spec coverage:** Booking flow is covered by Tasks 1, 4, 5, and 6. Immediate and later cancellation, confirmation, and seat release are covered by Tasks 2, 3, 6, and 7. Local persistence and malformed storage fallback are covered by Task 3. Visual and responsive requirements plus removal of the old restaurant experience are covered by Task 8. The same-browser reload, cancellation, and static-export checks are covered by Task 9.
- **Placeholder scan:** No `TBD`, `TODO`, or open implementation decisions remain. Demo film titles, sample showtimes, seat layout, price, reservation-code shape, local storage key, and screen labels are specified.
- **Type consistency:** Components consume `Movie`, `Screening`, `Seat`, `Reservation`, and `BookingStore` from `src/lib/cinema/types.ts`. The store uses `version: 1`; the booking helpers and UI use the same `screeningId`, `seatIds`, `audienceCount`, `status`, and `code` fields.
