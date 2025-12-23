# 프로젝트 공통 페이징 규약 (Trend 페이지 기준)

## 목적
- 트렌드 페이지에서 검증된 페이징 UX·로직을 모든 목록/테이블 화면의 기본 규칙으로 사용합니다.
- 페이지 파라미터/응답 구조/버튼 UX가 일관되도록 합의된 사양을 명문화합니다.

## API 규약
- 요청 파라미터: `page`(0부터 시작), `size`(페이지당 아이템 수). 필터 값은 동일한 쿼리에 함께 전달합니다.
- 응답 권장 구조: `items` 배열, `totalCount`, `totalPages`, `page`, `size`를 포함합니다. `items`는 빈 배열 허용.
- 헤더 권장: `X-Total-Count`, `X-Total-Pages`를 제공하면 프론트 추론 로직을 건너뜁니다.
- 계산 우선순위
  - `totalPages`: 헤더 → 본문 → `Math.ceil(totalCount / size)` → fallback(현재 페이지 길이 기반).
  - `totalCount`: 헤더 → 본문 → `totalPages * size` → fallback(`page * size + items.length`).
- 표준 엔드포인트 예시: `/trend?page=0&size=10[&snsType=INSTAGRAM]` (다른 목록 API도 동일한 쿼리 키 사용).

## 상태/이벤트 기본값
- 상태 키: `page`, `pageSize`, `totalCount`, `totalPages`, `loading`, `error`, `rows`(또는 `items`).
- 초기값: `page = 0`, `pageSize = 10`, `pageSizeOptions = [10, 20, 30]`, `PAGE_GROUP_SIZE = 10`.
- 페이지 이동 핸들러 패턴
  - 그룹 이동: `page = Math.max(0, page - PAGE_GROUP_SIZE)` / `Math.min(totalPages - 1, page + PAGE_GROUP_SIZE)`.
  - 단일 이동: `page = page - 1` / `page + 1` (경계/로딩 시 가드).
  - 번호 선택: 유효 범위 체크 후 `setPage(pageIndex)`.
  - 페이지 사이즈 변경: `setPage(0)`으로 리셋 후 재조회.

## UI/UX 규칙
- 위치: 테이블/목록 바로 아래 중앙에 배치하고, 버튼 묶음은 `flex flex-wrap items-center justify-center gap-2`처럼 중앙 정렬한다.
- 버튼 순서와 라벨: `<<` `<` `1 2 ...` `>` `>>` (숫자 표시는 1부터, 내부 상태는 0부터).
- 스타일: 활성 페이지는 기본(primary) 버튼, 나머지는 outline/ghost 사용.
- 비활성 조건: `loading`일 때 또는 첫/마지막 페이지 그룹 경계에서는 해당 버튼을 `disabled` 처리.
- 페이지 번호 노출: 최대 10개씩 그룹화하여 노출, 다음/이전 그룹 버튼으로 이동.
- 빈 상태/에러: 데이터 없을 때 안내 문구, 에러 시 재시도 버튼(Trend 페이지 `다시 시도` 패턴 그대로 사용).

## 구현 참고 (Trend 코드 발췌)
```ts
const derivedTotalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
const totalPages = responseTotalPages > 0 ? responseTotalPages : derivedTotalPages;
const pageGroupStart = Math.floor(page / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE;
const pageGroupEnd = Math.min(totalPages, pageGroupStart + PAGE_GROUP_SIZE);
const pageNumbers = Array.from(
  { length: Math.max(0, pageGroupEnd - pageGroupStart) },
  (_, index) => pageGroupStart + index
);
```
- API 사용 예: `/trend?page={page}&size={size}` (옵션 `snsType` 포함). 콘텐츠 생성 등 부가 액션은 행 단위 버튼으로 배치.

## 적용 체크리스트
- [ ] 새 목록/테이블 화면에서 위 상태 키·기본값을 그대로 사용한다.
- [ ] 요청 파라미터는 0-based `page`, `size`로 전달하고, 필터 변경 시 `page`를 0으로 리셋한다.
- [ ] 응답에 `X-Total-Count`/`totalCount` 또는 `X-Total-Pages`/`totalPages`가 포함되는지 확인한다(없어도 Trend 추론 규칙으로 동작).
- [ ] 로딩/에러/빈 상태 UI와 버튼 비활성 로직을 Trend와 동일하게 넣는다.
