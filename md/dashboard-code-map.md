# Dashboard 코드 맵

## 진입/라우팅
- `src/main.tsx`: 루트 DOM에 `App`을 마운트하고 `index.css`를 불러와 Tailwind 전역 스타일을 적용.
- `src/App.tsx`: `currentPage` 기본값이 `dashboard`이며 `renderPage` 스위치에서 `Dashboard` 컴포넌트를 렌더링. `Sidebar`의 `onPageChange`로 페이지 전환, `isAuthenticated` 가드로 로그인/회원가입 화면을 분기, `logout` 호출로 토큰/세션 제거 후 로그인 화면으로 복귀.

## 네비게이션(사이드바)
- `src/components/Sidebar.tsx`: 네비 항목에 `dashboard`가 포함되어 초기 진입점이자 사용자 전환 트리거. `LayoutDashboard` 아이콘 사용, 선택 상태에 따라 Tailwind 클래스로 스타일 변경. 마운트 시 `/user/me`를 `api.get`으로 호출해 사용자 이름/이메일을 표시하며, 하단 `로그아웃` 버튼은 상위 `onLogout`을 실행.

## Dashboard 화면 UI
- `src/components/Dashboard.tsx`: 대시보드 본문 컴포넌트. 현재는 정적 mock 데이터로 구성.
  - `kpiData`: 조회수/클릭 KPI 카드(`Card` + lucide 아이콘 + 전일 대비 증감 `TrendingUp/Down`).
  - `chartData`: Recharts `LineChart`로 조회수 추이 선그래프(`ResponsiveContainer`, `Line`, `Tooltip` 등) 렌더링.
  - `recentContents`: 최근 콘텐츠 리스트. Unsplash 썸네일(96x96) 시도 후 실패 시 `https://placehold.co/96x96`로 대체, 조회수/클릭/CTR 표시, `ExternalLink` 아이콘 버튼은 placeholder.
  - 레이아웃은 상단 제목/서브텍스트 → 2열 KPI 카드 → 조회수 추이 차트 → "최근 콘텐츠 성과" 카드 순, Tailwind 유틸 클래스로 스타일링.

## UI/스타일 기반
- `src/components/ui/card.tsx`: `Card`, `CardHeader`, `CardTitle`, `CardContent` 등 카드 프리미티브 정의. Dashboard KPI/차트/리스트가 모두 이 컴포넌트를 사용.
- `src/index.css`: Tailwind v4 빌드 결과로 색상/타이포 스케일, 기본 레이아웃 리셋을 제공. 모든 Dashboard 스타일 클래스의 토큰이 여기서 정의됨.

## 데이터/인증 유틸
- `src/lib/api.ts`: 기본 `/api` 또는 `VITE_API_BASE_URL`을 사용해 fetch를 래핑, 로컬 스토리지/쿠키의 토큰을 Bearer 헤더로 자동 첨부. Dashboard에 API 연동 시 이 헬퍼를 사용.
- `src/lib/auth.ts`: 토큰 저장/조회/삭제(`logout`)와 인증 여부 체크(`isAuthenticated`) 로직을 제공. Dashboard 진입 전 인증 플로우에 사용됨.

## 백엔드 대시보드 사양 문서
- `md/frontend-dashboard-link.md`: `/api/dashboard/status`(allClicks/allViews/visitors/averageDwellTime)와 `/api/dashboard/contents`(콘텐츠 목록) 엔드포인트 명세, 인증 요구사항, 응답/에러 예시를 포함. 대시보드 API 연동 시 참고.

## 기타 참조
- `README.md`: 주요 기능 목록에 대시보드 설명이 있으며, 전체 기술 스택/실행 방법/폴더 구조를 제공.
