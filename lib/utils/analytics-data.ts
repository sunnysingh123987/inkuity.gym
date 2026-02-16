// Analytics Data Transformation Utilities
// Converts database results to chart-ready formats

import { format, parseISO } from 'date-fns';

// ============================================================
// RECHARTS FORMAT TRANSFORMERS
// ============================================================

export function transformCheckInTrends(data: { date: string; count: number }[]) {
  return data.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    checkIns: item.count,
  }));
}

export function transformMemberGrowth(
  data: { date: string; newMembers: number; returningMembers: number }[]
) {
  return data.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    newMembers: item.newMembers,
    returningMembers: item.returningMembers,
  }));
}

export function transformPeakHours(data: { hour: number; count: number }[]) {
  return data.map((item) => ({
    hour: `${item.hour}:00`,
    checkIns: item.count,
  }));
}

export function transformDeviceBreakdown(
  data: { name: string; value: number; percentage: number }[]
) {
  return data.map((item) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
  }));
}

// ============================================================
// CALCULATIONS
// ============================================================

export function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function aggregateHourlyData(
  checkIns: { check_in_at: string }[]
): { hour: number; count: number }[] {
  const hourMap = new Map<number, number>();

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, 0);
  }

  // Count check-ins per hour
  checkIns.forEach((checkIn) => {
    const hour = new Date(checkIn.check_in_at).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  return Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count }));
}

export function formatDeviceStats(
  scans: { device_type: string }[]
): { name: string; value: number; percentage: number }[] {
  const deviceMap = new Map<string, number>();
  let total = 0;

  scans.forEach((scan) => {
    const device = scan.device_type || 'Unknown';
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    total++;
  });

  return Array.from(deviceMap.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: total > 0 ? Math.round((value / total) * 100) : 0,
  }));
}

// ============================================================
// DATE RANGE HELPERS
// ============================================================

export function getDateRangePreset(preset: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
}

export function formatDateRange(start: Date, end: Date): string {
  return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
}
