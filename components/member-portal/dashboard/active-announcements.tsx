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
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    iconClass: 'text-red-400',
    titleClass: 'text-red-300',
  },
  closure: {
    icon: DoorClosed,
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    iconClass: 'text-amber-400',
    titleClass: 'text-amber-300',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    iconClass: 'text-amber-400',
    titleClass: 'text-amber-300',
  },
  holiday: {
    icon: PartyPopper,
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    iconClass: 'text-purple-400',
    titleClass: 'text-purple-300',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    iconClass: 'text-blue-400',
    titleClass: 'text-blue-300',
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
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gym Announcements</p>
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
                <p className="text-sm text-slate-400 mt-1">{a.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
