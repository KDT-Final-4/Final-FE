import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Trend } from "./pages/trend/Trend";
import { LoginPage } from "./pages/LoginPage";
import { ConfigurationPage } from "./pages/Configuration";
import { LogsPage } from "./pages/Logs";
import { ReportsPage } from "./pages/Reports";
import { ProfilePage } from "./pages/Profile";

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
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
