import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Save, Bell, AlertCircle, CheckCircle, Clock, MessageSquare, Mail } from 'lucide-react';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
}

interface NotificationChannel {
  id: string;
  name: string;
  icon: any;
  description: string;
  enabled: boolean;
}

export function NotificationSettings() {
  const [slackWebhook, setSlackWebhook] = useState('');
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      description: '시스템 이메일로 알림을 받습니다',
      enabled: true,
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: MessageSquare,
      description: 'Slack 채널로 실시간 알림을 받습니다',
      enabled: false,
    },
  ]);
  
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

  const handleToggle = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
    ));
  };

  const handleChannelToggle = (id: string) => {
    setChannels(channels.map(channel => 
      channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
    ));
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

  const isSlackEnabled = channels.find(c => c.id === 'slack')?.enabled || false;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">알림 설정</h1>
        <p className="text-gray-600">시스템 이벤트에 대한 알림을 설정하세요</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle>알림 채널</CardTitle>
            <CardDescription>알림을 받을 채널을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div key={channel.id}>
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        channel.enabled ? 'bg-blue-50' : 'bg-gray-50'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          channel.enabled ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">{channel.name}</h4>
                        <p className="text-gray-600">{channel.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => handleChannelToggle(channel.id)}
                    />
                  </div>
                  
                  {/* Slack Webhook Input */}
                  {channel.id === 'slack' && channel.enabled && (
                    <div className="mt-3 ml-4 space-y-2">
                      <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="slack-webhook"
                          type="text"
                          value={slackWebhook}
                          onChange={(e) => setSlackWebhook(e.target.value)}
                          placeholder="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
                          className="flex-1"
                        />
                        <Button variant="outline" onClick={handleTestSlack}>
                          테스트 발송
                        </Button>
                      </div>
                      <p className="text-gray-500">Slack Incoming Webhook URL을 입력하세요</p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
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
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      notif.enabled ? 'bg-blue-50' : 'bg-gray-50'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        notif.enabled ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 mb-1">{notif.title}</h4>
                      <p className="text-gray-600">{notif.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notif.enabled}
                    onCheckedChange={() => handleToggle(notif.id)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Notification Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>알림 스케줄</CardTitle>
            <CardDescription>일일 리포트 발송 시간을 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-time">리포트 발송 시간</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="report-time"
                  type="time"
                  defaultValue="09:00"
                  className="w-40"
                />
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
        </Card>

        {/* Advanced Settings */}
        <Card>
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
