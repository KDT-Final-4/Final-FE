import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { FileText, Image, Clock, Eye, Check, X, Edit } from 'lucide-react';

type ContentStatus = 'pending' | 'approved' | 'rejected';

interface Content {
  id: number;
  title: string;
  preview: string;
  status: ContentStatus;
  wordCount: number;
  imageCount: number;
  createdAt: string;
  keyword: string;
}

const mockContents: Content[] = [
  {
    id: 1,
    title: '2024년 최신 갤럭시 S24 완벽 리뷰',
    preview: '삼성전자의 최신 플래그십 스마트폰 갤럭시 S24가 드디어 출시되었습니다. 이번 모델은 AI 기능이 대폭 강화되었으며, 카메라 성능도...',
    status: 'pending',
    wordCount: 1245,
    imageCount: 5,
    createdAt: '2024-11-22 10:30',
    keyword: '갤럭시 S24',
  },
  {
    id: 2,
    title: '블랙프라이데이 쇼핑 꿀팁 대공개',
    preview: '연말 최대 쇼핑 시즌인 블랙프라이데이가 다가왔습니다. 올해는 어떤 제품을 구매하는 것이 좋을까요? 전자제품부터 생활용품까지...',
    status: 'pending',
    wordCount: 1089,
    imageCount: 4,
    createdAt: '2024-11-22 09:15',
    keyword: '블랙프라이데이',
  },
  {
    id: 3,
    title: '겨울 필수템! 패딩 추천 가이드',
    preview: '본격적인 겨울이 다가오면서 패딩을 찾는 분들이 많아지고 있습니다. 올해 트렌드부터 가성비 제품까지 모두 소개해드립니다...',
    status: 'approved',
    wordCount: 1432,
    imageCount: 6,
    createdAt: '2024-11-21 14:20',
    keyword: '패딩 추천',
  },
  {
    id: 4,
    title: '다이슨 청소기 vs 삼성 청소기 비교',
    preview: '무선 청소기 시장의 양대 산맥인 다이슨과 삼성 제품을 비교해봤습니다. 각 브랜드의 장단점과 추천 모델을...',
    status: 'rejected',
    wordCount: 956,
    imageCount: 3,
    createdAt: '2024-11-21 11:45',
    keyword: '다이슨 청소기',
  },
];

export function ContentReview() {
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | 'all'>('pending');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedText, setEditedText] = useState('');

  const filteredContents = selectedStatus === 'all' 
    ? mockContents 
    : mockContents.filter(content => content.status === selectedStatus);

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

  const handlePreview = (content: Content) => {
    setSelectedContent(content);
  };

  const handleEdit = (content: Content) => {
    setEditedText(content.preview);
    setSelectedContent(content);
    setEditDialogOpen(true);
  };

  const handleApprove = (content: Content) => {
    alert(`"${content.title}" 콘텐츠가 승인되었습니다.`);
    setSelectedContent(null);
  };

  const handleReject = (content: Content) => {
    alert(`"${content.title}" 콘텐츠가 반려되었습니다.`);
    setSelectedContent(null);
  };

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
        {filteredContents.map((content) => (
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
                      <FileText className="w-4 h-4" />
                      <span>{content.wordCount.toLocaleString()}자</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      <span>{content.imageCount}개</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{content.createdAt}</span>
                    </div>
                    <Badge variant="secondary">{content.keyword}</Badge>
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

      {/* Preview Dialog */}
      <Dialog open={selectedContent !== null && !editDialogOpen} onOpenChange={(open) => !open && setSelectedContent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedContent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p>{selectedContent?.preview}</p>
              <p>이 부분은 실제 콘텐츠의 전체 내용이 표시됩니다. AI가 생성한 마케팅 글의 전체 내용을 여기서 확인하고 품질을 검수할 수 있습니다.</p>
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
            <Button onClick={() => {
              alert('콘텐츠가 수정되었습니다.');
              setEditDialogOpen(false);
            }}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
