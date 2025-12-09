import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';

interface NotificationSettingResponse {
  id: number;
  userId: number;
  channelId: number;
  webhookUrl: string | null;
  apiToken: string | null;
  isActive: boolean;
  createdAt: string;
}

interface NotificationUpdatePayload {
  channelId: number;
  webhookUrl: string;
  apiToken: string;
  isActive: boolean;
}

export function NotificationSettings() {
  const [notificationId, setNotificationId] = useState<number | null>(null);
  const [channelId, setChannelId] = useState<number>(1);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [apiToken, setApiToken] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizeCredentials = (channel: number, webhook: string, token: string) => {
    if (channel === 1) {
      return { webhook: '', token: '' };
    }
    if (channel === 2) {
      return { webhook, token: '' };
    }
    return { webhook, token };
  };

  const loadNotification = useCallback(async () => {
    try {
      setFetchError(null);
      setSuccessMessage(null);
      setInitialLoading(true);
      const data = await api.get<NotificationSettingResponse>('/setting/notification');
      setNotificationId(data.id ?? null);
      const nextChannel = typeof data.channelId === 'number' ? data.channelId : 1;
      const normalized = normalizeCredentials(nextChannel, data.webhookUrl ?? '', data.apiToken ?? '');
      setChannelId(nextChannel);
      setWebhookUrl(normalized.webhook);
      setApiToken(normalized.token);
      setIsActive(Boolean(data.isActive));
    } catch (err: any) {
      setFetchError(err?.message || '알림 설정을 불러오지 못했습니다');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotification();
  }, [loadNotification]);

  const handleChannelChange = (value: string) => {
    const nextChannel = parseInt(value, 10);
    const normalized = normalizeCredentials(nextChannel, webhookUrl, apiToken);
    setChannelId(nextChannel);
    setWebhookUrl(normalized.webhook);
    setApiToken(normalized.token);
  };

  const handleSave = async () => {
    if (notificationId == null) {
      setSaveError('알림 설정 ID를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSuccessMessage(null);
      const normalizedForPayload = normalizeCredentials(channelId, webhookUrl, apiToken);
      const payload: NotificationUpdatePayload = {
        channelId,
        webhookUrl: normalizedForPayload.webhook,
        apiToken: normalizedForPayload.token,
        isActive,
      };
      const res = await api.put<NotificationSettingResponse>(`/setting/notification/${notificationId}`, payload);
      const updatedChannel = typeof res.channelId === 'number' ? res.channelId : channelId;
      const normalizedAfterSave = normalizeCredentials(
        updatedChannel,
        res.webhookUrl ?? normalizedForPayload.webhook,
        res.apiToken ?? normalizedForPayload.token,
      );
      setChannelId(updatedChannel);
      setWebhookUrl(normalizedAfterSave.webhook);
      setApiToken(normalizedAfterSave.token);
      setIsActive(Boolean(res.isActive));
      setSuccessMessage('알림 설정이 저장되었습니다.');
    } catch (err: any) {
      setSaveError(err?.message || '알림 설정 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const isEmailEnabled = channelId === 1;
  const isSlackEnabled = channelId === 2;
  const needsApiTokenInput = channelId !== 1 && channelId !== 2;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">알림 설정</h1>
          <p className="text-gray-600">시스템 이벤트에 대한 알림을 설정하세요</p>
          {fetchError && <p className="text-sm text-red-600 mt-2">{fetchError}</p>}
          {successMessage && <p className="text-sm text-green-600 mt-2">{successMessage}</p>}
          {saveError && <p className="text-sm text-red-600 mt-2">{saveError}</p>}
          {initialLoading && !fetchError && <p className="text-sm text-gray-500 mt-2">설정을 불러오는 중...</p>}
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>알림 채널</CardTitle>
            <CardDescription>알림을 받을 채널과 인증 정보를 선택하세요</CardDescription>
            <div className="flex justify-end mt-4">
              <div className="flex items-center gap-3">
                <span className="text-gray-700">알림 활성화</span>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={initialLoading || saving}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-channel">알림 채널</Label>
              <Select
                value={String(channelId)}
                onValueChange={handleChannelChange}
                disabled={initialLoading || saving}
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

            {needsApiTokenInput && (
              <div className="space-y-2">
                <Label htmlFor="api-token">API 토큰</Label>
                <Input
                  id="api-token"
                  type="text"
                  value={apiToken}
                  onChange={(event) => setApiToken(event.target.value)}
                  placeholder="알림 발송에 사용할 API 토큰을 입력하세요"
                  disabled={initialLoading || saving}
                />
              </div>
            )}

            {isSlackEnabled && (
              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  type="text"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  disabled={initialLoading || saving}
                />
                <p className="text-sm text-gray-500">Slack Incoming Webhook URL을 입력하세요</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={initialLoading || saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}
