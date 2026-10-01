import type { Movie, Screening, Theater } from "@/lib/cinema/types";

const OPENING_MINUTES = 9 * 60;
const CLOSING_MINUTES = 22 * 60;

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return result >>> 0;
}

function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Builds the complete day together, so different films never share a hall time. */
export function buildTheaterSchedule(
  theater: Theater,
  date: string,
  movies: Movie[],
  ticketPrice: number,
): Screening[] {
  if (movies.length === 0) return [];

  const daySeed = hash(`${theater.id}:${date}`);
  const halls = theater.auditoriums.map((auditorium, index) => {
    const hallSeed = hash(`${auditorium.id}:${date}`);
    return {
      auditorium,
      nextStart: OPENING_MINUTES + ((daySeed % 5 + index * 2 + hallSeed % 3) % 9) * 5,
      slots: 5 + hallSeed % 2,
      cleanupMinutes: 15 + (hallSeed % 3) * 5,
    };
  });
  const screenings: Screening[] = [];
  const movieCounts = new Map(movies.map(({ id }) => [id, 0]));
  const shortestRuntime = Math.min(...movies.map(({ runtimeMinutes }) => runtimeMinutes));
  let movieCursor = daySeed % movies.length;

  // Rotate across halls first to distribute every film through the theater.
  for (let slot = 0; slot < 6; slot += 1) {
    for (const hall of halls) {
      if (slot >= hall.slots) continue;
      // Preserve room for at least five slots, and favor underrepresented films.
      const remainingSlots = Math.max(0, 4 - slot);
      const reservedMinutes = remainingSlots * (shortestRuntime + hall.cleanupMinutes + 4);
      let movie: Movie | undefined;
      let selectedOffset = 0;
      for (let offset = 0; offset < movies.length; offset += 1) {
        const candidate = movies[(movieCursor + offset) % movies.length];
        if (hall.nextStart + candidate.runtimeMinutes + reservedMinutes > CLOSING_MINUTES) continue;
        if (!movie || movieCounts.get(candidate.id)! < movieCounts.get(movie.id)!) {
          movie = candidate;
          selectedOffset = offset;
        }
      }
      if (!movie) continue;
      const end = hall.nextStart + movie.runtimeMinutes;

      const startTime = formatTime(hall.nextStart);
      const id = `${theater.id}:${date}:${hall.auditorium.id}:${startTime.replace(":", "")}:${movie.id}`;
      const occupancySeed = hash(id);
      const occupancyPercent = 12 + occupancySeed % 43;
      const seats = hall.auditorium.seats.map((seat) => ({ ...seat }));
      const blockedSeatIds = seats
        .filter((seat) => hash(`${id}:${seat.id}`) % 100 < occupancyPercent)
        .map(({ id: seatId }) => seatId)
        .slice(0, Math.max(0, seats.length - 8));

      screenings.push({
        id,
        movieId: movie.id,
        date,
        startTime,
        endTime: formatTime(end),
        auditorium: hall.auditorium.name,
        auditoriumId: hall.auditorium.id,
        theaterId: theater.id,
        theaterName: theater.name,
        regionName: theater.regionName,
        ticketPrice,
        seats,
        seatColumns: hall.auditorium.columns,
        aisleAfter: [...hall.auditorium.aisleAfter],
        blockedSeatIds,
      });

      movieCounts.set(movie.id, movieCounts.get(movie.id)! + 1);
      movieCursor = (movieCursor + selectedOffset + 1) % movies.length;
      // Round to five minutes while preserving the film and cleanup duration.
      hall.nextStart = Math.ceil((end + hall.cleanupMinutes) / 5) * 5;
    }
  }

  return screenings.sort((left, right) =>
    left.startTime.localeCompare(right.startTime) || left.auditorium.localeCompare(right.auditorium),
  );
}
