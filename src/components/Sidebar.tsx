import {
  LayoutDashboard,
  TrendingUp,
  FileCheck,
  Settings,
  MessageSquare,
  FileText,
  Upload,
  Bell,
} from "lucide-react";
import { cn } from "../lib/utils";

type Page =
  | "dashboard"
  | "trends"
  | "review"
  | "llm-settings"
  | "platform-settings"
  | "notifications"
  | "logs";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
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
];

const systemItems = [
  { id: "logs" as Page, label: "로그 뷰어", icon: FileText },
];

export function Sidebar({
  currentPage,
  onPageChange,
}: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-gray-900">AURA</h1>
        <p className="text-gray-500 mt-1">
          Automated Update & Review Assistant
        </p>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-gray-900">관리자</div>
            <div className="text-gray-500">
              admin@example.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}