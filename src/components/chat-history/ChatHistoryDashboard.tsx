/**
 * ChatHistoryDashboard — Full-page session browser for chat history.
 * Reads sessions from localStorage (same keys as CampaignChatPage)
 * and provides search, date filtering, and session navigation.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, MessageSquare, Plus } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
  tdllmChatId?: string;
}

type DateFilter = 'all' | 'today' | 'yesterday' | '7days' | '30days';

const CHAT_SESSIONS_KEY = 'pm_chat_sessions';

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
];

function matchesDateFilter(timestamp: Date, filter: DateFilter): boolean {
  if (filter === 'all') return true;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ts = new Date(timestamp);

  switch (filter) {
    case 'today':
      return ts >= startOfToday;
    case 'yesterday': {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      return ts >= startOfYesterday && ts < startOfToday;
    }
    case '7days': {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return ts >= sevenDaysAgo;
    }
    case '30days': {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return ts >= thirtyDaysAgo;
    }
    default:
      return true;
  }
}

export default function ChatHistoryDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_KEY);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved).map(
          (s: ChatSession & { timestamp: string }) => ({
            ...s,
            timestamp: new Date(s.timestamp),
          })
        );
        setSessions(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Text search
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const titleMatch = (session.title || '').toLowerCase().includes(q);
        const previewMatch = (session.preview || '').toLowerCase().includes(q);
        if (!titleMatch && !previewMatch) return false;
      }
      // Date filter
      if (!matchesDateFilter(session.timestamp, dateFilter)) return false;
      return true;
    });
  }, [sessions, searchFilter, dateFilter]);

  const handleSelectSession = (session: ChatSession) => {
    navigate(`/campaign-chat?sessionId=${encodeURIComponent(session.id)}`);
  };

  const handleNewChat = () => {
    navigate('/campaign-chat', { state: { resetId: Date.now() } });
  };

  return (
    <div className="h-full flex flex-col px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-xl font-semibold text-gray-800">Chat History</h1>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-[#3B6FD4] rounded-lg cursor-pointer text-sm font-medium text-white border-none transition-colors hover:bg-[#2a5fc4]"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search + Date Filters */}
      <div className="flex flex-col gap-3 mb-5 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm focus-within:border-[#3B6FD4] focus-within:shadow-[0_0_0_3px_rgba(59,111,212,0.1)]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="flex-1 border-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="bg-transparent border-none cursor-pointer p-0.5 flex items-center justify-center rounded-full hover:bg-gray-200"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DATE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDateFilter(option.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                dateFilter === option.value
                  ? 'border-[#3B6FD4] bg-blue-50 text-[#3B6FD4]'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-[#3B6FD4] hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Clock className="w-10 h-10 mb-3" />
            <span className="text-sm">No chat history yet</span>
            <span className="text-xs mt-1 text-gray-300">
              Start a conversation in Campaign Chat to see it here
            </span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search className="w-10 h-10 mb-3" />
            <span className="text-sm">No matching chats found</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session)}
                className="w-full text-left px-4 py-3.5 rounded-xl cursor-pointer transition-all border-none bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {session.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {session.preview}
                    </div>
                    <div className="text-[11px] text-gray-300 mt-1">
                      {new Date(session.timestamp).toLocaleDateString()} &middot;{' '}
                      {session.messageCount} messages
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
