import { useState } from 'react';
import { Sidebar, type Page } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrendAnalysis } from './components/TrendAnalysis';
import { ContentReview } from './components/ContentReview';
import { LLMSettings } from './components/LLMSettings';
import { PlatformSettings } from './components/PlatformSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { SystemLogs } from './components/SystemLogs';
import { ScheduleSettings } from './components/ScheduleSettings';
import { Schedule } from './components/Schedule';
import { MyPage } from './components/MyPage';
import Login from './components/Login';
import Signup from './components/Signup';
import { isAuthenticated, logout } from './lib/auth';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'trends':
        return <TrendAnalysis />;
      case 'review':
        return <ContentReview />;
      case 'llm-settings':
        return <LLMSettings />;
      case 'platform-settings':
        return <PlatformSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'schedule-settings':
        return <ScheduleSettings />;
      case 'schedule':
        return <Schedule />;
      case 'my-page':
        return <MyPage />;
      case 'logs':
        return <SystemLogs />;
      default:
        return <Dashboard />;
    }
  };

  if (!authed) {
    if (authPage === 'signup') {
      return (
        <Signup
          onSuccess={() => setAuthPage('login')}
          onSwitchToLogin={() => setAuthPage('login')}
        />
      );
    }
    return (
      <Login
        onSuccess={() => setAuthed(true)}
        onSwitchToSignup={() => setAuthPage('signup')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={(p) => setCurrentPage(p)}
        onLogout={() => {
          logout();
          setAuthed(false);
          setAuthPage('login');
        }}
      />
      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}
