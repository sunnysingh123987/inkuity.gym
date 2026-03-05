import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendPushNotification, type PushPayload } from '@/lib/push/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily cron (7:00 AM IST / 1:30 UTC) to send push reminders for:
 * 1. Today's meals (scheduled today, not completed)
 * 2. Workout days (today's day in routine schedule, active routines)
 * 3. Tracker reminders (incomplete daily targets)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const results = { meals: 0, workouts: 0, trackers: 0, errors: [] as string[] };

  // ── 1. Meal Reminders (all meals scheduled today, not yet completed) ──
  try {
    const { data: upcomingMeals } = await supabase
      .from('meal_plans')
      .select(`
        id, name, meal_type, scheduled_for,
        diet_plans!inner (
          id, member_id, gym_id,
          members!inner ( id, metadata )
        )
      `)
      .eq('scheduled_date', today)
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

        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('member_id', memberId);

        if (!subs || subs.length === 0) continue;

        const mealLabel = meal.meal_type
          ? meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)
          : 'Meal';

        const payload: PushPayload = {
          title: `Today's ${mealLabel}`,
          body: meal.name || `Don't forget your ${mealLabel.toLowerCase()} today`,
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

  // ── 3. Tracker Reminders (incomplete daily targets) ──
  try {
    const { data: trackers } = await supabase
      .from('custom_trackers')
      .select(`
        id, name, unit, daily_target, member_id, gym_id,
        members!inner ( id, metadata ),
        tracker_daily_log ( current_value, log_date )
      `)
      .eq('tracker_daily_log.log_date', today);

    if (trackers) {
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

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    sent: results,
  });
}
