'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoutineCard } from '@/components/member-portal/workouts/routine-card';
import { PRTracker } from '@/components/member-portal/personal-records/pr-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { getUiSvg } from '@/lib/svg-icons';
import Link from 'next/link';
import type { PersonalRecord } from '@/types/database';

interface TrackersPageContentProps {
  routines: any[];
  sessions: any[];
  records: PersonalRecord[];
  prSummary: any[];
  memberId: string;
  gymId: string;
  gymSlug: string;
  initialTab?: string;
}

const VALID_TABS = ['routines', 'sessions', 'prs'];

export function TrackersPageContent({
  routines,
  sessions,
  records,
  prSummary,
  memberId,
  gymId,
  gymSlug,
  initialTab,
}: TrackersPageContentProps) {
  const router = useRouter();
  const defaultTab = VALID_TABS.includes(initialTab || '') ? initialTab! : 'routines';

  const handleTabChange = (value: string) => {
    router.replace(`/${gymSlug}/portal/trackers?tab=${value}`, { scroll: false });
  };

  const activeRoutines = routines.filter((r) => r.is_active);
  const inactiveRoutines = routines.filter((r) => !r.is_active);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trackers</h1>
        <p className="text-slate-400 mt-1">
          Track your workouts, sessions, and personal records
        </p>
      </div>

      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="routines" className="flex items-center gap-2">
            <img src={getUiSvg('workouts')} alt="" className="h-4 w-4 opacity-80" />
            <span className="hidden sm:inline">Routines</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <img src={getUiSvg('sessions')} alt="" className="h-4 w-4 opacity-80" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="prs" className="flex items-center gap-2">
            <img src={getUiSvg('personal-record')} alt="" className="h-4 w-4 opacity-80" />
            <span className="hidden sm:inline">PR Tracker</span>
          </TabsTrigger>
        </TabsList>

        {/* Routines Tab */}
        <TabsContent value="routines" className="space-y-6">
          <div className="flex justify-end">
            <Link href={`/${gymSlug}/portal/workouts/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Routine
              </Button>
            </Link>
          </div>

          {activeRoutines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-300 mb-4">
                Active Routines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    gymSlug={gymSlug}
                  />
                ))}
              </div>
            </div>
          )}

          {inactiveRoutines.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-500 mb-4">
                Inactive Routines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    gymSlug={gymSlug}
                  />
                ))}
              </div>
            </div>
          )}

          {routines.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-cyan-500/10 mb-4">
                <img src={getUiSvg('workouts')} alt="" className="h-8 w-8 opacity-80" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No workout routines yet
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Create your first workout routine to start tracking your exercises
                and progress
              </p>
              <Link href={`/${gymSlug}/portal/workouts/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Routine
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((workoutSession) => {
                const routineData = workoutSession.workout_routines as any;
                const routineName = Array.isArray(routineData)
                  ? routineData[0]?.name
                  : routineData?.name;

                return (
                  <Link
                    key={workoutSession.id}
                    href={`/${gymSlug}/portal/sessions/${workoutSession.id}`}
                  >
                    <Card className="bg-slate-900 border-slate-800 hover:bg-slate-800/70 transition-colors cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-white">
                                {routineName || 'Workout Session'}
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(workoutSession.started_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-12 text-center">
                <img src={getUiSvg('sessions')} alt="" className="h-12 w-12 opacity-50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No workout sessions yet
                </h3>
                <p className="text-slate-400">
                  Start a workout routine to see your sessions here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PR Tracker Tab */}
        <TabsContent value="prs">
          <PRTracker
            records={records}
            summary={prSummary}
            memberId={memberId}
            gymId={gymId}
            gymSlug={gymSlug}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
