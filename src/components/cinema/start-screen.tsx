import React from "react";
import { movies } from "@/lib/cinema/catalog";

type StartScreenProps = {
  onStartBooking: () => void;
  onLookupBooking: () => void;
};

export function StartScreen({ onStartBooking, onLookupBooking }: StartScreenProps) {
  return (
    <section className="screen-card cinema-home">
      <div className="home-copy">
      <p className="eyebrow">YOUR NEXT FAVORITE STORY</p>
      <p className="home-wordmark" aria-hidden="true">CINEMA<span>.</span></p>
      <h1>오늘의 영화를 예매하세요</h1>
      <p className="home-description">기다려 온 이야기, 가장 좋은 자리에서.<br />영화와 상영 시간을 고른 뒤 좌석을 선택해 주세요.</p>
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
      <p className="home-guide">영화 선택 <span aria-hidden="true">→</span> 상영 시간 <span aria-hidden="true">→</span> 좌석 선택</p>
      </div>
      <div className="home-poster-scene" aria-hidden="true">
        {[movies[5], movies[2], movies[7]].map((movie) => (
          <img key={movie.id} alt="" src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${movie.posterSrc}`} />
        ))}
        <span className="home-poster-caption">지금, 만나고 싶은 영화 10편</span>
      </div>
      <div className="home-footnote"><span>영화 예매 키오스크</span><span>DEMO EXPERIENCE · 실제 결제 없음</span></div>
    </section>
  );
}
