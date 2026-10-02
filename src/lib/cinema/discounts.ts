import type { BenefitType, BookingPriceBreakdown, DiscountSelection } from "@/lib/cinema/types";

export const benefitOptions: { id: BenefitType; label: string; hint: string; ticketPrice: number }[] = [
  { id: "senior", label: "경로", hint: "만 65세 이상 · 본인", ticketPrice: 7000 },
  { id: "disabledMild", label: "장애인 · 경증", hint: "본인 · 복지카드 확인", ticketPrice: 5000 },
  { id: "disabledSevere", label: "장애인 · 중증", hint: "본인 · 복지카드 확인", ticketPrice: 5000 },
  { id: "disabledCompanion", label: "중증 장애인 동반", hint: "중증 장애인 1명당 동반 1명", ticketPrice: 5000 },
  { id: "veteran", label: "국가유공자·유족", hint: "본인 · 상이 4~7급 포함", ticketPrice: 5000 },
  { id: "veteranSevere", label: "국가유공상이자", hint: "상이 1~3급 본인", ticketPrice: 5000 },
  { id: "veteranCompanion", label: "국가유공상이자 동반", hint: "상이 1~3급 본인 1명당 동반 1명", ticketPrice: 5000 },
];

export const cinemaCoupons = [
  { code: "CINEMA3000", label: "CINEMA 3,000원 혜택", amount: 3000 },
  { code: "CINEMA5000", label: "CINEMA 5,000원 혜택", amount: 5000 },
] as const;

export function createDiscountSelection(): DiscountSelection {
  return { benefits: {}, couponCode: null };
}

export function getBenefitCount(selection: DiscountSelection) {
  return benefitOptions.reduce((count, { id }) => count + (selection.benefits[id] ?? 0), 0);
}

export function findCinemaCoupon(code: string) {
  const normalized = code.replace(/\s/g, "").toUpperCase();
  return cinemaCoupons.find((coupon) => coupon.code === normalized);
}

/** A single price calculation is used for preview, payment and stored reservations. */
export function calculateBookingPrice(ticketPrice: number, audienceCount: number, selection = createDiscountSelection()): BookingPriceBreakdown | null {
  if (!Number.isInteger(ticketPrice) || ticketPrice <= 0
    || !Number.isInteger(audienceCount) || audienceCount < 1 || audienceCount > 8
    || !selection || !selection.benefits || typeof selection.benefits !== "object"
    || Object.keys(selection.benefits).some((id) => !benefitOptions.some((option) => option.id === id))) return null;
  for (const option of benefitOptions) {
    const count = selection.benefits[option.id] ?? 0;
    if (!Number.isInteger(count) || count < 0 || count > 8) return null;
  }
  const benefitCount = getBenefitCount(selection);
  if (benefitCount > audienceCount
    || (selection.benefits.disabledCompanion ?? 0) > (selection.benefits.disabledSevere ?? 0)
    || (selection.benefits.veteranCompanion ?? 0) > (selection.benefits.veteranSevere ?? 0)) return null;

  const originalTotal = ticketPrice * audienceCount;
  const lines: BookingPriceBreakdown["lines"] = [];
  for (const option of benefitOptions) {
    const count = selection.benefits[option.id] ?? 0;
    const amount = Math.max(0, ticketPrice - option.ticketPrice) * count;
    if (count > 0 && amount > 0) lines.push({ label: `${option.label} ${count}명`, amount });
  }
  let couponCode: string | undefined;
  if (selection.couponCode !== null) {
    if (typeof selection.couponCode !== "string" || audienceCount === benefitCount) return null;
    const coupon = findCinemaCoupon(selection.couponCode);
    if (!coupon || ticketPrice <= 1000) return null;
    couponCode = coupon.code;
    lines.push({ label: `${coupon.label} · 일반 1명`, amount: Math.min(coupon.amount, ticketPrice - 1000) });
  }
  const discountTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  return { originalTotal, discountTotal, total: originalTotal - discountTotal, lines, ...(couponCode ? { couponCode } : {}) };
}

export function updateBenefitSelection(selection: DiscountSelection, id: BenefitType, requested: number, audienceCount: number): DiscountSelection {
  const current = selection.benefits[id] ?? 0;
  const available = audienceCount - getBenefitCount(selection) + current;
  let max = available;
  if (id === "disabledCompanion") max = Math.min(max, selection.benefits.disabledSevere ?? 0);
  if (id === "veteranCompanion") max = Math.min(max, selection.benefits.veteranSevere ?? 0);
  const count = Math.max(0, Math.min(Math.trunc(requested), max));
  const benefits = { ...selection.benefits, [id]: count };
  benefits.disabledCompanion = Math.min(benefits.disabledCompanion ?? 0, benefits.disabledSevere ?? 0);
  benefits.veteranCompanion = Math.min(benefits.veteranCompanion ?? 0, benefits.veteranSevere ?? 0);
  const next = { benefits, couponCode: selection.couponCode };
  if (getBenefitCount(next) >= audienceCount) next.couponCode = null;
  return next;
}

export function isBookingPriceBreakdown(value: unknown, total: number): value is BookingPriceBreakdown {
  if (!value || typeof value !== "object") return false;
  const breakdown = value as Record<string, unknown>;
  if (!Number.isInteger(breakdown.originalTotal) || (breakdown.originalTotal as number) < 0
    || !Number.isInteger(breakdown.discountTotal) || (breakdown.discountTotal as number) < 0
    || breakdown.total !== total || (breakdown.originalTotal as number) - (breakdown.discountTotal as number) !== total
    || !Array.isArray(breakdown.lines) || breakdown.lines.length > benefitOptions.length + 1
    || (breakdown.couponCode !== undefined && (typeof breakdown.couponCode !== "string" || !findCinemaCoupon(breakdown.couponCode)))) return false;
  let sum = 0;
  for (const line of breakdown.lines) {
    if (!line || typeof line !== "object" || typeof line.label !== "string" || line.label.length > 100
      || !Number.isInteger(line.amount) || line.amount < 0) return false;
    sum += line.amount;
  }
  return sum === breakdown.discountTotal;
}
