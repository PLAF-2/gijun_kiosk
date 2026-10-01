import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/cinema/contact";
import type { Movie, PaymentMethod, Reservation, Screening } from "@/lib/cinema/types";

const RESERVATION_CODE_SPACE = 1_000_000;
export const CANCELLED_RESERVATION_TTL_MS = 60_000;

export function getCancellationExpiry(reservation: Reservation): number | null {
  if (reservation.status !== "cancelled" || !reservation.cancelledAt) return null;
  const cancelledAt = Date.parse(reservation.cancelledAt);
  return Number.isFinite(cancelledAt) ? cancelledAt + CANCELLED_RESERVATION_TTL_MS : null;
}

export function stampLegacyCancellations(reservations: Reservation[], now = new Date()): Reservation[] {
  let changed = false;
  const next = reservations.map((reservation) => {
    if (reservation.status !== "cancelled" || reservation.cancelledAt) return reservation;
    changed = true;
    return { ...reservation, cancelledAt: now.toISOString() };
  });
  return changed ? next : reservations;
}

export function purgeExpiredCancellations(reservations: Reservation[], now = Date.now()): Reservation[] {
  const next = reservations.filter((reservation) => {
    const expiresAt = getCancellationExpiry(reservation);
    return expiresAt === null || expiresAt > now;
  });
  return next.length === reservations.length ? reservations : next;
}

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
  phoneNumber?: string,
  paymentMethod?: PaymentMethod,
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
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(screening.theaterId ? { theaterId: screening.theaterId } : {}),
    ...(screening.theaterName ? { theaterName: screening.theaterName } : {}),
    ...(screening.regionName ? { regionName: screening.regionName } : {}),
  };
}

export function findReservation(reservations: Reservation[], code: string) {
  const normalizedCode = code.trim().toUpperCase();
  return reservations.find((reservation) => reservation.code === normalizedCode) ?? null;
}

export function findReservationsByPhone(reservations: Reservation[], phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!isValidPhoneNumber(normalizedPhone)) return [];
  return reservations
    .filter((reservation) => reservation.phoneNumber === normalizedPhone)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function cancelReservation(
  reservations: Reservation[],
  reservationId: string,
  now = new Date(),
) {
  return reservations.map((reservation) =>
    reservation.id === reservationId && reservation.status === "booked"
      ? { ...reservation, status: "cancelled" as const, cancelledAt: now.toISOString() }
      : reservation,
  );
}
