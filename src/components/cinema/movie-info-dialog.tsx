import React, { useEffect, useId, useRef, useState } from "react";
import { getMovieDetails } from "@/lib/cinema/movie-details";
import type { Movie } from "@/lib/cinema/types";
import styles from "./movie-info.module.css";

type MovieInfoDialogProps = {
  id: string;
  movie: Movie;
  onClose: () => void;
};

export function MovieInfoDialog({ id, movie, onClose }: MovieInfoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [playTrailer, setPlayTrailer] = useState(false);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const details = getMovieDetails(movie.id);
  const trailer = details?.trailer;
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${movie.title} 공식 예고편`)}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      id={id}
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={() => setPlayTrailer(false)}
      onClose={onClose}
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>영화 정보</p>
          <h2 id={titleId} className={styles.title}>{movie.title}</h2>
        </div>
        <button
          autoFocus
          className={styles.closeButton}
          aria-label={`${movie.title} 영화 정보 닫기`}
          onClick={() => {
            setPlayTrailer(false);
            dialogRef.current?.close();
          }}
          type="button"
        >
          <span aria-hidden="true">×</span> 닫기
        </button>
      </div>
      <div className={styles.body}>
        <img
          className={styles.poster}
          alt=""
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${movie.posterSrc}`}
        />
        <div className={styles.details}>
          <p className={styles.metadata}>{movie.ageRating} 관람가 <span aria-hidden="true">·</span> {movie.runtimeMinutes}분</p>
          <section aria-label="영화 줄거리">
            <h3 className={styles.sectionTitle}>줄거리</h3>
            <p className={styles.synopsis}>{details?.synopsis ?? movie.description}</p>
            {details?.sourceUrl ? (
              <a className={styles.sourceLink} href={details.sourceUrl} target="_blank" rel="noopener noreferrer">
                영화 정보 출처 <span aria-hidden="true">↗</span><span className={styles.srOnly}> (새 창)</span>
              </a>
            ) : null}
          </section>
          <section className={styles.trailerSection} aria-label="영화 예고편">
            <h3 className={styles.sectionTitle}>예고편</h3>
            {trailer ? (
              <>
                <p className={styles.trailerTitle}>{trailer.title}</p>
                <p className={styles.channel}>{trailer.channel}</p>
                {playTrailer ? (
                  <>
                    <div className={styles.player}>
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.videoId)}?autoplay=1&rel=0`}
                        title={`${movie.title} — ${trailer.title}`}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        onLoad={() => setPlayerLoaded(true)}
                        onError={() => setPlayerError(true)}
                      />
                    </div>
                    <p className={styles.playerStatus} role="status">
                      {playerError
                        ? "플레이어를 불러오지 못했어요. 아래 YouTube 링크로 시청할 수 있어요."
                        : playerLoaded
                          ? "영상이 재생되지 않으면 아래 YouTube 링크로 시청해 주세요."
                          : "YouTube 플레이어를 불러오는 중이에요."}
                    </p>
                  </>
                ) : (
                  <button className={styles.playButton} onClick={() => setPlayTrailer(true)} type="button">
                    <span className={styles.playIcon} aria-hidden="true">▶</span>
                    <strong>예고편 재생</strong>
                    <span>YouTube 플레이어 열기</span>
                  </button>
                )}
                <a className={styles.youtubeLink} href={trailer.sourceUrl} target="_blank" rel="noopener noreferrer">
                  YouTube에서 보기 <span aria-hidden="true">↗</span><span className={styles.srOnly}> (새 창)</span>
                </a>
              </>
            ) : (
              <div className={styles.unavailable}>
                <p>확인된 공식 예고편이 아직 없어요.</p>
                <a className={styles.youtubeLink} href={searchUrl} target="_blank" rel="noopener noreferrer">
                  YouTube에서 공식 예고편 검색 <span aria-hidden="true">↗</span><span className={styles.srOnly}> (새 창)</span>
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}
