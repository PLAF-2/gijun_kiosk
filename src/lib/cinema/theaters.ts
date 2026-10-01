import type { Auditorium, CinemaRegion, Seat, Theater } from "@/lib/cinema/types";

export const regions: CinemaRegion[] = [
  { id: "seoul", name: "서울" },
  { id: "busan", name: "부산" },
  { id: "daegu", name: "대구" },
  { id: "incheon", name: "인천" },
  { id: "gwangju", name: "광주" },
  { id: "daejeon", name: "대전" },
  { id: "ulsan", name: "울산" },
  { id: "sejong", name: "세종" },
  { id: "gyeonggi", name: "경기" },
  { id: "gangwon", name: "강원" },
  { id: "chungbuk", name: "충북" },
  { id: "chungnam", name: "충남" },
  { id: "jeonbuk", name: "전북" },
  { id: "jeonnam", name: "전남" },
  { id: "gyeongbuk", name: "경북" },
  { id: "gyeongnam", name: "경남" },
  { id: "jeju", name: "제주" },
];

// Neighborhood names identify fictional demo cinemas, rather than real brands.
const places: Record<string, [string, string][]> = {
  seoul: [["강남", "강남구 역삼동"], ["홍대", "마포구 서교동"], ["잠실", "송파구 잠실동"], ["왕십리", "성동구 행당동"]],
  busan: [["서면", "부산진구 부전동"], ["해운대", "해운대구 우동"], ["남포", "중구 남포동"], ["동래", "동래구 명륜동"]],
  daegu: [["동성로", "중구 공평동"], ["수성", "수성구 범어동"], ["월성", "달서구 월성동"], ["칠곡", "북구 태전동"]],
  incheon: [["구월", "남동구 구월동"], ["송도", "연수구 송도동"], ["부평", "부평구 부평동"], ["청라", "서구 청라동"]],
  gwangju: [["충장로", "동구 충장로"], ["상무", "서구 치평동"], ["첨단", "광산구 쌍암동"], ["수완", "광산구 수완동"]],
  daejeon: [["둔산", "서구 둔산동"], ["은행동", "중구 은행동"], ["유성", "유성구 봉명동"], ["가오", "동구 가오동"]],
  ulsan: [["삼산", "남구 삼산동"], ["성남", "중구 성남동"], ["동구", "동구 일산동"], ["울주", "울주군 범서읍"]],
  sejong: [["나성", "나성동"], ["종촌", "종촌동"], ["보람", "보람동"], ["조치원", "조치원읍"]],
  gyeonggi: [["수원", "수원시 팔달구 인계동"], ["성남", "성남시 분당구 서현동"], ["고양", "고양시 일산동구 장항동"], ["안양", "안양시 동안구 관양동"]],
  gangwon: [["춘천", "춘천시 온의동"], ["원주", "원주시 단계동"], ["강릉", "강릉시 교동"], ["속초", "속초시 조양동"]],
  chungbuk: [["청주", "청주시 흥덕구 가경동"], ["충주", "충주시 연수동"], ["제천", "제천시 장락동"], ["진천", "진천군 진천읍"]],
  chungnam: [["천안", "천안시 서북구 불당동"], ["아산", "아산시 온천동"], ["서산", "서산시 동문동"], ["공주", "공주시 신관동"]],
  jeonbuk: [["전주", "전주시 완산구 고사동"], ["익산", "익산시 영등동"], ["군산", "군산시 수송동"], ["정읍", "정읍시 수성동"]],
  jeonnam: [["목포", "목포시 상동"], ["여수", "여수시 학동"], ["순천", "순천시 조례동"], ["광양", "광양시 중동"]],
  gyeongbuk: [["포항", "포항시 북구 죽도동"], ["구미", "구미시 원평동"], ["경주", "경주시 노동동"], ["안동", "안동시 옥동"]],
  gyeongnam: [["창원", "창원시 성산구 상남동"], ["진주", "진주시 대안동"], ["김해", "김해시 내동"], ["양산", "양산시 중부동"]],
  jeju: [["제주시청", "제주시 이도이동"], ["연동", "제주시 연동"], ["서귀포", "서귀포시 서귀동"], ["노형", "제주시 노형동"]],
};

const layouts = [
  { rows: 8, columns: 8, aisleAfter: [4], cornerRows: 1 },
  { rows: 9, columns: 10, aisleAfter: [5], cornerRows: 2 },
  { rows: 10, columns: 12, aisleAfter: [4, 8], cornerRows: 2 },
  { rows: 11, columns: 14, aisleAfter: [7], cornerRows: 2 },
  { rows: 12, columns: 15, aisleAfter: [5, 10], cornerRows: 3 },
];

function createAuditorium(theaterId: string, hallIndex: number, layoutIndex: number): Auditorium {
  const layout = layouts[layoutIndex % layouts.length];
  const seats: Seat[] = [];
  for (let rowIndex = 0; rowIndex < layout.rows; rowIndex += 1) {
    const row = String.fromCharCode(65 + rowIndex);
    for (let column = 1; column <= layout.columns; column += 1) {
      // Front corners remain empty; numbering keeps its physical column.
      if (rowIndex < layout.cornerRows && (column === 1 || column === layout.columns)) continue;
      seats.push({ id: `${row}${column}`, row, number: column, column });
    }
  }
  return {
    id: `${theaterId}-hall-${hallIndex + 1}`,
    name: `${hallIndex + 1}관`,
    seats,
    columns: layout.columns,
    aisleAfter: [...layout.aisleAfter],
  };
}

export const theaters: Theater[] = regions.flatMap((region, regionIndex) =>
  places[region.id].map(([place, location], placeIndex) => {
    const index = regionIndex * 4 + placeIndex;
    const id = `${region.id}-${placeIndex + 1}`;
    return {
      id,
      regionId: region.id,
      regionName: region.name,
      name: `${place} CINEMA`,
      location: `${region.name} · ${location}`,
      auditoriums: Array.from({ length: 3 + index % 3 }, (_, hallIndex) =>
        createAuditorium(id, hallIndex, index + hallIndex),
      ),
    };
  }),
);

export function getTheater(theaterId: string): Theater | undefined {
  return theaters.find(({ id }) => id === theaterId);
}
