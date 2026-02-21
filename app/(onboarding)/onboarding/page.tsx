import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if already completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  const userName = profile?.full_name || user.user_metadata?.full_name || ''
  const userEmail = profile?.email || user.email || ''

  return <OnboardingWizard userName={userName} userEmail={userEmail} />
}
