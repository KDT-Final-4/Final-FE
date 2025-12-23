import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "./ui/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  FileText, 
  Zap,
  X,
  Logs,
  LogOut,
  Calendar1,
} from "lucide-react";
import { apiFetch } from "../apiClient";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNavigationClick = (path: string) => {
    if (!isExpanded) {
      setIsExpanded(true);
      // Delay the page change to allow expansion animation
      setTimeout(() => navigate(path), 150);
    } else {
      navigate(path);
    }
  };
  
  const navigationItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      name: "대시보드",
      icon: LayoutDashboard,
      description: "Overview & monitoring"
    },
    {
      id: "trend",
      path: "/trend",
      name: "트렌드", 
      icon: BarChart3,
      description: "Current trends"
    },
    {
      id: "reports",
      path: "/reports",
      name: "검수",
      icon: FileText,
      description: "Review reports"
    },
    {
      id: "schedule",
      path: "/schedule",
      name: "스케줄",
      icon: Calendar1,
      description: "Reservation Content"
    },
    {
      id: "logs",
      path: "/logs",
      name: "로그",
      icon: Logs,
      description: "Upload contents log"
    },
    {
      id: "configuration",
      path: "/configuration",
      name: "설정",
      icon: Settings,
      description: "System settings"
    }
  ];

  const displayName = userName || userEmail || "";
  const initials =
    displayName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    let active = true;

    const fetchUser = async () => {
      try {
        const { getApiUrl, getApiOptions } = await import("../utils/api");
        const response = await fetch(getApiUrl("/api/user/me"), getApiOptions());
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          console.error("[Sidebar] unexpected content-type for /api/user/me", contentType);
          return;
        }
        if (!response.ok) {
          console.error("[Sidebar] failed to fetch /api/user/me", response.status);
          return;
        }
        const data = await response.json();
        if (!active) return;
        setUserName(data?.name ?? "");
        setUserEmail(data?.email ?? "");
      } catch (error) {
        console.error("[Sidebar] error fetching /api/user/me", error);
      }
    };

    fetchUser();

    return () => {
      active = false;
    };
  }, []);

  const handleProfileClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
    navigate("/profile");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("isAuthenticated");
    } catch (error) {
      console.error("[Sidebar] failed to clear auth flag", error);
    }
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="ml-6 my-6">
      <div 
        className={cn(
          "flex flex-col h-[calc(100vh-3rem)] transition-all duration-300 ease-in-out rounded-3xl",
          "bg-gradient-to-b from-sidebar via-sidebar to-sidebar-accent shadow-2xl border border-sidebar-border/20 overflow-hidden",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        {/* Header with Logo */}
        <div className="p-6 flex flex-col items-center relative">
          {/* Close button when expanded */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <X className="w-4 h-4 text-sidebar-foreground" />
            </button>
          )}
          
          <div className="w-12 h-12 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          {isExpanded && (
            <div className="mt-3 text-center">
              <h2 className="text-sidebar-foreground font-semibold text-base whitespace-nowrap">
                AURA
              </h2>
              <p className="text-sidebar-foreground/70 text-xs whitespace-nowrap mt-1">

              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavigationClick(item.path)}
                    className={cn(
                      "transition-all duration-300 flex items-center relative overflow-hidden",
                      "hover:scale-110 hover:shadow-lg",
                      isExpanded 
                        ? "w-full px-4 py-3 justify-start rounded-xl" 
                        : "w-12 h-12 justify-center mx-auto rounded-full",
                      isActive
                        ? "bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/30 scale-105"
                        : "bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 hover:from-sidebar-primary/80 hover:to-sidebar-primary/60"
                    )}
                  >
                    <Icon className={cn(
                      "transition-colors duration-300 flex-shrink-0",
                      "w-5 h-5",
                      isActive 
                        ? "text-sidebar-primary-foreground" 
                        : "text-sidebar-accent-foreground group-hover:text-sidebar-primary-foreground"
                    )} />
                    
                    {isExpanded && (
                      <div className="ml-3 overflow-hidden">
                        <div className={cn(
                          "font-medium text-sm whitespace-nowrap transition-colors duration-300",
                          isActive 
                            ? "text-sidebar-primary-foreground" 
                            : "text-sidebar-accent-foreground group-hover:text-sidebar-primary-foreground"
                        )}>
                          {item.name}
                        </div>
                        {isActive && (
                          <div className="text-xs text-sidebar-primary-foreground/70 mt-0.5 whitespace-nowrap">
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Active indicator */}
                    {isActive && !isExpanded && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-sidebar-primary opacity-20 animate-pulse" />
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-l-full" />
                      </>
                    )}
                    
                    {/* Active indicator for expanded state */}
                    {isActive && isExpanded && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-sidebar-primary-foreground rounded-full animate-pulse" />
                    )}
                  </button>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs opacity-75 mt-1">{item.description}</div>
                      {/* Tooltip arrow */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-sidebar-primary rotate-45" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 flex justify-center">
          <div className="relative group">
            <button type="button" onClick={handleProfileClick}
              className="w-12 h-12 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer border border-sidebar-primary/40">
              <span className="text-sidebar-primary-foreground font-semibold text-sm">
                {initials}
              </span>
            </button>

            {!isExpanded && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0">
               
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-sidebar-primary rotate-45" />
              </div>
            )}
            
            {/* Profile info for expanded state */}
            {isExpanded && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-center">
                <div className="text-sidebar-foreground font-medium text-sm whitespace-nowrap">
                  {displayName}
                </div>
                <div className="text-sidebar-foreground/70 text-xs whitespace-nowrap">
                  {userEmail || "프로필로 이동"}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className="w-12 h-12 bg-sidebar-accent rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer border border-sidebar-border/40"
            aria-label="로그아웃"
          >
            <LogOut className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
