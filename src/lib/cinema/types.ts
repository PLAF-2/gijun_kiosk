export type Movie = {
  id: string;
  title: string;
  ageRating: "전체" | "12세" | "15세";
  runtimeMinutes: number;
  description: string;
  posterTheme: "violet" | "teal" | "amber" | "blue";
};

export type Seat = { id: string; row: string; number: number };

export type Screening = {
  id: string;
  movieId: string;
  date: string;
  startTime: string;
  auditorium: string;
  ticketPrice: number;
  seats: Seat[];
  blockedSeatIds: string[];
};

export type ReservationStatus = "booked" | "cancelled";

export type Reservation = {
  id: string;
  code: string;
  screeningId: string;
  movieId: string;
  movieTitle: string;
  screeningDate: string;
  startTime: string;
  auditorium: string;
  audienceCount: number;
  seatIds: string[];
  total: number;
  status: ReservationStatus;
  createdAt: string;
};

export type BookingStep =
  | "home"
  | "movie"
  | "showtime"
  | "seats"
  | "review"
  | "complete"
  | "lookup";

export type BookingStore = { version: 1; reservations: Reservation[] };
