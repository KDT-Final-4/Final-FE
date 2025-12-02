import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Minus, Sparkles, Flame } from 'lucide-react';

type Category = 'all' | 'electronics' | 'lifestyle' | 'fashion';

const categories = [
  { id: 'all' as Category, label: '전체' },
  { id: 'electronics' as Category, label: '전자기기' },
  { id: 'lifestyle' as Category, label: '생활용품' },
  { id: 'fashion' as Category, label: '패션/뷰티' },
];

const trendData = [
  {
    rank: 1,
    keyword: '갤럭시 S24',
    category: 'electronics',
    searchVolume: '145,230',
    change: 'up',
    changeValue: '+23',
    isHot: true,
  },
  {
    rank: 2,
    keyword: '블랙프라이데이',
    category: 'lifestyle',
    searchVolume: '128,450',
    change: 'up',
    changeValue: '+18',
    isHot: true,
  },
  {
    rank: 3,
    keyword: '패딩 추천',
    category: 'fashion',
    searchVolume: '98,340',
    change: 'up',
    changeValue: '+12',
    isHot: false,
  },
  {
    rank: 4,
    keyword: '에어팟 프로',
    category: 'electronics',
    searchVolume: '87,120',
    change: 'same',
    changeValue: '0',
    isHot: false,
  },
  {
    rank: 5,
    keyword: '다이슨 청소기',
    category: 'lifestyle',
    searchVolume: '76,890',
    change: 'down',
    changeValue: '-5',
    isHot: false,
  },
  {
    rank: 6,
    keyword: '크리스마스 선물',
    category: 'lifestyle',
    searchVolume: '65,430',
    change: 'up',
    changeValue: '+34',
    isHot: true,
  },
  {
    rank: 7,
    keyword: '겨울 부츠',
    category: 'fashion',
    searchVolume: '58,920',
    change: 'up',
    changeValue: '+8',
    isHot: false,
  },
  {
    rank: 8,
    keyword: '노트북 추천',
    category: 'electronics',
    searchVolume: '52,340',
    change: 'down',
    changeValue: '-3',
    isHot: false,
  },
];

const categoryLabels = {
  electronics: '전자기기',
  lifestyle: '생활용품',
  fashion: '패션/뷰티',
};

const categoryColors = {
  electronics: 'bg-blue-100 text-blue-700',
  lifestyle: 'bg-green-100 text-green-700',
  fashion: 'bg-purple-100 text-purple-700',
};

export function TrendAnalysis() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [generatingKeyword, setGeneratingKeyword] = useState<string | null>(null);

  const filteredTrends = selectedCategory === 'all' 
    ? trendData 
    : trendData.filter(trend => trend.category === selectedCategory);

  const handleGenerate = (keyword: string) => {
    setGeneratingKeyword(keyword);
    setTimeout(() => {
      setGeneratingKeyword(null);
      alert(`"${keyword}" 키워드로 콘텐츠 생성이 시작되었습니다.`);
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">인기 검색어</h1>
        <p className="text-gray-600">실시간 트렌드를 분석하고 AI 콘텐츠를 생성하세요</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Trend Table */}
      <Card>
        <CardHeader>
          <CardTitle>실시간 인기 검색어</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTrends.map((trend) => {
              const ChangeIcon = trend.change === 'up' ? TrendingUp : trend.change === 'down' ? TrendingDown : Minus;
              const changeColor = trend.change === 'up' ? 'text-green-600' : trend.change === 'down' ? 'text-red-600' : 'text-gray-400';
              
              return (
                <div 
                  key={trend.rank} 
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-gray-900">{trend.rank}</span>
                  </div>

                  {/* Keyword and Category */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-gray-900">{trend.keyword}</h3>
                      {trend.isHot && (
                        <Flame className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={categoryColors[trend.category as keyof typeof categoryColors]}>
                        {categoryLabels[trend.category as keyof typeof categoryLabels]}
                      </Badge>
                      <span className="text-gray-500">검색량 {trend.searchVolume}</span>
                    </div>
                  </div>

                  {/* Change */}
                  <div className={`flex items-center gap-1 ${changeColor}`}>
                    <ChangeIcon className="w-5 h-5" />
                    <span className="min-w-[3rem] text-right">{trend.changeValue}</span>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={() => handleGenerate(trend.keyword)}
                    disabled={generatingKeyword === trend.keyword}
                    className="bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    size="sm"
                  >
                    {generatingKeyword === trend.keyword ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        생성 중
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        콘텐츠 생성
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {filteredTrends.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>해당 카테고리의 트렌드가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-gray-500">HOT 키워드</div>
                <div className="text-gray-900">
                  {trendData.filter(t => t.isHot).length}개
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-gray-500">상승 중</div>
                <div className="text-gray-900">
                  {trendData.filter(t => t.change === 'up').length}개
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-gray-500">총 키워드</div>
                <div className="text-gray-900">
                  {filteredTrends.length}개
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
