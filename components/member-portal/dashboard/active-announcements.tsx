import { Announcement } from '@/types/database';
import {
  AlertTriangle,
  AlertCircle,
  PartyPopper,
  DoorClosed,
  Info,
} from 'lucide-react';

interface ActiveAnnouncementsProps {
  announcements: Announcement[];
}

const TYPE_CONFIG: Record<
  Announcement['type'],
  {
    icon: typeof Info;
    bgClass: string;
    borderClass: string;
    iconClass: string;
    titleClass: string;
  }
> = {
  emergency: {
    icon: AlertCircle,
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    iconClass: 'text-red-500',
    titleClass: 'text-red-800',
  },
  closure: {
    icon: DoorClosed,
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    iconClass: 'text-amber-500',
    titleClass: 'text-amber-800',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    iconClass: 'text-amber-500',
    titleClass: 'text-amber-800',
  },
  holiday: {
    icon: PartyPopper,
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    iconClass: 'text-purple-500',
    titleClass: 'text-purple-800',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    iconClass: 'text-blue-500',
    titleClass: 'text-blue-800',
  },
};

export function ActiveAnnouncements({ announcements }: ActiveAnnouncementsProps) {
  if (!announcements || announcements.length === 0) return null;

  // Sort: emergency and closure first
  const priorityOrder: Record<string, number> = {
    emergency: 0,
    closure: 1,
    warning: 2,
    holiday: 3,
    info: 4,
  };

  const sorted = [...announcements].sort(
    (a, b) => (priorityOrder[a.type] ?? 5) - (priorityOrder[b.type] ?? 5)
  );

  return (
    <div className="space-y-3">
      {sorted.map((a) => {
        const config = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
        const Icon = config.icon;

        return (
          <div
            key={a.id}
            className={`rounded-xl border p-4 ${config.bgClass} ${config.borderClass}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <Icon className={`h-5 w-5 ${config.iconClass}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`text-sm font-semibold ${config.titleClass}`}>
                  {a.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{a.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
