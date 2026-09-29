import React from "react";
import type { Movie, Screening } from "@/lib/cinema/types";

type BookingReviewScreenProps = {
  movie: Movie;
  screening: Screening;
  audienceCount: number;
  seatIds: string[];
  total: number;
  onBack: () => void;
  onPay: () => void;
};

export function BookingReviewScreen(props: BookingReviewScreenProps) {
  return (
    <section className="screen-card">
      <div className="screen-heading">
        <p className="eyebrow">FINAL CHECK</p>
        <h1>예매 내용을 확인하세요</h1>
      </div>
      <dl className="booking-summary">
        <div><dt>영화</dt><dd>{props.movie.title}</dd></div>
        <div><dt>상영</dt><dd>{props.screening.date} {props.screening.startTime} · {props.screening.auditorium}</dd></div>
        <div><dt>인원</dt><dd>{props.audienceCount}명</dd></div>
        <div><dt>좌석</dt><dd>{props.seatIds.join(", ")}</dd></div>
        <div><dt>결제 금액</dt><dd>{props.total.toLocaleString("ko-KR")}원</dd></div>
      </dl>
      <p className="pricing-note">CGV 일반 2D 성인 기준 예시 요금이며, 실제 금액은 지점에 따라 다를 수 있습니다.</p>
      <div className="screen-actions">
        <button className="secondary-button" onClick={props.onBack} type="button">좌석 다시 선택</button>
        <button className="primary-button" onClick={props.onPay} type="button">데모 결제 완료</button>
      </div>
    </section>
  );
}
