import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import {
  getMemberCheckInHistory,
  getMemberCheckInStats,
  getMemberStreak,
} from '@/lib/actions/members-portal';
import { CheckInHistoryTable } from '@/components/member-portal/check-ins/check-in-history-table';
import { CheckInCalendar } from '@/components/member-portal/check-ins/check-in-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function CheckInsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  // Fetch check-in data
  const { data: checkIns } = await getMemberCheckInHistory(
    memberId,
    gymId
  );

  // Fetch stats
  const { stats } = await getMemberCheckInStats(
    memberId,
    gymId
  );

  // Fetch streak
  const { streak } = await getMemberStreak(memberId, gymId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-in History</h1>
        <p className="text-gray-600 mt-1">
          Track your gym attendance and build streaks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Check-ins
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.thisMonth}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.thisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Streak
            </CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {streak} {streak === 1 ? 'day' : 'days'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {streak > 0 ? 'Keep it up!' : 'Start your streak'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Table vs Calendar View */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-6">
          <CheckInHistoryTable
            checkIns={checkIns || []}
            memberId={memberId}
            gymId={gymId}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CheckInCalendar
            memberId={memberId}
            gymId={gymId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
