import type { Gym } from '@/types/database';

export interface DashboardWidgetSettings {
  statsCards: boolean;
  liveCheckIns: boolean;
  recentMembers: boolean;
  paymentSummary: boolean;
  workoutSessions: boolean;
  reviews: boolean;
  feedback: boolean;
}

export const DEFAULT_WIDGET_SETTINGS: DashboardWidgetSettings = {
  statsCards: true,
  liveCheckIns: true,
  recentMembers: true,
  paymentSummary: true,
  workoutSessions: true,
  reviews: true,
  feedback: true,
};

export function getDashboardSettings(gym: Gym | null): DashboardWidgetSettings {
  if (!gym) return DEFAULT_WIDGET_SETTINGS;
  const settings = (gym.settings as any)?.dashboard_widgets;
  if (!settings) return DEFAULT_WIDGET_SETTINGS;
  return { ...DEFAULT_WIDGET_SETTINGS, ...settings };
}
