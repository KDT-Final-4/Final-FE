import { Card, CardContent } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Filter } from "lucide-react";

interface EnhancedFilterSectionProps {
  dataMode: string;
  selectedDay: string;
  dateRange: { start: string; end: string };
  onDataModeChange: (mode: string) => void;
  onDayChange: (day: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onApplyFilters: () => void;
}

export function EnhancedFilterSection({
  dataMode,
  selectedDay,
  dateRange,
  onDataModeChange,
  onDayChange,
  onDateRangeChange,
  onApplyFilters,
}: EnhancedFilterSectionProps) {
  const dataModes = [
    { id: "real-time", name: "Real-Time" },
    { id: "historical", name: "Historical" },
    { id: "combined", name: "Combined" },
  ];

  const timePerl = [
    { id: "today", name: "Today" },
    { id: "yesterday", name: "Yesterday" },
    { id: "last-7-days", name: "Last 7 Days" },
    { id: "last-30-days", name: "Last 30 Days" },
    { id: "custom", name: "Custom Range" },
  ];

  return (
    <Card className="border-border/30 shadow-sm mb-6 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          {/* Data Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Data Mode</label>
            <Select value={dataMode} onValueChange={onDataModeChange}>
              <SelectTrigger className="h-11 border-border/50 bg-background/50">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {dataModes.map((mode) => (
                  <SelectItem key={mode.id} value={mode.id}>
                    {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Period */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Time Period</label>
            <Select value={selectedDay} onValueChange={onDayChange}>
              <SelectTrigger className="h-11 border-border/50 bg-background/50">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {timePerl.map((day) => (
                  <SelectItem key={day.id} value={day.id}>
                    {day.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDay === "custom" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Start</label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(event) => onDateRangeChange({ ...dateRange, start: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">End</label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(event) => onDateRangeChange({ ...dateRange, end: event.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Up to 30 days per request.</p>
              </>
            )}
          </div>

          {/* Filter Button */}
          <div className="flex gap-2 lg:col-span-2">
            <Button onClick={onApplyFilters} className="h-11 px-6 bg-primary hover:bg-primary/90 shadow-sm">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
