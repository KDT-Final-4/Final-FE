import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Eye, EyeOff, Save } from 'lucide-react';

export function LLMSettings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('sk-proj-xxxxxxxxxxxxxxxxxxxx');
  const [model, setModel] = useState('gpt-4');
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

  const handleSave = () => {
    alert('LLM 설정이 저장되었습니다.');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">LLM 설정</h1>
        <p className="text-gray-600">AI 모델과 프롬프트를 설정하여 콘텐츠 생성 방식을 커스터마이징하세요</p>
      </div>

      <div className="space-y-6 max-w-4xl">
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
              <Label htmlFor="target-length">목표 글자 수</Label>
              <Input
                id="target-length"
                type="number"
                value={targetLength}
                onChange={(e) => setTargetLength(e.target.value)}
                placeholder="1200"
              />
              <p className="text-gray-500">AI가 작성할 콘텐츠의 목표 글자 수입니다 (공백 포함)</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>이미지 자동 삽입</Label>
                <p className="text-gray-500">Unsplash에서 관련 이미지를 자동으로 검색하여 삽입</p>
              </div>
              <Switch checked={autoImage} onCheckedChange={setAutoImage} />
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
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            설정 저장
          </Button>
        </div>
      </div>
    </div>
  );
}
