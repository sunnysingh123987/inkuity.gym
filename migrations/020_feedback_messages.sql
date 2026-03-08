-- Feedback chat messages between members and Inkuity (platform)
CREATE TABLE IF NOT EXISTS feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('member', 'inkuity')),
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_messages_conversation
  ON feedback_messages(gym_id, member_id, created_at);

-- RLS policies
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

-- Members can view their own messages (via admin client in practice)
CREATE POLICY "Members can view own feedback messages"
  ON feedback_messages FOR SELECT
  USING (member_id::text = auth.uid()::text);

-- Members can send messages (via admin client in practice)
CREATE POLICY "Members can send feedback messages"
  ON feedback_messages FOR INSERT
  WITH CHECK (
    member_id::text = auth.uid()::text
    AND sender_type = 'member'
  );

-- Service role (used by Inkuity platform) bypasses RLS
CREATE POLICY "Service role full access to feedback messages"
  ON feedback_messages FOR ALL
  USING (auth.role() = 'service_role');
