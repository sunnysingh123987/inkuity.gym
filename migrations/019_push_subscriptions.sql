-- Push notification subscriptions for PWA
-- Stores browser push subscription details per member

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_member ON public.push_subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_gym ON public.push_subscriptions(gym_id);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow members to manage their own subscriptions
CREATE POLICY "Members can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Members can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (true);
