import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendPushNotification, type PushPayload } from '@/lib/push/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Hourly cron job to send push reminders for:
 * 1. Upcoming meals (scheduled in next 30 min, not completed)
 * 2. Workout days (today's day in routine schedule, active routines)
 * 3. Tracker reminders (evening check — incomplete daily targets)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const results = { meals: 0, workouts: 0, trackers: 0, errors: [] as string[] };

  // ── 1. Meal Reminders ──
  try {
    const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    const { data: upcomingMeals } = await supabase
      .from('meal_plans')
      .select(`
        id, name, meal_type, scheduled_for,
        diet_plans!inner (
          id, member_id, gym_id,
          members!inner ( id, metadata )
        )
      `)
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', thirtyMinFromNow.toISOString())
      .eq('completed', false);

    if (upcomingMeals) {
      for (const meal of upcomingMeals) {
        const dietPlan = meal.diet_plans as any;
        const member = dietPlan?.members;
        if (!member) continue;

        const prefs = member.metadata?.notification_preferences;
        if (!prefs?.push_enabled || prefs?.push_meal_reminders === false) continue;

        const memberId = member.id;
        const gymId = dietPlan.gym_id;

        // Get push subscriptions
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('member_id', memberId);

        if (!subs || subs.length === 0) continue;

        const mealLabel = meal.meal_type
          ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)
          : 'Meal';

        const payload: PushPayload = {
          title: `Time for ${mealLabel}`,
          body: meal.name || `Your ${mealLabel.toLowerCase()} is coming up`,
          url: `/${gymId}/portal/meals`,
          tag: `meal-${meal.id}`,
        };

        for (const sub of subs) {
          const result = await sendPushNotification(sub, payload);
          if (result.success) results.meals++;
          if (result.statusCode === 410 || result.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      }
    }
  } catch (err: any) {
    results.errors.push(`Meals: ${err.message}`);
  }

  // ── 2. Workout Day Reminders ──
  // Only send at morning hours (7-9 AM in common timezones)
  const hour = now.getUTCHours();
  // Roughly covers IST morning (7-9 AM IST = 1:30-3:30 UTC)
  const isWorkoutHour = (hour >= 1 && hour <= 4) || (hour >= 7 && hour <= 9);

  if (isWorkoutHour) {
    try {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[now.getDay()];

      const { data: routines } = await supabase
        .from('workout_routines')
        .select(`
          id, name, schedule, member_id, gym_id,
          members!inner ( id, metadata )
        `)
        .eq('is_active', true)
        .contains('schedule', [todayName]);

      if (routines) {
        for (const routine of routines) {
          const member = (routine as any).members;
          if (!member) continue;

          const prefs = member.metadata?.notification_preferences;
          if (!prefs?.push_enabled || prefs?.push_workout_reminders === false) continue;

          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('member_id', routine.member_id);

          if (!subs || subs.length === 0) continue;

          const payload: PushPayload = {
            title: 'Workout Day!',
            body: `Today's routine: ${routine.name}`,
            url: `/${routine.gym_id}/portal/workouts`,
            tag: `workout-${routine.id}-${todayName}`,
          };

          for (const sub of subs) {
            const result = await sendPushNotification(sub, payload);
            if (result.success) results.workouts++;
            if (result.statusCode === 410 || result.statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id);
            }
          }
        }
      }
    } catch (err: any) {
      results.errors.push(`Workouts: ${err.message}`);
    }
  }

  // ── 3. Tracker Reminders (evening check) ──
  // Send in evening hours (roughly 6-8 PM IST = 12:30-14:30 UTC, or 18-20 UTC)
  const isTrackerHour = (hour >= 12 && hour <= 15) || (hour >= 18 && hour <= 20);

  if (isTrackerHour) {
    try {
      const today = now.toISOString().split('T')[0];

      // Get all active trackers with their daily logs for today
      const { data: trackers } = await supabase
        .from('custom_trackers')
        .select(`
          id, name, unit, daily_target, member_id, gym_id,
          members!inner ( id, metadata ),
          tracker_daily_log ( current_value, log_date )
        `)
        .eq('tracker_daily_log.log_date', today);

      if (trackers) {
        // Group by member to send one notification per member
        const memberTrackers = new Map<string, { name: string; current: number; target: number; unit: string; gymId: string }[]>();

        for (const tracker of trackers) {
          const member = (tracker as any).members;
          if (!member) continue;

          const prefs = member.metadata?.notification_preferences;
          if (!prefs?.push_enabled || prefs?.push_tracker_reminders === false) continue;

          const dailyLog = (tracker.tracker_daily_log as any[])?.[0];
          const currentValue = dailyLog?.current_value || 0;

          if (currentValue < tracker.daily_target) {
            const existing = memberTrackers.get(tracker.member_id) || [];
            existing.push({
              name: tracker.name,
              current: currentValue,
              target: tracker.daily_target,
              unit: tracker.unit,
              gymId: tracker.gym_id,
            });
            memberTrackers.set(tracker.member_id, existing);
          }
        }

        const memberIds = Array.from(memberTrackers.keys());
        for (const memberId of memberIds) {
          const incomplete = memberTrackers.get(memberId)!;
          if (incomplete.length === 0) continue;

          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('member_id', memberId);

          if (!subs || subs.length === 0) continue;

          // Pick the most notable incomplete tracker for the notification
          const top = incomplete[0];
          const body = incomplete.length === 1
            ? `${top.name}: ${top.current}/${top.target} ${top.unit}`
            : `${top.name}: ${top.current}/${top.target} ${top.unit} (+${incomplete.length - 1} more)`;

          const payload: PushPayload = {
            title: 'Tracker Reminder',
            body,
            url: `/${top.gymId}/portal/trackers`,
            tag: `tracker-${memberId}-${today}`,
          };

          for (const sub of subs) {
            const result = await sendPushNotification(sub, payload);
            if (result.success) results.trackers++;
            if (result.statusCode === 410 || result.statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id);
            }
          }
        }
      }
    } catch (err: any) {
      results.errors.push(`Trackers: ${err.message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    sent: results,
  });
}
