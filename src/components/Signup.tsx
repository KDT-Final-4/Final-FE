import { useState } from 'react';
import { ShieldCheck, Sparkles, Clock3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '@/lib/api';

interface SignupProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function Signup({ onSuccess, onSwitchToLogin }: SignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/user/register', { email, password, name });
      setMessage('회원가입이 완료되었습니다. 로그인으로 이동해주세요.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || '회원가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl grid lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-blue-600">AURA</p>
              <h2 className="text-2xl font-semibold text-gray-900">회원가입</h2>
              <p className="text-gray-500 text-sm">팀 정보를 입력하면 곧바로 대시보드에 접근할 수 있습니다.</p>
            </div>
            <Card className="shadow-lg border border-gray-100">
              <CardHeader>
                <CardTitle>새 계정 만들기</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="team@aura.co"
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
                      autoComplete="new-password"
                      placeholder="최소 8자 이상"
                      required
                    />
                  </div>
                  {error && <div className="text-sm text-red-600">{error}</div>}
                  {message && <div className="text-sm text-green-600">{message}</div>}
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" type="submit" disabled={loading}>
                      {loading ? '가입 중...' : '회원가입'}
                    </Button>
                    {onSwitchToLogin && (
                      <Button
                        className="flex-1"
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={onSwitchToLogin}
                      >
                        로그인으로
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
            <p className="text-center text-sm text-gray-500">이미 계정이 있다면 로그인으로 돌아가세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
