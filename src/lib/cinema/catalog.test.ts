import assert from "node:assert/strict";
import test from "node:test";
import {
  createSeatMap,
  getDemoDates,
  getDemoTicketPrice,
  getScreenings,
  movies,
  toLocalDateKey,
} from "@/lib/cinema/catalog";

test("movie catalog contains the ten requested movies and local posters in order", () => {
  assert.deepEqual(
    movies.map(({ id, title, posterSrc, ageRating, runtimeMinutes }) => [
      id,
      title,
      ageRating,
      runtimeMinutes,
      posterSrc,
    ]),
    [
      [
        "chiikawa-mermaid-island",
        "극장판 치이카와: 인어 섬의 비밀",
        "전체",
        99,
        "/posters/chiikawa.jpg",
      ],
      ["home-alone", "나 홀로 집에", "전체", 103, "/posters/home-alone.jpg"],
      ["la-la-land", "라라랜드", "12세", 128, "/posters/la-la-land.jpg"],
      [
        "manyak-e-woori",
        "만약에 우리",
        "15세",
        115,
        "/posters/if-we-were-us.jpg",
      ],
      ["moana-2026", "모아나", "전체", 115, "/posters/moana.jpg"],
      ["the-odyssey", "오디세이", "15세", 172, "/posters/the-odyssey.jpg"],
      [
        "oneul-bam-segyeeseo",
        "오늘 밤, 세계에서 이 사랑이 사라진다 해도",
        "12세",
        121,
        "/posters/even-if-this-love-disappears-tonight.jpg",
      ],
      ["arrietty", "마루 밑 아리에티", "전체", 94, "/posters/arrietty.jpg"],
      ["begin-again", "비긴 어게인", "15세", 104, "/posters/begin-again.jpg"],
      [
        "jurassic-world-rebirth",
        "쥬라기 월드: 새로운 시작",
        "12세",
        133,
        "/posters/jurassic-world-rebirth.jpg",
      ],
    ],
  );
  assert.equal(movies.every(({ description }) => description.length > 0), true);
  assert.equal(
    movies.every(({ posterTheme }) =>
      ["violet", "teal", "amber", "blue"].includes(posterTheme),
    ),
    true,
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
  const screenings = getScreenings("chiikawa-mermaid-island", "2026-09-29");

  assert.deepEqual(
    screenings.map(({ id, startTime, auditorium }) => [id, startTime, auditorium]),
    [
      ["chiikawa-mermaid-island:2026-09-29:1020", "10:20", "상영관 1"],
      ["chiikawa-mermaid-island:2026-09-29:1310", "13:10", "상영관 2"],
      ["chiikawa-mermaid-island:2026-09-29:1600", "16:00", "상영관 3"],
      ["chiikawa-mermaid-island:2026-09-29:1915", "19:15", "상영관 4"],
    ],
  );
  assert.equal(screenings.every(({ seats }) => seats.length === 32), true);
  assert.equal(screenings.every(({ ticketPrice }) => ticketPrice === 14000), true);
  assert.deepEqual(screenings[0].blockedSeatIds, ["A1", "A2", "D7"]);
  assert.deepEqual(screenings[1].blockedSeatIds, ["B4", "C5"]);
  assert.notEqual(screenings[0].seats, screenings[1].seats);
  assert.notEqual(screenings[0].seats[0], screenings[1].seats[0]);
});

test("demo ticket prices use the screening's local calendar date", () => {
  assert.equal(getDemoTicketPrice("2026-10-01"), 14000);
  assert.equal(getDemoTicketPrice("2026-10-02"), 15000);
  assert.equal(getDemoTicketPrice("2026-10-03"), 15000);
  assert.equal(getDemoTicketPrice("2026-10-04"), 15000);

  const fridayScreenings = getScreenings("home-alone", "2026-10-02");
  assert.equal(fridayScreenings.every(({ ticketPrice }) => ticketPrice === 15000), true);
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
