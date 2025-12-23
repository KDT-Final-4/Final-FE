# Dashboard API 연동 가이드

## 공통
- Base URL: `/api/dashboard`
- 응답: `application/json`, 성공 시 200
- 날짜 포맷: `YYYY-MM-DD` (ISO), `LocalDateTime`은 ISO 문자열
- 오류: 토큰 문제 → 401/403. `/daily`에서 `end < start` 또는 조회일수 31일 이상 → 400 (+ 메시지)

  ---

## 1) 대시보드 상태 조회
- `GET /api/dashboard/status`
- 프론트가 보내야 하는 값: 헤더만(JWT), 쿼리/바디 없음
- 응답 필드
    - `allClicks`: long
    - `allViews`: long (현재 0 고정)
    - `visitors`: long (현재 0 고정)
    - `averageDwellTime`: long (초, 현재 0 고정)
- 응답 예시값
  ```json
  {
    "allClicks": 123,
    "allViews": 0,
    "visitors": 0,
    "averageDwellTime": 0
  }

———

## 2) 내 콘텐츠 목록 조회

- GET /api/dashboard/contents
- 프론트가 보내야 하는 값: 헤더만(JWT), 쿼리/바디 없음
- 응답 필드
    - contents: 배열
        - contentId: long
        - title: string
        - keyword: string
        - contentLink: string
        - clickCount: long
        - createdAt: string(ISO datetime)
        - updatedAt: string(ISO datetime)
- 응답 예시값

  {
  "contents": [
  {
  "contentId": 1,
  "title": "제목",
  "keyword": "키워드",
  "contentLink": "https://example.com",
  "clickCount": 10,
  "createdAt": "2024-05-01T12:34:56",
  "updatedAt": "2024-05-03T09:00:00"
  }
  ]
  }

———

## 3) 기간별 일별 클릭 수 조회

- GET /api/dashboard/daily?start=YYYY-MM-DD&end=YYYY-MM-DD
- 프론트가 보내야 하는 값
    - 헤더: JWT
    - 쿼리: start(필수, 포함), end(필수, 포함), 기간 최대 30일
- 응답 필드
    - start: string(YYYY-MM-DD)
    - end: string(YYYY-MM-DD)
    - dailyClicks: 배열
        - clickDate: string(YYYY-MM-DD)
        - clicks: long
- 응답 예시값

  {
  "start": "2024-05-01",
  "end": "2024-05-07",
  "dailyClicks": [
  { "clickDate": "2024-05-01", "clicks": 3 },
  { "clickDate": "2024-05-02", "clicks": 0 },  // 클릭 없어도 0
  { "clickDate": "2024-05-03", "clicks": 5 }
  ]
  }

———

## 4) 콘텐츠 개수 조회

- GET /api/dashboard/contents/count
- 프론트가 보내야 하는 값: 헤더만(JWT), 쿼리/바디 없음
- 응답 필드
    - contentsCount: long
- 응답 예시값

  { "contentsCount": 12 }

———

## 샘플 요청 (curl) — 예시값 포함

# 상태
curl -H "Authorization: Bearer {예시_TOKEN}" \
https://<host>/api/dashboard/status

# 콘텐츠 목록
curl -H "Authorization: Bearer {예시_TOKEN}" \
https://<host>/api/dashboard/contents

# 일별 클릭 (기간 30일 이하)
curl -H "Authorization: Bearer {예시_TOKEN}" \
"https://<host>/api/dashboard/daily?start=2024-05-01&end=2024-05-07"

# 콘텐츠 개수
curl -H "Authorization: Bearer {예시_TOKEN}" \
https://<host>/api/dashboard/contents/count

## UI 적용 시 참고

- 날짜 필터: /daily는 start~end 포함, 최대 30일 → 달력에서 제한 필요.
- 빈 날 처리: dailyClicks에 clicks: 0이 이미 포함됨.
- 시간 포맷: createdAt/updatedAt는 ISO → 프론트에서 로컬 포맷 변환.
- 숫자 필드: 모두 정수(long); 프론트에서 포맷팅만 하면 됨.