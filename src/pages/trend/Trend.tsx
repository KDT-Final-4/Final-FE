import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Waves } from "lucide-react";
import { apiFetch } from "@/apiClient";

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

interface TrendKeywordResponse {
  items: TrendKeyword[];
  totalCount: number;
  totalPages: number;
}

type TrendRecord<T> = Record<TrendSnsType, T>;

const PLATFORM_LABELS: Record<TrendSnsType, string> = {
  GOOGLE: "Google Trends",
  INSTAGRAM: "Instagram",
  X: "X",
};

const DEFAULT_PAGE = 0;
const DEFAULT_TAB_SIZE = 3;
const DEFAULT_TABLE_SIZE = 10;
const PAGE_GROUP_SIZE = 10;
const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 30];
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
function parseNumericValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

const TOTAL_COUNT_KEY_CANDIDATES = [
  "totalcount",
  "totalelements",
  "totalrecords",
  "total",
  "count",
  "totalcnt",
  "countall",
  "totalitems",
  "recordstotal",
  "recordsfiltered",
  "maxresults",
  "hits",
  "nbhits",
  "numfound",
];

const NESTED_CONTAINER_KEYS = [
  "data",
  "meta",
  "metadata",
  "page",
  "pageinfo",
  "pagination",
  "pageable",
  "info",
  "result",
  "response",
  "body",
];

const TOTAL_PAGES_KEY_CANDIDATES = [
  "totalpages",
  "pages",
  "pagecount",
  "pagetotal",
  "totalpagecount",
];

const TOTAL_PAGES_NESTED_KEYS = NESTED_CONTAINER_KEYS;

const HEADER_TOTAL_COUNT_KEYS = [
  "X-Total-Count",
  "X-Total",
  "X-Total-Records",
  "X-TotalRecords",
  "X-Total-Elements",
  "X-TotalElements",
  "X-Total-Count-All",
];

const HEADER_TOTAL_PAGE_KEYS = [
  "X-Total-Pages",
  "X-TotalPages",
  "X-Page-Count",
  "X-PageCount",
];

const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

function extractTotalCount(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const queue: unknown[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      continue;
    }

    const record = current as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const normalizedKey = normalizeKey(key);
      if (TOTAL_COUNT_KEY_CANDIDATES.includes(normalizedKey)) {
        const parsed = parseNumericValue(record[key]);
        if (typeof parsed === "number") {
          return parsed;
        }
      }
    }

    for (const key of Object.keys(record)) {
      const normalizedKey = normalizeKey(key);
      if (NESTED_CONTAINER_KEYS.includes(normalizedKey)) {
        const value = record[key];
        if (value && typeof value === "object") {
          queue.push(value);
        }
      }
    }
  }

  return undefined;
}

function extractTotalPages(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const queue: unknown[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      continue;
    }

    const record = current as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const normalizedKey = normalizeKey(key);
      if (TOTAL_PAGES_KEY_CANDIDATES.includes(normalizedKey)) {
        const parsed = parseNumericValue(record[key]);
        if (typeof parsed === "number") {
          return parsed;
        }
      }
    }

    for (const key of Object.keys(record)) {
      const normalizedKey = normalizeKey(key);
      if (TOTAL_PAGES_NESTED_KEYS.includes(normalizedKey)) {
        const value = record[key];
        if (value && typeof value === "object") {
          queue.push(value);
        }
      }
    }
  }

  return undefined;
}

async function fetchTrendKeywords({ page, size, snsType }: FetchTrendParams): Promise<TrendKeywordResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (snsType) {
    params.set("snsType", snsType);
  }

  const response = await apiFetch(`${sanitizedBase}/trend?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "인기 검색어를 불러오지 못했습니다.");
  }

  const payload = await response.json();
  const items = extractTrendItems(payload);
  const normalizedItems = items.map((item, index) => normalizeTrendItem(item, index, snsType));
  const payloadRecord = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const payloadSize = payloadRecord
    ? parseNumericValue(payloadRecord["size"] ?? payloadRecord["pageSize"] ?? payloadRecord["limit"])
    : undefined;
  const payloadPage = payloadRecord
    ? parseNumericValue(payloadRecord["page"] ?? payloadRecord["pageIndex"] ?? payloadRecord["currentPage"])
    : undefined;
  const resolvedPageSize = typeof payloadSize === "number" && payloadSize > 0 ? payloadSize : size;
  const resolvedPageIndex = typeof payloadPage === "number" && payloadPage >= 0 ? payloadPage : page;
  const totalCountFromPayload = extractTotalCount(payload);
  const totalPagesFromPayload = extractTotalPages(payload);
  const headerTotalPages = HEADER_TOTAL_PAGE_KEYS
    .map((key) => response.headers.get(key))
    .map((value) => parseNumericValue(value ?? undefined))
    .find((value): value is number => typeof value === "number");
  const headerTotalCount = HEADER_TOTAL_COUNT_KEYS
    .map((key) => response.headers.get(key))
    .map((value) => parseNumericValue(value ?? undefined))
    .find((value): value is number => typeof value === "number");

  const inferredFromPages = (() => {
    if (typeof totalPagesFromPayload === "number" && totalPagesFromPayload > 0) {
      return totalPagesFromPayload * resolvedPageSize;
    }
    if (typeof headerTotalPages === "number" && headerTotalPages > 0) {
      return headerTotalPages * resolvedPageSize;
    }
    return undefined;
  })();
  const fallbackCount = resolvedPageIndex * resolvedPageSize + normalizedItems.length;
  const resolvedTotalCount = headerTotalCount ?? totalCountFromPayload ?? inferredFromPages ?? fallbackCount;

  const inferredTotalPagesFromCount = resolvedTotalCount > 0 ? Math.ceil(resolvedTotalCount / resolvedPageSize) : undefined;
  const fallbackPages = normalizedItems.length === resolvedPageSize ? resolvedPageIndex + 2 : resolvedPageIndex + 1;
  const resolvedTotalPages = headerTotalPages
    ?? totalPagesFromPayload
    ?? inferredTotalPagesFromCount
    ?? fallbackPages;

  return {
    items: normalizedItems,
    totalCount: resolvedTotalCount,
    totalPages: resolvedTotalPages,
  };
}

export function Trend() {
  const [activePlatform, setActivePlatform] = useState<PlatformId>("google");
  const [tableTrends, setTableTrends] = useState<TrendKeyword[]>([]);
  const [tablePage, setTablePage] = useState(DEFAULT_PAGE);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_TABLE_SIZE);
  const [tableTotalCount, setTableTotalCount] = useState(0);
  const [tableTotalPages, setTableTotalPages] = useState(0);
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
      const response = await apiFetch(`${sanitizedBase}/trend/content`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      });

        if (!response.ok) {
            console.error("콘텐츠 생성 요청이 실패했습니다.");
            return;
        }
    } catch (error) {
      console.error("[Trend] failed to trigger content creation", error);
    }
  }, []);

  const loadTableTrends = useCallback(async (page: number, size: number) => {
    setTableLoading(true);
    setTableError(null);

    try {
      const { items, totalCount, totalPages } = await fetchTrendKeywords({
        page,
        size,
      });
      setTableTrends(items);
      setTableTotalCount(totalCount);
      setTableTotalPages(totalPages);

      const maxPageIndex = Math.max(0, Math.ceil(totalPages) - 1);
      if (page > maxPageIndex) {
        setTablePage(maxPageIndex);
      }
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
        const { items } = await fetchTrendKeywords({
          page: DEFAULT_PAGE,
          size: DEFAULT_TAB_SIZE,
          snsType,
        });
        setPlatformTrends((prev) => ({
          ...prev,
          [snsType]: items,
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
    loadTableTrends(tablePage, tablePageSize);
  }, [loadTableTrends, tablePage, tablePageSize]);

  useEffect(() => {
    loadPlatformData(activePlatform);
  }, [activePlatform, loadPlatformData]);

  const handleRetry = (platformId: PlatformId) => {
    loadPlatformData(platformId, true);
  };

  const derivedTotalPages = tableTotalCount > 0 ? Math.ceil(tableTotalCount / tablePageSize) : 0;
  const totalPages = tableTotalPages > 0 ? tableTotalPages : derivedTotalPages;
  const tablePageGroupStart = totalPages > 0 ? Math.floor(tablePage / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE : 0;
  const tablePageGroupEnd = totalPages > 0 ? Math.min(totalPages, tablePageGroupStart + PAGE_GROUP_SIZE) : 0;
  const tablePageNumbers = Array.from(
    { length: Math.max(0, tablePageGroupEnd - tablePageGroupStart) },
    (_, index) => tablePageGroupStart + index
  );
  const canGoPrevPage = tablePage > 0;
  const canGoNextPage = totalPages > 0 && tablePage < totalPages - 1;
  const canGoGroupPrev = totalPages > 0 && tablePage > 0;
  const canGoGroupNext = totalPages > 0 && tablePage < totalPages - 1;

  const handleTableGroupPrev = () => {
    if (tableLoading || !canGoGroupPrev) return;
    setTablePage((prev) => Math.max(0, prev - PAGE_GROUP_SIZE));
  };

  const handleTableGroupNext = () => {
    if (tableLoading || !canGoGroupNext) return;
    setTablePage((prev) => Math.min(totalPages - 1, prev + PAGE_GROUP_SIZE));
  };

  const handleTablePrev = () => {
    if (tableLoading || !canGoPrevPage) return;
    setTablePage((prev) => Math.max(0, prev - 1));
  };

  const handleTableNext = () => {
    if (tableLoading || !canGoNextPage) return;
    setTablePage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleTablePageSelect = (pageIndex: number) => {
    if (tableLoading || pageIndex < 0 || (totalPages > 0 && pageIndex > totalPages - 1)) {
      return;
    }
    setTablePage(pageIndex);
  };

  const handleTablePageSizeChange = (value: string) => {
    const newSize = Number(value);
    if (!Number.isFinite(newSize)) return;
    setTablePage(0);
    setTablePageSize(newSize);
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
          <CardHeader className="pb-2">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>전체 플랫폼 인기 검색어</CardTitle>
                <CardDescription>플랫폼을 통합한 상위 키워드를 한눈에 비교하세요.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {/*<span className="text-sm text-muted-foreground">한 페이지당</span>*/}
                <Select value={String(tablePageSize)} onValueChange={handleTablePageSizeChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="페이지 크기" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_PAGE_SIZE_OPTIONS.map((sizeOption) => (
                      <SelectItem key={sizeOption} value={String(sizeOption)}>
                        {sizeOption}개씩 보기
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                <Button className="mt-3" variant="outline" size="sm" onClick={() => loadTableTrends(tablePage, tablePageSize)}>
                  다시 시도
                </Button>
              </div>
            )}

            {!tableLoading && !tableError && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
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
                {totalPages > 0 && (
                  <div className="mt-4 flex flex-col items-center gap-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleTableGroupPrev} disabled={tableLoading || !canGoGroupPrev}>
                        {"<<"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleTablePrev} disabled={tableLoading || !canGoPrevPage}>
                        {"<"}
                      </Button>
                      {tablePageNumbers.map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          size="sm"
                          variant={pageNumber === tablePage ? "default" : "outline"}
                          onClick={() => handleTablePageSelect(pageNumber)}
                        >
                          {pageNumber + 1}
                        </Button>
                      ))}
                      <Button variant="ghost" size="sm" onClick={handleTableNext} disabled={tableLoading || !canGoNextPage}>
                        {">"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleTableGroupNext} disabled={tableLoading || !canGoGroupNext}>
                        {">>"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
