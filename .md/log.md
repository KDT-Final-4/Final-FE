# Logger API 연동 가이드 (쿠키 인증)

## 공통
- Base URL: `/api`
- 인증: 토큰은 쿠키로 자동 전송되므로 프론트에서 헤더 추가 필요 없음.
- 응답: `application/json` (SSE는 `text/event-stream`), 성공 시 200
- 시간: ISO LocalDateTime (`YYYY-MM-DDTHH:MM:SS`)
- LogType: `INFO`, `ERROR`, `WARN`

  ---

## 1) 파이프라인 로그 생성
- `POST /api/log`
- 프론트가 보내야 하는 값 (JSON 바디)
    - `userId`: long (필수)
    - `logType`: string (`INFO` | `ERROR` | `WARN`, 선택, 미지정 시 INFO)
    - `loggedProcess`: string (필수)
    - `loggedDate`: string(ISO datetime, 선택)
    - `message`: string (필수)
    - `submessage`: string (선택)
    - `jobId`: string (선택, 미지정 시 `"0"`)
- 응답: 바디 없음, 200 OK
- 예시응답: 없음(빈 바디)

  ---

## 2) 로그 조회 (검색+페이지네이션)
- `GET /api/log`
- 프론트가 보내야 하는 값
    - 쿼리: `search`(선택), `page`(필수, 0 이상), `size`(필수, 1 이상)
- 응답 타입: `List<LogResponseDto>`
- 응답 컬럼
    - `id`: long
    - `userId`: long
    - `logType`: string
    - `jobId`: string
    - `message`: string
    - `createdAt`: string(ISO datetime)
- 예시응답
  ```json
  [
    {
      "id": 5,
      "userId": 10,
      "logType": "INFO",
      "jobId": "job-abc-123",
      "message": "pipeline-step-1 | 2024-05-01T12:30:00 | 전처리 완료 \n\trow=123, cols=5",
      "createdAt": "2024-05-01T12:30:10"
    },
    {
      "id": 6,
      "userId": 10,
      "logType": "ERROR",
      "jobId": "job-abc-123",
      "message": "pipeline-step-2 | 2024-05-01T12:31:00 | 업로드 실패",
      "createdAt": "2024-05-01T12:31:05"
    }
  ]

———

## 3) 로그 타입별 카운트

- GET /api/log/count
- 프론트가 보내야 하는 값: 없음(쿼리/바디)
- 응답 타입: Map<String, Long> (info, error 키만 반환)
- 예시응답

  { "info": 12, "error": 3 }

———

## 4) 특정 jobId 로그 SSE 스트림

- GET /api/pipeline/{jobId} (Accept: text/event-stream)
- 프론트가 보내야 하는 값
    - 경로 변수: jobId (필수)
    - 쿼리: id(선택, long) → 이 ID 초과부터 전송. 미지정 시 해당 jobId의 모든 로그.
- 응답 타입: text/event-stream (각 이벤트 data에 LogResponseDto JSON)
- 이벤트 payload 컬럼: id, userId, logType, jobId, message, createdAt
- 예시응답 (SSE 이벤트)

  data: {"id":5,"userId":10,"logType":"INFO","jobId":"job-abc-123","message":"pipeline-step-1 | 2024-05-01T12:30:00 | 전처리 완료 \n\trow=123,
  cols=5","createdAt":"2024-05-01T12:30:10"}

  data: {"id":6,"userId":10,"logType":"ERROR","jobId":"job-abc-123","message":"pipeline-step-2 | 2024-05-01T12:31:00 | 업로드 실
  패","createdAt":"2024-05-01T12:31:05"}

———

## 추가 메모

- /log GET: page < 0 또는 size <= 0이면 400 예상(IllegalArgumentException).
- /pipeline/{jobId}: 해당 jobId 로그의 userId가 현재 사용자와 모두 일치하지 않으면 예외 발생(권한 없음).
- loggedDate는 메시지 문자열에만 포함되고, 저장 시각은 서버 현재 시간이 createdAt으로 기록됩니다.