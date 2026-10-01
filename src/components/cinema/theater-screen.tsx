import React from "react";
import { regions, theaters } from "@/lib/cinema/theaters";
import type { Movie } from "@/lib/cinema/types";

type TheaterScreenProps = {
  movie: Movie;
  regionId: string;
  selectedTheaterId: string | null;
  onRegionChange: (id: string) => void;
  onSelect: (id: string) => void;
  onContinue: () => void;
};

export function TheaterScreen(props: TheaterScreenProps) {
  const region = regions.find((entry) => entry.id === props.regionId);
  const choices = theaters.filter((theater) => theater.regionId === props.regionId);
  const selected = choices.find((theater) => theater.id === props.selectedTheaterId);

  return (
    <section className="screen-card theater-screen">
      <div className="theater-heading">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${props.movie.posterSrc}`} alt="" />
        <div className="screen-heading">
          <p className="eyebrow">{props.movie.title}</p>
          <h1>관람할 극장을 선택하세요</h1>
        </div>
      </div>
      <div className="theater-picker">
        <div className="region-panel">
          <h2>지역</h2>
          <div className="region-options" role="group" aria-label="극장 지역">
            {regions.map((entry) => (
              <button type="button" key={entry.id} aria-pressed={entry.id === props.regionId} onClick={() => props.onRegionChange(entry.id)}>{entry.name}</button>
            ))}
          </div>
        </div>
        <div className="theater-panel">
          <h2>{region?.name} <span>극장 선택</span></h2>
          <div className="theater-options" role="group" aria-label={`${region?.name ?? ""} 극장`}>
            {choices.map((theater) => (
              <button key={theater.id} type="button" aria-pressed={theater.id === props.selectedTheaterId} onClick={() => props.onSelect(theater.id)}>
                <div className="theater-card-top"><strong>{theater.name}</strong><span aria-hidden="true">{theater.id === props.selectedTheaterId ? "✓" : "↗"}</span></div>
                <span>{theater.location}</span>
                <span className="theater-facilities">{theater.auditoriums.length}개 상영관 · 일반 2D</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="theater-continue">
        <p aria-live="polite">{selected?.name ?? "관람할 극장을 선택해 주세요"}</p>
        <button className="primary-button" type="button" disabled={!selected} onClick={props.onContinue}>날짜·시간 선택</button>
      </div>
    </section>
  );
}
