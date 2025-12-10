import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Switch } from "../../components/ui/switch";

type ScheduleResponse = {
  id: number;
  userId: number;
  title: string;
  startTime: string;
  repeatInterval: string;
  lastExecutedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ScheduleForm = {
  title: string;
  startTime: string;
  repeatInterval: string;
};

const REPEAT_INTERVALS = ["DAILY", "WEEKLY", "MONTHLY", "ONCE"];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const toLocalInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
};

export function SchedulePage() {
  const [activeScheduleId, setActiveScheduleId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [scheduleList, setScheduleList] = useState<ScheduleResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ScheduleForm>({
    title: "",
    startTime: "",
    repeatInterval: REPEAT_INTERVALS[0],
  });
  const [createForm, setCreateForm] = useState<ScheduleForm>({
    title: "",
    startTime: "",
    repeatInterval: REPEAT_INTERVALS[0],
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const editSectionRef = useRef<HTMLDivElement | null>(null);

  const loadScheduleList = async () => {
    setIsListLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/schedule", { method: "GET" });
      if (!response.ok) {
        throw new Error(`스케줄 목록을 불러오지 못했습니다. (HTTP ${response.status})`);
      }
      const data: ScheduleResponse[] = await response.json();
      setScheduleList(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "스케줄 목록을 불러오지 못했습니다.";
      setError(message);
      setScheduleList([]);
    } finally {
      setIsListLoading(false);
    }
  };

  const loadSchedule = async (
    id: number,
    options: { shouldScroll?: boolean; overwriteForm?: boolean } = {},
  ) => {
    const { shouldScroll = false, overwriteForm } = options;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/schedule/${id}`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`스케줄을 불러오지 못했습니다. (HTTP ${response.status})`);
      }
      const data: ScheduleResponse = await response.json();
      const normalizedRepeat = REPEAT_INTERVALS.includes(data.repeatInterval)
        ? data.repeatInterval
        : REPEAT_INTERVALS[0];
      setSchedule(data);
      setActiveScheduleId(id);
      setIsCreateOpen(false);
      const shouldSetForm = overwriteForm ?? !isEditing;
      if (shouldSetForm) {
        setForm({
          title: data.title ?? "",
          startTime: toLocalInputValue(data.startTime),
          repeatInterval: normalizedRepeat,
        });
      }
      if (shouldScroll && editSectionRef.current) {
        setTimeout(() => {
          editSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "스케줄을 불러오지 못했습니다.";
      setError(message);
      setSchedule(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleList();
  }, []);

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      setError("제목을 입력하세요.");
      return;
    }
    if (!createForm.startTime) {
      setError("시작 시간을 입력하세요.");
      return;
    }
    const parsedStart = new Date(createForm.startTime);
    if (Number.isNaN(parsedStart.getTime())) {
      setError("시작 시간 형식이 올바르지 않습니다.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title.trim(),
          startTime: parsedStart.toISOString(),
          repeatInterval: createForm.repeatInterval,
        }),
      });
      if (!response.ok) {
        throw new Error(`스케줄 생성에 실패했습니다. (HTTP ${response.status})`);
      }
      const data: ScheduleResponse = await response.json();
      setMessage("새 스케줄이 생성되었습니다.");
      setCreateForm({
        title: "",
        startTime: "",
        repeatInterval: REPEAT_INTERVALS.includes(data.repeatInterval) ? data.repeatInterval : REPEAT_INTERVALS[0],
      });
      setIsCreateOpen(false);
      await loadScheduleList();
      if (data?.id) {
        await loadSchedule(data.id, { shouldScroll: true, overwriteForm: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "스케줄 생성에 실패했습니다.";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!activeScheduleId) {
      setError("먼저 스케줄을 불러와 주세요.");
      return;
    }
    if (!form.title.trim()) {
      setError("제목을 입력하세요.");
      return;
    }
    if (!form.startTime) {
      setError("시작 시간을 입력하세요.");
      return;
    }
    const parsedStart = new Date(form.startTime);
    if (Number.isNaN(parsedStart.getTime())) {
      setError("시작 시간 형식이 올바르지 않습니다.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/schedule/${activeScheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          startTime: parsedStart.toISOString(),
          repeatInterval: form.repeatInterval,
        }),
      });
      if (!response.ok) {
        throw new Error(`스케줄 저장에 실패했습니다. (HTTP ${response.status})`);
      }
      const data: ScheduleResponse = await response.json();
      const normalizedRepeat = REPEAT_INTERVALS.includes(data.repeatInterval)
        ? data.repeatInterval
        : form.repeatInterval;
      setSchedule(data);
      setForm({
        title: data.title ?? form.title.trim(),
        startTime: toLocalInputValue(data.startTime),
        repeatInterval: normalizedRepeat,
      });
      setMessage("스케줄이 저장되었습니다.");
      setIsEditing(false);
      loadScheduleList();
    } catch (err) {
      const message = err instanceof Error ? err.message : "스케줄 저장에 실패했습니다.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (id: number) => {
    if (!id) {
      setError("먼저 스케줄을 불러와 주세요.");
      return;
    }
    setTogglingId(id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/schedule/active/${id}`, {
        method: "PUT",
      });
      if (!response.ok) {
        throw new Error(`스케줄 상태 변경에 실패했습니다. (HTTP ${response.status})`);
      }
      await loadSchedule(id, { shouldScroll: true, overwriteForm: true });
      await loadScheduleList();
      setMessage("스케줄 상태가 변경되었습니다.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "스케줄 상태 변경에 실패했습니다.";
      setError(message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!activeScheduleId) {
      setError("먼저 스케줄을 불러와 주세요.");
      return;
    }
    setIsDeleting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/schedule/${activeScheduleId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`스케줄 삭제에 실패했습니다. (HTTP ${response.status})`);
      }
      setSchedule(null);
      setActiveScheduleId(null);
      setIsEditing(false);
      setMessage("스케줄이 삭제되었습니다.");
      setForm({
        title: "",
        startTime: "",
        repeatInterval: REPEAT_INTERVALS[0],
      });
      await loadScheduleList();
    } catch (err) {
      const message = err instanceof Error ? err.message : "스케줄 삭제에 실패했습니다.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">스케줄</h1>
        <p className="text-muted-foreground">
          API에서 스케줄을 불러와 수정하고 활성 상태를 관리하세요.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="space-y-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">스케줄 목록</CardTitle>
                <CardDescription>/api/schedule 결과를 표로 표시합니다.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end sm:self-start">
                <Button variant="outline" onClick={loadScheduleList} disabled={isListLoading}>
                  {isListLoading ? "새로고침..." : "목록 새로고침"}
                </Button>
                <Button
                  onClick={() => {
                    if (isCreateOpen) {
                      setIsCreateOpen(false);
                      return;
                    }
                    // 생성 폼을 열 때 선택된 스케줄/수정 모드를 모두 해제해 상세 카드가 닫히도록 처리
                    setSchedule(null);
                    setActiveScheduleId(null);
                    setIsEditing(false);
                    setIsCreateOpen(true);
                  }}
                >
                  {isCreateOpen ? "생성 폼 닫기" : "+ 새 스케줄 생성"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">ID</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="w-[120px]">반복</TableHead>
                    <TableHead className="w-[200px]">시작 시간</TableHead>
                    <TableHead className="w-[200px]">최근 실행 시각</TableHead>
                    <TableHead className="w-[110px]">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        {isListLoading ? "불러오는 중..." : "등록된 스케줄이 없습니다."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    scheduleList.map((item) => {
                          const isActiveRow = activeScheduleId === item.id;
                          return (
                            <TableRow
                              key={item.id}
                              className={`hover:bg-muted/50 cursor-pointer ${isActiveRow ? "bg-muted/60" : ""}`}
                              onClick={() => {
                                setIsEditing(false);
                                loadSchedule(item.id, { shouldScroll: true, overwriteForm: true });
                              }}
                            >
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.repeatInterval}</TableCell>
                          <TableCell>{formatDateTime(item.startTime)}</TableCell>
                          <TableCell>{formatDateTime(item.lastExecutedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={item.isActive}
                                onCheckedChange={() => toggleActive(item.id)}
                                disabled={togglingId === item.id}
                                aria-label="스케줄 활성/비활성 토글"
                              />
                              <Badge variant={item.isActive ? "default" : "secondary"}>
                                {item.isActive ? "ON" : "OFF"}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        {isCreateOpen && (
          <Card className="lg:col-span-3 border-dashed">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">새 스케줄 생성</CardTitle>
                <CardDescription>제목, 반복 주기, 시작 시간을 입력해 새 스케줄을 추가하세요.</CardDescription>
              </div>
              <Badge variant="outline">신규 등록</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="newTitle">제목</Label>
                    <div className="outline-input">
                      <Input
                        id="newTitle"
                        value={createForm.title}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="스케줄 제목"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newRepeat">반복 주기</Label>
                    <div className="outline-input">
                      <Select
                        value={createForm.repeatInterval}
                        onValueChange={(value: string) => setCreateForm((prev) => ({ ...prev, repeatInterval: value }))}
                      >
                        <SelectTrigger id="newRepeat">
                          <SelectValue placeholder="반복 주기 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {REPEAT_INTERVALS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newStart">시작 시간</Label>
                    <div className="outline-input w-full">
                      <Input
                        id="newStart"
                        type="datetime-local"
                        value={createForm.startTime}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, startTime: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? "생성 중..." : "등록"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateForm({
                        title: "",
                        startTime: "",
                        repeatInterval: REPEAT_INTERVALS[0],
                      });
                      setIsCreateOpen(false);
                    }}
                    disabled={isCreating}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {schedule && (
          <Card className="lg:col-span-3" ref={editSectionRef}>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? "활성" : "비활성"}
                    </Badge>
                    <Badge variant="outline">ID {schedule.id}</Badge>
                  </div>
                  <CardTitle className="text-xl">스케줄 정보 · 수정</CardTitle>
                  <CardDescription>선택한 스케줄의 상태와 수정 영역을 한눈에 확인하세요.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoTile label="반복 주기" value={schedule.repeatInterval} />
                <InfoTile label="시작 시간" value={formatDateTime(schedule.startTime)} highlight />
                <InfoTile label="최근 실행 시각" value={formatDateTime(schedule.lastExecutedAt)} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">상세 기록</h3>
                    <Badge variant="outline">읽기</Badge>
                  </div>
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <InfoRow label="반복" value={schedule.repeatInterval} />
                    <InfoRow label="시작 시간" value={formatDateTime(schedule.startTime)} />
                    <InfoRow label="최근 실행 시각" value={formatDateTime(schedule.lastExecutedAt)} />
                    <InfoRow label="생성일" value={formatDateTime(schedule.createdAt)} />
                    <InfoRow label="업데이트" value={formatDateTime(schedule.updatedAt)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">수정</h3>
                      <p className="text-xs text-muted-foreground">필드를 수정한 뒤 저장을 누르세요.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!isEditing && (
                        <Button
                          type="button"
                          onClick={() => {
                            if (!schedule) return;
                            setForm({
                              title: schedule.title ?? "",
                              startTime: toLocalInputValue(schedule.startTime),
                              repeatInterval: REPEAT_INTERVALS.includes(schedule.repeatInterval)
                                ? schedule.repeatInterval
                                : REPEAT_INTERVALS[0],
                            });
                            setIsEditing(true);
                          }}
                          disabled={!schedule}
                        >
                          수정
                        </Button>
                      )}
                      {isEditing && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (!schedule) return;
                            setForm({
                              title: schedule.title ?? "",
                              startTime: toLocalInputValue(schedule.startTime),
                              repeatInterval: REPEAT_INTERVALS.includes(schedule.repeatInterval)
                                ? schedule.repeatInterval
                                : REPEAT_INTERVALS[0],
                            });
                            setIsEditing(false);
                          }}
                        >
                          취소
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
                    <div className="space-y-2">
                      <Label htmlFor="title">제목</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="스케줄 제목"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="repeatInterval">반복 주기</Label>
                      <Select
                        value={form.repeatInterval}
                        onValueChange={(value: ScheduleForm["repeatInterval"]) =>
                          setForm((prev) => ({ ...prev, repeatInterval: value }))
                        }
                        disabled={!isEditing}
                      >
                        <SelectTrigger id="repeatInterval">
                          <SelectValue placeholder="반복 주기 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {REPEAT_INTERVALS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">시작 시간</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={form.startTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    {!isEditing && (
                      <p className="text-xs text-muted-foreground">
                        상단의 &quot;수정&quot; 버튼을 눌러 편집 모드로 전환하세요.
                      </p>
                    )}

                    {isEditing && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button onClick={handleSave} disabled={isSaving || isLoading || !activeScheduleId}>
                          {isSaving ? "저장 중..." : "저장"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isDeleting || isLoading || !activeScheduleId}
                        >
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-muted-foreground/20 bg-muted/30"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  const displayValue = value === null || value === undefined || value === "" ? "-" : value;
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground break-words">{displayValue}</span>
    </div>
  );
}
