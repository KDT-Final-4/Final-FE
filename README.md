# Aura (AI 콘텐츠 자동화 대시보드)
AI가 수집·생성한 콘텐츠를 검수하고 여러 채널에 배포하는 웹 대시보드입니다. 트렌드 수집 → 생성 → 검수 → 발행 → 모니터링 전 과정을 한 화면에서 다룹니다.

## 주요 기능
- **대시보드**: 조회수/클릭 KPI 카드와 조회수 추이(LineChart), 최근 콘텐츠 성과 테이블을 제공.
- **트렌드 수집**: `/trend` API 기반 인기 검색어 리스트, 카테고리 필터, SNS/카테고리 메타 정보 표시.
- **콘텐츠 검수**: `/content` 목록 조회, 미리보기/수정(본문 편집), 승인·반려 상태 변경(`/content/status/{id}`).
- **LLM 설정**: `/setting/llm` 호출로 모델명, base URL, API Key, maxTokens, temperature, topP, 시스템 프롬프트 저장.
- **업로드 플랫폼**: 네이버 블로그·Twitter 연동 UI, 자동 발행 스위치, API 키/계정 설정 다이얼로그.
- **알림 설정**: 이메일/Slack 채널 토글, Slack Webhook 테스트, 오류·검수·완료·일일 리포트 알림 옵션, 야간 차단 등 고급 설정.
- **스케줄 관리**: `/schedule` CRUD와 활성화 토글(`/schedule/active/{id}`), 반복주기(DAILY/WEEKLY/MONTHLY/YEARLY) 및 실행 시간 관리.
- **스케줄 정책**: `/setting/schedule`로 일일 실행 횟수, 실패 재시도, 자동 실행(run) 제어.
- **로그 뷰어**: 파이프라인/트렌드/발행 로그 필터링 및 검색 UI(모의 데이터 기반).
- **마이페이지**: `/user/me` 프로필 조회, 이름 변경(`/user/update`), 비밀번호 변경(`/user/password`).
- **인증**: 로그인(`/auth/login`), 회원가입(`/user/register`), 로컬 스토리지와 `ACCESS_TOKEN` 쿠키를 통한 세션 유지/로그아웃.

## 기술 스택
- React 18 + TypeScript, Vite(SWC) 빌드
- Tailwind CSS v4 기반 스타일 (전역 `src/index.css`)
- Radix UI/shadcn-ui 컴포넌트 모듈(`src/components/ui`), lucide-react 아이콘
- 데이터 시각화: recharts, 상태 관리: React 훅, fetch 래퍼 `src/lib/api.ts`

## 폴더 구조
```
src/
  App.tsx            # 라우팅 및 페이지 전환(사이드바)
  components/        # 주요 화면 컴포넌트 (Dashboard, TrendAnalysis, ContentReview 등)
    ui/              # 공용 UI 컴포넌트 (card, button 등)
  lib/
    api.ts           # API 요청 유틸 (Bearer + 쿠키 토큰 자동 첨부)
    auth.ts          # 토큰 저장/삭제, 로그인 헬퍼
  styles/, index.css # 글로벌 스타일
```

## 실행 방법
사전 준비: Node.js 18+ (권장), npm.

```bash
npm install          # 의존성 설치
# .env.local 예시 (루트에 생성)
# VITE_API_BASE_URL=http://localhost:8080/api   # 기본값 '/api'
# VITE_BACKEND_TARGET=http://localhost:8080     # 개발 프록시 대상
npm run dev          # http://localhost:3000 (vite.config.ts에서 host=true, open=true)
npm run build        # 프로덕션 빌드, 출력: build/
```

### API/인증 메모
- `VITE_API_BASE_URL`가 없으면 기본 `/api`로 호출하며, 개발 서버는 `VITE_BACKEND_TARGET`(기본 `http://localhost:8080`)으로 프록시합니다.
- 로그인 성공 시 응답 `token` 또는 `ACCESS_TOKEN` 쿠키를 로컬 스토리지(`auth_token`)에 저장해 이후 요청 시 Authorization 헤더를 자동 추가합니다.
- 백엔드에서 CORS/쿠키 설정(credential 포함)을 허용해야 합니다.

## 개발 시 참고
- 네트워크 실패 시 `api.ts`가 JSON/텍스트를 파싱해 에러 메시지를 최대한 노출합니다.
- 스케줄/콘텐츠/트렌드 등은 백엔드 스키마 편차에 대비해 클라이언트에서 필드 보정 로직을 포함하고 있습니다.
- 빌드 출력 경로는 `build/`로 설정되어 있습니다(vite 기본 `dist/` 아님).
