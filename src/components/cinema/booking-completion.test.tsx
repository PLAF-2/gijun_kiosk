import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingReviewScreen } from "@/components/cinema/booking-review-screen";
import { CompleteScreen } from "@/components/cinema/complete-screen";
import {
  addReservationToStore,
  attemptDemoPayment,
  cancelReservationInStore,
} from "@/components/cinema/kiosk-app";
import { getScreenings, movies } from "@/lib/cinema/catalog";
import type { BookingStore, Reservation } from "@/lib/cinema/types";

const movie = movies[0];
const screening = getScreenings(movie.id, "2026-09-29")[0];
const reservation: Reservation = {
  id: "reservation-1",
  code: "C123456",
  screeningId: screening.id,
  movieId: movie.id,
  movieTitle: movie.title,
  screeningDate: screening.date,
  startTime: screening.startTime,
  auditorium: screening.auditorium,
  audienceCount: 2,
  seatIds: ["A3", "A4"],
  total: screening.ticketPrice * 2,
  status: "booked",
  createdAt: "2026-09-29T00:00:00.000Z",
};

const emptyStore: BookingStore = { version: 1, reservations: [] };

test("booking review shows the complete order and only a clearly labeled demo payment action", () => {
  const html = renderToStaticMarkup(
    <BookingReviewScreen
      movie={movie}
      screening={screening}
      audienceCount={2}
      seatIds={["A3", "A4"]}
      total={screening.ticketPrice * 2}
      onBack={() => {}}
      onPay={() => {}}
    />,
  );

  assert.match(html, new RegExp(movie.title));
  assert.match(html, /2026-09-29/);
  assert.match(html, /10:20/);
  assert.match(html, /상영관 1/);
  assert.match(html, /2명/);
  assert.match(html, /A3, A4/);
  assert.match(html, /28,000원/);
  assert.match(html, /데모 결제 완료/);
  assert.doesNotMatch(html, /카드 결제|결제하기|PAYMENT/);
});

test("demo payment rejects a stale occupied seat and malformed seat selections", () => {
  const competingReservation = { ...reservation, id: "other-booking", seatIds: ["A3"] };

  assert.deepEqual(
    attemptDemoPayment({
      movie,
      screening,
      audienceCount: 2,
      seatIds: ["A3", "A4"],
      reservations: [competingReservation],
    }),
    { status: "occupied", occupiedSeatIds: ["A3"] },
  );
  assert.deepEqual(
    attemptDemoPayment({
      movie,
      screening,
      audienceCount: 2,
      seatIds: ["A3", "A3"],
      reservations: [],
    }),
    { status: "invalid" },
  );
});

test("demo payment creates a reservation with a unique code and screening total", () => {
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const result = attemptDemoPayment({
      movie,
      screening,
      audienceCount: 2,
      seatIds: ["A3", "A4"],
      reservations: [{ ...reservation, screeningId: "another-screening", code: "C000000" }],
      now: new Date("2026-09-29T12:00:00.000Z"),
    });

    assert.equal(result.status, "success");
    if (result.status !== "success") return;
    assert.equal(result.reservation.movieId, movie.id);
    assert.equal(result.reservation.screeningId, screening.id);
    assert.equal(result.reservation.code, "C000001");
    assert.deepEqual(result.reservation.seatIds, ["A3", "A4"]);
    assert.equal(result.reservation.total, screening.ticketPrice * 2);
  } finally {
    Math.random = originalRandom;
  }
});

test("reservation stays in the in-memory store when persistence fails", () => {
  const update = addReservationToStore(emptyStore, reservation, () => false);

  assert.deepEqual(update.store.reservations, [reservation]);
  assert.equal(update.storageWarning, true);
});

test("direct cancellation retains the cancelled receipt even when persistence fails", () => {
  const update = cancelReservationInStore(
    { version: 1, reservations: [reservation] },
    reservation.id,
    () => false,
  );

  assert.equal(update.store.reservations[0].status, "cancelled");
  assert.equal(update.storageWarning, true);
});

test("completion receipt displays the reservation code and a storage warning", () => {
  const html = renderToStaticMarkup(
    <CompleteScreen
      reservation={reservation}
      cancelled={false}
      storageWarning
      onCancel={() => {}}
      onHome={() => {}}
    />,
  );

  assert.match(html, /예매가 완료되었습니다/);
  assert.match(html, /C123456/);
  assert.match(html, new RegExp(movie.title));
  assert.match(html, /A3, A4/);
  assert.match(html, /새로고침 후 예매 조회가 되지 않을 수 있습니다/);
  assert.match(html, /예매 취소/);
  assert.match(html, /처음으로/);
  assert.match(html, /<dialog[^>]*aria-labelledby="cancel-dialog-title"/);
  assert.match(html, /<dialog[^>]*aria-describedby="cancel-dialog-description"/);
  assert.match(html, /id="cancel-dialog-title"/);
  assert.match(html, /id="cancel-dialog-description"/);
  assert.match(html, /취소 확정/);
  assert.match(html, /계속 예매 유지/);
});

test("cancelled receipt remains visible without offering another cancellation", () => {
  const html = renderToStaticMarkup(
    <CompleteScreen
      reservation={{ ...reservation, status: "cancelled" }}
      cancelled
      onCancel={() => {}}
      onHome={() => {}}
    />,
  );

  assert.match(html, /예매가 취소되었습니다/);
  assert.match(html, /C123456/);
  assert.doesNotMatch(html, />예매 취소<\/button>/);
  assert.match(html, /처음으로/);
});
