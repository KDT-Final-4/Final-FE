import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Search, Download, RefreshCw, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
type LogModule = 'Pipeline' | 'TrendCollector' | 'DataCollector' | 'ContentGenerator' | 'Publisher';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: LogModule;
  jobId: string;
  message: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-11-22 14:32:15',
    level: 'SUCCESS',
    module: 'Publisher',
    jobId: 'JOB-20241122-001',
    message: '콘텐츠 "갤럭시 S24 완벽 리뷰"가 네이버 블로그에 성공적으로 발행되었습니다.',
  },
  {
    id: '2',
    timestamp: '2024-11-22 14:30:42',
    level: 'INFO',
    module: 'ContentGenerator',
    jobId: 'JOB-20241122-001',
    message: 'GPT-4 모델을 사용하여 1,245자의 콘텐츠를 생성했습니다.',
  },
  {
    id: '3',
    timestamp: '2024-11-22 14:28:30',
    level: 'INFO',
    module: 'DataCollector',
    jobId: 'JOB-20241122-001',
    message: '키워드 "갤럭시 S24"에 대한 관련 데이터 수집을 완료했습니다.',
  },
  {
    id: '4',
    timestamp: '2024-11-22 14:25:18',
    level: 'WARNING',
    module: 'TrendCollector',
    jobId: 'JOB-20241122-002',
    message: 'Google Trends API 응답 지연이 감지되었습니다. (응답시간: 3.2초)',
  },
  {
    id: '5',
    timestamp: '2024-11-22 14:20:05',
    level: 'ERROR',
    module: 'Publisher',
    jobId: 'JOB-20241122-003',
    message: '네이버 블로그 API 인증 실패. Access Token이 만료되었습니다.',
  },
  {
    id: '6',
    timestamp: '2024-11-22 14:15:33',
    level: 'SUCCESS',
    module: 'Pipeline',
    jobId: 'JOB-20241122-004',
    message: '자동화 파이프라인이 성공적으로 시작되었습니다.',
  },
  {
    id: '7',
    timestamp: '2024-11-22 14:10:22',
    level: 'INFO',
    module: 'TrendCollector',
    jobId: 'JOB-20241122-005',
    message: '실시간 트렌드 키워드 8개를 수집했습니다.',
  },
  {
    id: '8',
    timestamp: '2024-11-22 14:05:11',
    level: 'SUCCESS',
    module: 'ContentGenerator',
    jobId: 'JOB-20241122-006',
    message: 'AI 콘텐츠 생성 완료. 검수 대기 상태로 전환되었습니다.',
  },
];

const getLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'INFO':
      return <Info className="w-4 h-4" />;
    case 'SUCCESS':
      return <CheckCircle className="w-4 h-4" />;
    case 'WARNING':
      return <AlertTriangle className="w-4 h-4" />;
    case 'ERROR':
      return <AlertCircle className="w-4 h-4" />;
  }
};

const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case 'INFO':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'SUCCESS':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'ERROR':
      return 'bg-red-100 text-red-700 border-red-200';
  }
};

export function SystemLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'ALL'>('ALL');

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.jobId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const handleDownload = () => {
    alert('로그 파일이 다운로드됩니다.');
  };

  const handleRefresh = () => {
    alert('로그를 새로고침합니다.');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">로그 뷰어</h1>
        <p className="text-gray-600">시스템 실행 로그를 확인하고 문제를 추적하세요</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>시스템 로그</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="로그 검색 (메시지, Job ID...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLevel('ALL')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  selectedLevel === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setSelectedLevel('INFO')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  selectedLevel === 'INFO'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                INFO
              </button>
              <button
                onClick={() => setSelectedLevel('SUCCESS')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  selectedLevel === 'SUCCESS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                SUCCESS
              </button>
              <button
                onClick={() => setSelectedLevel('WARNING')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  selectedLevel === 'WARNING'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                WARNING
              </button>
              <button
                onClick={() => setSelectedLevel('ERROR')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  selectedLevel === 'ERROR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                ERROR
              </button>
            </div>
          </div>

          {/* Log Entries */}
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-0.5">
                    <Badge className={getLevelColor(log.level)}>
                      {getLevelIcon(log.level)}
                      <span className="ml-1">{log.level}</span>
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500">{log.timestamp}</span>
                      <Badge variant="outline">{log.module}</Badge>
                      <Badge variant="secondary" className="font-mono">
                        {log.jobId}
                      </Badge>
                    </div>
                    <p className="text-gray-900">{log.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
