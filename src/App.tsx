import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let recent401: number[] = [];
    const GRACE_MS = 5000; // ignore 401s within 5s of login
    const BURST_MS = 3000; // observe 401 bursts in this window
    const BURST_COUNT = 2; // require at least 2 in window

    const handler = (e: Event) => {
      const ev = e as CustomEvent<any>;
      const d = ev.detail || {};
      const path: string = d.path || '';
      const hasToken: boolean = !!d.hasToken;
      const hasWwwAuth: boolean = !!d.hasWwwAuth;
      const code: string | undefined = d.code;
      const message: string = d.message || '';

      // exclude auth endpoints
      if (path.startsWith('/auth/') || path.startsWith('/user/register')) return;

      // grace period after login
      const lastLoginAt = Number(localStorage.getItem('last_login_at') || '0');
      if (lastLoginAt && Date.now() - lastLoginAt < GRACE_MS) return;

      const keywordHit = /unauthorized|invalid token|expired|login required|authentication required/i.test(
        message || '',
      );
      const codeHit = ['UNAUTHORIZED', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'AUTHENTICATION_FAILED'].includes(
        (code || '').toUpperCase(),
      );

      const strongAuthFailure = !hasToken || hasWwwAuth || keywordHit || codeHit || path === '/user/me';

      // burst control
      const now = Date.now();
      recent401 = recent401.filter((t) => now - t < BURST_MS);
      recent401.push(now);
      const burstHit = recent401.length >= BURST_COUNT;

      if (strongAuthFailure && burstHit) {
        setAuthed(false);
        setAuthPage('login');
      }
    };
    window.addEventListener('app:unauthorized', handler as EventListener);
    return () => window.removeEventListener('app:unauthorized', handler as EventListener);
  }, []);

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
        onSuccess={() => {
          localStorage.setItem('last_login_at', String(Date.now()));
          setAuthed(true);
        }}
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
