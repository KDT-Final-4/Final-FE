import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Leaf, TrendingDown, AlertTriangle, TreePine } from "lucide-react";
import { KpiCard } from "../../components/KpiCard";

interface AnalyticsData {
  deviceId: string;
  timestamp: string;
  kvah: number;
  billing: number;
  kva: number;
  kw: number;
  kwh: number;
  pf: number;
  kvarh_lag: number;
  kvarh_lead: number;
  co2_emissions: number;
}

interface EnvironmentalImpactProps {
  data: AnalyticsData[];
}

export function EnvironmentalImpact({ data }: EnvironmentalImpactProps) {
  // Calculate environmental metrics
  const totalCO2 = data.reduce((sum, item) => sum + item.co2_emissions, 0);
  const averageCO2 = totalCO2 / data.length;
  const totalKWH = data.reduce((sum, item) => sum + item.kwh, 0);
  const emissionFactor = 0.82; // kg CO2 per kWh (India average)
  
  // Calculate tree equivalency (1 tree absorbs ~22 kg CO2 per year)
  const treesEquivalent = totalCO2 / 22;
  
  // Determine emission level
  const getEmissionLevel = (co2: number) => {
    if (co2 < 30) return { level: "Low", variant: "default" as const, color: "text-green-600" };
    if (co2 < 50) return { level: "Moderate", variant: "secondary" as const, color: "text-yellow-600" };
    return { level: "High", variant: "destructive" as const, color: "text-red-600" };
  };

  const emissionLevel = getEmissionLevel(averageCO2);

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600" />
          Environmental Impact
        </CardTitle>
        <CardDescription>
          CO₂ emissions and environmental metrics based on energy consumption
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total CO₂"
            value={totalCO2.toFixed(1)}
            subtitle="kg CO₂"
            icon={<AlertTriangle className="w-4 h-4 text-green-600" />}
            backgroundClass="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
            toneClass="text-green-800 dark:text-green-200"
          />
          <KpiCard
            label="Avg/Hour"
            value={averageCO2.toFixed(1)}
            subtitle="kg CO₂/hr"
            icon={<TrendingDown className="w-4 h-4 text-blue-600" />}
            backgroundClass="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
            toneClass="text-blue-800 dark:text-blue-200"
          />
          <KpiCard
            label="Trees Needed"
            value={treesEquivalent.toFixed(0)}
            subtitle="trees/year"
            icon={<TreePine className="w-4 h-4 text-emerald-600" />}
            backgroundClass="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900"
            toneClass="text-emerald-800 dark:text-emerald-200"
          />
          <KpiCard
            label="Impact Level"
            value={
              <Badge variant={emissionLevel.variant} className="text-lg px-3 py-1">
                {emissionLevel.level}
              </Badge>
            }
            footer={
              emissionLevel.level === "Low"
                ? "Excellent efficiency!"
                : emissionLevel.level === "Moderate"
                  ? "Room for improvement"
                  : "Consider energy optimization"
            }
            icon={<Leaf className="w-4 h-4 text-gray-600" />}
            backgroundClass="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900"
            toneClass="text-foreground"
          />
        </div>

        {/* Environmental Insights */}
        <div className="mt-6 p-4 bg-accent/30 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Environmental Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">
                <span className="font-medium">Carbon Intensity:</span> {emissionFactor} kg CO₂ per kWh
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Total Energy:</span> {totalKWH.toFixed(1)} kWh consumed
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                <span className="font-medium">Reduction Potential:</span> Up to 20% with optimization
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Target:</span> &lt;30 kg CO₂/hr for optimal efficiency
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
