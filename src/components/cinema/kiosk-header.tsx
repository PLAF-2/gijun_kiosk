import React from "react";

type KioskHeaderProps = {
  stepLabel: string;
  stepNumber: number;
  stepCount: number;
  onHome?: () => void;
  onBack?: () => void;
  onDiscoverLogo?: () => void;
};

export function KioskHeader({
  stepLabel,
  stepNumber,
  stepCount,
  onHome,
  onBack,
  onDiscoverLogo,
}: KioskHeaderProps) {
  return (
    <header className="cinema-header">
      <div className="cinema-brand">
        {onDiscoverLogo ? <button className="cinema-brand-discovery" type="button" onClick={onDiscoverLogo} aria-label="CINEMA 로고의 숨은 필름 찾기">CINEMA</button> : "CINEMA"} <span>RESERVATION</span>
      </div>
      {stepLabel ? <div className="header-progress">
        <p aria-live="polite">{stepNumber > 0 ? `${stepNumber} / ${stepCount} · ` : ""}{stepLabel}</p>
        {stepNumber > 0 ? <div className="progress-track" aria-hidden="true"><span style={{ width: `${stepNumber / stepCount * 100}%` }} /></div> : null}
      </div> : null}
      <nav aria-label="키오스크 이동">
        {onBack ? (
          <button onClick={onBack} type="button">
            이전
          </button>
        ) : null}
        {onHome ? (
          <button onClick={onHome} type="button">
            처음으로
          </button>
        ) : null}
      </nav>
    </header>
  );
}
