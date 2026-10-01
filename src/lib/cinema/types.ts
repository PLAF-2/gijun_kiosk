export type Movie = {
  id: string;
  title: string;
  ageRating: "전체" | "12세" | "15세";
  runtimeMinutes: number;
  description: string;
  posterSrc: string;
  posterTheme: "violet" | "teal" | "amber" | "blue";
};

export type Seat = { id: string; row: string; number: number; column?: number };

export type Auditorium = {
  id: string;
  name: string;
  seats: Seat[];
  columns: number;
  aisleAfter: number[];
};

export type CinemaRegion = { id: string; name: string };
export type Theater = {
  id: string;
  regionId: string;
  regionName: string;
  name: string;
  location: string;
  auditoriums: Auditorium[];
};

export type Screening = {
  id: string;
  movieId: string;
  date: string;
  startTime: string;
  auditorium: string;
  ticketPrice: number;
  seats: Seat[];
  blockedSeatIds: string[];
  endTime?: string;
  theaterId?: string;
  theaterName?: string;
  regionName?: string;
  auditoriumId?: string;
  seatColumns?: number;
  aisleAfter?: number[];
};

export type ReservationStatus = "booked" | "cancelled";
export type PaymentMethod = "card" | "samsung-pay" | "apple-pay" | "kakao-pay" | "naver-pay" | "toss-pay" | "cash";

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
  cancelledAt?: string;
  phoneNumber?: string;
  paymentMethod?: PaymentMethod;
  theaterId?: string;
  theaterName?: string;
  regionName?: string;
};

export type BookingStep =
  | "home"
  | "movie"
  | "theater"
  | "showtime"
  | "seats"
  | "review"
  | "payment"
  | "complete"
  | "lookup";

export type BookingStore = { version: 1; reservations: Reservation[] };
