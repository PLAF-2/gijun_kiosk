"use client";

import { useEffect, useRef, useState } from "react";
import { cinemaStamps, type CinemaStampId } from "@/lib/cinema/collectibles";
import styles from "./cinema-discoveries.module.css";

type CinemaDiscoveriesProps = {
  movieId?: string;
  foundStampIds: CinemaStampId[];
  onDiscover: (id: CinemaStampId) => void;
};

export function CinemaDiscoveries({ movieId, foundStampIds, onDiscover }: CinemaDiscoveriesProps) {
  const foundStamps = cinemaStamps.filter((stamp) => foundStampIds.includes(stamp.id));
  const stampKey = foundStamps.map((stamp) => stamp.id).join(",");
  const previousStamps = useRef(new Set(foundStampIds));
  const pendingStamps = useRef(new Set<CinemaStampId>());
  const [celebration, setCelebration] = useState<CinemaStampId | null>(null);

  useEffect(() => {
    const nextStamps = new Set(stampKey.split(",").filter(Boolean) as CinemaStampId[]);
    const newStamp = cinemaStamps.find((stamp) => nextStamps.has(stamp.id) && !previousStamps.current.has(stamp.id));
    previousStamps.current = nextStamps;
    pendingStamps.current.clear();

    if (!newStamp) {
      setCelebration(null);
      return;
    }

    setCelebration(newStamp.id);
    const timeout = window.setTimeout(() => setCelebration(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [stampKey]);

  function discover(id: CinemaStampId) {
    if (foundStampIds.includes(id) || pendingStamps.current.has(id)) return;
    pendingStamps.current.add(id);
    onDiscover(id);
  }

  const latestStamp = cinemaStamps.find((stamp) => stamp.id === celebration);
  const scene = movieId === "la-la-land" ? "starlight" : movieId === "jurassic-world-rebirth" ? "footprint" : "cinema";

  return (
    <aside className={styles.discoveries} data-scene={scene} aria-label="영화관의 작은 발견">
      <div className={styles.trail}>
        <span className={styles.hint}>작은 흔적을 찾아보세요</span>
        <div className={styles.targets}>
          {cinemaStamps.filter((stamp) => stamp.id !== "reel").map((stamp) => {
            const found = foundStampIds.includes(stamp.id);
            return (
              <button
                key={stamp.id}
                type="button"
                className={`${styles.target} ${stamp.id === "starlight" ? styles.star : styles.footprint}`}
                aria-label={`${stamp.label}${found ? ", 이미 찾은 기념 스탬프" : ", 기념 스탬프 찾기"}`}
                aria-pressed={found}
                title={found ? `${stamp.label} · 발견 완료` : "작은 흔적 살펴보기"}
                onClick={() => discover(stamp.id)}
              >
                {stamp.id === "starlight" ? (
                  <span className={styles.starSymbol} aria-hidden="true">✦<i>·</i></span>
                ) : (
                  <svg className={styles.footprintSymbol} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                    <path d="M12 26c-4 0-6-3-4-7l4-6 3 3 4-4 4 7c2 4 0 7-4 7h-7ZM8 13 5 7c-.6-1.4.5-2.5 1.6-1.5l5 5L8 13Zm6-3-1-7c-.2-1.5 1.5-2 2.1-.5l3 7-4.1.5Zm6 0 3-6c.8-1.3 2.3-.7 1.8.8L24 13l-4-3Z" />
                  </svg>
                )}
                {found && <span className={styles.check} aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.collection}>
        <span className={styles.count} aria-label={`기념 스탬프 ${foundStamps.length}개 발견, 전체 ${cinemaStamps.length}개`}>
          기념 스탬프 <strong>{foundStamps.length}</strong><span> / {cinemaStamps.length}</span>
        </span>
        <span className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {latestStamp && (
            <span key={latestStamp.id} className={styles.celebration}>
              <span aria-hidden="true">{latestStamp.symbol}</span> {latestStamp.label}! 티켓에 담을 수 있어요
            </span>
          )}
        </span>
      </div>
    </aside>
  );
}
