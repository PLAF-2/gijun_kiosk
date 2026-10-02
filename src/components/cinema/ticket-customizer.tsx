import React, { useEffect, useRef, useState } from "react";
import { movies } from "@/lib/cinema/catalog";
import { cinemaStamps, type CinemaStampId } from "@/lib/cinema/collectibles";
import type { Reservation } from "@/lib/cinema/types";
import { createSouvenirTicket, souvenirThemes, type SouvenirThemeId } from "./ticket-image";
import styles from "./ticket-customizer.module.css";

const phrases = ["오늘, 영화처럼.", "혼영하는 날", "우리의 데이트", "친구들과 영화"];

export function TicketCustomizer({ reservation, foundStampIds = [], cancelled }: { reservation: Reservation; foundStampIds?: CinemaStampId[]; cancelled: boolean }) {
  const [phrase, setPhrase] = useState(phrases[0]);
  const [themeId, setThemeId] = useState<SouvenirThemeId>(() => ["moana-2026", "chiikawa-mermaid-island"].includes(reservation.movieId) ? "ocean" : ["arrietty", "jurassic-world-rebirth"].includes(reservation.movieId) ? "forest" : "starlight");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const urlRef = useRef<string | null>(null);
  const revokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movie = movies.find((item) => item.id === reservation.movieId);
  const theme = souvenirThemes.find((item) => item.id === themeId) ?? souvenirThemes[0];
  const stamps = cinemaStamps.filter((stamp) => foundStampIds.includes(stamp.id));

  useEffect(() => () => {
    controllerRef.current?.abort();
    if (revokeTimerRef.current !== null) clearTimeout(revokeTimerRef.current);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  useEffect(() => {
    if (cancelled) { controllerRef.current?.abort(); busyRef.current = false; setBusy(false); setMessage(""); }
  }, [cancelled]);

  async function saveImage() {
    if (cancelled || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setMessage("기념 티켓 이미지를 준비하고 있어요.");
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const { blob, posterIncluded } = await createSouvenirTicket(reservation, phrase, themeId, foundStampIds, controller.signal);
      if (controller.signal.aborted) return;
      if (revokeTimerRef.current !== null) clearTimeout(revokeTimerRef.current);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `cinema-${reservation.code}.png`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      revokeTimerRef.current = setTimeout(() => { URL.revokeObjectURL(url); if (urlRef.current === url) urlRef.current = null; }, 1500);
      setMessage(posterIncluded ? "PNG 다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인해 주세요." : "포스터를 불러오지 못해 텍스트 티켓으로 다운로드를 요청했습니다.");
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "이미지 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      if (!controller.signal.aborted) { busyRef.current = false; setBusy(false); }
    }
  }

  return <section className={styles.customizer} aria-label="기념 티켓 꾸미기">
    <div className={styles.heading}><h3>나만의 기념 티켓</h3><p>오늘의 영화 시간을 한 장으로 간직하세요.</p></div>
    <div className={styles.preview} style={{ "--souvenir-bg": theme.background, "--souvenir-panel": theme.panel, "--souvenir-accent": theme.accent } as React.CSSProperties}>
      <div className={styles.previewTop}><span>CINEMA</span><span>{cancelled ? "취소된 예매" : "기념 티켓"}</span></div>
      <div className={styles.previewMovie}>
        {movie ? <img alt="" src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${movie.posterSrc}`} /> : null}
        <div><strong>{reservation.movieTitle}</strong><p>{reservation.screeningDate} · {reservation.startTime}</p><p>{reservation.theaterName ?? reservation.auditorium}</p><p>{reservation.seatIds.join(" · ")}</p></div>
      </div>
      <p className={styles.phrase}>{phrase}</p>
      {stamps.length ? <div className={styles.stamps}>{stamps.map((stamp) => <span key={stamp.id}><i aria-hidden="true">{stamp.symbol}</i>{stamp.label}</span>)}</div> : null}
      <div className={styles.previewBottom}><span>{reservation.code}</span><span>{reservation.audienceCount}명 · {reservation.total.toLocaleString("ko-KR")}원</span></div>
    </div>
    <div className={styles.options} role="group" aria-label="기념 티켓 문구">{phrases.map((item, index) => <button type="button" key={item} aria-pressed={phrase === item} onClick={() => setPhrase(item)} disabled={busy}>{index === 0 ? "기본 문구" : item}</button>)}</div>
    <div className={styles.colors} role="group" aria-label="기념 티켓 색감">{souvenirThemes.map((item) => <button type="button" key={item.id} aria-pressed={themeId === item.id} onClick={() => setThemeId(item.id)} disabled={busy}><i style={{ background: item.accent }} aria-hidden="true"/>{item.label}</button>)}</div>
    <button type="button" className={styles.save} disabled={busy || cancelled} onClick={saveImage}>{busy ? "이미지 만드는 중…" : "기념 티켓 이미지 저장 ↓"}</button>
    {cancelled ? <p className={styles.notice}>취소된 예매의 기념 이미지 저장은 제공하지 않습니다.</p> : null}
    <p className={styles.notice} role="status" aria-live="polite">{message}</p>
  </section>;
}
