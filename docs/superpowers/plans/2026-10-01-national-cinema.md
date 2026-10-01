# National cinema selection implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Do not add or run tests unless requested. Build and inspect source changes. Work in the authorized live workspace; preserve unrelated edits and do not push.

**Goal:** Add 68 regional demo cinemas, stable date-specific schedules and varied auditorium seat maps to the existing booking flow.

**Architecture:** Separate theater definitions and a deterministic day scheduler from the UI. Keep reservation v1 storage backward compatible using optional theater snapshots. Connect a new theater step and render actual seat coordinates instead of fixed four rows.

**Tech Stack:** Next.js 15, React 19, TypeScript, localStorage, CSS grid.

## Task 1: Theater catalog and schedules
- [x] Add `theaters.ts`: `regions: CinemaRegion[]`, `theaters: Theater[]`, 17 regions × 4 cinemas. Each has 3~5 halls with fixed 60~180-seat layouts, row omissions and aisles. Seat `column` defines visual placement independent of numbering.
- [x] Add `schedule.ts`: `buildTheaterSchedule(theater, date, movies, ticketPrice): Screening[]`. Schedule all movies together per theater/date with runtime + cleanup gaps; deterministic IDs include theater/hall/date/start/movie; deterministic occupancy varies per screening. No overlaps.
- [x] Update `catalog.ts`: `getScreenings(movieId, date, theaterId?)` delegates selected theaters to scheduler, keeping legacy two-argument behavior for existing consumers. Return only selected movie sorted by time.

## Task 2: Regional selection and state
- [x] Add TheaterScreen movie summary, 17-region buttons and four cinema cards per selected region. Region change clears visible theater selection; theater continue initializes date and transitions to showtime.
- [x] In KioskApp: selected theater/region state; poster click directly enters theater stage. Movie change resets downstream selection. Theater change retains date and resets screening/seats. Back mapping is movie←theater←showtime←seats←review←payment. Progress total seven.
- [x] Change MovieScreen continuation copy to 극장 선택; keep carousel.
- [x] ShowtimeScreen shows theater, end time, remaining/total and empty state.

## Task 3: Seat map
- [x] Derive rows from Screening.seats, use column/aisle metadata for grid positioning and empty spaces. Put SCREEN within the same scrollable canvas. Zoom range 70~140% with buttons and overflow in both directions. Keep number/status accessibility and disabled occupied seats. Use small square seats and clear center/side aisle spaces.
- [x] Add region/theater/map CSS with desktop and mobile breakpoints; preserve existing payment and poster styling.

## Task 4: Persistence and summaries
- [x] Copy optional theaterId/theaterName/regionName into reservations in booking.ts. booking-store.ts accepts optional strings and expands seat ID validation to planned row/number bounds while preserving old records.
- [x] Add theater names in review, completion, lookup results and phone match lists.
- [x] Update README and approved design assumptions.

## Task 5: Review and delivery
- [x] Spec review, then quality review; fix concrete defects.
- [x] Run `git diff --check` for relevant files and `npm.cmd run build`, expect exit 0. No automated tests requested.
- [x] Ensure local dev server serves port 3105 with new sources after build; report local-only result and link. Do not push.

## Completion evidence
All tasks completed locally. Spec review identified full-map fit; width/height fitting and border-box observation resolved it. Code quality review found no actionable defects. Production build completed with exit 0 on 2026-10-01 (home 14.3 kB, First Load 117 kB). Scoped git diff --check passed. No automated tests were added or run. Dev server is ready at http://127.0.0.1:3105/; changes remain uncommitted and unpushed.
