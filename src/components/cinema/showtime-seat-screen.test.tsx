import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SeatScreen } from "@/components/cinema/seat-screen";
import { ShowtimeScreen } from "@/components/cinema/showtime-screen";
import { createInitialBookingSelection, updateBookingSelection } from "@/components/cinema/kiosk-app";
import type { BookingSelectionState } from "@/components/cinema/kiosk-app";
import { getDemoDates, getScreenings, movies } from "@/lib/cinema/catalog";
import type { Reservation } from "@/lib/cinema/types";

const dateOptions = getDemoDates(new Date(2026, 8, 29)).map(({ key, date }) => ({
  key,
  label: date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }),
}));
const screenings = getScreenings(movies[0].id, dateOptions[0].key);

const bookedReservation: Reservation = {
  id: "booked-1",
  code: "C111111",
  screeningId: screenings[0].id,
  movieId: movies[0].id,
  movieTitle: movies[0].title,
  screeningDate: screenings[0].date,
  startTime: screenings[0].startTime,
  auditorium: screenings[0].auditorium,
  audienceCount: 1,
  seatIds: ["B1"],
  total: screenings[0].ticketPrice,
  status: "booked",
  createdAt: "2026-09-29T00:00:00.000Z",
};

function findButton(element: React.ReactNode, name: string) {
  const matches: React.ReactElement<{ onClick?: () => void; disabled?: boolean; children?: React.ReactNode }>[] = [];
  function visit(node: React.ReactNode) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!React.isValidElement(node)) return;
    const elementNode = node as React.ReactElement<{
      onClick?: () => void;
      disabled?: boolean;
      children?: React.ReactNode;
      "aria-label"?: string;
    }>;
    if (elementNode.type === "button" && elementNode.props["aria-label"] === name) matches.push(elementNode);
    if (typeof elementNode.type === "function") {
      visit((elementNode.type as (props: typeof elementNode.props) => React.ReactNode)(elementNode.props));
    } else {
      visit(elementNode.props.children);
    }
  }
  visit(element);
  return matches[0];
}

test("showtime screen renders seven local dates, four screenings, occupied counts, and CGV sample pricing", () => {
  const html = renderToStaticMarkup(
    <ShowtimeScreen
      dates={dateOptions}
      movie={movies[0]}
      onSelectDate={() => {}}
      onSelectScreening={() => {}}
      reservations={[bookedReservation]}
      screenings={screenings}
      selectedDate={dateOptions[0].key}
      selectedScreeningId={null}
    />,
  );

  assert.equal((html.match(/aria-label="상영 날짜 /g) ?? []).length, 7);
  assert.equal((html.match(/aria-label="상영 시간 /g) ?? []).length, 4);
  assert.match(html, /role="group" aria-label="상영 날짜"/);
  assert.match(html, /role="group" aria-label="상영 시간"/);
  assert.match(html, /잔여 좌석 28석/);
  assert.match(html, /CGV 일반 2D 성인 기준 예시 요금이며, 실제 금액은 지점에 따라 다를 수 있습니다\./);
  assert.match(html, /14,000원 \/ 1인/);
  assert.match(html, /19:15/);
});

test("sold-out showtimes are visibly marked and cannot be selected", () => {
  const soldOutScreening = {
    ...screenings[0],
    blockedSeatIds: screenings[0].seats.map((seat) => seat.id),
  };
  const element = ShowtimeScreen({
    dates: dateOptions,
    movie: movies[0],
    onSelectDate: () => {},
    onSelectScreening: () => {},
    reservations: [],
    screenings: [soldOutScreening],
    selectedDate: dateOptions[0].key,
    selectedScreeningId: null,
  });
  const html = renderToStaticMarkup(element);
  const soldOutButton = findButton(
    element,
    `상영 시간 ${soldOutScreening.startTime}, ${soldOutScreening.auditorium}, 매진, 14,000원`,
  );

  assert.match(html, /aria-label="상영 시간 [^"]+, 매진, 14,000원"/);
  assert.ok(soldOutButton);
  assert.equal(soldOutButton.props.disabled, true);
});

test("showtime screen reports the selected date and delegates date and screening selection", () => {
  const selectedDates: string[] = [];
  const selectedScreenings: string[] = [];
  const element = ShowtimeScreen({
    dates: dateOptions,
    movie: movies[0],
    onSelectDate: (date) => selectedDates.push(date),
    onSelectScreening: (screeningId) => selectedScreenings.push(screeningId),
    reservations: [],
    screenings,
    selectedDate: dateOptions[2].key,
    selectedScreeningId: screenings[1].id,
  });
  const html = renderToStaticMarkup(element);
  const dateNode = findButton(element, `상영 날짜 ${dateOptions[2].label}`);
  const timeNode = findButton(element, `상영 시간 13:10, 상영관 2, 잔여 좌석 30석, 14,000원`);

  assert.match(html, /aria-pressed="true"/);
  assert.ok(dateNode);
  assert.ok(timeNode);
  dateNode.props.onClick?.();
  timeNode.props.onClick?.();
  assert.deepEqual(selectedDates, [dateOptions[2].key]);
  assert.deepEqual(selectedScreenings, [screenings[1].id]);
});

test("seat screen renders an accessible four by eight map, disables booked seats, and shows the computed total", () => {
  const cancelledReservation = { ...bookedReservation, id: "cancelled-1", code: "C222222", seatIds: ["B2"], status: "cancelled" as const };
  const html = renderToStaticMarkup(
    <SeatScreen
      audienceCount={2}
      onAudienceCountChange={() => {}}
      onContinue={() => {}}
      onToggleSeat={() => {}}
      reservations={[bookedReservation, cancelledReservation]}
      screening={screenings[0]}
      selectedSeatIds={["A3"]}
    />,
  );

  assert.equal((html.match(/class="seat /g) ?? []).length, 32);
  assert.match(html, /aria-label="A열 1번 좌석 선택 불가"[^>]*disabled=""/);
  assert.match(html, /aria-label="B열 1번 좌석 선택 불가"[^>]*disabled=""/);
  assert.match(html, /aria-label="B열 2번 좌석 선택 가능"/);
  assert.match(html, /aria-label="A열 3번 좌석 선택됨"[^>]*aria-pressed="true"/);
  assert.match(html, /1 \/ 2석 선택 · 28,000원/);
  assert.match(html, /CGV 일반 2D 성인 기준 예시 요금/);
  assert.match(html, /role="group" aria-label="관람 인원"/);
  assert.match(html, /role="group" aria-label="좌석 상태 안내"/);
  assert.match(html, /role="group" aria-label="좌석 배치도"/);
  assert.match(html, /예매 내용 확인/);
});

test("seat screen gates continue until one seat per attendee and delegates seat/count controls", () => {
  let toggledSeat = "";
  let nextAudienceCount = 0;
  let continued = false;
  const element = SeatScreen({
    audienceCount: 1,
    onAudienceCountChange: (count) => { nextAudienceCount = count; },
    onContinue: () => { continued = true; },
    onToggleSeat: (seatId) => { toggledSeat = seatId; },
    reservations: [],
    screening: screenings[0],
    selectedSeatIds: [],
  });
  const html = renderToStaticMarkup(element);
  const seat = findButton(element, "A열 3번 좌석 선택 가능");
  const addPerson = findButton(element, "인원 늘리기");

  assert.match(html, /예매 내용 확인<\/button>/);
  assert.match(html, /disabled=""[^>]*>예매 내용 확인/);
  assert.ok(seat);
  assert.ok(addPerson);
  seat.props.onClick?.();
  addPerson.props.onClick?.();
  assert.equal(toggledSeat, "A3");
  assert.equal(nextAudienceCount, 2);
  assert.equal(continued, false);
});

test("booking selection clears downstream choices on changed date or showtime", () => {
  const initial = {
    ...createInitialBookingSelection(dateOptions[0].key),
    selectedScreeningId: screenings[0].id,
    selectedSeatIds: ["A3", "A4"],
  };

  assert.deepEqual(updateBookingSelection(initial, { type: "date", date: dateOptions[1].key }), {
    selectedDate: dateOptions[1].key,
    selectedScreeningId: null,
    selectedSeatIds: [],
    audienceCount: 1,
  });
  assert.deepEqual(updateBookingSelection(initial, { type: "screening", screeningId: screenings[1].id }), {
    ...initial,
    selectedScreeningId: screenings[1].id,
    selectedSeatIds: [],
  });
});

test("booking selection trims seats when audience count falls and limits seat toggles to one per person", () => {
  let selection: BookingSelectionState = {
    ...createInitialBookingSelection(dateOptions[0].key),
    selectedScreeningId: screenings[0].id,
    audienceCount: 3,
    selectedSeatIds: ["A3", "A4", "A5"],
  };

  selection = updateBookingSelection(selection, { type: "audience-count", count: 2 });
  assert.deepEqual(selection.selectedSeatIds, ["A3", "A4"]);
  selection = updateBookingSelection(selection, { type: "toggle-seat", seatId: "A5", occupied: false });
  assert.deepEqual(selection.selectedSeatIds, ["A3", "A4"]);
  selection = updateBookingSelection(selection, { type: "toggle-seat", seatId: "A3", occupied: false });
  assert.deepEqual(selection.selectedSeatIds, ["A4"]);
  selection = updateBookingSelection(selection, { type: "toggle-seat", seatId: "A5", occupied: true });
  assert.deepEqual(selection.selectedSeatIds, ["A4"]);
});
