
• Logger API 정리 (프론트 전달용, WARN 카운트 반영 버전)

- Base path: /api
- 인증: JWT 토큰이 담긴 쿠키만 있으면 됨(헤더 추가 불필요).
- 공통 모델 LogResponseDto: id:number, userId:number,
  logType:"INFO"|"ERROR"|"WARN", jobId:string, message:string,
  createdAt:string(ISO-8601).

POST /log

- 용도: 파이프라인 로그 생성.
- Content-Type: application/json.
- 요청 바디: userId:number(필수), logType:string(선택, 기본 INFO),
  loggedProcess:string(필수), loggedDate:string(ISO-8601, 선택),
  message:string(필수), submessage:string(선택), jobId:string(선택, 기
  본 "0").
- 응답: 200 OK, 바디 없음. 저장 메시지 포맷 <loggedProcess> |
  <loggedDate> | <message> (+ \n\t<submessage> 옵션).
- 정확한 예시 요청:

{
"userId": 5,
"logType": "WARN",
"loggedProcess": "deploy",
"loggedDate": "2024-07-15T12:10:00",
"message": "slow response detected",
"submessage": "p99 = 3s",
"jobId": "job-123"
}

GET /log

- 용도: 내 로그 검색/페이지네이션 조회.
- 쿼리: search:string(선택, message LIKE, 대소문자 무시), page:int(필수,
  0 이상), size:int(필수, 1 이상).
- 정렬: createdAt DESC.
- 응답: 200 OK, LogResponseDto 배열.
- 검증 실패: page<0 또는 size<=0 → 400.
- 정확한 예시 응답:

[
{
"id": 101,
"userId": 5,
"logType": "INFO",
"jobId": "job-123",
"message": "build | 2024-07-15T12:00:00 | pipeline completed",
"createdAt": "2024-07-15T12:00:05"
},
{
"id": 102,
"userId": 5,
"logType": "WARN",
"jobId": "job-124",
"message": "deploy | 2024-07-15T12:10:00 | slow response detected
\n\tp99 = 3s",
"createdAt": "2024-07-15T12:10:02"
}
]

GET /log/count

- 용도: 내 로그를 타입별로 카운트.
- 응답: 200 OK, JSON 객체. 키는 "info", "error", "warn" 세 개 모두 포함.
- 정확한 예시 응답:

{
"info": 12,
"error": 3,
"warn": 4
}

GET /pipeline/{jobId} (SSE)

- 용도: 특정 jobId의 로그를 한번에 스트리밍; fromId 이후만 받을 수 있음.
- 경로 변수: jobId:string.
- 쿼리: id:number (옵션, 지정 시 그 id보다 큰 로그만 전송).
- 응답: 200 OK, text/event-stream. 현재 DB에 있는 로그들을 LogResponseDto
  JSON으로 순차 전송 후 스트림 완료(실시간 지속 연결 아님).
- 접근 제어: 해당 jobId 로그의 userId 전부가 현재 사용자와 다르면 400.
- 로그가 없으면 이벤트 없이 바로 완료(빈 스트림).
- 정확한 예시 응답(SSE 데이터 청크):

data: {"id":201,"userId":5,"logType":"INFO","jobId":"job-
123","message":"build | 2024-07-15T12:00:00 | pipeline
completed","createdAt":"2024-07-15T12:00:05"}

data: {"id":202,"userId":5,"logType":"WARN","jobId":"job-
123","message":"deploy | 2024-07-15T12:10:00 | slow response detected
\n\tp99 = 3s","createdAt":"2024-07-15T12:10:02"}

추가 메모

- logType 없으면 INFO, jobId 없으면 "0"으로 저장.
- loggedDate를 비우면 메시지에 빈 칸으로 들어감.
- SSE는 과거 로그 덤프 후 종료되므로, 실시간 구독이 필요하면 반복 호출/폴
  링 설계 필요.
