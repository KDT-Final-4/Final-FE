import { useState } from 'react';
import { ShieldCheck, Sparkles, Clock3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '@/lib/api';
import { setToken, setLoggedInFlag, type LoginResponse } from '@/lib/auth';

interface LoginProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export default function Login({ onSuccess, onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      if (res?.token) setToken(res.token);
      setLoggedInFlag();
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl grid grid-cols-1 gap-8 items-stretch">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <p className="text-3xl font-semibold text-blue-600">AURA</p>
              <p className="text-gray-500 text-sm"> Automated Update & Review Assistant</p>
            </div>
            <Card className="shadow-lg border border-gray-100">
              <CardHeader>
                <CardTitle>로그인</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="team@aura.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {error && <div className="text-sm text-red-600">{error}</div>}
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" type="submit" disabled={loading}>
                      {loading ? '로그인 중...' : '로그인'}
                    </Button>
                    {onSwitchToSignup && (
                      <Button
                        className="flex-1"
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={onSwitchToSignup}
                      >
                        회원가입
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
            <p className="text-center text-sm text-gray-500">계정 문제 발생 시 관리자에게 문의해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
