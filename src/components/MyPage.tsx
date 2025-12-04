import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { api } from '@/lib/api';

type Me = {
  userId: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  isDelete: boolean;
};

export function MyPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  function extractErrorMessage(err: any): string | null {
    const body = err?.body;
    if (body) {
      // Common Spring validation shapes
      if (Array.isArray(body.errors)) {
        const msgs = body.errors
          .map((e: any) => e?.defaultMessage || e?.message || e?.detail || e)
          .filter(Boolean);
        if (msgs.length) return msgs.join('\n');
      }
      if (Array.isArray(body.fieldErrors)) {
        const msgs = body.fieldErrors
          .map((e: any) => e?.defaultMessage || e?.message || e)
          .filter(Boolean);
        if (msgs.length) return msgs.join('\n');
      }
      if (body.detail || body.title || body.message) {
        return body.detail || body.title || body.message;
      }
    }
    return err?.message || null;
  }

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    api
      .get<Me>('/user/me')
      .then((res) => {
        if (ignore) return;
        setMe(res);
        setProfileName(res.name || '');
      })
      .catch((e: any) => {
        if (ignore) return;
        setError(e?.message || '사용자 정보를 불러오지 못했습니다');
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">마이페이지</h1>
        <p className="text-gray-600">내 계정 정보를 확인합니다</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>내 정보</CardTitle>
            <CardDescription>계정 기본 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-gray-500">불러오는 중...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && me && (
              <div className="space-y-1 text-gray-800">
                <div><span className="text-gray-500 mr-2">이름</span>{me.name}</div>
                <div><span className="text-gray-500 mr-2">이메일</span>{me.email}</div>
                <div><span className="text-gray-500 mr-2">권한</span>{me.role}</div>
                <div><span className="text-gray-500 mr-2">가입일</span>{me.createdAt}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 프로필 수정 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필 수정</CardTitle>
            <CardDescription>이름을 변경할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">이름</Label>
              <Input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="이름을 입력하세요"
              />
            </div>
            {profileMsg && (
              <div className={profileMsg.startsWith('성공') ? 'text-green-600' : 'text-red-600'}>{profileMsg}</div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  setProfileMsg(null);
                  if (!profileName.trim()) {
                    setProfileMsg('이름을 입력해주세요.');
                    return;
                  }
                  try {
                    setSavingProfile(true);
                    const res = await api.patch<{ name: string }>(`/user/update`, { name: profileName.trim() });
                    if (me) setMe({ ...me, name: res.name });
                    setProfileMsg('성공: 프로필이 업데이트되었습니다.');
                  } catch (e: any) {
                    setProfileMsg(extractErrorMessage(e) || '프로필 업데이트에 실패했습니다');
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                disabled={savingProfile}
                className="bg-blue-600 hover:bg-blue-700"
              >
                저장
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 */}
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>현재 비밀번호 확인 후 새 비밀번호로 변경합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-pw">현재 비밀번호</Label>
              <Input id="old-pw" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">새 비밀번호</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                maxLength={14}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-pw">새 비밀번호 확인</Label>
              <Input
                id="confirm-new-pw"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                minLength={8}
                maxLength={14}
              />
            </div>
            {pwMsg && (
              <div className={pwMsg.startsWith('성공') ? 'text-green-600' : 'text-red-600'}>{pwMsg}</div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  setPwMsg(null);
                  if (!oldPassword || !newPassword || !confirmNewPassword) {
                    setPwMsg('모든 항목을 입력해주세요.');
                    return;
                  }
                  if (newPassword.length < 8 || newPassword.length > 14) {
                    setPwMsg('새 비밀번호는 8자 이상 14자 이하이어야 합니다.');
                    return;
                  }
                  if (confirmNewPassword.length < 8 || confirmNewPassword.length > 14) {
                    setPwMsg('새 비밀번호 확인은 8자 이상 14자 이하이어야 합니다.');
                    return;
                  }
                  if (newPassword !== confirmNewPassword) {
                    setPwMsg('새 비밀번호가 일치하지 않습니다.');
                    return;
                  }
                  try {
                    setPwSaving(true);
                    await api.patch<void>(`/user/password`, {
                      oldPassword,
                      newPassword,
                      confirmNewPassword,
                    });
                    setPwMsg('성공: 비밀번호가 변경되었습니다.');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  } catch (e: any) {
                    setPwMsg(extractErrorMessage(e) || '비밀번호 변경에 실패했습니다');
                  } finally {
                    setPwSaving(false);
                  }
                }}
                disabled={pwSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                변경
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
