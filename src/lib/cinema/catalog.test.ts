import assert from "node:assert/strict";
import test from "node:test";
import {
  createSeatMap,
  getDemoDates,
  getScreenings,
  movies,
  toLocalDateKey,
} from "@/lib/cinema/catalog";

test("movie catalog contains the four original demo movies", () => {
  assert.deepEqual(
    movies.map(({ id, title }) => [id, title]),
    [
      ["starlight-post", "별빛 우체국"],
      ["last-wave", "마지막 파도"],
      ["today-us", "오늘의 우리"],
      ["monday-detective", "월요일의 탐정"],
    ],
  );
});

test("local date keys and demo dates preserve calendar days", () => {
  const today = new Date(2026, 8, 29, 23, 45);

  assert.equal(toLocalDateKey(today), "2026-09-29");
  assert.deepEqual(
    getDemoDates(today).map(({ key }) => key),
    [
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
    ],
  );
});

test("screenings have stable identifiers, showtimes, and independent 32-seat maps", () => {
  const screenings = getScreenings("today-us", "2026-09-29");

  assert.deepEqual(
    screenings.map(({ id, startTime, auditorium }) => [id, startTime, auditorium]),
    [
      ["today-us:2026-09-29:1020", "10:20", "상영관 1"],
      ["today-us:2026-09-29:1310", "13:10", "상영관 2"],
      ["today-us:2026-09-29:1600", "16:00", "상영관 3"],
      ["today-us:2026-09-29:1915", "19:15", "상영관 4"],
    ],
  );
  assert.equal(screenings.every(({ seats }) => seats.length === 32), true);
  assert.deepEqual(screenings[0].blockedSeatIds, ["A1", "A2", "D7"]);
  assert.deepEqual(screenings[1].blockedSeatIds, ["B4", "C5"]);
  assert.notEqual(screenings[0].seats, screenings[1].seats);
});

test("seat map is an ordered four by eight layout", () => {
  assert.deepEqual(
    createSeatMap().map(({ id, row, number }) => [id, row, number]),
    ["A", "B", "C", "D"].flatMap((row) =>
      Array.from({ length: 8 }, (_, index) => [
        `${row}${index + 1}`,
        row,
        index + 1,
      ]),
    ),
  );
});
