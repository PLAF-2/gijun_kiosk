import React from "react";
import { getOccupiedSeatIds } from "@/lib/cinema/booking";
import type { Movie, Reservation, Screening } from "@/lib/cinema/types";

export type DateOption = { key: string; label: string };

type ShowtimeScreenProps = {
  movie: Movie;
  dates: DateOption[];
  selectedDate: string;
  screenings: Screening[];
  reservations: Reservation[];
  selectedScreeningId: string | null;
  onSelectDate: (date: string) => void;
  onSelectScreening: (screeningId: string) => void;
};

export function ShowtimeScreen(props: ShowtimeScreenProps) {
  return (
    <section className="screen-card">
      <div className="screen-heading">
        <p className="eyebrow">{props.movie.title}</p>
        <h1>날짜와 시간을 선택하세요</h1>
      </div>
      <div role="group" aria-label="상영 날짜" className="date-options">
        {props.dates.map((date) => (
          <button
            aria-label={`상영 날짜 ${date.label}`}
            aria-pressed={date.key === props.selectedDate}
            key={date.key}
            onClick={() => props.onSelectDate(date.key)}
            type="button"
          >
            {date.label}
          </button>
        ))}
      </div>
      <div role="group" aria-label="상영 시간" className="showtime-grid">
        {props.screenings.map((screening) => {
          const occupied = getOccupiedSeatIds(screening, props.reservations);
          const available = Math.max(0, screening.seats.length - occupied.size);
          const soldOut = available === 0;
          const price = screening.ticketPrice.toLocaleString("ko-KR");
          const availabilityLabel = soldOut ? "매진" : `잔여 좌석 ${available}석`;

          return (
            <button
              aria-label={`상영 시간 ${screening.startTime}, ${screening.auditorium}, ${availabilityLabel}, ${price}원`}
              aria-pressed={screening.id === props.selectedScreeningId}
              disabled={soldOut}
              key={screening.id}
              onClick={() => props.onSelectScreening(screening.id)}
              type="button"
            >
              <strong>{screening.startTime}</strong>
              <span>{screening.auditorium}</span>
              <span>{availabilityLabel}</span>
              <span>{price}원 / 1인</span>
            </button>
          );
        })}
      </div>
      <p className="pricing-note">CGV 일반 2D 성인 기준 예시 요금이며, 실제 금액은 지점에 따라 다를 수 있습니다.</p>
    </section>
  );
}
