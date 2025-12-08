import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Save, Bell, AlertCircle, CheckCircle, Clock, MessageSquare, Mail } from 'lucide-react';
import { api } from '@/lib/api';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
}

interface NotificationSettingResponse {
  id: number;
  userId: number;
  channelId: number;
  webhookUrl: string | null;
  apiToken: string | null;
  isActive: boolean;
  createdAt: string;
}

export function NotificationSettings() {
  const [slackWebhook, setSlackWebhook] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'error',
      title: '오류 발생',
      description: '크롤링 실패, API 토큰 만료, 생성 실패 등의 오류 발생 시 즉시 알림',
      icon: AlertCircle,
      enabled: true,
    },
    {
      id: 'review',
      title: '검수 대기',
      description: 'AI가 콘텐츠 생성을 완료하여 사람의 검수가 필요할 때 알림',
      icon: Bell,
      enabled: true,
    },
    {
      id: 'complete',
      title: '작업 완료',
      description: '콘텐츠가 성공적으로 블로그에 발행되었을 때 알림',
      icon: CheckCircle,
      enabled: false,
    },
    {
      id: 'daily',
      title: '일일 리포트',
      description: '매일 오전 9시에 전일 성과 요약 리포트 자동 발송 (Cron Job)',
      icon: Clock,
      enabled: true,
    },
  ]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await api.get<NotificationSettingResponse>('/setting/notification');
        if (ignore) return;
        setSelectedChannel(typeof data.channelId === 'number' ? data.channelId : 1);
        setSlackWebhook(data.webhookUrl ?? '');
        setIsActive(Boolean(data.isActive));
      } catch (err: any) {
        if (!ignore) {
          setFetchError(err?.message || '알림 설정을 불러오지 못했습니다');
        }
      } finally {
        if (!ignore) setInitialLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggle = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, enabled: !notif.enabled } : notif)),
    );
  };

  const handleSave = () => {
    alert('알림 설정이 저장되었습니다.');
  };

  const handleTestSlack = () => {
    if (!slackWebhook) {
      alert('Slack Webhook URL을 입력해주세요.');
      return;
    }
    alert('Slack 채널로 테스트 메시지를 발송했습니다.');
  };

  const isSlackEnabled = selectedChannel === 2;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">알림 설정</h1>
          <p className="text-gray-600">시스템 이벤트에 대한 알림을 설정하세요</p>
          {fetchError && <p className="text-sm text-red-600 mt-2">{fetchError}</p>}
          {initialLoading && !fetchError && <p className="text-sm text-gray-500 mt-2">설정을 불러오는 중...</p>}
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle>알림 채널</CardTitle>
            <CardDescription>알림을 받을 채널을 선택하세요</CardDescription>
            <div className="flex justify-end mt-4">
              <div className="flex items-center gap-3">
                <span className="text-gray-700">알림 활성화</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} disabled={initialLoading} />
              </div>
            </div> 
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-channel">알림 채널</Label>
              <Select
                value={String(selectedChannel)}
                onValueChange={(v: string) => setSelectedChannel(parseInt(v, 10))}
                disabled={initialLoading}
              >
                <SelectTrigger id="notification-channel">
                  <SelectValue placeholder="채널을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Email</SelectItem>
                  <SelectItem value="2">Slack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Slack Webhook Input */}
            {isSlackEnabled && (
              <div className="mt-1 space-y-2">
                <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="slack-webhook"
                    type="text"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
                    className="flex-1"
                    disabled={initialLoading}
                  />
                  <Button variant="outline" onClick={handleTestSlack} disabled={initialLoading}>
                    테스트 발송
                  </Button>
                </div>
                <p className="text-gray-500">Slack Incoming Webhook URL을 입력하세요</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Types */}
        {/* <Card>
          <CardHeader>
            <CardTitle>알림 유형</CardTitle>
            <CardDescription>받고 싶은 알림 유형을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        notif.enabled ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${notif.enabled ? 'text-blue-600' : 'text-gray-400'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 mb-1">{notif.title}</h4>
                      <p className="text-gray-600">{notif.description}</p>
                    </div>
                  </div>
                  <Switch checked={notif.enabled} onCheckedChange={() => handleToggle(notif.id)} />
                </div>
              );
            })}
          </CardContent>
        </Card> */}

        {/* Notification Schedule */}
        {/* <Card>
          <CardHeader>
            <CardTitle>알림 스케줄</CardTitle>
            <CardDescription>일일 리포트 발송 시간을 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-time">리포트 발송 시간</Label>
              <div className="flex items-center gap-4">
                <Input id="report-time" type="time" defaultValue="09:00" className="w-40" />
                <span className="text-gray-500">매일 지정된 시간에 자동 발송됩니다</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 mb-2">일일 리포트 포함 내용</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>전일 생성된 콘텐츠 수</li>
                <li>총 조회수 및 전주 대비 증감</li>
                <li>총 클릭수 및 평균 CTR</li>
                <li>발생한 오류 및 경고 사항</li>
                <li>검수 대기 중인 콘텐츠 수</li>
              </ul>
            </div>
          </CardContent>
        </Card> */}

        {/* Advanced Settings */}
        {/* <Card>
          <CardHeader>
            <CardTitle>고급 설정</CardTitle>
            <CardDescription>알림 발송 방식에 대한 세부 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>알림 그룹화</Label>
                <p className="text-gray-500">짧은 시간에 여러 알림이 발생하면 하나로 묶어서 발송</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>야간 알림 차단</Label>
                <p className="text-gray-500">오후 10시 ~ 오전 8시 사이의 알림을 다음날 아침에 발송</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card> */}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={initialLoading}>
            <Save className="w-4 h-4 mr-2" />
            설정 저장
          </Button>
        </div>
        
      </div>
    </div>
  );
}
