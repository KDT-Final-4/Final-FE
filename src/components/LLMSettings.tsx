import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Eye, EyeOff, Save } from 'lucide-react';
import { api } from '@/lib/api';

export function LLMSettings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<boolean>(true);
  const [maxTokens, setMaxTokens] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [llmId, setLlmId] = useState<number | null>(null);
  // legacy fields kept for UI coherence
  const [targetLength, setTargetLength] = useState('1200');
  const [autoImage, setAutoImage] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(
    `당신은 전문 마케팅 콘텐츠 작성자입니다. 다음 가이드라인을 따라 블로그 글을 작성하세요:

1. SEO 최적화: 키워드를 자연스럽게 본문에 3-5회 포함
2. 구조화: 제목, 소제목, 본문으로 명확히 구분
3. 가독성: 문단은 3-4줄 이내로 작성
4. 톤앤매너: 친근하고 유익한 정보 제공 스타일
5. 목표 글자 수: {target_length}자 이상

제품 정보:
- 제품명: {product_name}
- 상세정보: {product_info}

키워드: {keyword}

위 정보를 바탕으로 매력적인 마케팅 블로그 글을 작성해주세요.`
  );

  type LlmSetting = {
    id: number;
    userId: number;
    name: string;
    modelName: string;
    status: boolean;
    maxTokens: number;
    temperature: number;
    prompt: string;
    apiKey: string;
    createdAt: string;
    updatedAt: string;
  };

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    api
      .get<LlmSetting>('/setting/llm')
      .then((res) => {
        if (ignore) return;
        setLlmId(typeof res.id === 'number' ? res.id : null);
        setName(res.name || '');
        setModel(res.modelName || '');
        setStatus(!!res.status);
        setMaxTokens(res.maxTokens ?? 0);
        setTemperature(res.temperature ?? 0);
        if (res.prompt) setSystemPrompt(res.prompt);
        // apiKey는 보안상 빈 문자열일 수 있음
        setApiKey(res.apiKey || '');
      })
      .catch((e: any) => {
        if (ignore) return;
        setError(e?.message || 'LLM 설정을 불러오지 못했습니다');
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
      const ok = window.confirm('설정을 저장하시겠습니까?');
      if (!ok) return;
      setSaving(true);
      setMsg(null);
      setError(null);
      const payload = {
        name,
        modelName: model,
        apiKey,
        status,
        maxTokens,
        temperature,
        prompt: systemPrompt,
      };
      const saved = llmId
        ? await api.put<LlmSetting>('/setting/llm', payload)
        : await api.post<LlmSetting>('/setting/llm', payload);
      // reflect saved state
      setLlmId(typeof saved.id === 'number' ? saved.id : llmId);
      setMsg('설정이 저장되었습니다.');
      alert('설정이 저장되었습니다.');
    } catch (e: any) {
      const message = e?.message || '설정 저장에 실패했습니다';
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">LLM 설정</h1>
        <p className="text-gray-600">AI 모델과 프롬프트를 설정하여 콘텐츠 생성 방식을 커스터마이징하세요</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {loading && <div className="text-gray-500">불러오는 중...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {msg && <div className="text-green-600">{msg}</div>}
        {/* API Key */}
        <Card>
          <CardHeader>
            <CardTitle>OpenAI API 키</CardTitle>
            <CardDescription>콘텐츠 생성에 사용할 OpenAI API 키를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-proj-..."
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-gray-500">API 키는 암호화되어 안전하게 저장됩니다</p>
            </div>
          </CardContent>
        </Card>

        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle>모델 선택</CardTitle>
            <CardDescription>콘텐츠 생성에 사용할 GPT 모델을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">GPT 모델</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (빠르고 경제적)</SelectItem>
                  <SelectItem value="gpt-4">GPT-4 (고품질, 권장)</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo (최신 모델)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-gray-500">GPT-4는 더 높은 품질의 콘텐츠를 생성하지만 비용이 더 높습니다</p>
            </div>
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle>콘텐츠 설정</CardTitle>
            <CardDescription>생성될 콘텐츠의 기본 설정을 지정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">설정 이름</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 기본 LLM 설정"
              />
            </div>
            {/* Base URL removed per backend spec */}
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                placeholder="0.0"
              />
            </div>
            {/* Top P removed per backend spec */}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>활성화</Label>
                <p className="text-gray-500">LLM 설정을 사용 가능 상태로 유지합니다</p>
              </div>
              <Switch checked={status} onCheckedChange={setStatus} />
            </div>
          </CardContent>
        </Card>

        {/* System Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 프롬프트</CardTitle>
            <CardDescription>AI의 글쓰기 스타일과 규칙을 정의하는 프롬프트입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-prompt">프롬프트 템플릿</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={15}
                className="font-mono"
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-900 mb-2">사용 가능한 변수</h4>
                <div className="space-y-1 text-blue-700">
                  <div><code className="bg-blue-100 px-2 py-1 rounded">{'{keyword}'}</code> - 트렌드 키워드</div>
                  <div><code className="bg-blue-100 px-2 py-1 rounded">{'{product_name}'}</code> - 제품명</div>
                  <div><code className="bg-blue-100 px-2 py-1 rounded">{'{product_info}'}</code> - 제품 상세정보</div>
                  <div><code className="bg-blue-100 px-2 py-1 rounded">{'{target_length}'}</code> - 목표 글자 수</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            설정 저장
          </Button>
        </div>
      </div>
    </div>
  );
}
