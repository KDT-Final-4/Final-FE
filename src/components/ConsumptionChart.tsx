import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Button } from "./ui/button";

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

export function ConsumptionChart({ selectedDay, selectedDevice }: ConsumptionChartProps) {
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
          throw new Error(`Failed to fetch contents (${response.status})`);
        }

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Unexpected response type: ${contentType} ${text.slice(0, 120)}`);
        }

        const payload: ContentsResponse = await response.json();
        setContents(payload.contents ?? []);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
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
            {data.value.toLocaleString()} clicks ({percentage}%)
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
      return <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">Loading contents...</div>;
    }

    if (error) {
      return <div className="h-80 flex items-center justify-center text-sm text-destructive">{error}</div>;
    }

    if (!chartData.length) {
      return <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">No contents found.</div>;
    }

    return (
      <>
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-foreground">{totalClicks.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total clicks</div>
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
          <h4 className="text-sm font-medium">Contents</h4>
          <div className="grid grid-cols-1 gap-2">
            {contents.slice(0, 3).map((content, index) => (
              <div key={content.contentId ?? index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  <span className="text-sm">{`${content.title} - ${content.keyword}`}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" size="sm">
                    <a href={content.contentLink} target="_blank" rel="noreferrer">열기</a>
                  </Button>
                  <span className="text-sm font-medium">{content.clickCount.toLocaleString()} clicks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <Card className="border-border/30 shadow-sm bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-card-foreground">Energy Consumption Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribution of energy consumption across all live devices for {selectedDay}
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
