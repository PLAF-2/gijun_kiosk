import type { Movie, Screening, Seat } from "@/lib/cinema/types";

export const movies: Movie[] = [
  {
    id: "starlight-post",
    title: "별빛 우체국",
    ageRating: "전체",
    runtimeMinutes: 108,
    description: "밤하늘의 편지가 이어 주는 작은 기적",
    posterTheme: "violet",
  },
  {
    id: "last-wave",
    title: "마지막 파도",
    ageRating: "15세",
    runtimeMinutes: 121,
    description: "모두가 떠난 해안에서 시작된 여름",
    posterTheme: "teal",
  },
  {
    id: "today-us",
    title: "오늘의 우리",
    ageRating: "12세",
    runtimeMinutes: 96,
    description: "오래된 친구들이 다시 만난 하루",
    posterTheme: "amber",
  },
  {
    id: "monday-detective",
    title: "월요일의 탐정",
    ageRating: "12세",
    runtimeMinutes: 113,
    description: "평범한 출근길에 벌어진 뜻밖의 사건",
    posterTheme: "blue",
  },
];

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDemoDates(today: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index,
    );
    return { key: toLocalDateKey(date), date };
  });
}

export function createSeatMap(): Seat[] {
  return ["A", "B", "C", "D"].flatMap((row) =>
    Array.from({ length: 8 }, (_, index) => ({
      id: `${row}${index + 1}`,
      row,
      number: index + 1,
    })),
  );
}

const showtimes = ["10:20", "13:10", "16:00", "19:15"];

export function getScreenings(movieId: string, date: string): Screening[] {
  return showtimes.map((startTime, index) => ({
    id: `${movieId}:${date}:${startTime.replace(":", "")}`,
    movieId,
    date,
    startTime,
    auditorium: `상영관 ${index + 1}`,
    ticketPrice: 12000,
    seats: createSeatMap(),
    blockedSeatIds: index === 0 ? ["A1", "A2", "D7"] : ["B4", "C5"],
  }));
}
