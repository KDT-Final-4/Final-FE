import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/users/LoginPage";

const Dashboard = lazy(() =>
  import("./pages/dashboard/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Trend = lazy(() => import("./pages/trend/Trend").then((module) => ({ default: module.Trend })));
const ConfigurationPage = lazy(() =>
  import("./pages/configuration/Configuration").then((module) => ({ default: module.ConfigurationPage })),
);
const LogsPage = lazy(() => import("./pages/log/LogsPage").then((module) => ({ default: module.LogsPage })));
const ReportsPage = lazy(() => import("./pages/report/Reports").then((module) => ({ default: module.ReportsPage })));
const SchedulePage = lazy(() =>
  import("./pages/schedule/SchedulePage").then((module) => ({ default: module.SchedulePage })),
);
const ProfilePage = lazy(() => import("./pages/users/Profile").then((module) => ({ default: module.ProfilePage })));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const handleLogin = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">로딩 중...</div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="trend" element={<Trend />} />
            <Route path="configuration" element={<ConfigurationPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
