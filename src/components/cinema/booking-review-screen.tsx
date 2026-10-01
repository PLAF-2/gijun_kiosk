import React from "react";
import { isValidPhoneNumber } from "@/lib/cinema/contact";
import type { Movie, Screening } from "@/lib/cinema/types";

type BookingReviewScreenProps = {
  movie: Movie;
  screening: Screening;
  audienceCount: number;
  seatIds: string[];
  total: number;
  onBack: () => void;
  onPay: () => void;
  phoneNumber?: string;
  onPhoneNumberChange?: (value: string) => void;
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
        {props.screening.theaterName ? <div><dt>극장</dt><dd>{props.screening.regionName} · {props.screening.theaterName}</dd></div> : null}
        <div><dt>상영</dt><dd>{props.screening.date} {props.screening.startTime} · {props.screening.auditorium}</dd></div>
        <div><dt>인원</dt><dd>{props.audienceCount}명</dd></div>
        <div><dt>좌석</dt><dd>{props.seatIds.join(", ")}</dd></div>
        <div><dt>결제 금액</dt><dd>{props.total.toLocaleString("ko-KR")}원</dd></div>
      </dl>
      <div className="booking-contact">
        <label htmlFor="booking-phone">휴대폰 번호</label>
        <input id="booking-phone" type="tel" inputMode="numeric" autoComplete="off" maxLength={13} placeholder="01012345678" value={props.phoneNumber ?? ""} onChange={(event) => props.onPhoneNumberChange?.(event.target.value)} aria-describedby="booking-phone-hint" />
        <p id="booking-phone-hint">010으로 시작하는 11자리를 입력하세요. 예매 번호를 잊으면 이 번호로 조회할 수 있습니다.</p>
      </div>
      <p className="pricing-note">CGV 일반 2D 성인 기준 예시 요금이며, 실제 금액은 지점에 따라 다를 수 있습니다.</p>
      <div className="screen-actions">
        <button className="secondary-button" onClick={props.onBack} type="button">좌석 다시 선택</button>
        <button className="primary-button" disabled={!isValidPhoneNumber(props.phoneNumber ?? "")} onClick={props.onPay} type="button">결제 방식 선택</button>
      </div>
    </section>
  );
}
