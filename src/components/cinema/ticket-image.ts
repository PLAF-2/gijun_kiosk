import { movies } from "@/lib/cinema/catalog";
import { cinemaStamps, type CinemaStampId } from "@/lib/cinema/collectibles";
import { paymentMethodLabel } from "@/lib/cinema/payments";
import type { Reservation } from "@/lib/cinema/types";

export const souvenirThemes = [
  { id: "starlight", label: "별빛", background: "#141124", panel: "#24203c", accent: "#cab5f2" },
  { id: "ocean", label: "바다", background: "#071d26", panel: "#10333d", accent: "#9fd9df" },
  { id: "forest", label: "숲", background: "#101e18", panel: "#22382b", accent: "#bfd5a4" },
  { id: "sunset", label: "노을", background: "#281923", panel: "#442b32", accent: "#f1bd99" },
  { id: "blossom", label: "벚꽃", background: "#271b2a", panel: "#3d2b40", accent: "#edbdd5" },
  { id: "film", label: "필름", background: "#1b1916", panel: "#34302a", accent: "#e0d2b4" },
  { id: "neon", label: "네온", background: "#11172b", panel: "#242443", accent: "#b8c2ff" },
] as const;
export type SouvenirThemeId = typeof souvenirThemes[number]["id"];

function linesFor(context: CanvasRenderingContext2D, text: string, width: number, font: string) {
  context.font = font;
  const lines: string[] = [];
  let line = "";
  for (const character of Array.from(text)) {
    if (line && context.measureText(line + character).width > width) { lines.push(line); line = character; }
    else line += character;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function loadPoster(source: string, signal: AbortSignal): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(null); return; }
    const image = new Image();
    let done = false;
    const finish = (result: HTMLImageElement | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      image.onload = image.onerror = null;
      signal.removeEventListener("abort", abort);
      if (!result) image.src = "";
      resolve(result);
    };
    const abort = () => finish(null);
    const timer = setTimeout(() => finish(null), 8000);
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    signal.addEventListener("abort", abort, { once: true });
    image.src = source;
  });
}

export async function createSouvenirTicket(reservation: Reservation, phrase: string, themeId: SouvenirThemeId, foundStampIds: CinemaStampId[], signal: AbortSignal) {
  const theme = souvenirThemes.find((item) => item.id === themeId) ?? souvenirThemes[0];
  const movie = movies.find((item) => item.id === reservation.movieId);
  const poster = movie ? await loadPoster(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${movie.posterSrc}`, signal) : null;
  if (signal.aborted) throw new DOMException("Export cancelled", "AbortError");
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이 브라우저에서 이미지 저장을 지원하지 않습니다.");
  const fontFamily = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  const titleFont = `700 50px ${fontFamily}`;
  const bodyFont = `32px ${fontFamily}`;
  const phraseFont = `700 42px ${fontFamily}`;
  const titleLines = linesFor(context, reservation.movieTitle, 624, titleFont);
  const phraseLines = linesFor(context, phrase, 840, phraseFont);
  const details = [
    ["상영", `${reservation.screeningDate}  ${reservation.startTime}`],
    ["극장", [reservation.regionName, reservation.theaterName ?? "CINEMA", reservation.auditorium].filter(Boolean).join(" · ")],
    ["좌석", reservation.seatIds.join(" · ")],
    ["관람 인원", `${reservation.audienceCount}명`],
    ...(reservation.paymentMethod ? [["결제 방식", paymentMethodLabel(reservation.paymentMethod)]] : []),
    ["결제 금액", `${reservation.total.toLocaleString("ko-KR")}원`],
  ].map(([label, text]) => ({ label, lines: linesFor(context, text, 640, bodyFont) }));
  const stamps = cinemaStamps.filter((stamp) => foundStampIds.includes(stamp.id));
  const titleBottom = Math.max(430, 155 + titleLines.length * 68 + 75);
  canvas.height = titleBottom + 115 + phraseLines.length * 60 + details.reduce((height, row) => height + Math.max(64, row.lines.length * 44 + 26), 0) + (stamps.length ? 110 : 0) + 140;
  context.fillStyle = theme.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = theme.accent;
  context.lineWidth = 2;
  context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
  context.textBaseline = "top";
  const write = (text: string, x: number, y: number, font: string, color = "#f4f1fa") => { context.font = font; context.fillStyle = color; context.fillText(text, x, y); };
  write("CINEMA", 64, 63, `900 38px Arial, sans-serif`, theme.accent);
  write("기념 티켓", 790, 71, `24px ${fontFamily}`, theme.accent);
  context.fillStyle = theme.panel;
  context.fillRect(64, 142, 180, 270);
  if (poster && poster.naturalWidth > 0 && poster.naturalHeight > 0) {
    const scale = Math.min(180 / poster.naturalWidth, 270 / poster.naturalHeight);
    const width = poster.naturalWidth * scale;
    const height = poster.naturalHeight * scale;
    context.drawImage(poster, 64 + (180 - width) / 2, 142 + (270 - height) / 2, width, height);
  } else write("CINEMA", 79, 252, `700 26px Arial, sans-serif`, theme.accent);
  titleLines.forEach((line, index) => write(line, 282, 155 + index * 68, titleFont));
  write(`예매 번호 ${reservation.code}`, 282, 170 + titleLines.length * 68, `700 29px ${fontFamily}`, theme.accent);
  const divider = (y: number) => {
    context.beginPath(); context.setLineDash([8, 8]); context.moveTo(64, y); context.lineTo(936, y);
    context.strokeStyle = theme.accent; context.globalAlpha = 0.45; context.stroke(); context.globalAlpha = 1; context.setLineDash([]);
  };
  divider(titleBottom + 24);
  let y = titleBottom + 62;
  phraseLines.forEach((line) => { write(line, 80, y, phraseFont, theme.accent); y += 60; });
  y += 35;
  details.forEach((row) => {
    write(row.label, 80, y + 4, `25px ${fontFamily}`, "#b3bdc8");
    row.lines.forEach((line, index) => write(line, 285, y + index * 44, bodyFont));
    y += Math.max(64, row.lines.length * 44 + 26);
  });
  if (stamps.length) {
    divider(y + 10); y += 38;
    stamps.forEach((stamp, index) => write(`${stamp.symbol} ${stamp.label}`, 80 + index * 280, y, `25px ${fontFamily}`, theme.accent));
    y += 72;
  }
  write("오늘의 영화 시간을 담은 기념 이미지", 80, canvas.height - 104, `23px ${fontFamily}`, "#a7b0bf");
  write("CINEMA SOUVENIR", 80, canvas.height - 70, `15px Arial, sans-serif`, theme.accent);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("이미지를 만들지 못했습니다.")), "image/png"));
  if (signal.aborted) throw new DOMException("Export cancelled", "AbortError");
  return { blob, posterIncluded: !!poster };
}
