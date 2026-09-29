import type { Movie, Reservation, Screening } from "@/lib/cinema/types";

const RESERVATION_CODE_SPACE = 1_000_000;

export function computeBookingTotal(ticketPrice: number, audienceCount: number) {
  return ticketPrice * audienceCount;
}

export function getOccupiedSeatIds(
  screening: Screening,
  reservations: Reservation[],
) {
  const bookedSeatIds = reservations
    .filter(
      (reservation) =>
        reservation.screeningId === screening.id &&
        reservation.status === "booked",
    )
    .flatMap((reservation) => reservation.seatIds);

  return new Set([...screening.blockedSeatIds, ...bookedSeatIds]);
}

export function canContinueWithSeats(
  audienceCount: number,
  seatIds: string[],
) {
  return (
    audienceCount > 0 &&
    seatIds.length === audienceCount &&
    new Set(seatIds).size === seatIds.length
  );
}

function createUniqueReservationCode(existingCodes: string[]) {
  const usedCodes = new Set(existingCodes.map((code) => code.trim().toUpperCase()));
  const firstCandidate = Math.floor(Math.random() * RESERVATION_CODE_SPACE);

  for (let offset = 0; offset < RESERVATION_CODE_SPACE; offset += 1) {
    const number = (firstCandidate + offset) % RESERVATION_CODE_SPACE;
    const code = `C${String(number).padStart(6, "0")}`;

    if (!usedCodes.has(code)) return code;
  }

  throw new Error("예약 번호를 생성할 수 없습니다.");
}

export function createReservation(
  movie: Movie,
  screening: Screening,
  audienceCount: number,
  seatIds: string[],
  existingCodes: string[],
  now = new Date(),
): Reservation {
  if (movie.id !== screening.movieId) {
    throw new Error("영화와 상영 정보가 일치하지 않습니다.");
  }

  return {
    id: crypto.randomUUID(),
    code: createUniqueReservationCode(existingCodes),
    screeningId: screening.id,
    movieId: screening.movieId,
    movieTitle: movie.title,
    screeningDate: screening.date,
    startTime: screening.startTime,
    auditorium: screening.auditorium,
    audienceCount,
    seatIds: [...seatIds],
    total: computeBookingTotal(screening.ticketPrice, audienceCount),
    status: "booked",
    createdAt: now.toISOString(),
  };
}

export function findReservation(reservations: Reservation[], code: string) {
  const normalizedCode = code.trim().toUpperCase();
  return reservations.find((reservation) => reservation.code === normalizedCode) ?? null;
}

export function cancelReservation(
  reservations: Reservation[],
  reservationId: string,
) {
  return reservations.map((reservation) =>
    reservation.id === reservationId && reservation.status === "booked"
      ? { ...reservation, status: "cancelled" as const }
      : reservation,
  );
}
