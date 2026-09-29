import React from "react";
import { canContinueWithSeats, computeBookingTotal, getOccupiedSeatIds } from "@/lib/cinema/booking";
import type { Reservation, Screening } from "@/lib/cinema/types";

type SeatScreenProps = {
  screening: Screening;
  reservations: Reservation[];
  audienceCount: number;
  selectedSeatIds: string[];
  bookingError?: string | null;
  onAudienceCountChange: (count: number) => void;
  onToggleSeat: (seatId: string) => void;
  onContinue: () => void;
};

export function SeatScreen(props: SeatScreenProps) {
  const occupiedSeatIds = getOccupiedSeatIds(props.screening, props.reservations);
  const rows = ["A", "B", "C", "D"].map((row) => [
    row,
    props.screening.seats.filter((seat) => seat.row === row),
  ] as const);
  const canContinue = canContinueWithSeats(props.audienceCount, props.selectedSeatIds);
  const total = computeBookingTotal(props.screening.ticketPrice, props.audienceCount);

  return (
    <section className="screen-card">
      <div className="screen-heading">
        <p className="eyebrow">{props.screening.date} · {props.screening.startTime} · {props.screening.auditorium}</p>
        <h1>인원과 좌석을 선택하세요</h1>
      </div>
      <div role="group" aria-label="관람 인원" className="audience-picker">
        <button
          aria-label="인원 줄이기"
          disabled={props.audienceCount <= 1}
          onClick={() => props.onAudienceCountChange(props.audienceCount - 1)}
          type="button"
        >−</button>
        <span>{props.audienceCount}명</span>
        <button
          aria-label="인원 늘리기"
          disabled={props.audienceCount >= 8}
          onClick={() => props.onAudienceCountChange(props.audienceCount + 1)}
          type="button"
        >＋</button>
      </div>
      <div aria-hidden="true" className="screen-indicator">SCREEN</div>
      <div role="group" aria-label="좌석 상태 안내" className="seat-legend">
        <span>선택 가능</span><span>선택됨</span><span>선택 불가</span>
      </div>
      <div role="group" aria-label="좌석 배치도" className="seat-map">
        {rows.map(([row, seats]) => (
          <div className="seat-row" key={row}>
            <span aria-hidden="true">{row}</span>
            {seats.map((seat) => {
              const occupied = occupiedSeatIds.has(seat.id);
              const selected = props.selectedSeatIds.includes(seat.id);

              return (
                <button
                  aria-label={`${row}열 ${seat.number}번 좌석${occupied ? " 선택 불가" : selected ? " 선택됨" : " 선택 가능"}`}
                  aria-pressed={selected}
                  className={`seat ${occupied ? "seat-taken" : selected ? "seat-selected" : "seat-open"}`}
                  disabled={occupied}
                  key={seat.id}
                  onClick={() => props.onToggleSeat(seat.id)}
                  type="button"
                >{seat.number}</button>
              );
            })}
          </div>
        ))}
      </div>
      <p>{props.selectedSeatIds.length} / {props.audienceCount}석 선택 · {total.toLocaleString("ko-KR")}원</p>
      <p className="pricing-note">CGV 일반 2D 성인 기준 예시 요금이며, 실제 금액은 지점에 따라 다를 수 있습니다.</p>
      {props.bookingError ? <p role="alert">{props.bookingError}</p> : null}
      <div className="screen-actions">
        <button className="primary-button" disabled={!canContinue} onClick={props.onContinue} type="button">예매 내용 확인</button>
      </div>
    </section>
  );
}
