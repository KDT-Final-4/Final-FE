import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrendAnalysis } from './components/TrendAnalysis';
import { ContentReview } from './components/ContentReview';
import { LLMSettings } from './components/LLMSettings';
import { PlatformSettings } from './components/PlatformSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { SystemLogs } from './components/SystemLogs';

type Page = 'dashboard' | 'trends' | 'review' | 'llm-settings' | 'platform-settings' | 'notifications' | 'logs';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

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
      case 'logs':
        return <SystemLogs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}