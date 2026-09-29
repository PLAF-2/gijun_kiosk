import React from "react";

type KioskHeaderProps = {
  stepLabel: string;
  stepNumber: number;
  stepCount: number;
  onHome?: () => void;
  onBack?: () => void;
};

export function KioskHeader({
  stepLabel,
  stepNumber,
  stepCount,
  onHome,
  onBack,
}: KioskHeaderProps) {
  return (
    <header className="cinema-header">
      <div className="cinema-brand">
        CINEMA <span>RESERVATION</span>
      </div>
      <p aria-live="polite">
        {stepNumber} / {stepCount} · {stepLabel}
      </p>
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
