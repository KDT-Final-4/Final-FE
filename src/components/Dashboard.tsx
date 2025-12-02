import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Eye, MousePointerClick, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const kpiData = [
  { label: '총 조회수', value: '45,231', change: '+12.5%', isPositive: true, icon: Eye },
  { label: '총 클릭수', value: '3,892', change: '+8.2%', isPositive: true, icon: MousePointerClick },
];

const chartData = [
  { date: '11/15', views: 4200 },
  { date: '11/16', views: 4800 },
  { date: '11/17', views: 5200 },
  { date: '11/18', views: 4900 },
  { date: '11/19', views: 6100 },
  { date: '11/20', views: 6800 },
  { date: '11/21', views: 7200 },
  { date: '11/22', views: 8500 },
];

const recentContents = [
  {
    id: 1,
    title: '2024년 최신 갤럭시 스마트폰 비교 가이드',
    date: '2024-11-22',
    views: 1234,
    clicks: 89,
    ctr: '7.2%',
    thumbnail: 'smartphone technology',
  },
  {
    id: 2,
    title: '겨울 필수 아이템! 가성비 패딩 추천',
    date: '2024-11-21',
    views: 2341,
    clicks: 156,
    ctr: '6.7%',
    thumbnail: 'winter fashion',
  },
  {
    id: 3,
    title: '집에서 즐기는 홈카페 꿀팁',
    date: '2024-11-20',
    views: 1876,
    clicks: 134,
    ctr: '7.1%',
    thumbnail: 'coffee home',
  },
  {
    id: 4,
    title: '블랙프라이데이 쇼핑 완벽 가이드',
    date: '2024-11-19',
    views: 3456,
    clicks: 289,
    ctr: '8.4%',
    thumbnail: 'shopping sale',
  },
];

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">AI 콘텐츠 마케팅 성과를 한눈에 확인하세요</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const ChangeIcon = kpi.isPositive ? TrendingUp : TrendingDown;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    kpi.isPositive ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <Icon className={`w-6 h-6 ${kpi.isPositive ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className={`flex items-center gap-1 ${
                    kpi.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <ChangeIcon className="w-4 h-4" />
                    <span>{kpi.change}</span>
                  </div>
                </div>
                <div className="text-gray-600 mb-1">{kpi.label}</div>
                <div className="text-gray-900">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>조회수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Contents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>최근 콘텐츠 성과</CardTitle>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-md bg-blue-50 text-blue-600">7일</button>
              <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-50">30일</button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentContents.map((content) => (
              <div key={content.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  <img 
                    src={`https://source.unsplash.com/96x96/?${content.thumbnail}`}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 mb-1 truncate">{content.title}</h3>
                  <p className="text-gray-500 mb-2">{content.date}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>{content.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MousePointerClick className="w-4 h-4" />
                      <span>{content.clicks}</span>
                    </div>
                    <div className="text-gray-600">CTR: {content.ctr}</div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}