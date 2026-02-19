/**
 * Chat History Page — Route-level wrapper for the ChatHistoryDashboard.
 */

import ChatHistoryDashboard from '../components/chat-history/ChatHistoryDashboard';

export default function ChatHistoryPage() {
  return (
    <div className="h-full overflow-auto">
      <ChatHistoryDashboard />
    </div>
  );
}
