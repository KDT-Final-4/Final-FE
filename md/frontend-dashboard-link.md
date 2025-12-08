# Frontend API Hand-off: Dashboard & Link

## 공통
- 베이스 URL: `http://localhost:8080` (배포 시 환경별로 교체). 모든 경로는 `/api` prefix 사용.
- 인증: JWT Bearer. 헤더 `Authorization: Bearer <token>` 필요. 단, `/api/link`는 공개 엔드포인트.
- 문서: Swagger UI `http://localhost:8080/swagger-ui/index.html` 에서 스펙 확인 가능.
- 에러 포맷: Spring ProblemDetail(JSON). 기본 필드 `type`, `title`, `status`, `detail` 등을 반환.

## Dashboard
### GET `/api/dashboard/status`
- 설명: 전체 클릭수(현재만 유효), 조회수, 방문자수, 평균 체류 시간을 반환.
- 인증: 필요 (Bearer 토큰).
- 요청 헤더: `Authorization: Bearer <token>`
- 응답 바디 예시:
  ```json
  {
    "allClicks": 123,
    "allViews": 0,
    "visitors": 0,
    "averageDwellTime": 0
  }
  ```
- 필드
  - `allClicks` (number, long): 누적 클릭 수.
  - `allViews` (number, long): 현재 0으로 고정.
  - `visitors` (number, long): 현재 0으로 고정.
  - `averageDwellTime` (number, seconds): 현재 0으로 고정.
- 에러: 인증 실패 시 401 ProblemDetail (`type: "/errors/unauthorized"`, `title: "Unauthorized"`).

### GET `/api/dashboard/contents`
- 설명: 인증된 사용자가 작성한 모든 콘텐츠 목록을 반환.
- 인증: 필요 (Bearer 토큰).
- 요청 헤더: `Authorization: Bearer <token>`
- 응답 바디 예시:
  ```json
  {
    "contents": [
      {
        "contentId": 1,
        "title": "예시 타이틀",
        "keyword": "예시 키워드",
        "contentLink": "https://example.com/post/1",
        "clickCount": 42,
        "createdAt": "2024-06-01T12:00:00",
        "updatedAt": "2024-06-02T09:00:00"
      }
    ]
  }
  ```
- `contents` 항목 필드
  - `contentId` (number, long): 콘텐츠 ID.
  - `title` (string): 제목.
  - `keyword` (string): 키워드.
  - `contentLink` (string, URL): 랜딩 링크.
  - `clickCount` (number, long): 해당 콘텐츠 누적 클릭 수.
  - `createdAt` / `updatedAt` (string, ISO-8601): 예시 `2024-06-01T12:00:00` (타임존 오프셋 없음 → 서버 로컬 시간).
- 정렬: 별도 명시 없음(백엔드 기본 반환 순서 그대로 사용). 필요 시 프런트에서 정렬.
- 에러: 인증 실패 시 401 ProblemDetail.

## Link
### GET `/api/link?jobId={id}`
- 설명: jobId로 대상 링크를 조회하고(가능하면 클릭 수 기록), 실제 리디렉션 URL을 반환.
- 인증: 불필요 (공개 엔드포인트).
- 쿼리 파라미터: `jobId` (string, 필수, 공백 불가).
- 응답 바디 예시:
  ```json
  {
    "link": "https://example.com/landing"
  }
  ```
- IP 수집: 서버가 `X-Forwarded-For` 또는 `X-Real-IP` 헤더를 읽어 최초 클라이언트 IP를 추출. 프록시/로드밸런서가 있다면 이 헤더를 보존만 하면 되고, 프런트에서 따로 보낼 필요 없음.
- 에러
  - 잘못된/없는 `jobId`: 400 ProblemDetail
    ```json
    {
      "type": "/errors/invalid-job-id",
      "title": "Invalid Job ID",
      "status": 400,
      "detail": "존재하지 않는 jobId입니다."
    }
    ```

## 샘플 요청 (cURL)
- 대시보드 상태
  ```bash
  curl -H "Authorization: Bearer <token>" \
       http://localhost:8080/api/dashboard/status
  ```
- 대시보드 콘텐츠
  ```bash
  curl -H "Authorization: Bearer <token>" \
       http://localhost:8080/api/dashboard/contents
  ```
- 링크 조회 (공개)
  ```bash
  curl "http://localhost:8080/api/link?jobId=abc123"
  ```

## 프런트 구현 시 참고 포인트
- 토큰 만료/미보유 시 401 ProblemDetail로 떨어지므로 로그인/재인증 플로우 처리 필요.
- 대시보드의 `allViews`, `visitors`, `averageDwellTime`는 현재 0이므로 UI에 표시 시 "준비 중" 또는 0으로 취급하도록 합의 필요.
- 날짜 필드는 오프셋 없는 ISO 문자열로 내려오므로 클라이언트에서 타임존 처리/포맷팅 필요.
- 링크 조회 실패(400) 메시지 `존재하지 않는 jobId입니다.` 그대로 노출 여부를 결정.
- 서버가 IP를 자동 추출하므로 프런트에서 별도 IP 전달 로직은 필요 없음.
