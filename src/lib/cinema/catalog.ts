import type { Movie, Screening, Seat } from "@/lib/cinema/types";

export const movies: Movie[] = [
  {
    id: "chiikawa-mermaid-island",
    title: "극장판 치이카와: 인어 섬의 비밀",
    ageRating: "전체",
    runtimeMinutes: 99,
    description: "치이카와와 친구들이 인어섬의 비밀을 찾아 나서는 모험",
    posterSrc: "/posters/chiikawa.jpg",
    posterTheme: "teal",
  },
  {
    id: "home-alone",
    title: "나 홀로 집에",
    ageRating: "전체",
    runtimeMinutes: 103,
    description: "크리스마스에 홀로 집에 남은 케빈의 유쾌한 소동",
    posterSrc: "/posters/home-alone.jpg",
    posterTheme: "blue",
  },
  {
    id: "la-la-land",
    title: "라라랜드",
    ageRating: "12세",
    runtimeMinutes: 128,
    description: "꿈을 좇는 재즈 피아니스트와 배우 지망생의 로맨스",
    posterSrc: "/posters/la-la-land.jpg",
    posterTheme: "violet",
  },
  {
    id: "manyak-e-woori",
    title: "만약에 우리",
    ageRating: "15세",
    runtimeMinutes: 115,
    description: "가장 눈부셨던 시절을 돌아보는 현실 공감 로맨스",
    posterSrc: "/posters/if-we-were-us.jpg",
    posterTheme: "amber",
  },
  {
    id: "moana-2026",
    title: "모아나",
    ageRating: "전체",
    runtimeMinutes: 115,
    description: "바다의 부름을 따라 항해를 떠나는 모아나의 모험",
    posterSrc: "/posters/moana.jpg",
    posterTheme: "teal",
  },
  {
    id: "the-odyssey",
    title: "오디세이",
    ageRating: "15세",
    runtimeMinutes: 172,
    description: "고향으로 돌아가기 위한 오디세우스의 장대한 여정",
    posterSrc: "/posters/the-odyssey.jpg",
    posterTheme: "blue",
  },
  {
    id: "oneul-bam-segyeeseo",
    title: "오늘 밤, 세계에서 이 사랑이 사라진다 해도",
    ageRating: "12세",
    runtimeMinutes: 121,
    description: "사랑하는 사람과 함께하는 하루를 소중히 그린 로맨스",
    posterSrc: "/posters/even-if-this-love-disappears-tonight.jpg",
    posterTheme: "violet",
  },
  {
    id: "arrietty",
    title: "마루 밑 아리에티",
    ageRating: "전체",
    runtimeMinutes: 94,
    description: "인간의 집 아래 숨어 사는 작은 사람들의 이야기",
    posterSrc: "/posters/arrietty.jpg",
    posterTheme: "teal",
  },
  {
    id: "begin-again",
    title: "비긴 어게인",
    ageRating: "15세",
    runtimeMinutes: 104,
    description: "뉴욕에서 만난 두 음악가가 노래로 다시 시작하는 이야기",
    posterSrc: "/posters/begin-again.jpg",
    posterTheme: "amber",
  },
  {
    id: "jurassic-world-rebirth",
    title: "쥬라기 월드: 새로운 시작",
    ageRating: "12세",
    runtimeMinutes: 133,
    description: "공룡이 살아 숨 쉬는 섬에서 펼쳐지는 생존 어드벤처",
    posterSrc: "/posters/jurassic-world-rebirth.jpg",
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

export function getDemoTicketPrice(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  const weekday = localDate.getDay();
  return weekday === 0 || weekday >= 5 ? 15000 : 14000;
}

export function getScreenings(movieId: string, date: string): Screening[] {
  return showtimes.map((startTime, index) => ({
    id: `${movieId}:${date}:${startTime.replace(":", "")}`,
    movieId,
    date,
    startTime,
    auditorium: `상영관 ${index + 1}`,
    ticketPrice: getDemoTicketPrice(date),
    seats: createSeatMap(),
    blockedSeatIds: index === 0 ? ["A1", "A2", "D7"] : ["B4", "C5"],
  }));
}
