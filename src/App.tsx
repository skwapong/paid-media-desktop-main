import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CampaignChatPage from './pages/CampaignChatPage';
import CampaignLandingPage from './components/campaign/CampaignLandingPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import OptimizeDashboardPage from './pages/OptimizeDashboardPage';
import UnifiedViewPage from './pages/UnifiedViewPage';
import ReportsDashboardPage from './pages/ReportsDashboardPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import SettingsPage from './pages/SettingsPage';
import DebugPanel from './components/DebugPanel';

console.log('📱 App component loaded');

function App() {
  // Defer logging to avoid setState-during-render warnings
  useEffect(() => {
    console.log('🎨 App component rendered');
  }, []);

  try {
    return (
      <>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<CampaignLandingPage />} />
              <Route path="/campaign-chat" element={<CampaignChatPage />} />
              <Route path="/unified" element={<UnifiedViewPage />} />
              <Route path="/chat-history" element={<ChatHistoryPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="/optimize" element={<OptimizeDashboardPage />} />
              <Route path="/reports" element={<ReportsDashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
        <DebugPanel />
      </>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    throw error; // Re-throw to be caught by ErrorBoundary
  }
}

export default App;
