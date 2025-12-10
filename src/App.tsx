import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Trend } from "./pages/trend/Trend";
import { LoginPage } from "./pages/users/LoginPage";
import { ProfilePage } from "./pages/users/Profile";
import { ConfigurationPage } from "./pages/configuration/Configuration";
import { LogsPage } from "./pages/log/LogsPage";
import { ReportsPage } from "./pages/report/Reports";
import { SchedulePage } from "./pages/schedule/SchedulePage"

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
    </BrowserRouter>
  );
}
