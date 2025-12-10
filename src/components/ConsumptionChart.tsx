import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { MousePointerClick } from "lucide-react";

interface ConsumptionChartProps {
  selectedDay: string;
  selectedDevice: string;
}

type ContentItem = {
  contentId: number;
  title: string;
  keyword: string;
  contentLink: string;
  clickCount: number;
};

type ContentsResponse = {
  contents?: ContentItem[];
};

const palette = ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"];

export function ConsumptionChart({ selectedDay: _selectedDay, selectedDevice: _selectedDevice }: ConsumptionChartProps) {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const endpoint = "/api/dashboard/contents";

    const fetchContents = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          credentials: "include",
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") || "unknown";

        if (!response.ok) {
          throw new Error(`콘텐츠 데이터를 불러오지 못했습니다 (${response.status})`);
        }

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`예상치 못한 응답 형식입니다: ${contentType} ${text.slice(0, 120)}`);
        }

        const payload: ContentsResponse = await response.json();
        setContents(payload.contents ?? []);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        const message = fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchContents();
    return () => controller.abort();
  }, []);

  const chartData = useMemo(
    () =>
      contents.map((item, index) => ({
        name: `${item.title} - ${item.keyword}`,
        value: item.clickCount ?? 0,
        color: palette[index % palette.length],
      })),
    [contents]
  );

  const totalClicks = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalClicks ? ((data.value / totalClicks) * 100).toFixed(1) : "0.0";
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value.toLocaleString()}회 클릭 ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderBody = () => {
    if (loading) {
      return <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">콘텐츠를 불러오는 중...</div>;
    }

    if (error) {
      return <div className="h-80 flex items-center justify-center text-sm text-destructive">{error}</div>;
    }

    if (!chartData.length) {
      return <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">콘텐츠가 없습니다.</div>;
    }

    return (
      <>
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-foreground">{totalClicks.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">총 클릭수</div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">콘텐츠 목록</h4>
          <div className="grid grid-cols-1 gap-2">
            {contents.slice(0, 3).map((content, index) => (
              <a
                key={content.contentId ?? index}
                href={content.contentLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  <span className="text-sm">{`${content.title} - ${content.keyword}`}</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <MousePointerClick className="w-4 h-4 text-primary" aria-hidden />
                  {content.clickCount.toLocaleString()}회 클릭
                </span>
              </a>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <Card className="border-border/30 shadow-sm bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-card-foreground">콘텐츠 클릭 현황</CardTitle>
        <p className="text-sm text-muted-foreground">
          지금까지 누적된 전체 데이터 기준으로 콘텐츠별 클릭 수 분포를 보여줍니다
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderBody()}
        </div>
      </CardContent>
    </Card>
  );
}
