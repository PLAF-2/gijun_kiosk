import assert from "node:assert/strict";
import test from "node:test";
import { movies, getScreenings } from "@/lib/cinema/catalog";
import {
  canContinueWithSeats,
  cancelReservation,
  computeBookingTotal,
  createReservation,
  findReservation,
  getOccupiedSeatIds,
} from "@/lib/cinema/booking";
import type { Reservation } from "@/lib/cinema/types";

const screening = getScreenings("today-us", "2026-09-29")[0];
const baselineBooking: Reservation = {
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

test("computeBookingTotal multiplies ticket price by audience count", () => {
  assert.equal(computeBookingTotal(12000, 2), 24000);
});

test("createReservation captures screening details and makes a unique six-digit code", () => {
  const movie = movies[0];
  const movieScreening = getScreenings(movie.id, "2026-09-29")[0];
  const originalRandom = Math.random;
  let created: Reservation;

  try {
    Math.random = () => 0;
    created = createReservation(
      movie,
      movieScreening,
      1,
      ["A3"],
      ["C000000"],
      new Date("2026-09-29T00:00:00.000Z"),
    );
  } finally {
    Math.random = originalRandom;
  }

  assert.match(created.code, /^C\d{6}$/);
  assert.notEqual(created.code, "C000000");
  assert.match(created.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(created.movieTitle, movie.title);
  assert.equal(created.movieId, movie.id);
  assert.equal(created.screeningId, movieScreening.id);
  assert.deepEqual(created.seatIds, ["A3"]);
  assert.equal(created.total, 12000);
  assert.equal(created.status, "booked");
  assert.equal(created.createdAt, "2026-09-29T00:00:00.000Z");
});

test("createReservation rejects a movie that does not match the screening", () => {
  const mismatchedScreening = getScreenings("today-us", "2026-09-29")[0];

  assert.throws(
    () => createReservation(movies[0], mismatchedScreening, 1, ["A3"], []),
    /영화와 상영 정보가 일치하지 않습니다/,
  );
});

test("findReservation trims and ignores case in reservation codes", () => {
  assert.equal(findReservation([baselineBooking], "  c123456\n"), baselineBooking);
  assert.equal(findReservation([baselineBooking], "missing"), null);
});

test("canContinueWithSeats requires exactly one distinct seat per audience member", () => {
  assert.equal(canContinueWithSeats(2, ["A3", "A4"]), true);
  assert.equal(canContinueWithSeats(2, ["A3"]), false);
  assert.equal(canContinueWithSeats(2, ["A3", "A3"]), false);
  assert.equal(canContinueWithSeats(0, []), false);
});

test("cancelling a reservation releases its seats but leaves blocked seats occupied", () => {
  const occupiedBefore = getOccupiedSeatIds(screening, [baselineBooking]);
  assert.equal(occupiedBefore.has("A3"), true);
  assert.equal(occupiedBefore.has("A1"), true);

  const cancelled = cancelReservation([baselineBooking], baselineBooking.id);
  const occupiedAfter = getOccupiedSeatIds(screening, cancelled);

  assert.equal(cancelled[0].status, "cancelled");
  assert.equal(occupiedAfter.has("A3"), false);
  assert.equal(occupiedAfter.has("A1"), true);
  assert.equal(baselineBooking.status, "booked");
});

test("cancelling an unknown or already-cancelled reservation leaves entries unchanged", () => {
  const alreadyCancelled: Reservation = {
    ...baselineBooking,
    status: "cancelled",
  };
  const reservations = [baselineBooking, alreadyCancelled];

  const afterUnknown = cancelReservation(reservations, "missing");
  assert.deepEqual(afterUnknown, reservations);
  assert.notEqual(afterUnknown, reservations);

  const afterCancelled = cancelReservation([alreadyCancelled], alreadyCancelled.id);
  assert.deepEqual(afterCancelled, [alreadyCancelled]);
  assert.equal(afterCancelled[0], alreadyCancelled);
});
