import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LookupResult,
  LookupScreen,
  appendLookupKey,
  normalizeReservationCode,
  toCancelledLookupResult,
} from "@/components/cinema/lookup-screen";
import { getScreenings, movies } from "@/lib/cinema/catalog";
import type { Reservation } from "@/lib/cinema/types";

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

test("reservation code input normalizes to uppercase alphanumeric and seven characters", () => {
  assert.equal(normalizeReservationCode(" c-12a 345678 "), "C12A345");
  assert.equal(normalizeReservationCode("!@#$%^&*()"), "");
});

test("keypad appends C and digits up to seven characters and clears", () => {
  assert.equal(appendLookupKey("c12345", "6"), "C123456");
  assert.equal(appendLookupKey("C123456", "7"), "C123456");
  assert.equal(appendLookupKey("C123456", "clear"), "");
});

test("lookup screen renders an accessible code field, complete kiosk keypad, and labeled native dialog", () => {
  const html = renderToStaticMarkup(
    <LookupScreen
      reservations={[reservation]}
      onCancelReservation={() => {}}
      onHome={() => {}}
      storageWarning={false}
    />,
  );

  assert.match(html, /예매 번호를 입력하세요/);
  assert.match(html, /<label[^>]*for="reservation-code"[^>]*>예매 번호/);
  assert.match(html, /<input[^>]*id="reservation-code"[^>]*maxLength="7"/);
  assert.match(html, /aria-label="예매 번호 입력"[^>]*role="group"/);
  for (const key of ["C", ..."0123456789", "지우기", "조회"]) {
    assert.match(html, new RegExp(`>${key}</button>`));
  }
  assert.match(html, /<form/);
  assert.match(html, /<dialog[^>]*aria-labelledby="lookup-cancel-dialog-title"/);
  assert.match(html, /<dialog[^>]*aria-describedby="lookup-cancel-dialog-description"/);
  assert.match(html, /id="lookup-cancel-dialog-title"/);
  assert.match(html, /id="lookup-cancel-dialog-description"/);
  assert.match(html, /취소 확정/);
});

test("active lookup result shows every reservation detail and offers confirmed cancellation", () => {
  const html = renderToStaticMarkup(
    <LookupResult
      result={reservation}
      confirming={false}
      storageWarning={false}
      cancelTriggerRef={React.createRef<HTMLButtonElement>()}
      statusHeadingRef={React.createRef<HTMLHeadingElement>()}
      onConfirm={() => {}}
    />,
  );

  assert.match(html, new RegExp(movie.title));
  assert.match(html, /2026-09-29 10:20 · 상영관 1/);
  assert.match(html, /2명/);
  assert.match(html, /A3, A4/);
  assert.match(html, /28,000원/);
  assert.match(html, /예매 완료/);
  assert.match(html, />예매 취소</);
  assert.doesNotMatch(html, /role="alertdialog"/);
});

test("cancelled lookup result is marked as already cancelled and has no cancel action", () => {
  const cancelled = toCancelledLookupResult(reservation);
  const html = renderToStaticMarkup(
    <LookupResult
      result={cancelled}
      confirming={false}
      storageWarning
      cancelTriggerRef={React.createRef<HTMLButtonElement>()}
      statusHeadingRef={React.createRef<HTMLHeadingElement>()}
      onConfirm={() => {}}
    />,
  );

  assert.equal(cancelled.status, "cancelled");
  assert.match(html, /취소 완료/);
  assert.match(html, /이미 취소된 예매입니다/);
  assert.match(html, /예매 정보는 이 화면에 반영됐지만 저장되지 않았습니다/);
  assert.doesNotMatch(html, />예매 취소</);
});

test("unknown lookup result gives a not-found alert", () => {
  const html = renderToStaticMarkup(
    <LookupResult
      result="not-found"
      confirming={false}
      storageWarning={false}
      cancelTriggerRef={React.createRef<HTMLButtonElement>()}
      statusHeadingRef={React.createRef<HTMLHeadingElement>()}
      onConfirm={() => {}}
    />,
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /예매 내역을 찾을 수 없습니다/);
});
