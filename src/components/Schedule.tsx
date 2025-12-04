import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { api } from '@/lib/api';

// API types
export type RepeatInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type ScheduleItem = {
  id: number;
  userId: number;
  title: string;
  startTime: string; // ISO
  repeatInterval: RepeatInterval;
  isActive?: boolean;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleCreateRequest = {
  title: string;
  startTime: string; // ISO
  repeatInterval: RepeatInterval;
};

// datetime-local helpers
// Convert server value to input value (YYYY-MM-DDTHH:mm). Handles strings with or without timezone.
function toLocalInputValue(value?: string): string {
  if (!value) return '';
  // If backend sends naive local datetime like '2025-12-02T09:00:00'
  const naiveMatch = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (naiveMatch) return naiveMatch[1];
  // Otherwise treat as ISO with timezone and render in local time
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Convert input value (YYYY-MM-DDTHH:mm) to payload string WITHOUT timezone to preserve local wall-clock time
function fromLocalInputValue(v: string): string {
  if (!v) return '';
  // Ensure seconds present; do not append 'Z' or timezone
  const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(v);
  return hasSeconds ? v : `${v}:00`;
}

export function Schedule() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState<string>(''); // datetime-local
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>('DAILY');
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingItem = useMemo(() => items.find((i) => i.id === editingId) || null, [items, editingId]);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editRepeatInterval, setEditRepeatInterval] = useState<RepeatInterval>('DAILY');
  const [savingEdit, setSavingEdit] = useState(false);

  function extractErrorMessage(err: any): string {
    const body = err?.body;
    if (body?.detail || body?.title || body?.message) return body.detail || body.title || body.message;
    return err?.message || '요청 처리 중 오류가 발생했습니다';
  }

  // Normalize incoming schedule object to our client shape
  function normalizeItem(raw: any): ScheduleItem {
    const idCandidate = raw?.id ?? raw?.scheduleId ?? raw?.scheduleID ?? raw?.schedule_id;
    const idNum = typeof idCandidate === 'string' ? Number(idCandidate) : idCandidate;
    return {
      id: Number.isFinite(idNum) ? (idNum as number) : 0,
      userId: raw?.userId ?? raw?.userID ?? raw?.user_id ?? 0,
      title: raw?.title ?? '',
      startTime: raw?.startTime ?? raw?.start_time ?? '',
      repeatInterval: raw?.repeatInterval ?? raw?.repeat_interval ?? 'DAILY',
      isActive: raw?.isActive ?? raw?.active ?? raw?.enabled ?? false,
      lastExecutedAt: raw?.lastExecutedAt ?? raw?.last_executed_at ?? null,
      createdAt: raw?.createdAt ?? raw?.created_at ?? '',
      updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
    } as ScheduleItem;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Load list via GET /schedule
      console.log('[Schedule] load -> request: GET /schedule');
      const res = await api.get<any[]>('/schedule');
      console.log('[Schedule] load <- response(raw):', res);
      const normalized = Array.isArray(res) ? res.map((r) => normalizeItem(r)) : [];
      console.log('[Schedule] load <- response(normalized):', normalized);
      setItems(normalized);
    } catch (e: any) {
      console.log('[Schedule] load !! error:', {
        message: e?.message,
        status: e?.status,
        body: e?.body,
      });
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('[Schedule] timezone offset (minutes):', new Date().getTimezoneOffset());
    load();
  }, []);

  useEffect(() => {
    const idSummary = items.map((r) => ({ id: r.id, typeOfId: typeof r.id, title: r.title }));
    console.log('[Schedule] items updated -> id mapping:', idSummary);
  }, [items]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const localInput = startTime;
      const parsed = localInput ? new Date(localInput) : null;
      const iso = localInput ? fromLocalInputValue(localInput) : '';
      const offset = parsed ? parsed.getTimezoneOffset() : null;
      const payload: ScheduleCreateRequest = {
        title: title.trim(),
        startTime: iso,
        repeatInterval,
      };
      console.log('[Schedule] create -> request: POST /schedule', {
        payload,
        debug: { localInput, parsed: String(parsed), iso, offset }
      });
      const createdRaw = await api.post<any>('/schedule', payload);
      const created = normalizeItem(createdRaw);
      console.log('[Schedule] create <- response(raw, normalized):', createdRaw, created);
      setItems((prev) => [created, ...prev]);
      setTitle('');
      setStartTime('');
      setRepeatInterval('DAILY');
    } catch (e: any) {
      console.log('[Schedule] create !! error:', {
        message: e?.message,
        status: e?.status,
        body: e?.body,
      });
      setError(extractErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function startEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    const local = toLocalInputValue(item.startTime);
    console.log('[Schedule] edit.start ->', { id: item.id, startTimeRaw: item.startTime, localInputValue: local });
    setEditStartTime(local);
    setEditRepeatInterval(item.repeatInterval);
  }

  async function saveEdit(id: number) {
    setSavingEdit(true);
    setError(null);
    try {
      const localInput = editStartTime;
      const parsed = localInput ? new Date(localInput) : null;
      const iso = localInput ? fromLocalInputValue(localInput) : '';
      const offset = parsed ? parsed.getTimezoneOffset() : null;
      const payload: ScheduleCreateRequest = {
        title: editTitle.trim(),
        startTime: iso,
        repeatInterval: editRepeatInterval,
      };
      console.log('[Schedule] update -> request: PUT /schedule/' + id, {
        payload,
        debug: { localInput, parsed: String(parsed), iso, offset }
      });
      const updatedRaw = await api.put<any>(`/schedule/${id}`, payload);
      const updated = normalizeItem(updatedRaw);
      console.log('[Schedule] update <- response(raw, normalized):', updatedRaw, updated);
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      setEditingId(null);
    } catch (e: any) {
      console.log('[Schedule] update !! error:', {
        message: e?.message,
        status: e?.status,
        body: e?.body,
      });
      setError(extractErrorMessage(e));
    } finally {
      setSavingEdit(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('이 스케줄을 삭제하시겠습니까?')) return;
    setError(null);
    try {
      console.log('[Schedule] delete -> request: DELETE /schedule/' + id);
      await api.del<void>(`/schedule/${id}`);
      console.log('[Schedule] delete <- response: 204');
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e: any) {
      console.log('[Schedule] delete !! error:', {
        message: e?.message,
        status: e?.status,
        body: e?.body,
      });
      setError(extractErrorMessage(e));
    }
  }

  async function toggleActive(id: number, next: boolean) {
    setError(null);
    try {
      if (!Number.isFinite(id) || id <= 0) {
        console.log('[Schedule] active !! invalid-id, abort', { id, typeOfId: typeof id, next });
        setError('유효하지 않은 ID입니다. 새로고침 후 다시 시도하세요.');
        return;
      }
      console.log('[Schedule] active -> request: PUT /schedule/active/' + id, { id, typeOfId: typeof id, isActive: next });
      await api.put<void>(`/schedule/active/${id}`, { isActive: next });
      console.log('[Schedule] active <- response: 204');
      setItems((prev) => {
        const exists = prev.some((it) => it.id === id);
        console.log('[Schedule] active -> update state', { id, exists });
        return prev.map((it) => (it.id === id ? { ...it, isActive: next } : it));
      });
    } catch (e: any) {
      console.log('[Schedule] active !! error:', {
        message: e?.message,
        status: e?.status,
        body: e?.body,
      });
      setError(extractErrorMessage(e));
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">스케줄</h1>
        <p className="text-gray-600">스케줄을 관리하고 실행 일정을 설정합니다</p>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>새 스케줄 추가</CardTitle>
            <CardDescription>제목, 시작 시간, 반복 주기를 설정하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 매일 리포트" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">시작 일자 / 시간</Label>
                <Input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>반복주기</Label>
                <Select value={repeatInterval} onValueChange={(v: string) => setRepeatInterval(v as RepeatInterval)}>
                  <SelectTrigger>
                    <SelectValue placeholder="반복 주기" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">매일</SelectItem>
                    <SelectItem value="WEEKLY">매주</SelectItem>
                    <SelectItem value="MONTHLY">매월</SelectItem>
                    <SelectItem value="YEARLY">매년</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCreate} disabled={creating || !title.trim() || !startTime}>
                {creating ? '추가 중...' : '추가'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>스케줄 목록</CardTitle>
            <CardDescription>등록된 스케줄을 확인하고 수정/삭제할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-500">불러오는 중...</div>
            ) : items.length === 0 ? (
              <div className="text-gray-500">등록된 스케줄이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="p-2 w-1/3">제목</th>
                      <th className="p-2 w-40">시작</th>
                      <th className="p-2 w-28">반복주기</th>
                      <th className="p-2 w-28">활성화</th>
                      <th className="p-2 w-40">최근 실행</th>
                      <th className="p-2 w-40">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const isEditing = editingId === it.id;
                      return (
                        <tr key={it.id} className="border-t border-gray-100">
                          <td className="p-2 align-middle max-w-[240px]">
                            {isEditing ? (
                              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            ) : (
                              <div className="text-gray-800 truncate">{it.title}</div>
                            )}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            {isEditing ? (
                              <Input type="datetime-local" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                            ) : (
                              <span className="text-gray-800">{toLocalInputValue(it.startTime).replace('T', ' ')}</span>
                            )}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            {isEditing ? (
                              <Select value={editRepeatInterval} onValueChange={(v: string) => setEditRepeatInterval(v as RepeatInterval)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DAILY">매일</SelectItem>
                                  <SelectItem value="WEEKLY">매주</SelectItem>
                                  <SelectItem value="MONTHLY">매월</SelectItem>
                                  <SelectItem value="YEARLY">매년</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-gray-800">{it.repeatInterval}</span>
                            )}
                          </td>
                          <td className="p-2 align-middle">
                            <div className="flex items-center">
                              <Switch
                                checked={!!it.isActive}
                                onCheckedChange={(checked: boolean) => toggleActive(it.id, !!checked)}
                              />
                            </div>
                          </td>
                          <td className="p-2 align-middle text-gray-600 whitespace-nowrap">
                            {it.lastExecutedAt ? toLocalInputValue(it.lastExecutedAt).replace('T', ' ') : '-'}
                          </td>
                          <td className="p-2 align-middle w-40">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveEdit(it.id)} disabled={savingEdit}>
                                  저장
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={savingEdit}>
                                  취소
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => startEdit(it)}>
                                  수정
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => remove(it.id)}>
                                  삭제
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
