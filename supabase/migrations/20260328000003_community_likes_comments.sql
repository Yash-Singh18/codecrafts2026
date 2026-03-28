-- Per-post like tracking
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Track comment count on the post itself (kept in sync by triggers below)
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Trigger: increment comments_count on insert
CREATE OR REPLACE FUNCTION inc_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inc_comments
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION inc_comments_count();

-- Trigger: decrement comments_count on delete
CREATE OR REPLACE FUNCTION dec_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dec_comments
  AFTER DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION dec_comments_count();

-- Atomic like/unlike RPC (runs as SECURITY DEFINER to bypass RLS on update)
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID)
RETURNS TABLE(liked BOOLEAN, new_upvotes INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_liked   BOOLEAN;
  v_upvotes INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM post_likes WHERE post_id = p_post_id AND user_id = v_user_id) THEN
    DELETE FROM post_likes WHERE post_id = p_post_id AND user_id = v_user_id;
    UPDATE community_posts SET upvotes = GREATEST(0, upvotes - 1)
      WHERE id = p_post_id RETURNING upvotes INTO v_upvotes;
    v_liked := FALSE;
  ELSE
    INSERT INTO post_likes (post_id, user_id) VALUES (p_post_id, v_user_id);
    UPDATE community_posts SET upvotes = upvotes + 1
      WHERE id = p_post_id RETURNING upvotes INTO v_upvotes;
    v_liked := TRUE;
  END IF;
  RETURN QUERY SELECT v_liked, v_upvotes;
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;

-- RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_read_all"    ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_auth" ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own"  ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comments_read_all"    ON post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own"  ON post_comments FOR DELETE USING (auth.uid() = user_id);
