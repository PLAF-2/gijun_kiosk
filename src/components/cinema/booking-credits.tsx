import React, { useEffect, useRef, useState } from "react";
import { movies } from "@/lib/cinema/catalog";
import type { Reservation } from "@/lib/cinema/types";
import type { CinemaStampId } from "@/lib/cinema/collectibles";
import { TicketCustomizer } from "./ticket-customizer";
import styles from "./booking-credits.module.css";

const CREDITS_DURATION_MS = 7400;

type BookingCreditsProps = {
  reservation: Reservation;
  cancelled: boolean;
  children: React.ReactNode;
  foundStampIds?: CinemaStampId[];
};

// The caller keys this component by receipt ID so a new booking gets its own roll.
export function BookingCredits({ reservation, cancelled, children, foundStampIds }: BookingCreditsProps) {
  const [phase, setPhase] = useState<"pending" | "rolling" | "ticket">("pending");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const skippedRef = useRef(false);
  const finishedRef = useRef(cancelled);
  const movie = movies.find((entry) => entry.id === reservation.movieId);
  const showingTicket = cancelled || phase === "ticket";

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function revealTicket() {
      finishedRef.current = true;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setPhase("ticket");
    }
    function handleMotionChange(event: MediaQueryListEvent) {
      if (event.matches) revealTicket();
    }

    if (cancelled || finishedRef.current || motionPreference.matches) {
      revealTicket();
    } else {
      setPhase("rolling");
      timerRef.current = setTimeout(revealTicket, CREDITS_DURATION_MS);
    }
    motionPreference.addEventListener("change", handleMotionChange);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
      motionPreference.removeEventListener("change", handleMotionChange);
    };
  }, [cancelled]);

  useEffect(() => {
    if (!showingTicket || !skippedRef.current) return;
    skippedRef.current = false;
    ticketRef.current?.focus();
  }, [showingTicket]);

  function skipCredits() {
    skippedRef.current = true;
    finishedRef.current = true;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    setPhase("ticket");
  }

  return (
    <div className={styles.experience} data-phase={showingTicket ? "ticket" : phase}>
      {!showingTicket ? (
        <div className={styles.credits}>
          <div className={styles.preamble} aria-hidden="true">
            <span className={styles.smallLabel}>ENDING CREDITS</span>
            <p>한 편의 영화, 당신의 시간</p>
          </div>
          <div className={styles.viewport} aria-hidden="true">
            <div className={styles.roll}>
              <div className={styles.credit}>
                <span>오늘의 주인공</span>
                <strong className={styles.protagonist}>당신</strong>
                <small>{reservation.audienceCount}명이 함께하는 영화의 시간</small>
              </div>
              <div className={styles.credit}>
                <span>관람 영화</span>
                <strong>{reservation.movieTitle}</strong>
              </div>
              <div className={styles.credit}>
                <span>극장</span>
                <strong>{reservation.theaterName ?? reservation.auditorium}</strong>
                <small>{[reservation.regionName, reservation.theaterName ? reservation.auditorium : null].filter(Boolean).join(" · ")}</small>
              </div>
              <div className={styles.credit}>
                <span>좌석</span>
                <strong>{reservation.seatIds.join(" · ")}</strong>
                <small>{reservation.screeningDate} · {reservation.startTime}</small>
              </div>
            </div>
          </div>
          <div className={styles.skipArea}>
            <p>곧 관람 티켓이 나타납니다.</p>
            <button className={styles.skipButton} onClick={skipCredits} type="button">
              티켓 바로 보기 <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      ) : null}
      <div
        aria-label={cancelled ? "취소된 예매 내역" : "관람 티켓"}
        className={`${styles.ticket} ${cancelled ? styles.cancelledTicket : ""}`}
        ref={ticketRef}
        role="region"
        tabIndex={-1}
      >
        <div className={styles.ticketMasthead}>
          <span>CINEMA</span>
          <span>{cancelled ? "CANCELLED" : `ADMIT ${reservation.audienceCount}`}</span>
        </div>
        <div className={styles.ticketMovie}>
          {movie ? (
            <img
              alt=""
              className={styles.poster}
              height={180}
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${movie.posterSrc}`}
              width={120}
            />
          ) : null}
          <div>
            <p className={styles.smallLabel}>{cancelled ? "CANCELLED RESERVATION" : "YOUR MOVIE TICKET"}</p>
            <h2>{reservation.movieTitle}</h2>
            <p className={styles.screening}>{reservation.screeningDate} · {reservation.startTime}</p>
            <p className={styles.screening}>{[reservation.theaterName, reservation.auditorium].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className={styles.receipt}>{children}</div>
        {showingTicket ? <TicketCustomizer reservation={reservation} foundStampIds={foundStampIds} cancelled={cancelled} /> : null}
        <div className={styles.ticketFooter}>
          <span aria-hidden="true">✦</span>
          <p>{cancelled ? "취소된 예매의 내역입니다." : "이제, 당신의 영화가 시작됩니다."}</p>
          <span aria-hidden="true">✦</span>
        </div>
      </div>
      <p aria-live="polite" className={styles.srOnly} role="status">
        {showingTicket ? (cancelled ? "취소된 예매 내역입니다." : "관람 티켓이 준비되었습니다.") : "예매가 완료되었습니다. 엔딩 크레딧 후 관람 티켓이 나타납니다. 티켓 바로 보기로 건너뛸 수 있습니다."}
      </p>
    </div>
  );
}
