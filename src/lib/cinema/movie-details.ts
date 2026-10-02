export type MovieDetails = {
  synopsis: string;
  sourceUrl: string;
  trailer: { videoId: string; title: string; channel: string; sourceUrl: string } | null;
};

const details: Record<string, MovieDetails> = {
  "chiikawa-mermaid-island": {
    synopsis: "특별한 섬에서 간단한 일을 하면 큰 보상을 받을 수 있다는 초대장을 발견한 치이카와와 친구들. 맛있는 음식과 즐거운 합숙을 기대하며 떠난 여행은 섬에 숨겨진 비밀을 마주하는 모험으로 이어집니다.",
    sourceUrl: "https://chiikawa.toho-movie.jp/atm/index.html#story",
    trailer: { videoId: "qTROMuvibHs", title: "영화 치이카와: 인어 섬의 비밀 · 60초 특보", channel: "東宝MOVIEチャンネル", sourceUrl: "https://www.youtube.com/watch?v=qTROMuvibHs" },
  },
  "home-alone": {
    synopsis: "크리스마스 여행을 떠난 가족에게서 실수로 떨어져 집에 혼자 남은 여덟 살 케빈. 자유로운 시간을 즐기던 그는 집을 노리는 두 도둑을 발견하고, 기발한 함정으로 자신과 집을 지키려 합니다. 1990년작의 공식 재개봉 예고편을 제공합니다.",
    sourceUrl: "https://family.20thcenturystudios.com/movies/home-alone",
    trailer: { videoId: "dzdpqRGA1qc", title: "Home Alone Official Trailer", channel: "Park Circus", sourceUrl: "https://www.youtube.com/watch?v=dzdpqRGA1qc" },
  },
  "la-la-land": {
    synopsis: "로스앤젤레스에서 배우의 꿈을 좇는 미아와 자신만의 무대를 꿈꾸는 재즈 피아니스트 세바스찬이 만납니다. 서로의 열정을 응원하며 사랑에 빠진 두 사람은 꿈을 이루는 과정에서 각자의 미래와 관계를 고민하게 됩니다.",
    sourceUrl: "https://www.lionsgate.com/la-la-land-sweeps",
    trailer: { videoId: "je0aAf2f8XQ", title: "La La Land · City Of Stars 공식 티저", channel: "Lionsgate Movies", sourceUrl: "https://www.youtube.com/watch?v=je0aAf2f8XQ" },
  },
  "manyak-e-woori": {
    synopsis: "고속버스에서 우연히 만난 은호와 정원은 서로의 꿈을 응원하며 연인이 되지만, 현실의 어려움 속에서 헤어집니다. 10년 뒤 다시 마주한 두 사람은 함께했던 시간을 돌아보며 마음에 남아 있던 감정을 꺼냅니다. 구교환과 문가영이 출연하는 작품입니다.",
    sourceUrl: "https://www.youtube.com/watch?v=JV4aFt8AhWI",
    trailer: { videoId: "JV4aFt8AhWI", title: "구교환 X 문가영 · 만약에 우리 예고편", channel: "쇼박스 SHOWBOX", sourceUrl: "https://www.youtube.com/watch?v=JV4aFt8AhWI" },
  },
  "moana-2026": {
    synopsis: "바다의 부름을 받은 모아나는 자신의 섬을 둘러싼 산호초 너머로 첫 항해를 떠납니다. 반신반인 마우이와 함께 위험한 바다를 건너며 고향 사람들에게 다시 풍요를 되찾아 줄 길을 찾아 나섭니다. Catherine Lagaʻaia와 Dwayne Johnson이 출연하는 2026년 실사판입니다.",
    sourceUrl: "https://movies.disney.com/moana-2026",
    trailer: { videoId: "Kx-gCrs7Gew", title: "Moana · Official Teaser", channel: "Walt Disney Studios Canada", sourceUrl: "https://www.youtube.com/watch?v=Kx-gCrs7Gew" },
  },
  "the-odyssey": {
    synopsis: "트로이 전쟁을 마친 오디세우스가 고향 이타카로 돌아가기 위해 길고 위험한 항해에 나섭니다. 거대한 괴물과 신화 속 존재들이 가로막는 여정에서 그는 지혜와 용기로 귀환의 길을 찾아야 합니다. Christopher Nolan 감독, Matt Damon 주연의 2026년 작품입니다.",
    sourceUrl: "https://www.odysseymovie.ca/synopsis/",
    trailer: { videoId: "f_bKjZeJBBI", title: "The Odyssey · Official New Trailer", channel: "Universal Pictures", sourceUrl: "https://www.youtube.com/watch?v=f_bKjZeJBBI" },
  },
  "oneul-bam-segyeeseo": {
    synopsis: "장난처럼 시작된 고백으로 사귀게 된 토오루와 마오리. 잠들면 하루의 기억을 잃는 마오리는 일기로 매일을 이어 가고, 두 사람은 서로를 진심으로 좋아하지 않겠다는 약속을 넘어 소중한 추억을 쌓습니다. 미치에다 슌스케와 후쿠모토 리코가 출연하는 2022년 일본판입니다.",
    sourceUrl: "https://www.youtube.com/watch?v=Z-xXhqa6igU",
    trailer: { videoId: "Z-xXhqa6igU", title: "오늘 밤, 세계에서 이 사랑이 사라진다 해도 · 일본판 공식 예고편", channel: "東宝MOVIEチャンネル", sourceUrl: "https://www.youtube.com/watch?v=Z-xXhqa6igU" },
  },
  arrietty: {
    synopsis: "인간의 물건을 조금씩 빌려 쓰며 집의 마루 아래 숨어 사는 작은 소녀 아리에티. 어느 날 인간 소년 쇼에게 모습을 들킨 뒤 두 사람은 친구가 되지만, 그 만남은 아리에티 가족의 조용한 생활을 흔들기 시작합니다.",
    sourceUrl: "https://gkids.com/films/the-secret-world-of-arrietty/",
    trailer: { videoId: "9CtIXPhPo0g", title: "Arrietty · Official Trailer", channel: "Crunchyroll Store Australia (Madman 배급 예고편)", sourceUrl: "https://www.youtube.com/watch?v=9CtIXPhPo0g" },
  },
  "begin-again": {
    synopsis: "뉴욕에서 연인과 헤어진 싱어송라이터 그레타는 자신의 음악을 알아본 음반 프로듀서 댄을 만납니다. 두 사람은 도시의 거리와 옥상을 녹음실 삼아 앨범을 만들며 음악과 삶을 다시 시작할 용기를 찾습니다.",
    sourceUrl: "https://www.youtube.com/watch?v=zqRL2dY5-us",
    trailer: { videoId: "zqRL2dY5-us", title: "BEGIN AGAIN · UK Official Trailer", channel: "eOne UK", sourceUrl: "https://www.youtube.com/watch?v=zqRL2dY5-us" },
  },
  "jurassic-world-rebirth": {
    synopsis: "인류를 위한 신약 개발에 필요한 공룡의 유전 물질을 확보하려는 조라의 팀이 위험한 섬으로 향합니다. 난파한 가족과 함께 고립된 이들은 공룡의 위협 속에서 살아남으려다 오래된 연구 시설에 숨겨진 비밀과 마주합니다.",
    sourceUrl: "https://www.universalstudios.com/videos/jan5CFWs9ic",
    trailer: { videoId: "jan5CFWs9ic", title: "Jurassic World Rebirth · Official Trailer", channel: "Universal Pictures", sourceUrl: "https://www.youtube.com/watch?v=jan5CFWs9ic" },
  },
};

export function getMovieDetails(movieId: string): MovieDetails | undefined {
  return details[movieId];
}
