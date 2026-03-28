import { supabase } from './supabaseClient';

export const communityService = {
  // ── Posts ──────────────────────────────────────────────────────────────────

  async getPosts(tag = null) {
    let query = supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (tag) query = query.eq('tag', tag);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createPost({ userId, username, avatarUrl, title, content, tag }) {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, username, avatar_url: avatarUrl || null, title, content, tag })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToPosts(callback) {
    return supabase
      .channel('rt-community-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, p => callback(p.new))
      .subscribe();
  },

  // ── Likes ──────────────────────────────────────────────────────────────────

  async getUserLikedPostIds(userId) {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId);
    if (error) throw error;
    return new Set(data.map(l => l.post_id));
  },

  async toggleLike(postId) {
    const { data, error } = await supabase.rpc('toggle_post_like', { p_post_id: postId });
    if (error) throw error;
    return data[0]; // { liked: boolean, new_upvotes: number }
  },

  // ── Comments ───────────────────────────────────────────────────────────────

  async getComments(postId) {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async addComment({ postId, userId, username, avatarUrl, content }) {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: userId, username, avatar_url: avatarUrl || null, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToComments(postId, callback) {
    return supabase
      .channel(`rt-comments-${postId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'post_comments',
        filter: `post_id=eq.${postId}`,
      }, p => callback(p.new))
      .subscribe();
  },

  // ── Chat ───────────────────────────────────────────────────────────────────

  async getMessages() {
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data;
  },

  async sendMessage({ userId, username, avatarUrl, content }) {
    const { data, error } = await supabase
      .from('community_messages')
      .insert({ user_id: userId, username, avatar_url: avatarUrl || null, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToMessages(callback) {
    return supabase
      .channel('rt-community-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, p => callback(p.new))
      .subscribe();
  },
};
