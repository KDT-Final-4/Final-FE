import {
  LayoutDashboard,
  TrendingUp,
  FileCheck,
  Settings,
  MessageSquare,
  FileText,
  Upload,
  Bell,
  Clock,
} from "lucide-react";
import { cn } from "../lib/utils";
import auraLogo from "../../img/AURA-LOGO.png";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Page =
  | "dashboard"
  | "trends"
  | "review"
  | "schedule"
  | "llm-settings"
  | "platform-settings"
  | "notifications"
  | "schedule-settings"
  | "my-page"
  | "logs";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout?: () => void;
}

const navItems = [
  {
    id: "dashboard" as Page,
    label: "대시보드",
    icon: LayoutDashboard,
  },
  {
    id: "trends" as Page,
    label: "인기 검색어",
    icon: TrendingUp,
  },
  {
    id: "review" as Page,
    label: "콘텐츠 검수",
    icon: FileCheck,
  },
  {
    id: "schedule" as Page,
    label: "스케줄 관리",
    icon: Clock,
  },
];

const settingsItems = [
  {
    id: "llm-settings" as Page,
    label: "LLM 설정",
    icon: MessageSquare,
  },
  {
    id: "platform-settings" as Page,
    label: "업로드 플랫폼",
    icon: Upload,
  },
  { id: "notifications" as Page, label: "알림", icon: Bell },
  { id: "schedule-settings" as Page, label: "스케쥴", icon: Clock },
];

const systemItems = [
  { id: "logs" as Page, label: "로그 뷰어", icon: FileText },
];

export function Sidebar({
  currentPage,
  onPageChange,
  onLogout,
}: SidebarProps) {
  const [userName, setUserName] = useState<string>("관리자");
  const [userEmail, setUserEmail] = useState<string>("admin@example.com");

  useEffect(() => {
    let ignore = false;
    api
      .get<{ userId: number; email: string; name: string }>("/user/me")
      .then((u) => {
        if (ignore) return;
        if (u?.name) setUserName(u.name);
        if (u?.email) setUserEmail(u.email);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      ignore = true;
    };
  }, []);
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div>
            <img src={auraLogo} alt="AURA" className="h-12 w-auto object-contain" />
            {/* <h1 className="text-gray-900">AURA</h1>
            <p className="text-gray-500">Automated Update & Review Assistant</p> */}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div>
          <div className="px-3 mb-2">
            <span className="text-gray-500">메인</span>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 mb-2">
            <span className="text-gray-500">설정</span>
          </div>
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 mb-2">
            <span className="text-gray-500">시스템</span>
          </div>
          <div className="space-y-1">
            {systemItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPageChange("my-page")}
              className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
              title="마이페이지"
            >
              <Settings className="w-5 h-5 text-blue-600" />
            </button>
            <div>
              <div className="text-gray-900">{userName}</div>
              <div className="text-gray-500">{userEmail}</div>
              <button
                onClick={onLogout}
                className="mt-2 px-3 py-1 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                로그아웃
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}