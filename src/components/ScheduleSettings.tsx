import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';

type ApiSchedule = {
  id: number;
  userId: number;
  maxDailyRuns: number;
  retryOnFail: number;
  createdAt: string;
  updatedAt: string;
  run: boolean;
};

type ApiScheduleUpdateResponse = {
  id: number;
  maxDailyRuns: number;
  retryOnFail: number;
  updatedAt: string;
  run: boolean;
};

export function ScheduleSettings() {
  const [maxDailyRuns, setMaxDailyRuns] = useState<number>(0);
  const [retryOnFail, setRetryOnFail] = useState<number>(0);
  const [run, setRun] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    api
      .get<ApiSchedule>(`/setting/schedule`)
      .then((res) => {
        if (ignore) return;
        setScheduleId(res.id);
        setMaxDailyRuns(res.maxDailyRuns);
        setRetryOnFail(res.retryOnFail);
        setRun(res.run);
      })
      .catch((e: any) => {
        if (ignore) return;
        setError(e?.message || '스케쥴 정보를 불러오지 못했습니다');
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (scheduleId == null) {
        throw new Error('스케쥴 ID를 불러오지 못했습니다. 새로고침 후 다시 시도하세요.');
      }
      const res = await api.put<ApiScheduleUpdateResponse>(`/setting/schedule/${scheduleId}`, {
        maxDailyRuns,
        retryOnFail,
        run,
      });
      setMaxDailyRuns(res.maxDailyRuns);
      setRetryOnFail(res.retryOnFail);
      setRun(res.run);
      alert('스케쥴 설정이 저장되었습니다.');
    } catch (e: any) {
      setError(e?.message || '스케쥴 설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">스케쥴</h1>
        <p className="text-gray-600">콘텐츠 생성 작업의 실행 횟수와 실패 시 재시도 정책을 설정하세요</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>실행 정책</CardTitle>
            <CardDescription>일일 실행 횟수와 실패 시 재시도 횟수를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading && <div className="text-gray-500">불러오는 중...</div>}
            {error && <div className="text-red-600">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="max-daily-runs">일일 최대 실행 횟수</Label>
              <Input
                id="max-daily-runs"
                type="number"
                value={Number.isFinite(maxDailyRuns) ? maxDailyRuns : 0}
                onChange={(e) => setMaxDailyRuns(Number(e.target.value))}
                placeholder="0"
                className="w-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry-on-fail">실패 시 재시도 횟수</Label>
              <Input
                id="retry-on-fail"
                type="number"
                value={Number.isFinite(retryOnFail) ? retryOnFail : 0}
                onChange={(e) => setRetryOnFail(Number(e.target.value))}
                placeholder="0"
                className="w-40"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>자동 실행</Label>
                <p className="text-gray-500">스케쥴에 따라 자동으로 작업을 실행합니다</p>
              </div>
              <Switch checked={run} onCheckedChange={setRun} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
