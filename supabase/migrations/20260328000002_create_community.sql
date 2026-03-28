-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  tag         TEXT NOT NULL DEFAULT 'discussion'
                CHECK (tag IN ('doubt','update','discussion','resource','achievement')),
  upvotes     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Global chat messages
CREATE TABLE IF NOT EXISTS community_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;

-- RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_read_all"
  ON community_posts FOR SELECT USING (true);

CREATE POLICY "posts_insert_auth"
  ON community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_own"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "messages_read_all"
  ON community_messages FOR SELECT USING (true);

CREATE POLICY "messages_insert_auth"
  ON community_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
