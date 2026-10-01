"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { findReservation, findReservationsByPhone } from "@/lib/cinema/booking";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/cinema/contact";
import { paymentMethodLabel } from "@/lib/cinema/payments";
import type { Reservation } from "@/lib/cinema/types";

type LookupScreenProps = {
  reservations: Reservation[];
  onCancelReservation: (reservationId: string) => void;
  onHome: () => void;
  storageWarning: boolean;
};

export type LookupResultValue = Reservation | "not-found" | "empty" | "invalid-phone" | "expired" | null;

function isReservationResult(result: LookupResultValue): result is Reservation {
  return result !== null && typeof result === "object";
}

export function normalizeReservationCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function appendLookupKey(current: string, key: string) {
  if (key === "clear") return "";
  return normalizeReservationCode(`${current}${key}`);
}

export function toCancelledLookupResult(reservation: Reservation): Reservation {
  return { ...reservation, status: "cancelled" };
}

type LookupResultProps = {
  result: LookupResultValue;
  confirming: boolean;
  storageWarning: boolean;
  cancelTriggerRef: React.RefObject<HTMLButtonElement | null>;
  statusHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  onConfirm: () => void;
};

export function LookupResult(props: LookupResultProps) {
  if (props.result === null) return null;
  if (props.result === "empty") {
    return <p className="lookup-message" role="alert">예매 번호를 입력해 주세요.</p>;
  }
  if (props.result === "not-found") {
    return <p className="lookup-message" role="alert">예매 내역을 찾을 수 없습니다.</p>;
  }
  if (props.result === "invalid-phone") {
    return <p className="lookup-message" role="alert">010으로 시작하는 휴대폰 번호 11자리를 입력해 주세요.</p>;
  }
  if (props.result === "expired") {
    return <p className="lookup-message" role="status">취소 후 1분이 지나 예매 내역이 자동 삭제되었습니다.</p>;
  }

  const reservation = props.result;
  const cancelled = reservation.status === "cancelled";

  return (
    <article aria-label="예매 조회 결과" className="reservation-result">
      <div className="screen-heading">
        <p className="eyebrow">RESERVATION RESULT</p>
        <h2 ref={props.statusHeadingRef} tabIndex={-1}>{reservation.movieTitle}</h2>
      </div>
      <p className={`reservation-status${cancelled ? " is-cancelled" : ""}`}>
        예매 상태: {cancelled ? "취소 완료" : "예매 완료"}
      </p>
      <dl className="booking-summary">
        <div><dt>예매 번호</dt><dd>{reservation.code}</dd></div>
        {reservation.theaterName ? <div><dt>극장</dt><dd>{reservation.regionName} · {reservation.theaterName}</dd></div> : null}
        <div><dt>상영</dt><dd>{reservation.screeningDate} {reservation.startTime} · {reservation.auditorium}</dd></div>
        <div><dt>인원</dt><dd>{reservation.audienceCount}명</dd></div>
        <div><dt>좌석</dt><dd>{reservation.seatIds.join(", ")}</dd></div>
        {reservation.paymentMethod ? <div><dt>결제 방식</dt><dd>{paymentMethodLabel(reservation.paymentMethod)}</dd></div> : null}
        <div><dt>결제 금액</dt><dd>{reservation.total.toLocaleString("ko-KR")}원</dd></div>
      </dl>
      {cancelled ? <p className="lookup-message">취소된 예매입니다. 취소 후 1분이 지나면 내역이 자동 삭제됩니다.</p> : null}
      {props.storageWarning ? (
        <p className="storage-warning" role="alert">
          예매 정보는 이 화면에 반영됐지만 저장되지 않았습니다. 새로고침 후 예매 조회가 되지 않을 수 있습니다.
        </p>
      ) : null}
      {!cancelled ? (
        <button className="danger-button" onClick={props.onConfirm} ref={props.cancelTriggerRef} type="button">
          예매 취소
        </button>
      ) : null}
    </article>
  );
}

export function LookupScreen(props: LookupScreenProps) {
  const [mode, setMode] = useState<"code" | "phone">("code");
  const [code, setCode] = useState("");
  const [matchingIds, setMatchingIds] = useState<string[]>([]);
  const [result, setResult] = useState<LookupResultValue>(null);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const statusHeadingRef = useRef<HTMLHeadingElement>(null);
  const hadConfirmationRef = useRef(false);

  useEffect(() => {
    if (isReservationResult(result)) {
      const current = props.reservations.find((reservation) => reservation.id === result.id);
      if (!current) {
        setResult(result.status === "cancelled" ? "expired" : "not-found");
        setConfirming(false);
      } else if (current !== result) {
        setResult(current);
      }
    } else if (result === null && matchingIds.length > 0 && !props.reservations.some((reservation) => matchingIds.includes(reservation.id))) {
      setResult("expired");
    }
  }, [props.reservations, result, matchingIds]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (confirming && isReservationResult(result) && result.status === "booked") {
      if (!dialog.open) dialog.showModal();
      hadConfirmationRef.current = true;
      confirmButtonRef.current?.focus();
      return;
    }

    if (hadConfirmationRef.current) {
      if (dialog.open) dialog.close();
      hadConfirmationRef.current = false;
      if (isReservationResult(result) && result.status === "cancelled") {
        statusHeadingRef.current?.focus();
      } else {
        cancelTriggerRef.current?.focus();
      }
    }
  }, [confirming, result]);

  function handleLookup(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (mode === "phone") {
      const phone = normalizePhoneNumber(code);
      setCode(phone);
      setConfirming(false);
      setMatchingIds([]);
      if (!isValidPhoneNumber(phone)) {
        setResult("invalid-phone");
        return;
      }
      const matches = findReservationsByPhone(props.reservations, phone);
      setMatchingIds(matches.map((reservation) => reservation.id));
      setResult(matches.length === 1 ? matches[0] : matches.length === 0 ? "not-found" : null);
      return;
    }
    const normalizedCode = normalizeReservationCode(code);
    setCode(normalizedCode);
    setResult(
      normalizedCode.length === 0
        ? "empty"
        : findReservation(props.reservations, normalizedCode) ?? "not-found",
    );
    setConfirming(false);
    setMatchingIds([]);
  }

  function updateCode(nextCode: string) {
    setCode(mode === "phone" ? normalizePhoneNumber(nextCode) : normalizeReservationCode(nextCode));
    setResult(null);
    setConfirming(false);
    setMatchingIds([]);
  }

  function handleConfirmCancellation() {
    if (!isReservationResult(result) || result.status !== "booked") return;
    props.onCancelReservation(result.id);
    setResult(toCancelledLookupResult(result));
    setConfirming(false);
  }

  function handleDialogCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    setConfirming(false);
  }

  function changeMode(nextMode: "code" | "phone") {
    if (mode === nextMode) return;
    setMode(nextMode);
    setCode("");
    setResult(null);
    setMatchingIds([]);
    setConfirming(false);
  }

  const inputId = mode === "phone" ? "reservation-phone" : "reservation-code";
  const inputLabel = mode === "phone" ? "휴대폰 번호" : "예매 번호";
  const matches = matchingIds
    .map((id) => props.reservations.find((reservation) => reservation.id === id))
    .filter((reservation): reservation is Reservation => reservation !== undefined);

  return (
    <section className="screen-card lookup-card">
      <div className="screen-heading">
        <p className="eyebrow">BOOKING LOOKUP</p>
        <h1>{inputLabel}를 입력하세요</h1>
      </div>
      <form className="lookup-form" onSubmit={handleLookup}>
        <div className="lookup-mode" role="group" aria-label="조회 방식">
          <button type="button" aria-pressed={mode === "code"} onClick={() => changeMode("code")}>예매 번호</button>
          <button type="button" aria-pressed={mode === "phone"} onClick={() => changeMode("phone")}>휴대폰 번호</button>
        </div>
        <label className="lookup-field" htmlFor={inputId}>{inputLabel}</label>
        <input
          autoCapitalize="characters"
          autoComplete="off"
          id={inputId}
          type={mode === "phone" ? "tel" : "text"}
          inputMode={mode === "phone" ? "numeric" : "text"}
          maxLength={mode === "phone" ? 13 : 7}
          onChange={(event) => updateCode(event.target.value)}
          placeholder={mode === "phone" ? "01012345678" : "예: C123456"}
          ref={inputRef}
          spellCheck={false}
          value={code}
        />
        <div aria-label={`${inputLabel} 입력`} className="keypad" role="group">
          {mode === "phone" ? <button aria-label="한 자리 지우기" className="keypad-key" onClick={() => updateCode(code.slice(0, -1))} type="button">⌫</button> : <button aria-label="C 입력" className="keypad-key" onClick={() => updateCode(appendLookupKey(code, "C"))} type="button">C</button>}
          {[..."0123456789"].map((digit) => (
            <button
              aria-label={`${digit} 입력`}
              className="keypad-key"
              key={digit}
              onClick={() => updateCode(mode === "phone" ? `${code}${digit}` : appendLookupKey(code, digit))}
              type="button"
            >{digit}</button>
          ))}
          <button
            aria-label={`${inputLabel} 지우기`}
            className="keypad-key keypad-clear"
            onClick={() => {
              updateCode(appendLookupKey(code, "clear"));
              inputRef.current?.focus();
            }}
            type="button"
          >지우기</button>
          <button aria-label={`${inputLabel} 조회`} className="primary-button keypad-submit" type="submit">조회</button>
        </div>
      </form>
      <div className="lookup-results">
        {matchingIds.length > 1 && matches.length > 0 ? <div className="lookup-matches" aria-label="휴대폰 번호로 찾은 예매 목록">
          <h2>예매 내역 {matches.length}건</h2>
          {matches.map((reservation) => <button key={reservation.id} type="button" aria-pressed={isReservationResult(result) && result.id === reservation.id} onClick={() => { setResult(reservation); setConfirming(false); }}>
            <strong>{reservation.movieTitle}</strong>
            {reservation.theaterName ? <span>{reservation.regionName} · {reservation.theaterName}</span> : null}
            <span>{reservation.screeningDate} {reservation.startTime} · {reservation.auditorium}</span>
            <span>{reservation.code} · {reservation.status === "cancelled" ? "취소 완료" : "예매 완료"}</span>
          </button>)}
        </div> : null}
        <LookupResult
        cancelTriggerRef={cancelTriggerRef}
        confirming={confirming}
        onConfirm={() => setConfirming(true)}
        result={result}
        statusHeadingRef={statusHeadingRef}
        storageWarning={props.storageWarning}
      />
      </div>
      <dialog
        aria-describedby="lookup-cancel-dialog-description"
        aria-labelledby="lookup-cancel-dialog-title"
        aria-modal="true"
        onCancel={handleDialogCancel}
        ref={dialogRef}
      >
        <h2 id="lookup-cancel-dialog-title">예매 취소 확인</h2>
        <p id="lookup-cancel-dialog-description">이 예매를 취소할까요? 취소하면 좌석을 다시 선택할 수 있습니다.</p>
        <div className="screen-actions">
          <button className="secondary-button" onClick={() => setConfirming(false)} type="button">계속 예매 유지</button>
          <button className="danger-button" onClick={handleConfirmCancellation} ref={confirmButtonRef} type="button">취소 확정</button>
        </div>
      </dialog>
      <button className="secondary-button" onClick={props.onHome} type="button">처음으로</button>
    </section>
  );
}
