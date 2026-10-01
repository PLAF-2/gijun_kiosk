import React, { useEffect, useRef, useState } from "react";
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

function getFitZoom(viewport: HTMLDivElement, mapWidth: number, mapHeight: number) {
  const horizontal = (viewport.clientWidth - 32) / mapWidth;
  const vertical = (viewport.clientHeight - 114) / mapHeight;
  return Math.max(0.2, Math.min(1, horizontal, vertical));
}

export function SeatScreen(props: SeatScreenProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const occupiedSeatIds = getOccupiedSeatIds(props.screening, props.reservations);
  const rows = Array.from(new Set(props.screening.seats.map((seat) => seat.row))).map((row) => [
    row,
    props.screening.seats.filter((seat) => seat.row === row),
  ] as const);
  const canContinue = canContinueWithSeats(props.audienceCount, props.selectedSeatIds);
  const total = computeBookingTotal(props.screening.ticketPrice, props.audienceCount);
  const columns = props.screening.seatColumns ?? Math.max(...props.screening.seats.map((seat) => seat.column ?? seat.number));
  const aisles = [...new Set(props.screening.aisleAfter ?? [4])].filter((column) => column > 0 && column < columns).sort((a, b) => a - b);
  const tracks = ["var(--row-label-size)", ...Array.from({ length: columns }, (_, index) => ["var(--seat-size)", ...(aisles.includes(index + 1) ? ["var(--aisle-size)"] : [])]).flat(), "var(--row-label-size)"].join(" ");
  const baseWidth = columns * 50 + aisles.length * 24 + 46;
  const baseHeight = rows.length * 50 - 6;

  function fitMap() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setZoom(getFitZoom(viewport, baseWidth, baseHeight));
    viewport.scrollTo({ left: 0, top: 0 });
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fit = () => setZoom(getFitZoom(viewport, baseWidth, baseHeight));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(viewport, { box: "border-box" });
    return () => observer.disconnect();
  }, [baseWidth, baseHeight, props.screening.id]);

  return (
    <section className="screen-card seat-screen">
      <div className="screen-heading">
        <p className="eyebrow">{props.screening.theaterName ? `${props.screening.theaterName} · ` : ""}{props.screening.date} · {props.screening.startTime} · {props.screening.auditorium}</p>
        <h1>인원과 좌석을 선택하세요</h1>
      </div>
      <div className="audience-bar">
      <div><strong>관람 인원</strong><p>성인 · 최대 8명</p></div>
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
      </div>
      <div className="seat-map-tools">
        <p>잔여 {props.screening.seats.length - occupiedSeatIds.size} / 전체 {props.screening.seats.length}석</p>
        <div className="seat-zoom-controls" role="group" aria-label="좌석도 크기">
          <button type="button" aria-label="좌석도 축소" disabled={zoom <= 0.2} onClick={() => setZoom((value) => Math.max(0.2, value - 0.15))}>−</button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="좌석도 확대" disabled={zoom >= 1.4} onClick={() => setZoom((value) => Math.min(1.4, value + 0.15))}>＋</button>
          <button type="button" className="seat-fit-button" onClick={fitMap}>맞춤</button>
        </div>
      </div>
      <div role="group" aria-label="좌석 상태 안내" className="seat-legend">
        <span><i className="legend-open" aria-hidden="true">○</i>선택 가능</span><span><i className="legend-selected" aria-hidden="true">✓</i>선택됨</span><span><i className="legend-taken" aria-hidden="true">×</i>선택 불가</span>
      </div>
      <div className="seat-map-scroll" ref={viewportRef} tabIndex={0} aria-label="좌석 배치도, 가로·세로로 이동할 수 있습니다">
      <div className="seat-canvas" style={{ "--seat-size": `${44 * zoom}px`, "--seat-gap": `${6 * zoom}px`, "--aisle-size": `${18 * zoom}px`, "--row-label-size": `${20 * zoom}px`, "--seat-font-size": `${14 * zoom}px` } as React.CSSProperties}>
      <div aria-hidden="true" className="screen-indicator">SCREEN</div>
      <div role="group" aria-label="좌석 배치도" className="seat-map">
        {rows.map(([row, seats]) => (
          <div className="seat-row" key={row} style={{ gridTemplateColumns: tracks }}>
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
                  style={{ gridColumn: (seat.column ?? seat.number) + 1 + aisles.filter((aisle) => aisle < (seat.column ?? seat.number)).length }}
                  onClick={() => props.onToggleSeat(seat.id)}
                  type="button"
                ><span>{occupied ? "×" : selected ? "✓" : seat.number}</span></button>
              );
            })}
            <span aria-hidden="true" style={{ gridColumn: columns + aisles.length + 2 }}>{row}</span>
          </div>
        ))}
      </div>
      </div>
      </div>
      <div className="seat-selection-summary" aria-live="polite">
      <p>{props.selectedSeatIds.length} / {props.audienceCount}석 선택 · {total.toLocaleString("ko-KR")}원</p>
      <p className="selected-seat-names">{props.selectedSeatIds.length ? props.selectedSeatIds.join(" · ") : "원하는 좌석을 터치해 주세요"}</p>
      </div>
      <p className="pricing-note">CGV 일반 2D 성인 기준 예시 요금이며, 실제 금액은 지점에 따라 다를 수 있습니다.</p>
      {props.bookingError ? <p role="alert">{props.bookingError}</p> : null}
      <div className="screen-actions">
        <button className="primary-button" disabled={!canContinue} onClick={props.onContinue} type="button">예매 내용 확인</button>
      </div>
    </section>
  );
}
