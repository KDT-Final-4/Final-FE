import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Waves } from "lucide-react";

const PLATFORM_IDS = ["google", "instagram", "x"] as const;
type PlatformId = (typeof PLATFORM_IDS)[number];
type TrendSnsType = "GOOGLE" | "INSTAGRAM" | "X";

interface PlatformConfig {
  id: PlatformId;
  name: string;
  description: string;
  highlight: string;
  snsType: TrendSnsType;
}

interface TrendKeywordApiItem {
  rank?: number;
  keyword?: string;
  keywordName?: string;
  category?: string;
  categoryName?: string;
  searchVolume?: number;
  searchCount?: number;
  snsType?: TrendSnsType;
}

interface TrendKeyword {
  rank: number;
  keyword: string;
  category: string;
  searchVolume: number;
  snsType: TrendSnsType;
}

interface FetchTrendParams {
  page: number;
  size: number;
  snsType?: TrendSnsType;
}

type TrendRecord<T> = Record<TrendSnsType, T>;

const PLATFORM_LABELS: Record<TrendSnsType, string> = {
  GOOGLE: "Google Trends",
  INSTAGRAM: "Instagram",
  X: "X",
};

const DEFAULT_PAGE = 0;
const DEFAULT_TAB_SIZE = 3;
const DEFAULT_TABLE_SIZE = 30;
const numberFormatter = new Intl.NumberFormat("ko-KR");
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
const sanitizedBase = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

const isPlatformId = (value: string): value is PlatformId =>
  PLATFORM_IDS.includes(value as PlatformId);

const platforms: PlatformConfig[] = [
  {
    id: "google",
    name: "Google Trends",
    description: "검색 기반 실시간 이슈",
    highlight: "일일 검색량 +32%",
    snsType: "GOOGLE",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "소셜 트렌드 & 챌린지",
    highlight: "콘텐츠 참여율 +18%",
    snsType: "INSTAGRAM",
  },
  {
    id: "x",
    name: "X",
    description: "바이럴 뉴스 & 밈",
    highlight: "실시간 언급량 +45%",
    snsType: "X",
  }
];

const PLATFORM_TYPE_MAP: Record<PlatformId, PlatformConfig> = platforms.reduce(
  (acc, platform) => ({
    ...acc,
    [platform.id]: platform,
  }),
  {} as Record<PlatformId, PlatformConfig>
);

const initialPlatformTrends: TrendRecord<TrendKeyword[] | null> = {
  GOOGLE: null,
  INSTAGRAM: null,
  X: null,
};

const initialPlatformFlags: TrendRecord<boolean> = {
  GOOGLE: false,
  INSTAGRAM: false,
  X: false,
};

function extractTrendItems(payload: unknown): TrendKeywordApiItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as TrendKeywordApiItem[];
  if (typeof payload === "object") {
    const dataPayload = payload as Record<string, unknown>;
    if (Array.isArray(dataPayload.content)) {
      return dataPayload.content as TrendKeywordApiItem[];
    }
    if (dataPayload.data && typeof dataPayload.data === "object") {
      const nested = dataPayload.data as Record<string, unknown>;
      if (Array.isArray(nested.content)) {
        return nested.content as TrendKeywordApiItem[];
      }
      if (Array.isArray(nested.items)) {
        return nested.items as TrendKeywordApiItem[];
      }
    }
    if (Array.isArray(dataPayload.items)) {
      return dataPayload.items as TrendKeywordApiItem[];
    }
  }
  return [];
}

function normalizeTrendItem(item: TrendKeywordApiItem, index: number, fallbackType?: TrendSnsType): TrendKeyword {
  const category = item.category ?? item.categoryName ?? "기타";
  const keyword = item.keyword ?? item.keywordName ?? "-";
  const searchVolumeValue = Number(item.searchVolume ?? item.searchCount ?? 0);

  return {
    rank: item.rank ?? index + 1,
    keyword,
    category,
    searchVolume: Number.isFinite(searchVolumeValue) ? searchVolumeValue : 0,
    snsType: item.snsType ?? fallbackType ?? "GOOGLE",
  };
}

async function fetchTrendKeywords({ page, size, snsType }: FetchTrendParams): Promise<TrendKeyword[]> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (snsType) {
    params.set("snsType", snsType);
  }

  const response = await fetch(`${sanitizedBase}/trend?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "인기 검색어를 불러오지 못했습니다.");
  }

  const payload = await response.json();
  const items = extractTrendItems(payload);

  return items.map((item, index) => normalizeTrendItem(item, index, snsType));
}

export function Trend() {
  const [activePlatform, setActivePlatform] = useState<PlatformId>("google");
  const [tableTrends, setTableTrends] = useState<TrendKeyword[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [platformTrends, setPlatformTrends] = useState(initialPlatformTrends);
  const [platformLoading, setPlatformLoading] = useState(initialPlatformFlags);
  const [platformError, setPlatformError] = useState<TrendRecord<string | null>>({
    GOOGLE: null,
    INSTAGRAM: null,
    X: null,
  });

  const tableRows = useMemo(() => tableTrends, [tableTrends]);

  const handleCreateContent = useCallback(async (keyword: string) => {
    try {
      const response = await fetch(`${sanitizedBase}/trend/content`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        throw new Error("콘텐츠 생성 요청이 실패했습니다.");
      }
    } catch (error) {
      console.error("[Trend] failed to trigger content creation", error);
    }
  }, []);

  const loadTableTrends = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);

    try {
      const trends = await fetchTrendKeywords({
        page: DEFAULT_PAGE,
        size: DEFAULT_TABLE_SIZE,
      });
      setTableTrends(trends);
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setTableLoading(false);
    }
  }, []);

  const loadPlatformData = useCallback(
    async (platformId: PlatformId, force = false) => {
      const snsType = PLATFORM_TYPE_MAP[platformId].snsType;
      if (!force && platformTrends[snsType]?.length) {
        return;
      }

      setPlatformLoading((prev) => ({
        ...prev,
        [snsType]: true,
      }));
      setPlatformError((prev) => ({
        ...prev,
        [snsType]: null,
      }));

      try {
        const trends = await fetchTrendKeywords({
          page: DEFAULT_PAGE,
          size: DEFAULT_TAB_SIZE,
          snsType,
        });
        setPlatformTrends((prev) => ({
          ...prev,
          [snsType]: trends,
        }));
      } catch (error) {
        setPlatformError((prev) => ({
          ...prev,
          [snsType]: error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.",
        }));
      } finally {
        setPlatformLoading((prev) => ({
          ...prev,
          [snsType]: false,
        }));
      }
    },
    [platformTrends]
  );

  useEffect(() => {
    loadTableTrends();
  }, [loadTableTrends]);

  useEffect(() => {
    loadPlatformData(activePlatform);
  }, [activePlatform, loadPlatformData]);

  const handleRetry = (platformId: PlatformId) => {
    loadPlatformData(platformId, true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8faf9" }}>
      <div className="p-6">
        <header className="space-y-2 mb-6">
          {/*<p className="text-sm font-medium text-primary">실시간 트렌드 허브</p>*/}
          <h1 className="text-3xl font-semibold text-foreground">트렌드</h1>
          <p className="text-muted-foreground">
            플랫폼별 인기 검색어를 비교하고, 바로 콘텐츠를 제작해보세요.
          </p>
        </header>

        <Tabs
          className="mb-6"
          value={activePlatform}
          onValueChange={(value) => {
            if (isPlatformId(value)) {
              setActivePlatform(value);
            }
          }}
        >
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

          {platforms.map((platform) => {
            const snsType = platform.snsType;
            const trends = platformTrends[snsType];
            const isLoading = platformLoading[snsType];
            const errorMessage = platformError[snsType];

            return (
              <TabsContent key={platform.id} value={platform.id} className="space-y-4">
                {isLoading && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {platform.name} 데이터를 불러오는 중입니다...
                  </div>
                )}

                {!isLoading && errorMessage && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    <p>{errorMessage}</p>
                    <Button className="mt-3" size="sm" variant="outline" onClick={() => handleRetry(platform.id)}>
                      다시 시도
                    </Button>
                  </div>
                )}

                {!isLoading && !errorMessage && (
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {trends && trends.length > 0 ? (
                      trends.map((trend) => (
                        <Card key={`${snsType}-${trend.rank}-${trend.keyword}`} className="border border-primary/10 shadow-sm">
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
                              <p className="text-2xl font-bold text-foreground">{numberFormatter.format(trend.searchVolume)}</p>
                            </div>
                            <Button className="w-full bg-sidebar-primary" onClick={() => handleCreateContent(trend.keyword)}>
                              콘텐츠 생성하기
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        표시할 데이터가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>전체 플랫폼 인기 검색어</CardTitle>
            <CardDescription>플랫폼을 통합한 상위 키워드를 한눈에 비교하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {tableLoading && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                전체 인기 검색어를 불러오는 중입니다...
              </div>
            )}

            {!tableLoading && tableError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <p>{tableError}</p>
                <Button className="mt-3" variant="outline" size="sm" onClick={loadTableTrends}>
                  다시 시도
                </Button>
              </div>
            )}

            {!tableLoading && !tableError && (
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
                    <TableRow key={`${row.snsType}-${row.rank}-${row.keyword}`}>
                      <TableCell>#{row.rank}</TableCell>
                      <TableCell className="font-medium">{row.keyword}</TableCell>
                      <TableCell>{PLATFORM_LABELS[row.snsType]}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{numberFormatter.format(row.searchVolume)}</TableCell>
                      <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleCreateContent(row.keyword)}>
                        생성하기
                      </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
