import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock, RefreshCw, Search } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
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
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [streamJobId, setStreamJobId] = useState("");
  const [streamLogs, setStreamLogs] = useState<LogItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const loadCounts = async () => {
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
  };

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", Math.max(0, page).toString());
      params.set("size", Math.max(1, size).toString());
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/log?${params.toString()}`, {
        credentials: "include",
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        throw new Error("로그 데이터를 불러오지 못했습니다.");
      }
      const data: LogItem[] = await response.json();
      const items = Array.isArray(data) ? data : [];
      setLogs(items);
      setHasNextPage(items.length >= size);
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그 조회에 실패했습니다.";
      setError(message);
      setLogs([]);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

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

  const handleSearchSubmit = () => {
    setPage(0);
    loadLogs();
  };

  const canGoPrev = page > 0;
  const canGoNext = hasNextPage;

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

            <Select value={logTypeFilter} onValueChange={(value) => setLogTypeFilter(value as typeof logTypeFilter)}>
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
                setPage(0);
              }}
            >
              <SelectTrigger className="w-28 bg-muted">
                <SelectValue placeholder="페이지 크기" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((opt) => (
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

          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canGoPrev || isLoading}>
                이전
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!canGoNext || isLoading}>
                다음
              </Button>
            </div>
          </div>
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
