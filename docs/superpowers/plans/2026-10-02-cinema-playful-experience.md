# Cinema Playful Experience Implementation Plan

**Goal:** 극장 문 입장, 영화별 배경과 UI, 기념 티켓 꾸미기·이미지 저장, 숨은 요소 발견을 한 예매 흐름에 연결한다.

**Architecture:** 입장 연출은 시작 화면의 짧은 상태와 타이머로 처리한다. 영화 분위기는 영화 ID별 CSS 변수와 장식 레이어로 적용한다. 발견한 스탬프는 현재 방문의 별도 UI 상태이며 결제·예약 데이터와 분리한다. 티켓 꾸미기는 완료 화면의 별도 상태와 Canvas PNG 내보내기를 사용한다. 기존 예매 번호·좌석·가격·취소 로직을 유지한다.

**Tech Stack:** React, TypeScript, CSS modules, inline SVG, Canvas, native download.

- [x] `start-screen.tsx`와 `cinema-entry.module.css`: 닫힌 문을 터치하거나 예매 시작을 누르면 약 0.8초 후 포스터 목록으로 이동한다. 바로 입장·동작 줄이기·타이머 정리와 조회 접근을 지원한다.
- [x] `movie-atmosphere.tsx`와 CSS: 영화 10편에 맞춘 색·장식과 패널·강조색·테두리를 제공한다. 장식은 비상호작용, 동작 줄이기 지원, 좌석 상태 구분 유지.
- [x] `collectibles.ts`, `cinema-discoveries.tsx`와 CSS: 별·발자국·로고 속 필름 발견을 중복 없이 처리한다. 작은 키보드/터치 가능한 요소, 짧은 알림, 스탬프 표시를 제공한다.
- [x] `ticket-customizer.tsx`와 CSS, `ticket-image.ts`: 기념 문구·색감을 선택하고 발견 스탬프가 포함된 미리보기와 PNG 저장을 제공한다. 로컬 포스터만 사용하고 전화번호·가짜 바코드를 포함하지 않는다. 저장 버튼 클릭 때만 내려받으며 취소된 예약은 저장을 제한한다.
- [x] `kiosk-app.tsx`, `kiosk-header.tsx`, `booking-credits.tsx`, `complete-screen.tsx`: 영화 분위기·발견 상태·기념 티켓을 연결하고 처음으로 이동 시 방문 스탬프를 초기화한다.
- [x] 소스 검토·README 갱신·운영 빌드·개발 HTTP 응답 확인. 테스트·커밋·푸시는 실행하지 않는다.
