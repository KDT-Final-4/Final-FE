import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock, Filter, RefreshCw, Search } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

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
  INFO: "bg-primary/10 text-primary border-primary/20",
  ERROR: "bg-destructive/10 text-destructive border-destructive/20",
  WARN: "bg-amber-100 text-amber-900 border-amber-200",
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
  const [streamFromId, setStreamFromId] = useState("");
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

  const startStream = (jobIdInput?: string, fromIdInput?: string) => {
    const jobIdValue = (jobIdInput ?? streamJobId).trim();
    const fromIdValue = (fromIdInput ?? streamFromId).trim();
    setStreamJobId(jobIdValue);
    setStreamFromId(fromIdValue);

    if (!jobIdValue) {
      setStreamError("Job ID를 입력하세요.");
      return;
    }
    stopStream();
    setStreamError(null);
    setStreamLogs([]);

    const params = new URLSearchParams();
    if (fromIdValue) {
      const parsed = Number(fromIdValue);
      if (!Number.isNaN(parsed)) {
        params.set("id", parsed.toString());
      }
    }
    const query = params.toString();
    const url = `/api/pipeline/${encodeURIComponent(jobIdValue)}${query ? `?${query}` : ""}`;

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
          <Button variant="outline" className="gap-2" onClick={loadCounts} disabled={isLoadingCounts}>
            <Filter className="w-4 h-4" />
            카운트 새로고침
          </Button>
          <Button variant="outline" className="gap-2" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className="w-4 h-4" />
            목록 새로고침
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "전체", value: summary.total, tone: "text-foreground" },
          { label: "INFO", value: summary.info, tone: "text-primary" },
          { label: "WARN", value: summary.warn, tone: "text-amber-600" },
          { label: "ERROR", value: summary.error, tone: "text-destructive" },
        ].map((item) => (
          <Card key={item.label} className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-semibold ${item.tone}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            조회 조건
          </CardTitle>
          <CardDescription>검색어, 로그 타입, 페이지 크기로 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="sr-only" htmlFor="log-search">검색</label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="log-search"
                placeholder="메시지 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={logTypeFilter} onValueChange={(value) => setLogTypeFilter(value as typeof logTypeFilter)}>
            <SelectTrigger>
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
            <SelectTrigger>
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
          <div className="md:col-span-4 flex gap-2">
              <Button
                variant="default"
                className="bg-primary text-primary-foreground hover:brightness-105"
                onClick={handleSearchSubmit}
                disabled={isLoading}
            >
              조회
            </Button>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>페이지</span>
              <code className="rounded bg-muted px-2 py-1">#{page + 1}</code>
            </div>
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>타입</TableHead>
                <TableHead>Job ID</TableHead>
                <TableHead>메시지</TableHead>
                <TableHead className="text-right">작성자 ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    표시할 로그가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={LOGTYPE_BADGE[log.logType]}>
                        {log.logType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{log.jobId || "-"}</span>
                        {log.jobId && (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-0"
                            onClick={() => startStream(log.jobId)}
                          >
                            스트림
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[360px] whitespace-pre-line break-words" title={log.message}>
                      {log.message}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{log.userId}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
            <TableCaption>서버에서 받은 순서대로 정렬됩니다.</TableCaption>
          </Table>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">페이지: {page + 1}</div>
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
          <CardDescription>jobId 기준으로 DB의 로그를 한번에 스트리밍합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="sr-only" htmlFor="stream-jobid">Job ID</label>
              <Input
                id="stream-jobid"
                placeholder="job-123"
                value={streamJobId}
                onChange={(e) => setStreamJobId(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="stream-from">fromId (선택)</label>
              <Input
                id="stream-from"
                placeholder="fromId (숫자)"
                value={streamFromId}
                onChange={(e) => setStreamFromId(e.target.value)}
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
                  <div className="text-xs text-muted-foreground">Job: {log.jobId || "-"}</div>
                  <div className="text-sm whitespace-pre-line break-words">{log.message}</div>
                  <div className="text-xs text-muted-foreground text-right">userId: {log.userId}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
