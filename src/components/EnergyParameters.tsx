import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface EnergyParametersProps {
  totalViews?: number;
  contentsCount?: number;
}

export function EnergyParameters({ totalViews, contentsCount }: EnergyParametersProps) {
  // Mock data - in real app this would come from API
  const parameters = [
    {
      id: "views",
      name: "총 조회수",
      fullName: "총 조회수",
      value: totalViews !== undefined ? totalViews.toLocaleString() : "-",
      unit: "회",
    },
    {
      id: "contents",
      name: "총 콘텐츠 수",
      fullName: "총 콘텐츠 수",
      value: contentsCount !== undefined ? contentsCount.toLocaleString() : "-",
      unit: "개",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {parameters.map((param) => (
        <Card key={param.id} className="border-sidebar-border/30 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-sidebar via-sidebar to-sidebar-accent backdrop-blur-sm hover:scale-[1.02] transform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-sidebar-foreground">{param.name}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold text-sidebar-foreground">
                  {param.value}
                </div>
                {param.unit && (
                  <div className="text-sm text-sidebar-foreground/70">
                    {param.unit}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-sidebar-foreground/70">
                {param.fullName}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
