import React, { useState } from "react";
import { paymentMethods } from "@/lib/cinema/payments";
import type { BookingPriceBreakdown, PaymentMethod } from "@/lib/cinema/types";

type PaymentScreenProps = {
  total: number;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  onPay: () => void;
  onBack: () => void;
  priceBreakdown?: BookingPriceBreakdown;
};

export function PaymentScreen(props: PaymentScreenProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const option = paymentMethods.find((method) => method.id === props.method) ?? paymentMethods[0];

  return (
    <section className="screen-card payment-screen">
      <div className="screen-heading">
        <p className="eyebrow">PAYMENT</p>
        <h1>{showInstructions ? `${option.label}로 결제합니다` : "결제 방식을 선택하세요"}</h1>
      </div>
      <div className="payment-total"><span>결제 금액</span><strong>{props.total.toLocaleString("ko-KR")}원</strong></div>
      {props.priceBreakdown && props.priceBreakdown.discountTotal > 0 ? <p className="payment-discount-note">혜택 적용 전 {props.priceBreakdown.originalTotal.toLocaleString("ko-KR")}원 − 혜택 금액 {props.priceBreakdown.discountTotal.toLocaleString("ko-KR")}원</p> : null}
      {showInstructions ? (
        <div className="payment-instructions" aria-live="polite">
          <div className={`payment-reader reader-${option.reader}`} aria-hidden="true">
            <div className="reader-device">
              <span className="reader-symbol">{option.reader === "code" ? "▥" : option.reader === "nfc" ? "⌁" : option.symbol}</span>
              <span>{option.reader === "code" ? "QR · BARCODE" : option.reader === "nfc" ? "CONTACTLESS" : option.reader === "cash" ? "CASH" : "CARD"}</span>
              <div className="reader-slot" />
            </div>
          </div>
          <h2>{option.instruction}</h2>
          <p>{option.reader === "card" ? "결제가 끝날 때까지 카드를 빼지 마세요." : option.reader === "nfc" ? "단말기에 휴대폰을 가까이 유지해 주세요." : option.reader === "code" ? "화면 밝기를 높이고 결제 코드를 스캐너 중앙에 맞춰 주세요." : "결제가 끝나면 거스름돈과 영수증을 확인해 주세요."}</p>
        </div>
      ) : (
        <div className="payment-method-grid" role="group" aria-label="결제 방식">
          {paymentMethods.map((method) => <button key={method.id} className={`payment-method method-${method.id}`} type="button" onClick={() => { props.onMethodChange(method.id); setShowInstructions(true); }}>
            <span className="payment-method-symbol" aria-hidden="true">{method.symbol}</span>
            <strong>{method.label}</strong>
          </button>)}
        </div>
      )}
      <div className="screen-actions">
        <button className="secondary-button" onClick={showInstructions ? () => setShowInstructions(false) : props.onBack} type="button">{showInstructions ? "결제 방식 다시 선택" : "예매 내용 확인"}</button>
        {showInstructions ? <button className="primary-button" onClick={props.onPay} type="button">결제 완료</button> : null}
      </div>
    </section>
  );
}
