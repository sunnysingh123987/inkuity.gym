'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateMemberPreferences } from '@/lib/actions/members-portal';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { toast } from '@/components/ui/toaster';
import { Loader2, Bell, BellOff, Smartphone } from 'lucide-react';

interface SettingsFormProps {
  memberId: string;
  gymId: string;
  initialPreferences: any;
}

export function SettingsForm({
  memberId,
  gymId,
  initialPreferences,
}: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailCheckin:
      initialPreferences?.notification_preferences?.email_checkin !== false,
    emailWorkout:
      initialPreferences?.notification_preferences?.email_workout !== false,
    emailDiet:
      initialPreferences?.notification_preferences?.email_diet !== false,
    emailWeeklyReport:
      initialPreferences?.notification_preferences?.email_weekly_report !== false,
    pushMealReminders:
      initialPreferences?.notification_preferences?.push_meal_reminders !== false,
    pushWorkoutReminders:
      initialPreferences?.notification_preferences?.push_workout_reminders !== false,
    pushTrackerReminders:
      initialPreferences?.notification_preferences?.push_tracker_reminders !== false,
  });

  const {
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications({ memberId, gymId });

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success('Push notifications disabled');
      } else {
        toast.error('Failed to disable push notifications');
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Push notifications enabled!');
      } else {
        toast.error('Could not enable push notifications. Check browser permissions.');
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);

    const result = await updateMemberPreferences(memberId, {
      notification_preferences: {
        email_checkin: preferences.emailCheckin,
        email_workout: preferences.emailWorkout,
        email_diet: preferences.emailDiet,
        email_weekly_report: preferences.emailWeeklyReport,
        push_meal_reminders: preferences.pushMealReminders,
        push_workout_reminders: preferences.pushWorkoutReminders,
        push_tracker_reminders: preferences.pushTrackerReminders,
      },
    });

    if (result.success) {
      toast.success('Preferences updated successfully!');
    } else {
      toast.error(result.error || 'Failed to update preferences');
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 glass rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailCheckin"
              className="font-medium text-white cursor-pointer"
            >
              Check-in Confirmations
            </Label>
            <p className="text-sm text-slate-400 mt-1">
              Receive email confirmations when you check in to the gym
            </p>
          </div>
          <Switch
            id="emailCheckin"
            checked={preferences.emailCheckin}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, emailCheckin: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 glass rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailWorkout"
              className="font-medium text-white cursor-pointer"
            >
              Workout Updates
            </Label>
            <p className="text-sm text-slate-400 mt-1">
              Get notified about workout achievements and milestones
            </p>
          </div>
          <Switch
            id="emailWorkout"
            checked={preferences.emailWorkout}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, emailWorkout: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 glass rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailDiet"
              className="font-medium text-white cursor-pointer"
            >
              Diet Plan Reminders
            </Label>
            <p className="text-sm text-slate-400 mt-1">
              Receive reminders about your diet plan and meal logging
            </p>
          </div>
          <Switch
            id="emailDiet"
            checked={preferences.emailDiet}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, emailDiet: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 glass rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailWeeklyReport"
              className="font-medium text-white cursor-pointer"
            >
              Weekly Progress Reports
            </Label>
            <p className="text-sm text-slate-400 mt-1">
              Get a weekly summary of your fitness progress and achievements
            </p>
          </div>
          <Switch
            id="emailWeeklyReport"
            checked={preferences.emailWeeklyReport}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, emailWeeklyReport: checked })
            }
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pt-2">
          <Smartphone className="h-4 w-4 text-brand-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Push Notifications
          </h3>
        </div>

        {!isSupported ? (
          <div className="p-4 glass rounded-lg">
            <div className="flex items-center gap-2 text-slate-400">
              <BellOff className="h-4 w-4" />
              <p className="text-sm">
                Push notifications are not supported in this browser.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Master Push Toggle */}
            <div className="flex items-center justify-between p-4 glass-input rounded-lg">
              <div className="flex-1 mr-4">
                <Label
                  htmlFor="pushEnabled"
                  className="font-medium text-white cursor-pointer"
                >
                  Enable Push Notifications
                </Label>
                <p className="text-sm text-slate-400 mt-1">
                  Receive push notifications on this device for meals, workouts, and trackers
                </p>
              </div>
              <Switch
                id="pushEnabled"
                checked={isSubscribed}
                disabled={pushLoading}
                onCheckedChange={handlePushToggle}
              />
            </div>

            {/* Individual Push Preferences (only when subscribed) */}
            {isSubscribed && (
              <div className="space-y-3 pl-4 border-l-2 border-brand-cyan-500/30">
                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex-1 mr-4">
                    <Label
                      htmlFor="pushMeal"
                      className="font-medium text-white cursor-pointer"
                    >
                      Meal Reminders
                    </Label>
                    <p className="text-sm text-slate-400 mt-1">
                      Get reminded before your scheduled meals
                    </p>
                  </div>
                  <Switch
                    id="pushMeal"
                    checked={preferences.pushMealReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, pushMealReminders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex-1 mr-4">
                    <Label
                      htmlFor="pushWorkout"
                      className="font-medium text-white cursor-pointer"
                    >
                      Workout Day Reminders
                    </Label>
                    <p className="text-sm text-slate-400 mt-1">
                      Get notified on your scheduled workout days
                    </p>
                  </div>
                  <Switch
                    id="pushWorkout"
                    checked={preferences.pushWorkoutReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, pushWorkoutReminders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div className="flex-1 mr-4">
                    <Label
                      htmlFor="pushTracker"
                      className="font-medium text-white cursor-pointer"
                    >
                      Tracker Reminders
                    </Label>
                    <p className="text-sm text-slate-400 mt-1">
                      Evening reminders for incomplete daily trackers (water, vitamins, etc.)
                    </p>
                  </div>
                  <Switch
                    id="pushTracker"
                    checked={preferences.pushTrackerReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, pushTrackerReminders: checked })
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-white/[0.06]">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
}
