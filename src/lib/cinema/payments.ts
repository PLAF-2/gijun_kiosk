import type { PaymentMethod } from "@/lib/cinema/types";

export const paymentMethods: {
  id: PaymentMethod;
  label: string;
  caption: string;
  instruction: string;
  reader: "card" | "nfc" | "code" | "cash";
  symbol: string;
}[] = [
  { id: "card", label: "신용·체크카드", caption: "IC 카드", instruction: "카드를 아래 카드 투입구에 넣어 주세요.", reader: "card", symbol: "▣" },
  { id: "samsung-pay", label: "삼성페이", caption: "휴대폰 접촉", instruction: "삼성페이에서 결제할 카드를 선택하고 휴대폰을 결제 단말기에 가까이 대 주세요.", reader: "nfc", symbol: "S" },
  { id: "apple-pay", label: "애플페이", caption: "휴대폰·워치 접촉", instruction: "지갑 앱에서 결제를 준비한 후 iPhone 또는 Apple Watch를 결제 단말기에 가까이 대 주세요.", reader: "nfc", symbol: "A" },
  { id: "kakao-pay", label: "카카오페이", caption: "QR·바코드", instruction: "카카오페이의 결제 QR 또는 바코드를 열고 아래 스캐너에 보여 주세요.", reader: "code", symbol: "K" },
  { id: "naver-pay", label: "네이버페이", caption: "QR·바코드", instruction: "네이버페이의 현장결제 QR 또는 바코드를 열고 아래 스캐너에 보여 주세요.", reader: "code", symbol: "N" },
  { id: "toss-pay", label: "토스페이", caption: "QR·바코드", instruction: "토스페이의 결제 QR 또는 바코드를 열고 아래 스캐너에 보여 주세요.", reader: "code", symbol: "T" },
  { id: "cash", label: "현금 결제", caption: "현금 투입", instruction: "결제 금액에 맞춰 아래 현금 투입구에 현금을 넣어 주세요.", reader: "cash", symbol: "₩" },
];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return paymentMethods.some((method) => method.id === value);
}

export function paymentMethodLabel(method: PaymentMethod) {
  return paymentMethods.find((option) => option.id === method)?.label ?? "신용·체크카드";
}
