export type CinemaStampId = "starlight" | "footprint" | "reel";

export const cinemaStamps: {
  id: CinemaStampId;
  label: string;
  symbol: string;
}[] = [
  { id: "starlight", label: "별빛 발견", symbol: "✦" },
  { id: "footprint", label: "공룡의 발자국", symbol: "🦖" },
  { id: "reel", label: "숨은 필름", symbol: "🎞" },
];
