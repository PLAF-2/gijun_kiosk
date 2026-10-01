import React, { useEffect, useRef, useState } from "react";
import type { Reservation } from "@/lib/cinema/types";
import { paymentMethodLabel } from "@/lib/cinema/payments";

type CompleteScreenProps = {
  reservation: Reservation;
  cancelled: boolean;
  storageWarning?: boolean;
  onCancel: () => void;
  onHome: () => void;
};

export function CompleteScreen(props: CompleteScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const statusHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (confirming && !props.cancelled) {
      if (!dialog.open) dialog.showModal();
      confirmButtonRef.current?.focus();
      return;
    }

    if (dialog.open) dialog.close();
    if (props.cancelled) statusHeadingRef.current?.focus();
  }, [confirming, props.cancelled]);

  function handleDialogClose() {
    setConfirming(false);
    if (props.cancelled) statusHeadingRef.current?.focus();
    else cancelTriggerRef.current?.focus();
  }

  function handleDialogCancel() {
    setConfirming(false);
  }

  function dismissConfirmation() {
    dialogRef.current?.close();
    setConfirming(false);
  }

  return (
    <section className="screen-card completion-card">
      <p className="eyebrow">{props.cancelled ? "CANCELLATION COMPLETE" : "RESERVATION COMPLETE"}</p>
      <h1 ref={statusHeadingRef} tabIndex={-1}>
        {props.cancelled ? "예매가 취소되었습니다" : "예매가 완료되었습니다"}
      </h1>
      {props.cancelled ? <p>취소 내역은 취소 후 1분이 지나면 자동 삭제됩니다.</p> : null}
      <p>예매 번호</p>
      <p className="reservation-code" aria-label={`예매 번호 ${props.reservation.code}`}>
        {props.reservation.code}
      </p>
      <dl className="booking-summary">
        <div><dt>영화</dt><dd>{props.reservation.movieTitle}</dd></div>
        {props.reservation.theaterName ? <div><dt>극장</dt><dd>{props.reservation.regionName} · {props.reservation.theaterName}</dd></div> : null}
        <div><dt>상영</dt><dd>{props.reservation.screeningDate} {props.reservation.startTime} · {props.reservation.auditorium}</dd></div>
        <div><dt>인원</dt><dd>{props.reservation.audienceCount}명</dd></div>
        <div><dt>좌석</dt><dd>{props.reservation.seatIds.join(", ")}</dd></div>
        {props.reservation.paymentMethod ? <div><dt>결제 방식</dt><dd>{paymentMethodLabel(props.reservation.paymentMethod)}</dd></div> : null}
        <div><dt>결제 금액</dt><dd>{props.reservation.total.toLocaleString("ko-KR")}원</dd></div>
      </dl>
      {props.storageWarning ? (
        <p role="alert" className="storage-warning">
          예매 정보는 이 화면에 반영됐지만 저장되지 않았습니다. 새로고침 후 예매 조회가 되지 않을 수 있습니다.
        </p>
      ) : null}
      <div className="screen-actions">
        {!props.cancelled && !confirming ? (
          <button
            className="secondary-button"
            onClick={() => setConfirming(true)}
            ref={cancelTriggerRef}
            type="button"
          >예매 취소</button>
        ) : null}
        <dialog
          aria-describedby="cancel-dialog-description"
          aria-labelledby="cancel-dialog-title"
          aria-modal="true"
          onCancel={handleDialogCancel}
          onClose={handleDialogClose}
          ref={dialogRef}
        >
          <h2 id="cancel-dialog-title">예매 취소 확인</h2>
          <p id="cancel-dialog-description">이 예매를 취소할까요?</p>
          <div className="screen-actions">
            <button className="secondary-button" onClick={dismissConfirmation} type="button">계속 예매 유지</button>
            <button className="danger-button" onClick={props.onCancel} ref={confirmButtonRef} type="button">취소 확정</button>
          </div>
        </dialog>
        <button className="primary-button" onClick={props.onHome} type="button">처음으로</button>
      </div>
    </section>
  );
}
