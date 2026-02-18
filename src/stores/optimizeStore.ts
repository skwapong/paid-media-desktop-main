/**
 * Optimize Store — Zustand store for live campaign optimization data.
 * Manages in-flight campaign metrics, alerts, and optimization actions.
 */

import { create } from 'zustand';
import type {
  LiveCampaign,
  OptimizationAlert,
  OptimizationAction,
  OptimizationDashboardData,
  ChannelPerformance,
  AudienceSegment,
} from '../types/optimize';

interface OptimizeState {
  campaigns: LiveCampaign[];
  alerts: OptimizationAlert[];
  actions: OptimizationAction[];
  channelPerformance: ChannelPerformance[];
  audienceSegments: AudienceSegment[];
  summary: {
    totalBudget: number;
    totalSpent: number;
    overallRoas: number;
    totalConversions: number;
    activeCampaigns: number;
  };
  selectedCampaignId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDashboardData: (data: OptimizationDashboardData) => void;
  setCampaigns: (campaigns: LiveCampaign[]) => void;
  setAlerts: (alerts: OptimizationAlert[]) => void;
  dismissAlert: (id: string) => void;
  addAction: (action: OptimizationAction) => void;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  selectCampaign: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOptimizeStore = create<OptimizeState>((set) => ({
  campaigns: [],
  alerts: [],
  actions: [],
  channelPerformance: [],
  audienceSegments: [],
  summary: {
    totalBudget: 0,
    totalSpent: 0,
    overallRoas: 0,
    totalConversions: 0,
    activeCampaigns: 0,
  },
  selectedCampaignId: null,
  isLoading: false,
  error: null,

  setDashboardData: (data) =>
    set({
      campaigns: data.campaigns,
      alerts: data.alerts,
      channelPerformance: data.channelPerformance,
      audienceSegments: data.audienceSegments,
      summary: data.summary,
    }),

  setCampaigns: (campaigns) => set({ campaigns }),

  setAlerts: (alerts) => set({ alerts }),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, isDismissed: true } : a
      ),
    })),

  addAction: (action) =>
    set((state) => ({ actions: [...state.actions, action] })),

  approveAction: (id) =>
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a
      ),
    })),

  rejectAction: (id) =>
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a
      ),
    })),

  selectCampaign: (id) => set({ selectedCampaignId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
