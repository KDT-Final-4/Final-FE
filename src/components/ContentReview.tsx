import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { FileText, Image, Clock, Eye, Check, X, Edit } from 'lucide-react';
import { api } from '@/lib/api';

type ContentStatus = 'pending' | 'approved' | 'rejected';

interface Content {
  id: number;
  title: string;
  preview: string;
  status: ContentStatus;
  createdAt: string;
}

// Backend types
type ApiContent = {
  id: number;
  jobId: string;
  userId: number;
  uploadChannelId: number;
  title: string;
  body: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  generationType: string;
  createdAt: string;
  updatedAt: string;
};

function mapStatus(s: ApiContent['status']): ContentStatus {
  switch (s) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING':
    default:
      return 'pending';
  }
}

function toContent(a: ApiContent): Content {
  return {
    id: a.id,
    title: a.title,
    preview: a.body || '',
    status: mapStatus(a.status),
    createdAt: a.createdAt,
  };
}

export function ContentReview() {
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | 'all'>('pending');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Load list
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    api
      .get<ApiContent[]>('/content')
      .then((list) => {
        if (ignore) return;
        setContents(list.map(toContent));
      })
      .catch((e: any) => {
        if (ignore) return;
        setError(e?.message || '콘텐츠 목록을 불러오지 못했습니다');
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filteredContents = useMemo(() => {
    if (selectedStatus === 'all') return contents;
    return contents.filter((c) => c.status === selectedStatus);
  }, [contents, selectedStatus]);

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">검수 대기</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-600">승인 완료</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-600">반려</Badge>;
    }
  };

  const handlePreview = async (content: Content) => {
    try {
      const full = await api.get<ApiContent>(`/content/${content.id}`);
      const mapped = toContent(full);
      setSelectedContent(mapped);
    } catch (e) {
      setSelectedContent(content);
    }
  };

  const handleEdit = async (content: Content) => {
    try {
      const full = await api.get<ApiContent>(`/content/${content.id}`);
      const mapped = toContent(full);
      setEditedText(mapped.preview);
      setSelectedContent(mapped);
    } catch {
      setEditedText(content.preview);
      setSelectedContent(content);
    } finally {
      setEditDialogOpen(true);
    }
  };

  const handleApprove = (content: Content) => {
    updateStatus(content.id, 'APPROVED');
  };

  const handleReject = (content: Content) => {
    updateStatus(content.id, 'REJECTED');
  };

  async function updateStatus(id: number, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    try {
      setActioningId(id);
      const updated = await api.patch<ApiContent>(`/content/status/${id}`, { status });
      const mapped = toContent(updated);
      setContents((prev) => prev.map((c) => (c.id === mapped.id ? mapped : c)));
      if (selectedContent && selectedContent.id === id) setSelectedContent(mapped);
    } catch (e) {
      alert('상태 변경에 실패했습니다.');
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">콘텐츠 검수</h1>
        <p className="text-gray-600">AI가 생성한 콘텐츠를 검토하고 승인하세요</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setSelectedStatus('pending')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedStatus === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          검수 대기
        </button>
        <button
          onClick={() => setSelectedStatus('approved')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedStatus === 'approved'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          승인 완료
        </button>
        <button
          onClick={() => setSelectedStatus('rejected')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedStatus === 'rejected'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          반려
        </button>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading && (
          <div className="text-gray-500">불러오는 중...</div>
        )}
        {error && (
          <div className="text-red-600">{error}</div>
        )}
        {!loading && !error && filteredContents.map((content) => (
          <Card key={content.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-gray-900">{content.title}</h3>
                    {getStatusBadge(content.status)}
                  </div>
                  <p className="text-gray-600 mb-3">{content.preview}</p>
                  <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{content.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePreview(content)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  미리보기
                </Button>
                {content.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(content)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(content)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      승인
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      onClick={() => handleReject(content)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      반려
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */
      }
      <Dialog open={selectedContent !== null && !editDialogOpen} onOpenChange={(open) => !open && setSelectedContent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedContent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p>{selectedContent?.preview}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedContent(null)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>콘텐츠 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={10}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>취소</Button>
            <Button onClick={async () => {
              if (!selectedContent) return;
              try {
                const updated = await api.put<ApiContent>(`/content/${selectedContent.id}`, {
                  title: selectedContent.title,
                  body: editedText,
                });
                const mapped = toContent(updated);
                setContents((prev) => prev.map((c) => (c.id === mapped.id ? mapped : c)));
                setSelectedContent(mapped);
                setEditDialogOpen(false);
              } catch (e) {
                alert('콘텐츠 수정에 실패했습니다.');
              }
            }}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
