import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableCaption, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { ExternalLink, Inbox, MousePointerClick } from 'lucide-react';
import { api } from '@/lib/api';

type DashboardStatus = {
    allClicks: number;
    allViews: number;
    visitors: number;
    averageDwellTime: number;
};

type DashboardContent = {
    contentId: number;
    title: string;
    keyword: string;
    contentLink: string;
    clickCount: number;
    createdAt: string;
    updatedAt: string;
};

// 숫자 표시용 헬퍼: null/undefined를 대시로 표시해 UI 깨짐 방지
function formatNumber(value: number | null | undefined) {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString();
}

export function Dashboard() {
    const [status, setStatus] = useState<DashboardStatus | null>(null);
    const [contents, setContents] = useState<DashboardContent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [periodDays, setPeriodDays] = useState<7 | 30>(7); // 최근 n일 필터
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statusData, contentsData] = await Promise.all([
                api.get<DashboardStatus>('/dashboard/status'),
                api.get<{ contents: DashboardContent[] }>('/dashboard/contents'),
            ]);
            if (!mountedRef.current) return;
            setStatus(statusData);
            setContents(contentsData?.contents || []);
        } catch (err: any) {
            if (!mountedRef.current) return;
            setError(err?.message || '대시보드 데이터를 불러오지 못했습니다.');
        } finally {
            if (!mountedRef.current) return;
            setLoading(false);
        }
    };

    useEffect(() => {
        // 초기 데이터 로드
        fetchDashboard();
    }, []);

    const handleRefresh = () => {
        fetchDashboard();
    };

    const recentItems = useMemo(() => {
        // 최근 콘텐츠 카드용 데이터: 기간 필터 → 수정일 우선 정렬 → 표시 필드만 추출
        const now = Date.now();
        const threshold = now - periodDays * 24 * 60 * 60 * 1000;
        return [...contents]
            .filter((item) => {
                const t = new Date(item.updatedAt || item.createdAt).getTime();
                return Number.isFinite(t) && t >= threshold;
            })
            .sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
            )
            .map((item, idx) => ({
                id: item.contentId ?? idx,
                title: item.title,
                createdLabel: item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                      })
                    : '-',
                clicks: item.clickCount ?? 0,
                keyword: item.keyword,
                link: item.contentLink,
            }));
    }, [contents, periodDays]);

    const kpiItems = [
        {
            key: 'clicks',
            title: '총 클릭수',
            description: '모든 콘텐츠의 클릭수',
            value: formatNumber(status?.allClicks),
            icon: <MousePointerClick className="h-5 w-5 text-foreground" />,
        },
    ];

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 space-y-6 max-w-6xl mx-auto">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">대시보드</h1>
                <p className="text-muted-foreground">AI 콘텐츠 마케팅 성과를 한눈에 확인하세요</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {kpiItems.map((item) => (
                    <Card key={item.key}>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div className="space-y-1.5">
                                <CardTitle>{item.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                                {item.icon}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {loading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-4 w-28" />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="text-3xl font-semibold">{item.value}</div>
                                    <p className="text-xs text-muted-foreground">집계 기준: 실시간</p>
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <span>데이터를 불러오지 못했습니다.</span>
                                    <Button size="sm" variant="outline" onClick={handleRefresh}>
                                        재시도
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle>최근 콘텐츠 성과</CardTitle>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">실시간</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">최근 {periodDays}일 작성 기준</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className={
                                periodDays === 7
                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                                    : 'text-foreground border-border hover:bg-muted'
                            }
                            onClick={() => setPeriodDays(7)}
                        >
                            7일
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className={
                                periodDays === 30
                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
                                    : 'text-foreground border-border hover:bg-muted'
                            }
                            onClick={() => setPeriodDays(30)}
                        >
                            30일
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-muted/70">
                                <TableRow className="h-12">
                                    <TableHead>글 제목</TableHead>
                                    <TableHead>키워드</TableHead>
                                    <TableHead>작성일</TableHead>
                                    <TableHead className="text-right">클릭수</TableHead>
                                    <TableHead>링크</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, idx) => (
                                    <TableRow key={idx} className="h-12">
                                        <TableCell className="w-1/3"><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell className="w-24"><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell className="w-32"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="w-28"><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell className="w-24"><Skeleton className="h-8 w-16" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : error ? (
                        <div className="flex items-center gap-3 p-6 text-sm text-destructive">
                            <span>콘텐츠를 불러오지 못했습니다.</span>
                            <Button size="sm" variant="outline" onClick={handleRefresh}>
                                재시도
                            </Button>
                        </div>
                    ) : recentItems.length === 0 ? (
                        <div className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                            <Inbox className="h-5 w-5 text-primary/50" />
                            <span>표시할 콘텐츠가 없습니다.</span>
                            <Button size="sm" variant="outline" onClick={handleRefresh}>
                                새로고침
                            </Button>
                        </div>
                    ) : (
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-muted/70">
                                <TableRow className="h-12">
                                    <TableHead>글 제목</TableHead>
                                    <TableHead>키워드</TableHead>
                                    <TableHead>작성일</TableHead>
                                    <TableHead className="text-right">클릭수</TableHead>
                                    <TableHead>링크</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentItems.map((item) => (
                                    <TableRow key={item.id} className="h-12 even:bg-muted/40 hover:bg-primary/5">
                                        <TableCell className="font-medium max-w-[320px] truncate" title={item.title || '제목 없음'}>
                                            {item.title || '제목 없음'}
                                        </TableCell>
                                        <TableCell>
                                            {item.keyword ? (
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                    {item.keyword}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{item.createdLabel}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <MousePointerClick className="h-4 w-4 text-green-700" />
                                                <span className="font-semibold">{formatNumber(item.clicks)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.link ? (
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200 gap-1"
                                                    onClick={() => window.open(item.link, '_blank', 'noreferrer')}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    열기
                                                </Button>
                                            ) : (
                                                <span className="text-muted-foreground">링크 없음</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableCaption className="text-left">
                                최근 {periodDays}일 동안 작성된 콘텐츠 기준
                            </TableCaption>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
