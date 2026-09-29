import React from "react";

type StartScreenProps = {
  onStartBooking: () => void;
  onLookupBooking: () => void;
};

export function StartScreen({ onStartBooking, onLookupBooking }: StartScreenProps) {
  return (
    <section className="screen-card cinema-home">
      <p className="eyebrow">MOVIE RESERVATION</p>
      <h1>오늘의 영화를 예매하세요</h1>
      <p>영화와 상영 시간을 고른 뒤 좌석을 선택해 주세요.</p>
      <div className="home-actions">
        <button
          className="primary-button"
          onClick={onStartBooking}
          type="button"
        >
          예매 시작
        </button>
        <button
          className="secondary-button"
          onClick={onLookupBooking}
          type="button"
        >
          예매 조회·취소
        </button>
      </div>
    </section>
  );
}
