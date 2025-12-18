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
import { apiFetch } from "../../apiClient";

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

const REPEAT_INTERVALS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ONCE"] as const;

const REPEAT_LABELS: Record<string, string> = {
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
  YEARLY: "매년",
  ONCE: "한 번",
};

const KST_TIME_ZONE = "Asia/Seoul";

const getRepeatLabel = (value?: string) => {
  if (!value) return "-";
  return REPEAT_LABELS[value] ?? value;
};

type DateTimeParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  millisecond: string;
};

const extractServerDateTimeParts = (value?: string | null): DateTimeParts | null => {
  if (!value) return null;
  const sanitized = value.trim().replace(/Z$/, "");
  const match = sanitized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/,
  );
  if (!match) return null;
  const [, year, month, day, hour, minute, second, fraction = "0"] = match;
  const millisecond = fraction.slice(0, 3).padEnd(3, "0");
  return { year, month, day, hour, minute, second, millisecond };
};

const buildDateFromKstParts = (parts: DateTimeParts) =>
  new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) - 9,
      Number(parts.minute),
      Number(parts.second),
      Number(parts.millisecond),
    ),
  );

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parts = extractServerDateTimeParts(value);
  if (!parts) return value;
  const date = buildDateFromKstParts(parts);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: KST_TIME_ZONE,
  }).format(date);
};

const toLocalInputValue = (value?: string | null) => {
  const parts = extractServerDateTimeParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const extractInputDateTimeParts = (value: string): DateTimeParts | null => {
  if (!value) return null;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/,
  );
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "00", fraction = "0"] = match;
  const millisecond = fraction.slice(0, 3).padEnd(3, "0");
  const validationDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(millisecond),
    ),
  );
  if (Number.isNaN(validationDate.getTime())) return null;
  return {
    year,
    month,
    day,
    hour,
    minute,
    second: second.padStart(2, "0"),
    millisecond,
  };
};

const formatInputDateTimeForServer = (value: string) => {
  const parts = extractInputDateTimeParts(value);
  if (!parts) return null;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${parts.millisecond}`;
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
  const [isToggling, setIsToggling] = useState(false);
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
      const { getApiUrl, getApiOptions } = await import("../../utils/api");
      const response = await fetch(getApiUrl("/api/schedule"), getApiOptions({ method: "GET" }));
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
      const { getApiUrl, getApiOptions } = await import("../../utils/api");
      const response = await fetch(getApiUrl(`/api/schedule/${id}`), getApiOptions({ method: "GET" }));
      if (!response.ok) {
        throw new Error(`스케줄을 불러오지 못했습니다. (HTTP ${response.status})`);
      }
      const data: ScheduleResponse = await response.json();
      const normalizedRepeat = REPEAT_INTERVALS.includes(data.repeatInterval as typeof REPEAT_INTERVALS[number])
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
    const formattedStartTime = formatInputDateTimeForServer(createForm.startTime);
    if (!formattedStartTime) {
      setError("시작 시간 형식이 올바르지 않습니다.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setMessage(null);
    try {
      const { getApiUrl, getApiOptions } = await import("../../utils/api");
      const response = await fetch(getApiUrl("/api/schedule"), {
        ...getApiOptions({
          method: "POST",
          body: JSON.stringify({
            title: createForm.title.trim(),
            startTime: parsedStart.toISOString(),
            repeatInterval: createForm.repeatInterval,
          }),
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
          repeatInterval: REPEAT_INTERVALS.includes(data.repeatInterval as typeof REPEAT_INTERVALS[number])
            ? data.repeatInterval
            : REPEAT_INTERVALS[0],
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
    const formattedStartTime = formatInputDateTimeForServer(form.startTime);
    if (!formattedStartTime) {
      setError("시작 시간 형식이 올바르지 않습니다.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { getApiUrl, getApiOptions } = await import("../../utils/api");
      const response = await fetch(getApiUrl(`/api/schedule/${activeScheduleId}`), {
        ...getApiOptions({
          method: "PUT",
          body: JSON.stringify({
            title: form.title.trim(),
            startTime: parsedStart.toISOString(),
            repeatInterval: form.repeatInterval,
          }),
        }),
      });
      if (!response.ok) {
        throw new Error(`스케줄 저장에 실패했습니다. (HTTP ${response.status})`);
      }
      const data: ScheduleResponse = await response.json();
      const normalizedRepeat = REPEAT_INTERVALS.includes(data.repeatInterval as typeof REPEAT_INTERVALS[number])
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

  const toggleActive = async (id?: number | null) => {
    if (!id) {
      setError("먼저 스케줄을 불러와 주세요.");
      return;
    }
    setIsToggling(true);
    setError(null);
    setMessage(null);
    try {
      const { getApiUrl, getApiOptions } = await import("../../utils/api");
      const response = await fetch(getApiUrl(`/api/schedule/active/${id}`), {
        ...getApiOptions({
          method: "PUT",
        }),
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
      setIsToggling(false);
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
      const { getApiUrl, getApiOptions } = await import("../../utils/api");
      const response = await fetch(getApiUrl(`/api/schedule/${activeScheduleId}`), getApiOptions({ method: "DELETE" }));
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
          컨텐츠 자동 배포를 위한 스케줄을 관리하세요.
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
            <div className="flex flex-wrap justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">스케줄 목록</CardTitle>
                <CardDescription>스케줄을 수정하시려면 목록을 클릭해주세요. </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadScheduleList} disabled={isListLoading}>
                  {isListLoading ? "새로고침..." : "목록 새로고침"}
                </Button>
                {!isCreateOpen && (
                  <Button
                    onClick={() => {
                      // 생성 폼을 열 때 선택된 스케줄/수정 모드를 모두 해제해 상세 카드가 닫히도록 처리
                      setSchedule(null);
                      setActiveScheduleId(null);
                      setIsEditing(false);
                      setIsCreateOpen(true);
                    }}
                  >
                    + 새 스케줄 생성
                  </Button>
                )}
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
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
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
                          <TableCell>{getRepeatLabel(item.repeatInterval)}</TableCell>
                          <TableCell>{formatDateTime(item.startTime)}</TableCell>
                          <TableCell>{formatDateTime(item.lastExecutedAt)}</TableCell>
                          <TableCell>
                            <Badge variant={item.isActive ? "default" : "secondary"}>
                              {item.isActive ? "활성" : "비활성"}
                            </Badge>
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
                              {getRepeatLabel(option)}
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
              <div className="flex flex-wrap justify-between gap-4">
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
                <div className="flex items-center gap-3">
                  <Switch
                    id={`schedule-${schedule.id}-active-toggle`}
                    checked={schedule.isActive}
                    disabled={isToggling || isLoading}
                    onCheckedChange={(checked) => {
                      if (checked === schedule.isActive) return;
                      toggleActive(schedule.id);
                    }}
                    aria-label="스케줄 활성화 전환"
                  />
                  <Label htmlFor={`schedule-${schedule.id}-active-toggle`} className="text-sm cursor-pointer">
                    {isToggling ? "변경 중..." : schedule.isActive ? "활성화됨" : "비활성화됨"}
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoTile label="반복 주기" value={getRepeatLabel(schedule.repeatInterval)} />
                <InfoTile label="시작 시간" value={formatDateTime(schedule.startTime)} highlight />
                <InfoTile label="최근 실행 시각" value={formatDateTime(schedule.lastExecutedAt)} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-6">
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
                      {isEditing && (
                        <div className="flex flex-wrap gap-3 pt-2">
                          <Button onClick={handleSave} disabled={isSaving || isLoading || !activeScheduleId}>
                            {isSaving ? "저장 중..." : "저장"}
                          </Button>
                        </div>
                      )}
                       <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isDeleting || isLoading || !activeScheduleId}
                        >
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </Button>
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
                              {getRepeatLabel(option)}
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
