# 완료된 기능 정리

## 인증 및 라우팅
- `/api/auth/login`, `/api/user/register`를 호출하는 로그인·회원가입 폼(이메일/비밀번호/이름) 제공.
- 로컬 스토리지 플래그(`isAuthenticated`) 기반 세션 유지 후 `Layout`+`Sidebar` 구조에서 페이지 이동.
- 사이드바 프로필/로그아웃 버튼, 네비게이션(대시보드·트렌드·검수·스케줄·로그·설정) 및 활성 상태 표시.

## 대시보드
- `/api/user/me`로 사용자 이름/이메일 조회 후 인사 섹션 표시.
- `/api/dashboard/status`, `/api/dashboard/contents/count`로 총 조회수·콘텐츠 수 카드 노출.
- `/api/dashboard/contents` 응답 기반 콘텐츠별 클릭수 파이차트 및 상위 링크 리스트.
- 기간 검증 포함 `/api/dashboard/daily?start=…&end=…` 일간 클릭 라인차트(총합/평균/피크일 계산, 최대 30일 제한).

## 트렌드 분석 뷰
- 디바이스/근무시간/그래프 타입 선택 UI와 mock 데이터 기반 분석 화면 구성.
- `TrendChart`: 소비(Area+Line), 파라미터(Line), 고조파(Bar) 3가지 그래프 토글.
- `RealtimeDataPanel`: 실시간 파라미터 카드, PF 상태 뱃지, 피크·효율 요약.
- `EnvironmentalImpact`: CO₂ 총량/평균, 나무 환산, 임팩트 레벨 계산.
- `SummaryReportTable`: 기간별 집계 테이블 및 Excel/PDF 다운로드 시뮬레이션 버튼.

## 설정 관리
- LLM 설정(`/api/setting/llm`): 공급자/모델, API 키, 온도, 토큰, 프롬프트, AUTO/MANUAL 업로드, 활성화 토글 로드·저장.
- 스케줄 설정(`/api/setting/schedule`): 하루 실행 횟수, 실패 재시도, 실행 여부를 로드/수정 저장.
- 알림 설정(`/api/setting/notification`): 이메일/슬랙 채널 선택, 슬랙 웹훅·토큰, 활성화 토글 저장.

## 스케줄 CRUD
- `/api/schedule` 목록 테이블: 반복 주기/시작·최근 실행 시각/ON·OFF 토글(상태 변경 API `/api/schedule/active/:id`).
- 단건 조회·수정·삭제(`/api/schedule/:id`) 및 신규 생성 POST 폼 제공, 날짜·필수값 검증 포함.

## 프로필
- `/api/user/me` 응답으로 이름/이메일/권한/상태/생성·업데이트 시각/삭제 플래그 표시, 로딩 스켈레톤 및 에러 처리.

## 플레이스홀더
- Reports(`src/pages/report/Reports.tsx`), Logs(`src/pages/log/LogsPage.tsx`)는 후속 구현을 위한 안내 문구만 제공.

## 이후 개선 제안
1) Logs/Reports에 실제 데이터 연동 및 다운로드 구현.  
2) 트렌드 페이지 mock 데이터를 API 응답으로 교체하고 필터와 연동.  
3) fetch 공통 래퍼/에러 처리/토큰 만료 대응 추가.  
4) 테스트 및 타입 보강: API 응답 타입 명세, 에러/로딩 상태 단위 테스트.
