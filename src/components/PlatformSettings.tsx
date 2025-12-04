import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { CheckCircle2, XCircle, Eye, EyeOff, Plus } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: string;
  description: string;
  isConnected: boolean;
  accountInfo?: string;
}

export function PlatformSettings() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'naver',
      name: '네이버 블로그',
      icon: 'N',
      description: '한국 최대 블로그 플랫폼',
      isConnected: false,
      accountInfo: '',
    },
    {
      id: 'twitter',
      name: 'Twitter (X)',
      icon: '𝕏',
      description: '실시간 소셜 네트워크',
      isConnected: false,
      accountInfo: '',
    },
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accountId, setAccountId] = useState('');

  const handleConnect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setClientId('');
    setClientSecret('');
    setAccountId('');
    setConfigDialogOpen(true);
  };

  const handleDisconnect = (platformId: string) => {
    setPlatforms(platforms.map(p => 
      p.id === platformId ? { ...p, isConnected: false, accountInfo: '' } : p
    ));
    alert('플랫폼 연동이 해제되었습니다.');
  };

  const handleSave = () => {
    if (selectedPlatform) {
      setPlatforms(platforms.map(p => 
        p.id === selectedPlatform.id 
          ? { ...p, isConnected: true, accountInfo: accountId } 
          : p
      ));
      setConfigDialogOpen(false);
      alert(`${selectedPlatform.name} 연동이 완료되었습니다!`);
    }
  };

  const handleToggleAutoPost = (platformId: string) => {
    // Toggle auto-post for platform
    console.log(`Toggle auto-post for ${platformId}`);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">업로드 플랫폼</h1>
        <p className="text-gray-600">콘텐츠를 발행할 플랫폼을 연동하고 관리하세요</p>
      </div>

      <div className="space-y-6 max-w-5xl">
        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <Card key={platform.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <span className="text-xl">{platform.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 mb-1">{platform.name}</h3>
                      <p className="text-gray-500">{platform.description}</p>
                      {platform.isConnected && platform.accountInfo && (
                        <p className="text-gray-700 mt-2">
                          계정: {platform.accountInfo}
                        </p>
                      )}
                    </div>
                  </div>
                  {platform.isConnected ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      연동됨
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-300 text-gray-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      미연동
                    </Badge>
                  )}
                </div>

                {platform.isConnected && (
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-gray-700">자동 발행</Label>
                      <p className="text-gray-500">검수 승인 후 자동으로 발행</p>
                    </div>
                    <Switch 
                      defaultChecked={false}
                      onCheckedChange={() => handleToggleAutoPost(platform.id)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {platform.isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleConnect(platform)}
                      >
                        설정 변경
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        연동 해제
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleConnect(platform)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      연동하기
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>멀티 플랫폼 발행 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 mb-2">주요 기능</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>하나의 콘텐츠를 여러 플랫폼에 동시 발행</li>
                <li>플랫폼별 맞춤형 포맷 자동 변환</li>
                <li>자동 발행 또는 수동 발행 선택 가능</li>
                <li>각 플랫폼의 성과를 통합 대시보드에서 확인</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-yellow-900 mb-2">유의사항</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>각 플랫폼의 API 키는 안전하게 암호화되어 저장됩니다</li>
                <li>일부 플랫폼은 OAuth 인증이 필요합니다</li>
                <li>플랫폼별 발행 제한(일일 게시물 수 등)을 확인하세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPlatform?.name} 연동 설정</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-id">
                {selectedPlatform?.id === 'naver' ? '블로그 ID' : 
                 selectedPlatform?.id === 'twitter' ? 'Twitter 핸들' :
                 '계정 ID'}
              </Label>
              <Input
                id="account-id"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder={
                  selectedPlatform?.id === 'naver' ? 'myblog' :
                  selectedPlatform?.id === 'twitter' ? '@handle' :
                  '계정 ID 입력'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-id">API Client ID</Label>
              <Input
                id="client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="YOUR_CLIENT_ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-secret">API Client Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="client-secret"
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="YOUR_CLIENT_SECRET"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 mb-2">API 키 발급 방법</h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>{selectedPlatform?.name} 개발자 센터에 접속</li>
                <li>새 애플리케이션 등록</li>
                <li>필요한 권한(글쓰기, 읽기 등) 설정</li>
                <li>발급받은 Client ID와 Secret을 위에 입력</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              연동 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}