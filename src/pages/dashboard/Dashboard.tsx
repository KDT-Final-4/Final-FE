import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { ConsumptionChart } from "../../components/ConsumptionChart";
import { DemandChart } from "../../components/DemandChart";
import { EnergyParameters } from "../../components/EnergyParameters";
import { EnhancedFilterSection } from "../trend/EnhancedFilterSection";

type UserMeResponse = {
  userId?: number;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  isDelete?: boolean;
};

type DashboardStatusResponse = {
  allClicks?: number;
  allViews?: number;
  visitors?: number;
  averageDwellTime?: number;
};

type ContentsCountResponse = {
  contentsCount?: number;
};

export function Dashboard() {
  const [selectedFilterType, setSelectedFilterType] = useState<"device" | "virtual-group">("device");
  const [selectedDevice, setSelectedDevice] = useState("device-1");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [dataMode, setDataMode] = useState("real-time");
  const [selectedDay, setSelectedDay] = useState("today");
  const [userName, setUserName] = useState("");
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null);
  const [contentsCount, setContentsCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveName = (data: UserMeResponse) =>
      data.name || data.email || "";

    const fetchUserName = async () => {
      const endpoint = "/api/user/me";

      try {
        console.log("[Dashboard] fetching user info from", endpoint);
        const response = await fetch(endpoint, { credentials: "include" });
        console.log("[Dashboard] response status", endpoint, response.status);

        const contentType = response.headers.get("content-type") || "unknown";
        if (!response.ok) {
          console.error("[Dashboard] non-OK response", endpoint, response.status, contentType);
          return;
        }

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          console.error("[Dashboard] expected JSON but got", contentType, endpoint, text.slice(0, 200));
          return;
        }

        const data: UserMeResponse = await response.json();
        console.log("[Dashboard] response payload", endpoint, data);
        const nameFromApi = resolveName(data);

        if (nameFromApi && isMounted) {
          setUserName(nameFromApi);
          return;
        }
      } catch (error) {
        console.error("[Dashboard] failed to fetch user info from", endpoint, error);
      }

      if (isMounted) {
        setUserName((current) => current || "사용자");
      }
    };

    fetchUserName();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      const statusEndpoint = "/api/dashboard/status";
      const contentsCountEndpoint = "/api/dashboard/contents/count";

      try {
        console.log("[Dashboard] fetching status from", statusEndpoint);
        console.log("[Dashboard] fetching contents count from", contentsCountEndpoint);

        const [statusResponse, contentsCountResponse] = await Promise.all([
          fetch(statusEndpoint, { credentials: "include" }),
          fetch(contentsCountEndpoint, { credentials: "include" }),
        ]);

        const statusContentType = statusResponse.headers.get("content-type") || "unknown";
        if (statusResponse.ok && statusContentType.includes("application/json")) {
          const statusData: DashboardStatusResponse = await statusResponse.json();
          console.log("[Dashboard] status payload", statusEndpoint, statusData);
          if (isMounted) {
            setDashboardStatus(statusData);
          }
        } else {
          console.error("[Dashboard] failed to fetch status", statusEndpoint, statusResponse.status, statusContentType);
        }

        const contentsContentType = contentsCountResponse.headers.get("content-type") || "unknown";
        if (contentsCountResponse.ok && contentsContentType.includes("application/json")) {
          const countData: ContentsCountResponse = await contentsCountResponse.json();
          console.log("[Dashboard] contents count payload", contentsCountEndpoint, countData);
          if (isMounted && typeof countData.contentsCount === "number") {
            setContentsCount(countData.contentsCount);
          }
        } else {
          console.error("[Dashboard] failed to fetch contents count", contentsCountEndpoint, contentsCountResponse.status, contentsContentType);
        }
      } catch (error) {
        console.error("[Dashboard] failed to fetch dashboard data", error);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyFilters = () => {
    // In a real application, this would trigger data fetching
    console.log("Applying filters:", {
      filterType: selectedFilterType,
      device: selectedDevice,
      devices: selectedDevices,
      dataMode,
      selectedDay,
    });
  };

  const handleFilterTypeChange = (type: "device" | "virtual-group") => {
    setSelectedFilterType(type);
    if (type === "device") {
      setSelectedDevice("device-1");
      setSelectedDevices([]);
    } else {
      setSelectedDevice("group-production");
      setSelectedDevices([]);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">안녕하세요, {userName || "사용자"}! 👋</h1>
              <p className="text-muted-foreground mt-1">
                What are you looking for today?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5">
                <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                Real-time monitoring active
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Section */}
        <EnhancedFilterSection
          selectedFilterType={selectedFilterType}
          selectedDevice={selectedDevice}
          selectedDevices={selectedDevices}
          dataMode={dataMode}
          selectedDay={selectedDay}
          onFilterTypeChange={handleFilterTypeChange}
          onDeviceChange={setSelectedDevice}
          onDevicesChange={setSelectedDevices}
          onDataModeChange={setDataMode}
          onDayChange={setSelectedDay}
          onApplyFilters={handleApplyFilters}
        />

        {/* Energy Parameters */}
        <EnergyParameters 
          dataMode={dataMode} 
          selectedDevice={selectedFilterType === "device" ? selectedDevice : selectedDevices.join(",")} 
          totalViews={dashboardStatus?.allClicks}
          contentsCount={contentsCount ?? undefined}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consumption Overview */}
          <ConsumptionChart 
            selectedDay={selectedDay} 
            selectedDevice={selectedFilterType === "device" ? selectedDevice : selectedDevices.join(",")} 
          />
          
          {/* Max vs Actual Demand */}
          <DemandChart dataMode={dataMode} selectedDay={selectedDay} />
        </div>
      </div>
    </div>
  );
}
