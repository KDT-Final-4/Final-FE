# Logger API 안내 (/api/log, /api/log/count)

프론트가 구현해야 하는 로그 조회/집계 엔드포인트 사양을 정리합니다. 로그
인된 사용자의 로그만 반환합니다.

## 공통
- Base URL: `/api`
- 인증: 쿠키 `ACCESS_TOKEN`에 JWT가 있어야 함(`JwtAuthenticationFilter`가
  Authorization 헤더는 안 읽음). 브라우저 요청 시 `credentials: 'include'`
  필요.
- 헤더: `Accept: application/json`
- 타입: `logType`는 문자열 `"INFO"` 또는 `"ERROR"` 만 존재.

## GET /api/log
- 목적: 내 로그 리스트 조회 (검색 + 페이지네이션)
- 쿼리 파라미터
    - `search` (optional): 메시지에 대한 부분 검색, 대소문자 무시.
    - `page` (required): 0부터 시작. 0 미만이면 400.
    - `size` (required): 1 이상. 0 이하면 400.
- 정렬: `createdAt` 내림차순(최신 먼저).
- 응답 200: JSON 배열. 총 개수는 주지 않으므로 `size`보다 적게 오면 마지
  막 페이지로 판단.
- 로그 객체 필드
    - `id`: number
    - `userId`: number
    - `logType`: `"INFO"` | `"ERROR"`
    - `jobId`: string
    - `message`: string (줄바꿈/탭 포함 가능)
    - `createdAt`: string (ISO-8601 local datetime, 예: `2024-07-
  12T09:15:32.123456`)
- 예시 요청
    - `GET /api/log?search=error&page=0&size=20`
    - fetch 예: `fetch('/api/log?page=0&size=20', { credentials:
  'include' })`
- 예시 응답
  ```json
  [
    {
      "id": 17,
      "userId": 5,
      "logType": "INFO",
      "jobId": "deploy-2024-07-12-001",
      "message": "BUILD | 2024-07-12T09:15:32 |
  compile\n\tTask :app:assemble",
      "createdAt": "2024-07-12T09:15:32.123456"
    },
    {
      "id": 16,
      "userId": 5,
      "logType": "ERROR",
      "jobId": "deploy-2024-07-12-001",
      "message": "DEPLOY | 2024-07-12T09:14:02 | failed",
      "createdAt": "2024-07-12T09:14:02.003210"
    }
  ]
  ```

## GET /api/log/count
- 목적: 내 로그를 타입별로 집계
- 응답 200: 항상 두 키를 포함하는 JSON 객체
    - `info`: number (INFO 개수, 없으면 0)
    - `error`: number (ERROR 개수, 없으면 0)
- 예시: `GET /api/log/count`
  ```json
  { "info": 12, "error": 3 }
  ```

## 오류 응답 참고
- 인증 실패: 401
- 권한 없음: 403
- 리소스 없음: 404 (`Content Not Found`)
- 잘못된 요청(페이지/사이즈 음수 등): 400 (`Bad Request`)
- 오류 포맷은 Spring ProblemDetail 기본 형태 (예: `type`, `title`,
  `status`, `detail`).

## 구현 팁
- 페이지네이션: 총 개수가 없으니 `size`보다 적게 오면 더 불러오지 않는 식
  으로 처리.
- 메시지 렌더링: 개행/탭 포함 가능하니 멀티라인 표시 지원.
- 시간: `createdAt`는 타임존 정보가 없는 로컬 시각 문자열(서버 로캘 기준)
  이라 그대로 문자열로 표시하거나 필요 시 로컬 타임존으로 파싱.
