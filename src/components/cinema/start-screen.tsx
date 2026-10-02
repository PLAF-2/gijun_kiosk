import React, { useEffect, useRef, useState } from "react";
import { movies } from "@/lib/cinema/catalog";
import styles from "./cinema-entry.module.css";

type StartScreenProps = {
  onStartBooking: () => void;
  onLookupBooking: () => void;
};

const DOOR_OPENING_MS = 1000;
const DOOR_REVEAL_MS = 100;

export function StartScreen({ onStartBooking, onLookupBooking }: StartScreenProps) {
  const [opening, setOpening] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openingRef = useRef(false);
  const enteredRef = useRef(false);

  useEffect(() => () => { if (timerRef.current !== null) clearTimeout(timerRef.current); }, []);

  function enterCinema() {
    if (enteredRef.current) return;
    enteredRef.current = true;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    onStartBooking();
  }

  function openDoors() {
    if (openingRef.current) return;
    openingRef.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { enterCinema(); return; }
    setOpening(true);
    timerRef.current = setTimeout(enterCinema, DOOR_OPENING_MS + DOOR_REVEAL_MS);
  }

  return (
    <section className={`screen-card ${styles.entry} ${opening ? styles.opening : ""}`} style={{ "--door-opening-duration": `${DOOR_OPENING_MS}ms` } as React.CSSProperties}>
      <button type="button" className={styles.portal} onClick={openDoors} disabled={opening} aria-label="극장 문을 열고 영화 선택하기">
        <span className={styles.marquee} aria-hidden="true">YOUR NEXT FAVORITE STORY <small>THE SHOW BEGINS HERE</small></span>
        <span className={styles.doorFrame} aria-hidden="true">
          <span className={styles.inside}>{[movies[5], movies[2], movies[7]].map((movie) => <img key={movie.id} alt="" src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${movie.posterSrc}`} />)}</span>
          <span className={`${styles.door} ${styles.leftDoor}`}><i/><span className={styles.wordmarkStrip}><span className={styles.doorTitle}>{Array.from("CINEMA").map((letter, index) => <span key={index}>{letter}</span>)}</span></span></span>
          <span className={`${styles.door} ${styles.rightDoor}`}><i/><span className={styles.wordmarkStrip}><span className={styles.doorTitle}>{Array.from("CINEMA").map((letter, index) => <span key={index}>{letter}</span>)}</span></span></span>
          <span className={styles.seam}/>
        </span>
        <span className={styles.invitation} aria-hidden="true">{opening ? "당신의 영화가 시작됩니다" : "문을 터치해 입장하세요"} <span>↗</span></span>
      </button>
      <div className={styles.support}>
        <div><h1>오늘의 영화를 예매하세요</h1><p>기다려 온 이야기, 가장 좋은 자리에서.</p></div>
        <div className={styles.supportActions}>
          {opening ? <button type="button" className={styles.skip} onClick={enterCinema}>바로 입장</button> : null}
          <button className={styles.lookup} onClick={() => { if (timerRef.current !== null) clearTimeout(timerRef.current); onLookupBooking(); }} type="button">예매 조회·취소</button>
        </div>
      </div>
      <p className={styles.status} role="status">{opening ? "극장 문이 열립니다. 곧 영화 선택 화면으로 이동합니다." : ""}</p>
    </section>
  );
}
