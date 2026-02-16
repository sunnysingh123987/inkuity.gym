'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateMemberPreferences } from '@/lib/actions/members-portal';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SettingsFormProps {
  memberId: string;
  initialPreferences: any;
}

export function SettingsForm({
  memberId,
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
  });

  const handleSave = async () => {
    setLoading(true);

    const result = await updateMemberPreferences(memberId, {
      notification_preferences: {
        email_checkin: preferences.emailCheckin,
        email_workout: preferences.emailWorkout,
        email_diet: preferences.emailDiet,
        email_weekly_report: preferences.emailWeeklyReport,
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
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailCheckin"
              className="font-medium text-gray-900 cursor-pointer"
            >
              Check-in Confirmations
            </Label>
            <p className="text-sm text-gray-600 mt-1">
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

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailWorkout"
              className="font-medium text-gray-900 cursor-pointer"
            >
              Workout Updates
            </Label>
            <p className="text-sm text-gray-600 mt-1">
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

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailDiet"
              className="font-medium text-gray-900 cursor-pointer"
            >
              Diet Plan Reminders
            </Label>
            <p className="text-sm text-gray-600 mt-1">
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

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 mr-4">
            <Label
              htmlFor="emailWeeklyReport"
              className="font-medium text-gray-900 cursor-pointer"
            >
              Weekly Progress Reports
            </Label>
            <p className="text-sm text-gray-600 mt-1">
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

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
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
