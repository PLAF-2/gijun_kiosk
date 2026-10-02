import React from "react";
import type { BookingPriceBreakdown } from "@/lib/cinema/types";

export function PriceBreakdownRows({ breakdown }: { breakdown?: BookingPriceBreakdown }) {
  if (!breakdown || breakdown.discountTotal === 0) return null;
  return <>
    <div><dt>혜택 적용 전 금액</dt><dd>{breakdown.originalTotal.toLocaleString("ko-KR")}원</dd></div>
    {breakdown.lines.map((line, index) => <div className="discount-summary-row" key={`${line.label}-${index}`}><dt>{line.label.replace(/할인|쿠폰/g, "혜택")}</dt><dd>−{line.amount.toLocaleString("ko-KR")}원</dd></div>)}
    <div className="discount-summary-total"><dt>총 혜택 금액</dt><dd>−{breakdown.discountTotal.toLocaleString("ko-KR")}원</dd></div>
  </>;
}
