import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Car } from "lucide-react";

type LlmSetting = {
  id: number | null;
  userId: number | null;
  name: string;
  modelName: string;
  apiKey: string;
  status: boolean;
  maxTokens: number;
  temperature: number;
  prompt: string;
  generationType: string;
};

type ScheduleItem = {
  id: number | null;
  userId: number | null;
  maxDailyRuns: number;
  retryOnFail: number;
  isRun: boolean;
};

const MODEL_OPTIONS: Record<string, string[]> = {
  OpenAI: ["gpt-4o-mini", "gpt-4o", "gpt-5", "gpt-3.5-turbo"],
  Upstage: ["solar-1-mini-chat", "solar-1-embed", "solar-1-mini", "solar-1"],
};

const normalizeProvider = (name?: string | null) => {
  if (!name) return "OpenAI";
  const matched = Object.keys(MODEL_OPTIONS).find((key) => key.toLowerCase() === String(name).toLowerCase());
  return matched ?? "OpenAI";
};

export function ConfigurationPage() {
  const [llmSetting, setLlmSetting] = useState<LlmSetting>({
    id: null,
    userId: null,
    name: "OpenAI",
    modelName: MODEL_OPTIONS["OpenAI"][0],
    apiKey: "",
    status: true,
    maxTokens: 0,
    temperature: 0,
    prompt: "",
    generationType: "AUTO",
  });
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmSaving, setLlmSaving] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmSaved, setLlmSaved] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleItem>({
    id: null,
    userId: null,
    maxDailyRuns: 0,
    retryOnFail: 0,
    isRun: true,
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  useEffect(() => {
    const fetchLlmSetting = async () => {
      setLlmLoading(true);
      setLlmError(null);
      try {
        const response = await fetch("/api/setting/llm");
        if (!response.ok) throw new Error("LLM 설정을 불러오지 못했습니다.");
        const data = await response.json();
        const provider = normalizeProvider(data.name);
        const providerModels = MODEL_OPTIONS[provider] || [];
        setLlmSetting({
          id: data.id ?? null,
          userId: data.userId ?? null,
          name: provider,
          modelName: providerModels.includes(data.modelName) ? data.modelName : providerModels[0] ?? "",
          apiKey: data.apiKey ?? "",
          status: Boolean(data.status),
          maxTokens: Number.isFinite(Number(data.maxTokens)) ? Number(data.maxTokens) : 0,
          temperature: Number.isFinite(Number(data.temperature)) ? Number(data.temperature) : 0,
          prompt: data.prompt ?? "",
          generationType: data.generationType ?? "AUTO",
        });
      } catch (error) {
        setLlmError(error instanceof Error ? error.message : "LLM 설정을 불러오지 못했습니다.");
      } finally {
        setLlmLoading(false);
      }
    };

    fetchLlmSetting();
  }, []);

  useEffect(() => {
    const fetchScheduleSetting = async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const response = await fetch("/api/setting/schedule");
        if (!response.ok) throw new Error("스케줄 설정을 불러오지 못했습니다.");
        const data = await response.json();
        setSchedule({
          id: data.id ?? null,
          userId: data.userId ?? null,
          maxDailyRuns: Number.isFinite(Number(data.maxDailyRuns)) ? Number(data.maxDailyRuns) : 0,
          retryOnFail: Number.isFinite(Number(data.retryOnFail)) ? Number(data.retryOnFail) : 0,
          isRun: "isRun" in data ? Boolean(data.isRun) : Boolean(data.isRun),
        });
      } catch (error) {
        setScheduleError(error instanceof Error ? error.message : "스케줄 설정을 불러오지 못했습니다.");
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchScheduleSetting();
  }, []);

  const saveLlmSetting = async () => {
    setLlmSaving(true);
    setLlmSaved(false);
    setLlmError(null);
    try {
      const method = llmSetting.id ? "PUT" : "POST";
      const response = await fetch("/api/setting/llm", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: llmSetting.name,
          modelName: llmSetting.modelName,
          apiKey: llmSetting.apiKey,
          status: llmSetting.status,
          maxTokens: llmSetting.maxTokens,
          temperature: llmSetting.temperature,
          prompt: llmSetting.prompt,
          generationType: llmSetting.generationType || "AUTO",
        }),
      });
      if (!response.ok) throw new Error("LLM 설정 저장에 실패했습니다.");
      const data = await response.json();
      setLlmSetting({
        id: data.id ?? llmSetting.id ?? null,
        userId: data.userId ?? llmSetting.userId ?? null,
        name: data.name ?? "",
        modelName: data.modelName ?? "",
        apiKey: data.apiKey ?? "",
        status: Boolean(data.status),
        maxTokens: Number.isFinite(Number(data.maxTokens)) ? Number(data.maxTokens) : llmSetting.maxTokens,
        temperature: Number.isFinite(Number(data.temperature)) ? Number(data.temperature) : llmSetting.temperature,
        prompt: data.prompt ?? "",
        generationType: data.generationType ?? llmSetting.generationType ?? "AUTO",
      });
      setLlmSaved(true);
    } catch (error) {
      setLlmError(error instanceof Error ? error.message : "LLM 설정 저장에 실패했습니다.");
    } finally {
      setLlmSaving(false);
    }
  };

  const saveScheduleSetting = async () => {
    if (schedule.id === null || schedule.id === undefined) {
      setScheduleError("스케줄 ID가 없어 저장할 수 없습니다. 먼저 설정을 불러오세요.");
      return;
    }
    setScheduleSaving(true);
    setScheduleSaved(false);
    setScheduleError(null);
    try {
      const response = await fetch(`/api/setting/schedule/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxDailyRuns: schedule.maxDailyRuns,
          retryOnFail: schedule.retryOnFail,
          isRun: schedule.isRun,
        }),
      });
      if (!response.ok) throw new Error("스케줄 설정 저장에 실패했습니다.");
      const data = await response.json();
      setSchedule({
        id: data.id ?? schedule.id,
        userId: data.userId ?? schedule.userId ?? null,
        maxDailyRuns: Number.isFinite(Number(data.maxDailyRuns)) ? Number(data.maxDailyRuns) : schedule.maxDailyRuns,
        retryOnFail: Number.isFinite(Number(data.retryOnFail)) ? Number(data.retryOnFail) : schedule.retryOnFail,
        isRun: "isRun" in data ? Boolean(data.isRun) : Boolean(data.isRun),
      });
      setScheduleSaved(true);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : "스케줄 설정 저장에 실패했습니다.");
    } finally {
      setScheduleSaving(false);
    }
  };

  const providerKey = MODEL_OPTIONS[llmSetting.name] ? llmSetting.name : "OpenAI";
  const modelOptions = MODEL_OPTIONS[providerKey] || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">설정</h1>
        <p className="text-muted-foreground mt-2">
          LLM, 스케줄, 알림 설정을 관리하세요.
        </p>
      </div>

      <Tabs defaultValue="llm" className="w-full">
          <TabsList className="bg-muted">
            <TabsTrigger value="llm">LLM</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="notification">Notification</TabsTrigger>
          </TabsList>

        <TabsContent value="llm" className="pt-4">
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {/* Model */}
          <Card>
            <CardHeader>
               <CardTitle>Model 설정</CardTitle>
               <CardDescription>LLM 모델을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-name">AI 회사</Label>
                  <div className="outline-input">
                    <select
                      id="llm-name"
                      className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                      value={providerKey}
                      onChange={(e) => {
                        const provider = normalizeProvider(e.target.value);
                        const providerModels = MODEL_OPTIONS[provider] || [];
                        setLlmSetting((prev) => ({
                          ...prev,
                          name: provider,
                          modelName: providerModels.includes(prev.modelName)
                            ? prev.modelName
                            : providerModels[0] ?? "",
                        }));
                      }}
                    >
                      <option value="OpenAI">OpenAI</option>
                      <option value="Upstage">Upstage</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <div className="outline-input">
                    <select
                      id="model"
                      className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                      value={modelOptions.includes(llmSetting.modelName) ? llmSetting.modelName : modelOptions[0] ?? ""}
                      onChange={(e) => setLlmSetting((prev) => ({ ...prev, modelName: e.target.value }))}
                    >
                      {modelOptions.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* detail */}
          <Card>
            <CardHeader>
              <CardTitle>상세 설정</CardTitle>
              <CardDescription>LLM 상세 설정을 구성합니다.</CardDescription>
            </CardHeader>
            <CardContent>
             <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <div className="outline-input">
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={llmSetting.temperature}
                      onChange={(e) =>
                        setLlmSetting((prev) => ({
                          ...prev,
                          temperature: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0,
                        }))
                      }
                      placeholder="0.7"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <div className="outline-input">
                    <Input
                      id="maxTokens"
                      type="number"
                      value={llmSetting.maxTokens}
                      onChange={(e) =>
                        setLlmSetting((prev) => ({
                          ...prev,
                          maxTokens: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0,
                        }))
                      }
                      placeholder="2048"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="outline-input">
                  <Input
                    id="apiKey"
                    type="password"
                    value={llmSetting.apiKey}
                    onChange={(e) => setLlmSetting((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="••••••••••"
                  />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">프롬프트</Label>
                <div className="outline-input">
                  <Textarea
                  id="prompt"
                  rows={4}
                  value={llmSetting.prompt}
                  onChange={(e) => setLlmSetting((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder="모델이 따라야 할 기본 프롬프트를 입력하세요."
                />
                </div>
              </div>
            </div> 
            </CardContent>
          </Card>
          </div>
          
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {/* 업로드 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>업로드 설정</CardTitle>
                <CardDescription>자동/수동 업로드를 설정합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="generationType">업로드 타입 설정</Label>
                      <div className="outline-input">
                        <select
                          id="generationType"
                          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                          value={llmSetting.generationType}
                          onChange={(e) =>
                            setLlmSetting((prev) => ({ ...prev, generationType: e.target.value }))
                          }
                        >
                          <option value="AUTO">AUTO</option>
                          <option value="MANUAL">MANUAL</option>
                        </select>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
            {/* 설정 활성화 */}
            <Card>
              <CardHeader>
                <CardTitle>설정 활성화</CardTitle>
                <CardDescription>LLM 설정을 활성화합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="block">실시간 생성 활성화</Label>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">상태</p>
                        <p className="text-sm text-muted-foreground">LLM 호출 여부를 토글합니다.</p>
                      </div>
                      <Switch
                        checked={llmSetting.status}
                        onCheckedChange={(checked) => setLlmSetting((prev) => ({ ...prev, status: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-6 flex items-center justify-between">
            {llmError && <p className="text-sm text-destructive">{llmError}</p>}
            {llmLoading && <p className="text-sm text-muted-foreground">LLM 설정을 불러오는 중...</p>}
            {llmSaved && !llmError && <p className="text-sm text-emerald-600">LLM 설정이 저장되었습니다.</p>}

            <Button className="w-full" onClick={saveLlmSetting} disabled={llmSaving || llmLoading}>
              {llmSaving ? "저장 중..." : "LLM 설정 저장"}
            </Button>
          </div>
        </TabsContent>
        {/* ㄴ */}
        <TabsContent value="schedule" className="pt-4">
           <div className="flex items-center justify-between rounded-lg border p-3">
                {scheduleError && <p className="text-sm text-destructive">{scheduleError}</p>}
                {scheduleLoading && <p className="text-sm text-muted-foreground">스케줄 설정을 불러오는 중...</p>}
                {scheduleSaved && !scheduleError && <p className="text-sm text-emerald-600">스케줄 설정이 저장되었습니다.</p>}

                <Button className="w-full" onClick={saveScheduleSetting} disabled={scheduleSaving || scheduleLoading || schedule.id === null}>
                  {scheduleSaving ? "저장 중..." : "스케줄 설정 저장"}
                </Button>
              </div>
          <Card>
            <CardHeader>
              <CardTitle>스케줄 설정</CardTitle>
              <CardDescription>배치 실행 시간과 주기를 제어합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxDailyRuns">하루 최대 실행 횟수</Label>
                  <div className="outline-input">
                    <Input
                      id="maxDailyRuns"
                      type="number"
                      value={schedule.maxDailyRuns}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          maxDailyRuns: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0,
                        }))
                      }
                      placeholder="예: 5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retryOnFail">실패 시 재시도 횟수</Label>
                  <div className="outline-input">
                    <Input
                      id="retryOnFail"
                      type="number"
                      value={schedule.retryOnFail}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          retryOnFail: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0,
                        }))
                      }
                      placeholder="예: 3"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">실행 여부</p>
                  <p className="text-sm text-muted-foreground">스케줄 실행을 활성화/비활성화합니다.</p>
                </div>
                 <Switch checked={schedule.isRun} onCheckedChange={(checked) => setSchedule((prev) => ({ ...prev, isRun: checked }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>이메일 및 웹훅 알림을 구성합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일 수신자</Label>
                <Input id="email" type="email" placeholder="alert@company.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook URL</Label>
                <Input id="webhook" type="url" placeholder="https://hooks.slack.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">알림 규칙</Label>
                <Textarea
                  id="rules"
                  rows={4}
                  placeholder="예) 에러 발생 시 알림, 매일 09:00 요약 전송 등"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">이메일 알림</p>
                    <p className="text-sm text-muted-foreground">중요 이벤트를 이메일로 전달합니다.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">실시간 웹훅</p>
                    <p className="text-sm text-muted-foreground">웹훅으로 즉시 알림을 보냅니다.</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button className="w-full">알림 설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
