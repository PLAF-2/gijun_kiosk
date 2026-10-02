# Cinema Discounts and Movie Info Implementation Plan

**Goal:** 할인된 금액을 예매 완료까지 일관되게 반영하고 기존 영화의 설명과 공식 예고편을 제공한다.

**Architecture:** 할인 선택 → 단일 가격 계산 → 검증된 예약 스냅샷 → 완료/조회. 영화 카드의 별도 링크 → 설명 대화상자 → 사용자 시작 YouTube 재생/외부 링크.

**Tech Stack:** Next.js static export, React, TypeScript, localStorage, YouTube iframe.

## 작업

- [x] `types.ts`, `discounts.ts`에 대상별 인원, 쿠폰, 가격 명세와 조건 검증을 구현한다.
- [x] `discount-panel.tsx`에 인원 조절, 동반 제한, 쿠폰 적용·해제를 구현하고 `booking-review-screen.tsx`에 연결한다.
- [x] `kiosk-app.tsx`, `booking.ts`, `booking-store.ts`를 연결해 최종 금액을 다시 계산·저장한다. 인원/회차 변경 시 할인 선택을 초기화한다.
- [x] `payment-screen.tsx`, 완료·조회 화면에 할인 내역과 최종 금액을 표시한다.
- [x] 공식 티저/예고편과 각 판본의 설명을 조사해 `movie-details.ts`에 등록한다.
- [x] `movie-screen.tsx`에 별도 정보 링크, `movie-info-dialog.tsx`에 설명·YouTube 플레이어·외부 재생 링크를 구현한다. CSS는 버튼/링크 분리와 모바일 크기를 처리한다.
- [x] README와 조사 기록을 작성하고 소스 검토·빌드로 확인한다. 테스트·커밋·푸시는 실행하지 않는다.

## 완료 기록 (2026-10-01)

- `GITHUB_REPOSITORY=PLAF-2/gijun_kiosk` 환경의 `npm run build`가 종료 코드 0으로 완료됐다. 컴파일, 타입 검사, 정적 페이지 내보내기가 통과했다.
- 별도 에이전트가 할인 계산, 동반 인원 제한, 쿠폰 적용 조건, 선택 초기화, 예약 저장 호환성, 대화상자 종료와 포커스 복원을 읽기 전용으로 검토했다. 수정이 필요한 사항은 발견하지 않았다.
- 영화 10편의 영상 ID·제목·채널 메타데이터를 확인했다. 실제 브라우저 영상 재생은 확인하지 않았으며, 임베드 제한에 대비해 YouTube에서 보기 링크를 제공한다.
- 테스트 실행, 커밋, GitHub 푸시는 하지 않았다.
