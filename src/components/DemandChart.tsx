import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

interface DemandChartProps {
  dataMode: string;
  selectedDay: string;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

type DailyClickPoint = {
  clickDate: string;
  clicks: number;
};

type DailyClickResponse = {
  start?: string;
  end?: string;
  dailyClicks?: DailyClickPoint[];
};

type ChartPoint = {
  time: string;
  clicks: number;
};

const normalizeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const buildDailySeries = (start: string, end: string, data: DailyClickPoint[]): ChartPoint[] => {
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);

  if (!normalizedStart || !normalizedEnd) return [];

  const clicksByDate = new Map<string, number>();
  data.forEach((item) => {
    const dateKey = normalizeDate(item.clickDate);
    if (dateKey) {
      clicksByDate.set(dateKey, item.clicks);
    }
  });

  const days: ChartPoint[] = [];
  const cursor = new Date(normalizedStart);
  const last = new Date(normalizedEnd);

  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({ time: key, clicks: clicksByDate.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

export function DemandChart({ dataMode, selectedDay, dateRange, onDateRangeChange }: DemandChartProps) {
  const [dailyClicks, setDailyClicks] = useState<DailyClickPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeDraft, setRangeDraft] = useState(dateRange);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState<string>("");
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);

  useEffect(() => {
    setRangeDraft(dateRange);
  }, [dateRange]);

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) {
      setDailyClicks([]);
      return;
    }

    const controller = new AbortController();

    const fetchDailyClicks = async () => {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });

      const endpoint = `/api/dashboard/daily?${query.toString()}`;

      try {
        console.log("[DemandChart] fetching daily clicks from", endpoint);
        const response = await fetch(endpoint, {
          credentials: "include",
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") || "unknown";

        if (!response.ok) {
          throw new Error(`Failed to fetch daily clicks (${response.status})`);
        }

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Unexpected response type: ${contentType} ${text.slice(0, 120)}`);
        }

        const payload: DailyClickResponse = await response.json();
        setDailyClicks(payload.dailyClicks ?? []);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        console.error("[DemandChart] failed to fetch daily clicks", fetchError);
        const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDailyClicks();

    return () => controller.abort();
  }, [dataMode, dateRange.end, dateRange.start, selectedDay]);

  const chartData = useMemo(
    () => buildDailySeries(dateRange.start, dateRange.end, dailyClicks),
    [dateRange.end, dateRange.start, dailyClicks]
  );

  const totalClicks = chartData.reduce((sum, item) => sum + item.clicks, 0);
  const averageClicks = chartData.length ? Math.round(totalClicks / chartData.length) : 0;
  const peakDay = chartData.reduce<ChartPoint>(
    (peak, current) => (current.clicks > peak.clicks ? current : peak),
    { time: "-", clicks: 0 }
  );
  const yMax = chartData.reduce((max, item) => Math.max(max, item.clicks), 0);
  const yDomainMaxBase = Math.max(yMax, goal ?? 0);
  const yDomainMax = yDomainMaxBase ? Math.ceil(yDomainMaxBase * 1.1) : 10;

  const validateAndApplyRange = () => {
    const { start, end } = rangeDraft;

    if (!start || !end) {
      setRangeError("Both start and end dates are required.");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setRangeError("Please enter valid dates.");
      return;
    }

    if (startDate > endDate) {
      setRangeError("Start date must be on or before end date.");
      return;
    }

    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 30) {
      setRangeError("Range cannot exceed 30 days.");
      return;
    }

    setRangeError(null);
    onDateRangeChange({ start, end });
    setRangeOpen(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Date: ${label}`}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 rounded" style={{ backgroundColor: payload[0].color }} />
            <span className="text-sm">Clicks: {payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
          Loading daily clicks...
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-80 flex items-center justify-center text-destructive text-sm">
          {error}
        </div>
      );
    }

    if (!chartData.length) {
      return (
        <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
          No data for the selected period.
        </div>
      );
    }

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => value?.slice(5)}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={[0, yDomainMax]}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {goal !== null && (
              <ReferenceLine
                y={goal}
                stroke="#ef4444"
                strokeDasharray="6 4"
                label={{ value: `Goal (${goal})`, position: "right", fill: "#ef4444", fontSize: 12 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#22c55e"
              strokeWidth={3}
              name="Clicks"
              dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="border-border/30 shadow-sm bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-card-foreground">Daily Clicks</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click volume over time ({dataMode}) — {dateRange.start || "-"} to {dateRange.end || "-"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRangeOpen((open) => !open)}
              className="shrink-0"
            >
              {rangeOpen ? "Close" : "Set Range"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGoalOpen((open) => !open)}
              className="shrink-0"
            >
              {goalOpen ? "Close Goal" : "Set Goal"}
            </Button>
          </div>
        </div>

        {rangeOpen && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start</label>
                <Input
                  type="date"
                  value={rangeDraft.start}
                  onChange={(event) => setRangeDraft((prev) => ({ ...prev, start: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End</label>
                <Input
                  type="date"
                  value={rangeDraft.end}
                  onChange={(event) => setRangeDraft((prev) => ({ ...prev, end: event.target.value }))}
                />
              </div>
              <div className="flex gap-2 md:justify-end">
                <Button size="sm" onClick={validateAndApplyRange} className="w-full md:w-auto">
                  Apply
                </Button>
              </div>
            </div>
            {rangeError && <p className="text-xs text-destructive">{rangeError}</p>}
            <p className="text-xs text-muted-foreground">Up to 30 days per request.</p>
          </div>
        )}

        {goalOpen && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Goal (clicks)</label>
                <Input
                  type="number"
                  min="0"
                  value={goalDraft}
                  onChange={(event) => setGoalDraft(event.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="flex gap-2 md:justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    const parsed = Number(goalDraft);
                    if (!Number.isFinite(parsed) || parsed < 0) {
                      setGoalError("Enter a valid non-negative number.");
                      return;
                    }
                    setGoalError(null);
                    setGoal(parsed);
                    setGoalOpen(false);
                  }}
                  className="w-full md:w-auto"
                >
                  Apply Goal
                </Button>
              </div>
            </div>
            {goalError && <p className="text-xs text-destructive">{goalError}</p>}
            <p className="text-xs text-muted-foreground">Goal line will appear as a red dashed line.</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <div className="text-xl font-bold text-foreground">{totalClicks}</div>
              <div className="text-xs text-muted-foreground">Total Clicks</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-xl font-bold text-foreground">{averageClicks}</div>
              <div className="text-xs text-muted-foreground">Avg per Day</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-xl font-bold text-foreground">
                {peakDay.time !== "-" ? `${peakDay.clicks} on ${peakDay.time}` : "-"}
              </div>
              <div className="text-xs text-muted-foreground">Peak Day</div>
            </div>
          </div>

          {renderChart()}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Daily Insights</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <span className="text-sm">Range</span>
                <span className="text-sm font-medium">
                  {dateRange.start || "-"} ~ {dateRange.end || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <span className="text-sm">Peak</span>
                <span className="text-sm font-medium">
                  {peakDay.time !== "-" ? `${peakDay.clicks} clicks on ${peakDay.time}` : "No data"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <span className="text-sm">Total / Avg</span>
                <span className="text-sm font-medium">
                  {totalClicks} clicks / {averageClicks} per day
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
