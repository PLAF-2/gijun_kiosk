import React, { useId, useRef, useState } from "react";
import { benefitOptions, calculateBookingPrice, cinemaCoupons, findCinemaCoupon, getBenefitCount, updateBenefitSelection } from "@/lib/cinema/discounts";
import type { BenefitType, DiscountSelection } from "@/lib/cinema/types";

type DiscountPanelProps = {
  audienceCount: number;
  ticketPrice: number;
  value: DiscountSelection;
  onChange: (value: DiscountSelection) => void;
};

const categories: { id: string; label: string; benefits: BenefitType[] }[] = [
  { id: "senior", label: "경로", benefits: ["senior"] },
  { id: "disability", label: "장애인", benefits: ["disabledMild", "disabledSevere", "disabledCompanion"] },
  { id: "veteran", label: "국가유공자", benefits: ["veteran", "veteranSevere", "veteranCompanion"] },
  { id: "coupon", label: "혜택", benefits: [] },
];

export function DiscountPanel({ audienceCount, ticketPrice, value, onChange }: DiscountPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const categoryButtons = useRef<Map<string, HTMLButtonElement>>(new Map());
  const panelId = useId();
  const standardCount = audienceCount - getBenefitCount(value);
  const appliedCoupon = value.couponCode ? findCinemaCoupon(value.couponCode) : null;
  const breakdown = calculateBookingPrice(ticketPrice, audienceCount, value);
  const category = categories.find((item) => item.id === activeCategory);
  const selectedBenefits = benefitOptions.filter((option) => (value.benefits[option.id] ?? 0) > 0);

  function blockedReason(id: BenefitType) {
    if (standardCount < 1) return `선택한 ${audienceCount}명 모두 혜택이 적용되었습니다. 추가하려면 예매 인원을 늘려 주세요.`;
    if (id === "disabledCompanion" && (value.benefits.disabledCompanion ?? 0) >= (value.benefits.disabledSevere ?? 0)) {
      return "중증 장애인 1명당 동반 1명을 추가할 수 있습니다.";
    }
    if (id === "veteranCompanion" && (value.benefits.veteranCompanion ?? 0) >= (value.benefits.veteranSevere ?? 0)) {
      return "상이 1~3급 본인 1명당 동반 1명을 추가할 수 있습니다.";
    }
    return null;
  }

  function changeCount(id: BenefitType, count: number) {
    onChange(updateBenefitSelection(value, id, count, audienceCount));
    if (count === 0) {
      const targetCategory = categories.find((item) => item.benefits.includes(id));
      if (targetCategory) categoryButtons.current.get(targetCategory.id)?.focus({ preventScroll: true });
    }
  }

  function applyCoupon(code: string) {
    const coupon = findCinemaCoupon(code);
    if (!coupon) { setCouponError("혜택 번호를 확인해 주세요."); return; }
    if (standardCount < 1) { setCouponError("일반 요금 관객이 1명 이상일 때 사용할 수 있습니다."); return; }
    onChange({ ...value, couponCode: coupon.code });
    setDraft(coupon.code);
    setCouponError(null);
  }

  return <section className="discount-panel" aria-labelledby={`${panelId}-heading`}>
    <div className="discount-heading"><h2 id={`${panelId}-heading`}>혜택 적용</h2><p aria-live="polite">일반 {standardCount}명 · 우대 {audienceCount - standardCount}명 / 총 {audienceCount}명</p></div>
    <div className="discount-categories" role="group" aria-label="혜택 카테고리">
      {categories.map((item) => <button type="button" key={item.id}
        ref={(node) => { if (node) categoryButtons.current.set(item.id, node); else categoryButtons.current.delete(item.id); }}
        aria-expanded={activeCategory === item.id} aria-controls={`${panelId}-picker`}
        className={activeCategory === item.id ? "is-active" : undefined}
        onClick={() => { setActiveCategory(activeCategory === item.id ? null : item.id); setCouponError(null); }}>
        {item.label}<span aria-hidden="true">{activeCategory === item.id ? "⌃" : "⌄"}</span>
      </button>)}
    </div>

    <div id={`${panelId}-picker`} hidden={!category} className="discount-picker">
      {category ? <>
        <div className="discount-picker-heading"><h3>{category.label} {category.id === "coupon" ? "적용" : "대상 선택"}</h3><button type="button" onClick={() => { setActiveCategory(null); categoryButtons.current.get(category.id)?.focus({ preventScroll: true }); }}>접기</button></div>
        {category.id === "coupon" ? <div className="coupon-panel">
          <label htmlFor={`${panelId}-coupon`}>혜택 번호</label>
          <div className="coupon-input-row"><input id={`${panelId}-coupon`} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={24} placeholder="CINEMA3000" value={draft} onChange={(event) => { setDraft(event.target.value.toUpperCase()); setCouponError(null); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyCoupon(draft); } }} aria-describedby={`${panelId}-coupon-help${couponError ? ` ${panelId}-coupon-error` : ""}`} aria-invalid={couponError ? true : undefined} /><button type="button" onClick={() => applyCoupon(draft)} disabled={!draft.trim() || standardCount < 1}>적용</button></div>
          {couponError ? <p className="coupon-error" id={`${panelId}-coupon-error`} role="alert">{couponError}</p> : null}
          <p className="coupon-help" id={`${panelId}-coupon-help`}>CINEMA 체험용 혜택 · 예매당 1매 · 일반 요금 1명 적용 · 우대 요금과 같은 표에 중복 불가</p>
          {standardCount === 0 ? <p className="discount-capacity-note">일반 요금 관객이 1명 이상일 때 사용할 수 있습니다.</p> : null}
          <div className="coupon-examples">{cinemaCoupons.map((coupon) => <button type="button" key={coupon.code} disabled={standardCount === 0} onClick={() => applyCoupon(coupon.code)}>{coupon.amount.toLocaleString("ko-KR")}원 혜택 {appliedCoupon?.code === coupon.code ? "적용됨" : "적용"}</button>)}</div>
        </div> : <div className="discount-choice-grid">{benefitOptions.filter((option) => category.benefits.includes(option.id)).map((option) => {
          const count = value.benefits[option.id] ?? 0;
          const reason = count > 0 ? null : blockedReason(option.id);
          return <div className="discount-choice" key={option.id}>
            <button type="button" className={count > 0 ? "is-selected" : undefined} disabled={count > 0 || !!reason} aria-pressed={count > 0} aria-describedby={reason ? `${panelId}-${option.id}-reason` : undefined} onClick={() => { if (count === 0) changeCount(option.id, 1); }}>
              <strong>{option.label}</strong><span>{option.hint}</span><span className="discount-choice-price">{Math.min(ticketPrice, option.ticketPrice).toLocaleString("ko-KR")}원 / 1인</span>
            </button>
            {reason ? <p id={`${panelId}-${option.id}-reason`}>{reason}</p> : null}
          </div>;
        })}</div>}
      </> : null}
    </div>

    <div className="selected-discounts">
      <h3>선택한 혜택 {selectedBenefits.length + (appliedCoupon ? 1 : 0)}개</h3>
      {selectedBenefits.length === 0 && !appliedCoupon ? <p className="discount-empty">위 카테고리에서 혜택 대상을 선택해 주세요.</p> : null}
      <div className="benefit-grid">{selectedBenefits.map((option) => {
        const count = value.benefits[option.id] ?? 0;
        return <div className="benefit-option is-applied" key={option.id}>
          <div><h4>{option.label}</h4><p>{Math.min(ticketPrice, option.ticketPrice).toLocaleString("ko-KR")}원 / 1인</p><button className="benefit-remove" type="button" aria-label={`${option.label} 혜택 삭제`} onClick={() => changeCount(option.id, 0)}>삭제</button></div>
          <div className="benefit-counter" role="group" aria-label={`${option.label} 혜택 인원`}>
            <button type="button" aria-label={`${option.label} 인원 줄이기`} onClick={() => changeCount(option.id, count - 1)}>−</button>
            <span aria-live="polite">{count}<small>명</small></span>
            <button type="button" aria-label={`${option.label} 인원 늘리기`} disabled={!!blockedReason(option.id)} onClick={() => changeCount(option.id, count + 1)}>+</button>
          </div>
        </div>;
      })}</div>
      {appliedCoupon ? <div className="applied-coupon" role="status"><div><strong>{appliedCoupon.label}</strong><span>{appliedCoupon.code} · 일반 요금 1명 적용</span></div><button type="button" onClick={() => { onChange({ ...value, couponCode: null }); setDraft(""); setCouponError(null); categoryButtons.current.get("coupon")?.focus({ preventScroll: true }); }}>해제</button></div> : null}
    </div>

    <details className="discount-policy"><summary>우대 혜택 기준 보기</summary><p>경로·국가유공자는 신분증/증명서, 장애인은 실물 복지카드를 입장 시 제시해 주세요. 한 사람에게 우대 요금을 두 번 적용할 수 없습니다.</p><p>CGV 일반 2D 우대 요금을 참고한 CINEMA 예시 요금입니다. 실제 지점·좌석·특별관과 이용 경로별 조건은 다를 수 있습니다.</p><a href="https://cgv.co.kr/csc/frequentlyAskedQuestion" target="_blank" rel="noreferrer">CGV 공식 우대 혜택 안내 ↗</a></details>
    {breakdown ? <div className="discount-final" aria-live="polite"><div><span>혜택 적용 후 결제 금액</span><small>총 {breakdown.discountTotal.toLocaleString("ko-KR")}원 혜택</small></div><strong>{breakdown.total.toLocaleString("ko-KR")}원</strong></div> : null}
  </section>;
}
