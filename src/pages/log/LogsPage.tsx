import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock, RefreshCw } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { KpiCard } from "../../components/KpiCard";

type LogType = "INFO" | "ERROR" | "WARN";

type LogItem = {
  id: number;
  userId: number;
  logType: LogType;
  jobId: string;
  message: string;
  createdAt: string;
};

type LogCounts = {
  info?: number;
  error?: number;
  warn?: number;
};

const LOGTYPE_BADGE: Record<LogType, string> = {
  INFO: "badge-info-soft",
  WARN: "badge-warn-soft",
  ERROR: "badge-error-soft",
};

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30];
const PAGE_GROUP_SIZE = 10;

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
];

const TOTAL_PAGES_KEY_CANDIDATES = [
  "totalpages",
  "pages",
  "pagecount",
  "pagetotal",
  "totalpagecount",
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

const parseNumericValue = (value: unknown): number | undefined => {
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
};

const extractTotalCount = (payload: unknown): number | undefined => {
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
};

const extractTotalPages = (payload: unknown): number | undefined => {
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
      if (NESTED_CONTAINER_KEYS.includes(normalizedKey)) {
        const value = record[key];
        if (value && typeof value === "object") {
          queue.push(value);
        }
      }
    }
  }

  return undefined;
};

const extractLogItems = (payload: unknown): LogItem[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as LogItem[];
  if (typeof payload === "object") {
    const dataPayload = payload as Record<string, unknown>;
    if (Array.isArray(dataPayload.items)) {
      return dataPayload.items as LogItem[];
    }
    if (Array.isArray(dataPayload.content)) {
      return dataPayload.content as LogItem[];
    }
    if (dataPayload.data && typeof dataPayload.data === "object") {
      const nested = dataPayload.data as Record<string, unknown>;
      if (Array.isArray(nested.items)) {
        return nested.items as LogItem[];
      }
      if (Array.isArray(nested.content)) {
        return nested.content as LogItem[];
      }
    }
  }
  return [];
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [counts, setCounts] = useState<LogCounts>({ info: 0, error: 0, warn: 0 });
  const [logTypeFilter, setLogTypeFilter] = useState<LogType | "all">("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [, setIsLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamJobId, setStreamJobId] = useState("");
  const [streamLogs, setStreamLogs] = useState<LogItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadCounts = useCallback(async () => {
    setIsLoadingCounts(true);
    try {
      const response = await fetch("/api/log/count", { credentials: "include" });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("로그 카운트를 불러오지 못했습니다.");
      }
      const data: LogCounts = await response.json();
      setCounts({
        info: data.info ?? 0,
        error: data.error ?? 0,
        warn: data.warn ?? 0,
      });
    } catch (err) {
      console.error("[Logs] count load failed", err);
      setCounts((prev) => prev);
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", Math.max(0, page).toString());
      params.set("size", Math.max(1, size).toString());
      if (appliedSearch) params.set("search", appliedSearch);
      if (logTypeFilter !== "all") params.set("logType", logTypeFilter);

      const response = await fetch(`/api/log?${params.toString()}`, {
        credentials: "include",
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("로그 데이터를 불러오지 못했습니다.");
      }

      const payload = await response.json();
      const items = extractLogItems(payload);
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

      const fallbackCount = resolvedPageIndex * resolvedPageSize + items.length;
      const resolvedTotalCount = headerTotalCount ?? totalCountFromPayload ?? inferredFromPages ?? fallbackCount;

      const inferredTotalPagesFromCount = resolvedTotalCount > 0 ? Math.ceil(resolvedTotalCount / resolvedPageSize) : undefined;
      const fallbackPages = items.length === resolvedPageSize ? resolvedPageIndex + 2 : resolvedPageIndex + 1;
      const resolvedTotalPages = headerTotalPages ?? totalPagesFromPayload ?? inferredTotalPagesFromCount ?? fallbackPages;

      setLogs(items);
      setTotalCount(resolvedTotalCount);
      setTotalPages(resolvedTotalPages);

      const maxPageIndex = Math.max(0, Math.ceil(resolvedTotalPages) - 1);
      if (page > maxPageIndex) {
        setPage(maxPageIndex);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그 조회에 실패했습니다.";
      setError(message);
      setLogs([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch, logTypeFilter, page, size]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => (logTypeFilter === "all" ? true : log.logType === logTypeFilter));
  }, [logs, logTypeFilter]);

  const summary = useMemo(() => {
    const total = (counts.info ?? 0) + (counts.error ?? 0) + (counts.warn ?? 0);
    return {
      total,
      info: counts.info ?? 0,
      warn: counts.warn ?? 0,
      error: counts.error ?? 0,
    };
  }, [counts]);

  const derivedTotalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 0;
  const effectiveTotalPages = totalPages > 0 ? totalPages : derivedTotalPages;
  const pageGroupStart = effectiveTotalPages > 0 ? Math.floor(page / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE : 0;
  const pageGroupEnd = effectiveTotalPages > 0 ? Math.min(effectiveTotalPages, pageGroupStart + PAGE_GROUP_SIZE) : 0;
  const pageNumbers = Array.from(
    { length: Math.max(0, pageGroupEnd - pageGroupStart) },
    (_, index) => pageGroupStart + index
  );

  const canGoPrevPage = !isLoading && page > 0;
  const canGoNextPage = !isLoading && effectiveTotalPages > 0 && page < effectiveTotalPages - 1;
  const canGoGroupPrev = !isLoading && effectiveTotalPages > 0 && page > 0;
  const canGoGroupNext = !isLoading && effectiveTotalPages > 0 && page < effectiveTotalPages - 1;

  const handleSearchSubmit = () => {
    setPage(DEFAULT_PAGE);
    setAppliedSearch(search.trim());
  };

  const handleGroupPrev = () => {
    if (!canGoGroupPrev) return;
    setPage((prev) => Math.max(DEFAULT_PAGE, prev - PAGE_GROUP_SIZE));
  };

  const handleGroupNext = () => {
    if (!canGoGroupNext) return;
    setPage((prev) => Math.min(Math.max(0, effectiveTotalPages - 1), prev + PAGE_GROUP_SIZE));
  };

  const handlePrev = () => {
    if (!canGoPrevPage) return;
    setPage((prev) => Math.max(DEFAULT_PAGE, prev - 1));
  };

  const handleNext = () => {
    if (!canGoNextPage) return;
    setPage((prev) => Math.min(Math.max(0, effectiveTotalPages - 1), prev + 1));
  };

  const handlePageSelect = (pageIndex: number) => {
    if (pageIndex < 0 || (effectiveTotalPages > 0 && pageIndex > effectiveTotalPages - 1)) return;
    setPage(pageIndex);
  };

  const stopStream = () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsStreaming(false);
  };

  const startStream = (jobIdInput?: string) => {
    const jobIdValue = (jobIdInput ?? streamJobId).trim();
    setStreamJobId(jobIdValue);

    if (!jobIdValue) {
      setStreamError("식별 Id를 입력하세요.");
      return;
    }
    stopStream();
    setStreamError(null);
    setStreamLogs([]);

    const url = `/api/pipeline/${encodeURIComponent(jobIdValue)}`;

    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;
    setIsStreaming(true);

    es.onmessage = (event) => {
      try {
        const data: LogItem = JSON.parse(event.data);
        setStreamLogs((prev) => [...prev, data]);
      } catch (e) {
        console.error("[Logs] failed to parse SSE message", e);
      }
    };

    es.onerror = (event) => {
      const readyState = (event?.target as EventSource | null)?.readyState;
      const isClosed = readyState === EventSource.CLOSED;
      if (isClosed) {
        stopStream();
        setStreamError(null);
        return;
      }
      console.error("[Logs] SSE error", event);
      setStreamError("SSE 수신 중 오류가 발생했습니다. 권한 문제일 수 있습니다.");
      stopStream();
    };

    // 서버가 완료 시 스트림을 끊으면 readyState가 CLOSED가 됨
    es.onopen = () => {
      setStreamError(null);
    };
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">로그</h1>
          </div>
          <p className="text-muted-foreground">파이프라인/컨텐츠 처리 로그를 조회하고 필터링하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className="w-4 h-4" />
            목록 새로고침
          </Button>
        </div>
      </div>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            로그 요약
          </CardTitle>
          <CardDescription>전체/INFO/WARN/ERROR 상태를 한눈에 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[ 
              { label: "전체", value: summary.total, backgroundClass: "bg-card", toneClass: "text-foreground" },
              { label: "INFO", value: summary.info, backgroundClass: "card-info-soft", toneClass: "text-primary" },
              { label: "WARN", value: summary.warn, backgroundClass: "card-warn-soft", toneClass: "text-yellow-600" },
              { label: "ERROR", value: summary.error, backgroundClass: "card-error-soft", toneClass: "text-red-600" },
            ].map((item) => (
              <KpiCard
                key={item.label}
                label={item.label}
                value={item.value}
                backgroundClass={item.backgroundClass}
                toneClass={item.toneClass}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            조회 조건
          </CardTitle>
          <CardDescription>검색어, 로그 타입, 페이지 크기로 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-secondary/20 border border-secondary/30 rounded-md p-4 flex flex-row flex-nowrap items-center gap-3 overflow-x-auto">
            <div className="flex-[1.7] min-w-[320px]">
              <div className="relative">
                <Input
                  id="log-search"
                  aria-label="메시지 검색"
                  placeholder="메시지 검색 ex) UPDATE "
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  className="pr-3 bg-muted"
                />
              </div>
            </div>

            <Select
              value={logTypeFilter}
              onValueChange={(value) => {
                setLogTypeFilter(value as typeof logTypeFilter);
                setPage(DEFAULT_PAGE);
              }}
            >
              <SelectTrigger className="w-36 bg-muted">
                <SelectValue placeholder="로그 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(size)}
              onValueChange={(value) => {
                setSize(Number(value));
                setPage(DEFAULT_PAGE);
              }}
            >
              <SelectTrigger className="w-28 bg-muted">
                <SelectValue placeholder="페이지 크기" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}개씩
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="default"
              className="bg-primary text-primary-foreground hover:brightness-105 px-4"
              onClick={handleSearchSubmit}
              disabled={isLoading}
            >
              조회
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>로그 리스트</CardTitle>
          <CardDescription>최근 이벤트와 처리 상태</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>식별 Id</TableHead>
                  <TableHead>메시지</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      불러오는 중...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      표시할 로그가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  filteredLogs.map((log) => {
                    const isClickable = Boolean(log.jobId);
                    return (
                      <TableRow
                        key={log.id}
                        className={
                          isClickable
                            ? "cursor-pointer bg-secondary/20 hover:bg-secondary/30 transition-colors"
                            : undefined
                        }
                        onClick={() => {
                          if (log.jobId) startStream(log.jobId);
                        }}
                      >
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={LOGTYPE_BADGE[log.logType]}>
                            {log.logType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{log.jobId || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[360px] whitespace-pre-line break-words" title={log.message}>
                          {log.message}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {effectiveTotalPages > 0 && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleGroupPrev} disabled={!canGoGroupPrev}>
                  {"<<"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePrev} disabled={!canGoPrevPage}>
                  {"<"}
                </Button>
                {pageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="sm"
                    variant={pageNumber === page ? "default" : "outline"}
                    onClick={() => handlePageSelect(pageNumber)}
                    disabled={isLoading}
                  >
                    {pageNumber + 1}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={handleNext} disabled={!canGoNextPage}>
                  {">"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGroupNext} disabled={!canGoGroupNext}>
                  {">>"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            파이프라인 로그 스트림 (SSE)
          </CardTitle>
          <CardDescription>식별 Id 기준으로 DB의 로그를 한번에 스트리밍합니다.</CardDescription>
          <CardDescription>로그 리스트에서 선택 가능합니다.</CardDescription>

        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="sr-only" htmlFor="stream-jobid">식별 Id</label>
              <Input
                id="stream-jobid"
                placeholder="식별 Id (예: job-123)"
                value={streamJobId}
                onChange={(e) => setStreamJobId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={startStream} disabled={isStreaming} className="gap-2">
              {isStreaming ? "수신 중..." : "스트림 시작"}
            </Button>
            <Button variant="outline" onClick={stopStream} disabled={!isStreaming}>
              중지
            </Button>
          </div>
          {streamError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {streamError}
            </div>
          )}
          {!streamError && streamLogs.length === 0 && (
            <p className="text-sm text-muted-foreground">수신된 로그가 없습니다.</p>
          )}
          {streamLogs.length > 0 && (
            <div className="border rounded-md divide-y max-h-80 overflow-auto">
              {streamLogs.map((log) => (
                <div key={log.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatDateTime(log.createdAt)}</span>
                    <Badge variant="outline" className={LOGTYPE_BADGE[log.logType]}>
                      {log.logType}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">식별 Id: {log.jobId || "-"}</div>
                  <div className="text-sm whitespace-pre-line break-words">{log.message}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
