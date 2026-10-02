import type { BookingStore, Reservation } from "@/lib/cinema/types";
import { isValidPhoneNumber } from "@/lib/cinema/contact";
import { isPaymentMethod } from "@/lib/cinema/payments";
import { isBookingPriceBreakdown } from "@/lib/cinema/discounts";

const STORAGE_KEY = "cinema-kiosk-bookings-v1";

export function createEmptyBookingStore(): BookingStore {
  return { version: 1, reservations: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isReservation(value: unknown): value is Reservation {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    /^C\d{6}$/.test(value.code) &&
    typeof value.screeningId === "string" &&
    typeof value.movieId === "string" &&
    typeof value.movieTitle === "string" &&
    typeof value.screeningDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.screeningDate) &&
    typeof value.startTime === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.startTime) &&
    typeof value.auditorium === "string" &&
    Number.isInteger(value.audienceCount) &&
    (value.audienceCount as number) > 0 &&
    (value.audienceCount as number) <= 8 &&
    Array.isArray(value.seatIds) &&
    value.seatIds.length === value.audienceCount &&
    value.seatIds.every((seatId) => typeof seatId === "string" && /^[A-Z](?:[1-9]|1\d|2[0-4])$/.test(seatId)) &&
    new Set(value.seatIds).size === value.seatIds.length &&
    typeof value.total === "number" &&
    Number.isFinite(value.total) &&
    value.total >= 0 &&
    (value.priceBreakdown === undefined || isBookingPriceBreakdown(value.priceBreakdown, value.total)) &&
    (value.status === "booked" || value.status === "cancelled") &&
    typeof value.createdAt === "string" &&
    (value.cancelledAt === undefined || (typeof value.cancelledAt === "string" && Number.isFinite(Date.parse(value.cancelledAt)))) &&
    (value.phoneNumber === undefined || (typeof value.phoneNumber === "string" && isValidPhoneNumber(value.phoneNumber))) &&
    (value.paymentMethod === undefined || isPaymentMethod(value.paymentMethod)) &&
    (value.theaterId === undefined || typeof value.theaterId === "string") &&
    (value.theaterName === undefined || typeof value.theaterName === "string") &&
    (value.regionName === undefined || typeof value.regionName === "string")
  );
}

function isBookingStore(value: unknown): value is BookingStore {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.reservations) &&
    value.reservations.every(isReservation)
  );
}

export function readBookingStoreSnapshot(): BookingStore | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const value: unknown = JSON.parse(raw);
    return isBookingStore(value) ? value : null;
  } catch {
    return null;
  }
}

export function readBookingStore(): BookingStore {
  return readBookingStoreSnapshot() ?? createEmptyBookingStore();
}

export function writeBookingStore(store: BookingStore): boolean {
  if (typeof window === "undefined" || !isBookingStore(store)) return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}
