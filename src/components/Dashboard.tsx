import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MousePointerClick } from 'lucide-react';
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

    useEffect(() => {
        // 마운트 시점에 대시보드 요약(allClicks)과 콘텐츠 목록을 병렬로 조회
        let ignore = false;
        setLoading(true);
        Promise.all([
            api.get<DashboardStatus>('/dashboard/status'),
            api.get<{ contents: DashboardContent[] }>('/dashboard/contents'),
        ])
            .then(([statusData, contentsData]) => {
                if (ignore) return;
                setStatus(statusData);
                setContents(contentsData?.contents || []);
                setError(null);
            })
            .catch((err: any) => {
                if (ignore) return;
                setError(err?.message || '대시보드 데이터를 불러오지 못했습니다.');
            })
            .finally(() => {
                if (ignore) return;
                setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, []);

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

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-gray-900 mb-2">대시보드</h1>
                <p className="text-gray-600">AI 콘텐츠 마케팅 성과를 한눈에 확인하세요</p>
            </div>

            <div className="max-w-5xl space-y-28 pr-6">
                {/* KPI Cards: 총 클릭수 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50">
                                    <MousePointerClick className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-sm text-gray-500">
                                  {loading ? '불러오는 중...' : error ? '오류' : '실시간'}
                                </span>
                            </div>
                            <div className="text-gray-600 mb-1">총 클릭수</div>
                            <div className="text-gray-900 text-2xl font-semibold">
                                {loading ? '—' : formatNumber(status?.allClicks)}
                            </div>
                            {error ? (
                                <p className="text-red-500 text-sm mt-2">데이터를 불러오지 못했습니다.</p>
                            ) : (
                                <p className="text-gray-500 text-sm mt-2">모든 콘텐츠의 클릭수</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

        {/* Recent Contents: API 기반 + contentLink 직접 이동 */}
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">최근 콘텐츠 성과</CardTitle>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-md ${
                    periodDays === 7 ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setPeriodDays(7)}
                >
                  7일
                </button>
                <button
                  className={`px-3 py-1 rounded-md ${
                    periodDays === 30 ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setPeriodDays(30)}
                >
                  30일
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-8 pr-10">
            {loading ? (
              <p className="text-gray-500">불러오는 중...</p>
            ) : error ? (
              <p className="text-red-500">콘텐츠를 불러오지 못했습니다.</p>
            ) : recentItems.length === 0 ? (
              <p className="text-gray-500">표시할 콘텐츠가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[900px] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <table className="w-full text-base">
                    <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 text-gray-800 font-semibold">
                      <tr>
                        <th className="px-6 py-4 text-left border-b border-gray-200">글 제목</th>
                        <th className="px-6 py-4 text-left border-b border-gray-200">작성일</th>
                        <th className="px-6 py-4 text-left border-b border-gray-200">클릭수</th>
                        <th className="px-6 py-4 text-left border-b border-gray-200">링크</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {recentItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/40 transition-colors even:bg-gray-50/40"
                      >
                        <td
                          className="px-6 py-5 text-gray-900 font-medium truncate min-w-0"
                          title={item.title || '제목 없음'}
                        >
                          {item.title || '제목 없음'}
                        </td>
                        <td className="px-6 py-5 text-gray-700">{item.createdLabel}</td>
                        <td className="px-6 py-5 text-gray-700">
                          <div className="flex items-center gap-2">
                            <MousePointerClick className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">{formatNumber(item.clicks)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-gray-700">
                          <div className="flex items-center gap-2">
                            {item.link ? (
                              <button
                                className="px-4 py-2 text-sm rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shrink-0"
                                  onClick={() => window.open(item.link, '_blank', 'noreferrer')}
                                  title="링크 열기"
                                >
                                  열기
                                </button>
                              ) : (
                                <span className="text-gray-400">링크 없음</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </div>
    );
}
