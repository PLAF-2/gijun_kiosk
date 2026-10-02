import React, { useEffect, useId, useRef, useState } from "react";
import type { Screening, Seat } from "@/lib/cinema/types";
import styles from "./seat-view.module.css";

type SeatViewDialogProps = {
  screening: Screening;
  selectedSeats: Seat[];
  initialSeatId: string;
  onClose: () => void;
};

export function SeatViewDialog({ screening, selectedSeats, initialSeatId, onClose }: SeatViewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeSeatId, setActiveSeatId] = useState(initialSeatId);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const seat = selectedSeats.find((item) => item.id === activeSeatId) ?? selectedSeats[0];
  const rows = Array.from(new Set(screening.seats.map((item) => item.row)));
  const columns = screening.seatColumns ?? Math.max(1, ...screening.seats.map((item) => item.column ?? item.number));
  const aisles = [...new Set(screening.aisleAfter ?? [4])].filter((column) => column > 0 && column < columns);
  const roomWidth = columns + aisles.length * 0.7;
  const horizontalPosition = (item: Seat) => ((item.column ?? item.number) - 0.5 + aisles.filter((column) => column < (item.column ?? item.number)).length * 0.7) / roomWidth;
  const rowIndex = seat ? rows.indexOf(seat.row) : 0;
  const depth = rows.length > 1 ? rowIndex / (rows.length - 1) : 0.5;
  const lateral = seat ? horizontalPosition(seat) * 2 - 1 : 0;
  const distanceLabel = depth < 0.3 ? "앞쪽" : depth > 0.7 ? "뒤쪽" : "중간";
  const directionLabel = lateral < -0.28 ? "왼쪽" : lateral > 0.28 ? "오른쪽" : "중앙";
  const screenWidth = 560 - depth * 250;
  const screenHeight = screenWidth / 2.39;
  const centerX = 400 - lateral * (95 - depth * 25);
  const centerY = 186 + depth * 12;
  const leftHeight = screenHeight * (1 - lateral * 0.16);
  const rightHeight = screenHeight * (1 + lateral * 0.16);
  const leftX = centerX - screenWidth / 2;
  const rightX = centerX + screenWidth / 2;
  const screenPoints = `${leftX},${centerY - leftHeight / 2} ${rightX},${centerY - rightHeight / 2} ${rightX},${centerY + rightHeight / 2} ${leftX},${centerY + leftHeight / 2}`;
  const rowsAhead = rows.slice(0, rowIndex);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-note`} onClose={onClose}>
    <div className={styles.header}>
      <div><p className={styles.eyebrow}>VIEW FROM YOUR SEAT</p><h2 id={`${id}-title`}>{seat?.id}에서 보는 예상 시야</h2><p className={styles.theater}>{screening.theaterName ? `${screening.theaterName} · ` : ""}{screening.auditorium}</p></div>
      <button type="button" autoFocus aria-label="좌석 예상 시야 닫기" onClick={() => dialogRef.current?.close()}>× <span>닫기</span></button>
    </div>
    <div className={styles.body}>
      <div className={styles.scene}>
        <svg viewBox="0 0 800 450" role="img" aria-label={`${seat?.id} 좌석, ${distanceLabel} ${directionLabel}에서 본 스크린 크기와 기울기의 예상 이미지`}>
          <defs>
            <radialGradient id={`${id}-room`}><stop offset="0" stopColor="#252448"/><stop offset="1" stopColor="#060914"/></radialGradient>
            <linearGradient id={`${id}-light`} x2="0.9" y2="1"><stop stopColor="#c3bcff"/><stop offset="0.55" stopColor="#6a60cb"/><stop offset="1" stopColor="#342765"/></linearGradient>
            <linearGradient id={`${id}-floor`} x2="0" y2="1"><stop stopColor="#11172c"/><stop offset="1" stopColor="#03050c"/></linearGradient>
            <clipPath id={`${id}-screen`}><polygon points={screenPoints}/></clipPath>
          </defs>
          <rect width="800" height="450" fill={`url(#${id}-room)`}/>
          <path d="M0 0L75 90V340L0 450M800 0L725 90V340L800 450" fill="none" stroke="#293049" strokeWidth="2"/>
          <path d="M75 340L0 450H800L725 340Z" fill={`url(#${id}-floor)`}/>
          <polygon points={screenPoints} fill={`url(#${id}-light)`} stroke="#d5cdff" strokeWidth="2"/>
          <g clipPath={`url(#${id}-screen)`} aria-hidden="true">
            <circle cx={centerX + screenWidth * 0.24} cy={centerY - screenHeight * 0.12} r={screenHeight * 0.27} fill="#d5ceff" opacity="0.17"/>
            <path d={`M${leftX - 50} ${centerY + 65} Q${centerX - 50} ${centerY - 5} ${rightX + 50} ${centerY + 45} V400 H${leftX - 50}Z`} fill="#20194d" opacity="0.65"/>
            <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" fill="#f5f2ff" fontFamily="Arial, sans-serif" fontWeight="800" fontSize={22 + (1 - depth) * 12} letterSpacing="7">CINEMA</text>
            <text x={centerX} y={centerY + 30} textAnchor="middle" fill="#ded6ff" fontSize="11" letterSpacing="4">YOUR NEXT FAVORITE STORY</text>
          </g>
          <g aria-hidden="true">{rowsAhead.map((row, index) => {
            const perspective = (index + 1) / (rowsAhead.length + 1);
            const y = 290 + 140 * Math.pow(perspective, 1.6);
            const width = 170 + 800 * perspective;
            const rowCenter = 400 - lateral * (80 + 100 * perspective);
            const seatWidth = Math.min(60, width / roomWidth * 0.8);
            const seatHeight = 12 + perspective * 36;
            return <g key={row}>{screening.seats.filter((item) => item.row === row).map((item) => {
              const x = rowCenter + (horizontalPosition(item) - 0.5) * width;
              return <rect key={item.id} x={x - seatWidth / 2} y={y} width={seatWidth} height={seatHeight} rx={3 + perspective * 5} fill="#182036" stroke="#303d5b" strokeWidth="1.2"/>;
            })}</g>;
          })}</g>
          <path d="M285 450Q300 432 322 435H478Q500 432 515 450" fill="#050710" aria-hidden="true"/>
          <rect x="322" y="410" width="156" height="28" rx="14" fill="#151a2b" stroke="#554e88"/>
          <text x="400" y="428" textAnchor="middle" fill="#d2caff" fontSize="12">내 자리 {seat?.id}</text>
        </svg>
        <span className={styles.simulation}>예상 시야</span>
      </div>
      <div className={styles.position} aria-live="polite"><strong>{seat?.id} <span>{distanceLabel} · {directionLabel}</span></strong><p>스크린에서 {rowIndex + 1}번째 열 / 전체 {rows.length}열</p></div>
      <div className={styles.seatSwitcher} role="group" aria-label="선택 좌석의 예상 시야 전환">
        {selectedSeats.map((item) => <button type="button" key={item.id} aria-pressed={seat?.id === item.id} onClick={() => setActiveSeatId(item.id)}>{item.id}</button>)}
      </div>
      <p id={`${id}-note`} className={styles.note}>좌석 배치를 바탕으로 만든 예상 화면입니다. 실제 극장의 스크린 크기·높이·좌석 단차와 시야는 다를 수 있습니다.</p>
    </div>
  </dialog>;
}
