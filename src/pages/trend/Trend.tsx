import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {Waves} from "lucide-react";

interface TrendItem {
  rank: number;
  keyword: string;
  searchVolume: string;
  category: string;
}

interface PlatformConfig {
  id: PlatformId;
  name: string;
  description: string;
  highlight: string;
}

type PlatformId = "google" | "instagram" | "x";

type PlatformTrendMap = Record<PlatformId, TrendItem[]>;

const platforms: PlatformConfig[] = [
  {
    id: "google",
    name: "Google Trends",
    description: "검색 기반 실시간 이슈",
    highlight: "일일 검색량 +32%"
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "소셜 트렌드 & 챌린지",
    highlight: "콘텐츠 참여율 +18%"
  },
  {
    id: "x",
    name: "X",
    description: "바이럴 뉴스 & 밈",
    highlight: "실시간 언급량 +45%"
  }
];

const platformTrends: PlatformTrendMap = {
  google: [
    { rank: 1, keyword: "AI 컨퍼런스 2024", searchVolume: "1.2M", category: "테크" },
    { rank: 2, keyword: "여름휴가 핫플", searchVolume: "958K", category: "라이프스타일" },
    { rank: 3, keyword: "K-푸드 페스티벌", searchVolume: "812K", category: "푸드" }
  ],
  instagram: [
    { rank: 1, keyword: "#EcoHome 챌린지", searchVolume: "674K", category: "캠페인" },
    { rank: 2, keyword: "도시 감성사진", searchVolume: "602K", category: "크리에이티브" },
    { rank: 3, keyword: "한강 피크닉", searchVolume: "521K", category: "라이프스타일" }
  ],
  x: [
    { rank: 1, keyword: "기후 테크 규제", searchVolume: "433K", category: "정책" },
    { rank: 2, keyword: "우주 관광", searchVolume: "389K", category: "테크" },
    { rank: 3, keyword: "글로벌 음악 시상식", searchVolume: "347K", category: "엔터테인먼트" }
  ]
};

export function Trend() {
  const [activePlatform, setActivePlatform] = useState<PlatformId>("google");

  const tableRows = useMemo(
    () =>
      platforms.flatMap((platform) =>
        platformTrends[platform.id].map((trend) => ({
          ...trend,
          platform: platform.name
        }))
      ),
    []
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8faf9" }}>
      <div className="p-6">
        <header className="space-y-2 mb-6">
          <p className="text-sm font-medium text-primary">실시간 트렌드 허브</p>
          <h1 className="text-3xl font-semibold text-foreground">플랫폼별 인기 검색어 인사이트</h1>
          <p className="text-muted-foreground">
            플랫폼을 전환하며 인기 검색어와 검색량을 비교해 보고, 바로 콘텐츠 제작으로 연결해 보세요.
          </p>
        </header>

        <Tabs className="mb-6" value={activePlatform} onValueChange={(value) => setActivePlatform(value as PlatformId)}>
          <TabsList className="grid w-full grid-cols-3">
            {platforms.map((platform) => (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="flex items-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <Waves className="w-4 h-4" />
                  {platform.name}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {platform.description}
                </span>
                {/*<span className="text-xs text-primary/80">{platform.highlight}</span>*/}
              </TabsTrigger>
            ))}
          </TabsList>

          {platforms.map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                {platformTrends[platform.id].map((trend) => (
                  <Card key={`${platform.id}-${trend.rank}`} className="border border-primary/10 shadow-sm">
                    <CardHeader className="space-y-3 pb-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>순위 #{trend.rank}</span>
                        <Badge variant="secondary">{trend.category}</Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold leading-tight">{trend.keyword}</CardTitle>
                      <CardDescription>선택한 플랫폼에서 급상승 중인 검색어</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">검색량</p>
                        <p className="text-2xl font-bold text-foreground">{trend.searchVolume}</p>
                      </div>
                      <Button className="w-full bg-sidebar-primary">콘텐츠 생성하기</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>전체 플랫폼 인기 검색어</CardTitle>
            <CardDescription>플랫폼을 통합한 상위 키워드를 한눈에 비교하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">순위</TableHead>
                  <TableHead>키워드명</TableHead>
                  <TableHead>플랫폼</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">검색량</TableHead>
                  <TableHead className="text-right">생성하기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={`${row.platform}-${row.rank}-${row.keyword}`}>
                    <TableCell>#{row.rank}</TableCell>
                    <TableCell className="font-medium">{row.keyword}</TableCell>
                    <TableCell>{row.platform}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{row.searchVolume}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        생성하기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}