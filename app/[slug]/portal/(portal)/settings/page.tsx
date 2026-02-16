import { getAuthenticatedMember } from '@/lib/actions/pin-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsForm } from '@/components/member-portal/settings/settings-form';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export default async function SettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  const authResult = await getAuthenticatedMember(params.slug);
  if (!authResult.success || !authResult.data) {
    redirect(`/${params.slug}/portal/sign-in`);
  }
  const { memberId, gymId } = authResult.data;

  // Fetch member data
  const supabase = createAdminSupabaseClient();
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  // Fetch gym data
  const { data: gym } = await supabase
    .from('gyms')
    .select('name, slug')
    .eq('id', gymId)
    .single();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <p className="text-gray-900 mt-1">{member?.full_name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900 mt-1">{member?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="text-gray-900 mt-1">{member?.phone || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Gym</label>
              <p className="text-gray-900 mt-1">{gym?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            memberId={memberId}
            initialPreferences={member?.metadata || {}}
          />
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Manage your data and account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Your Data</p>
              <p className="text-sm text-gray-600 mt-1">
                Your check-in history, workout data, and diet plans are stored securely
                and only accessible by you and {gym?.name} administrators.
              </p>
            </div>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Account Deletion</p>
              <p className="text-sm text-gray-600 mt-1">
                To delete your account, please contact {gym?.name} directly.
                This will permanently remove all your data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
