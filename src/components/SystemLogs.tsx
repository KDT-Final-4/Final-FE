import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, Download, RefreshCw, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  id: number;
  userId: number;
  logType: LogLevel;
  jobId: string;
  message: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

const getLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'INFO':
      return <Info className="w-4 h-4" />;
    case 'WARN':
      return <AlertTriangle className="w-4 h-4" />;
    case 'ERROR':
      return <AlertCircle className="w-4 h-4" />;
  }
};

const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case 'INFO':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'WARN':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'ERROR':
      return 'bg-red-100 text-red-700 border-red-200';
  }
};

const parseProblemDetail = async (res: Response, fallback: string) => {
  try {
    const body = await res.json();
    return body?.detail || body?.title || fallback;
  } catch {
    return fallback;
  }
};

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ info: number; warn: number; error: number }>({
    info: 0,
    warn: 0,
    error: 0,
  });

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/log/count', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await parseProblemDetail(res, '로그 카운트 조회 실패'));
      const data = await res.json();
      setCounts({
        info: Number(data.info ?? 0),
        warn: Number(data.warn ?? data.warning ?? 0),
        error: Number(data.error ?? 0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    }
  };

  const fetchLogs = async ({ reset = false }: { reset?: boolean } = {}) => {
    if (loading && !reset) return;

    const nextPage = reset ? 0 : page;
    if (reset) {
      setPage(0);
      setHasMore(true);
    }
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        size: String(PAGE_SIZE),
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/log?${params.toString()}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(await parseProblemDetail(res, '로그 조회 실패'));

      const data: LogEntry[] = await res.json();
      setLogs((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setPage(nextPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchLogs({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => fetchLogs({ reset: true }), 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredLogs = logs.filter((log) => selectedLevel === 'ALL' || log.logType === selectedLevel);

  const handleRefresh = () => {
    setPage(0);
    setHasMore(true);
    fetchCounts();
    fetchLogs({ reset: true });
  };

  const handleDownload = () => {
    const csv = [
      ['id', 'logType', 'jobId', 'createdAt', 'message'],
      ...logs.map((l) => [l.id, l.logType, l.jobId, l.createdAt, JSON.stringify(l.message)]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">로그 뷰어</h1>
        <p className="text-gray-600">
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>시스템 로그</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!logs.length}>
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="로그 메시지 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['ALL', 'INFO', 'WARN', 'ERROR'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level as LogLevel | 'ALL')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    selectedLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {loading && <div className="text-sm text-gray-500">로딩 중...</div>}

          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <Badge className={getLevelColor(log.logType)}>
                      {getLevelIcon(log.logType)}
                      <span className="ml-1">{log.logType}</span>
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500">{log.createdAt}</span>
                      <Badge variant="secondary" className="font-mono">
                        {log.jobId}
                      </Badge>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{log.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>검색 결과가 없습니다.</p>
            </div>
          )}

          {hasMore && !loading && (
            <Button variant="outline" size="sm" onClick={() => fetchLogs()} className="w-full">
              더 불러오기
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
