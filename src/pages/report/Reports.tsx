import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TEXT_LIMIT = 100;

const STATUS_META = {
  WAITING: {
    label: "검수 대기",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "승인 완료",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "반려",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
} as const satisfies Record<ContentStatus, { label: string; badgeClass: string }>;

const mockReports: ReportItem[] = [
  {
    id: "1",
    jobId: "JOB-20241210-01",
    userId: "101",
    uploadChannelId: "201",
    title: "생활폐기물 무단 투기 예방 캠페인",
    body:
      "생활폐기물 배출이 집중되는 시간대의 패턴을 분석한 뒤 불법 투기를 막기 위한 캠페인 영상을 제작했습니다. 영상에는 시간대별 통계와 실제 단속 현장의 인터뷰가 포함되어 있으며, 추가로 주민 인터뷰를 덧붙여 자발적인 참여를 이끌 계획입니다.",
    createdAt: "2025-12-10T14:18:00",
    updatedAt: "2025-12-10T15:02:00",
    status: "WAITING",
    generationType: "VIDEO",
    link: "https://example.com/reports/1",
    keyword: "생활폐기물",
  },
  {
    id: "2",
    jobId: "JOB-20241209-03",
    userId: "101",
    uploadChannelId: "202",
    title: "동절기 에너지 절감 정책 카드뉴스",
    body:
      "동절기 전력 수요 증가를 대비하여 각 부처의 절감 정책을 정리한 카드뉴스입니다. 시민 참여형 아이디어 공모전과 연계할 수 있도록 CTA 문구를 추가했고, 공유 시 주의사항을 하단에 표기했습니다.",
    createdAt: "2025-12-09T09:30:00",
    updatedAt: "2025-12-09T10:10:00",
    status: "APPROVED",
    generationType: "CARD_NEWS",
    link: "https://example.com/reports/2",
    keyword: "에너지 절감",
  },
  {
    id: "3",
    jobId: "JOB-20241208-07",
    userId: "102",
    uploadChannelId: "203",
    title: "기상 이변 대비 행동요령 인포그래픽",
    body:
      "최근 3년간 빈번해진 국지성 폭우 데이터를 기반으로 주민들이 즉각적으로 취할 수 있는 행동요령을 정리했습니다. 기상청, 소방청 자료를 교차 검증했으며, 모바일 환경에서 읽기 쉽게 4단 구성으로 설계했습니다.",
    createdAt: "2025-12-08T18:50:00",
    updatedAt: "2025-12-08T19:05:00",
    status: "REJECTED",
    generationType: "INFOGRAPHIC",
    link: "https://example.com/reports/3",
    keyword: "기상 이변",
  },
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ContentStatus>("WAITING");
  const [reports] = useState<ReportItem[]>(mockReports);

  const reportsByStatus = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc[report.status].push(report);
        return acc;
      },
      {
        WAITING: [],
        APPROVED: [],
        REJECTED: [],
      } as Record<ContentStatus, ReportItem[]>
    );
  }, [reports]);

  const tabs: TabItem[] = useMemo(
    () => [
      {
        value: "WAITING",
        label: STATUS_META.WAITING.label,
        count: reportsByStatus.WAITING.length,
      },
      { value: "APPROVED", label: STATUS_META.APPROVED.label },
      { value: "REJECTED", label: STATUS_META.REJECTED.label },
    ],
    [reportsByStatus]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">검수</h1>
        <p className="text-muted-foreground">
          업로드 전 AI 생성 컨텐츠를 확인하세요.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ContentStatus)}
        className="mb-6"
      >
				<TabsList className="grid w-full grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2"
            >
              {tab.count !== undefined ? (
                <span>
                  {tab.label} ({tab.count})
                </span>
              ) : (
                tab.label
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => {
          const items = reportsByStatus[tab.value];

          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
              {items.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    현재 {tab.label} 상태의 보고서가 없습니다.
                  </CardContent>
                </Card>
              ) : (
                items.map((report) => <ReportCard key={report.id} report={report} />)
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function ReportCard({ report }: { report: ReportItem }) {
  const status = STATUS_META[report.status];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">타이틀</p>
          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold leading-tight">{report.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>상태</span>
              <Badge variant="outline" className={status.badgeClass}>
                {status.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">내용</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {truncateText(report.body)}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{report.body.length.toLocaleString()}자 (body 글자수)</span>
          <span>날짜 {formatDateTime(report.createdAt)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm">
          미리보기
        </Button>
        <Button size="sm">승인</Button>
        <Button variant="destructive" size="sm">
          반려
        </Button>
        <Button variant="secondary" size="sm">
          수정
        </Button>
      </CardFooter>
    </Card>
  );
}

function truncateText(text: string, limit = TEXT_LIMIT) {
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

type ContentStatus = "WAITING" | "APPROVED" | "REJECTED";

type ReportItem = {
  id: string;
  jobId: string;
  userId: string;
  uploadChannelId: string;
  title: string;
  body: string;
  status: ContentStatus;
  generationType: string;
  link?: string;
  keyword?: string;
  createdAt: string;
  updatedAt: string;
};

type TabItem = {
  value: ContentStatus;
  label: string;
  count?: number;
};
