// Dashboard Stats Cards Component
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, QrCode, Scan } from 'lucide-react';

interface StatsCardsProps {
  totalScans: number;
  uniqueVisitors: number;
  todayScans: number;
  weekScans: number;
  topQRCode: { name: string; scans: number } | null;
}

export function StatsCards({
  totalScans,
  uniqueVisitors,
  todayScans,
  weekScans,
  topQRCode,
}: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Scans',
      value: totalScans.toLocaleString(),
      description: 'All time',
      icon: Scan,
      trend: null,
    },
    {
      title: "Today's Scans",
      value: todayScans.toLocaleString(),
      description: 'Last 24 hours',
      icon: TrendingUp,
      trend: todayScans > 0 ? `+${todayScans}` : '0',
    },
    {
      title: 'This Week',
      value: weekScans.toLocaleString(),
      description: 'Last 7 days',
      icon: TrendingUp,
      trend: weekScans > 0 ? `+${weekScans}` : '0',
    },
    {
      title: 'Top QR Code',
      value: topQRCode?.scans.toLocaleString() || '0',
      description: topQRCode?.name || 'No scans yet',
      icon: QrCode,
      trend: null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
              {card.trend && (
                <span className="ml-1 text-green-600">{card.trend}</span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
