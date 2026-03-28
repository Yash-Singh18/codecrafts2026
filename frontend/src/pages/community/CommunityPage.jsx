import { useState, useEffect, useRef, useCallback } from 'react';
import { communityService } from '../../services/supabase/communityService';
import './CommunityPage.css';

const TAGS = [
  { value: 'all',         label: 'All',         color: '#6366f1' },
  { value: 'doubt',       label: 'Doubt',       color: '#f59e0b' },
  { value: 'update',      label: 'Update',      color: '#10b981' },
  { value: 'discussion',  label: 'Discussion',  color: '#6366f1' },
  { value: 'resource',    label: 'Resource',    color: '#3b82f6' },
  { value: 'achievement', label: 'Achievement', color: '#ec4899' },
];
const TAG_META = Object.fromEntries(TAGS.map(t => [t.value, t]));

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ username, avatarUrl, size = 32 }) {
  if (avatarUrl) return <img src={avatarUrl} alt={username} className="cm__avatar" style={{ width: size, height: size }} />;
  return (
    <div className="cm__avatar cm__avatar--initial" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {username?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
function PostCard({ post, user, profile, likedByMe, onLikeToggled, onLogin }) {
  const [likes, setLikes]           = useState(post.upvotes || 0);
  const [liked, setLiked]           = useState(likedByMe);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]     = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [reported, setReported]     = useState(false);
  const tag = TAG_META[post.tag] || TAG_META.discussion;

  // Sync liked state if parent prop changes (e.g., user logs in)
  useEffect(() => { setLiked(likedByMe); }, [likedByMe]);

  const toggleLike = async () => {
    if (!user) { onLogin(); return; }
    if (likeLoading) return;
    setLikeLoading(true);
    // Optimistic update
    setLiked(prev => !prev);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    try {
      const result = await communityService.toggleLike(post.id);
      setLiked(result.liked);
      setLikes(result.new_upvotes);
      onLikeToggled(post.id, result.liked);
    } catch {
      // Revert on error
      setLiked(prev => !prev);
      setLikes(prev => liked ? prev + 1 : prev - 1);
    } finally {
      setLikeLoading(false);
    }
  };

  const openComments = async () => {
    setShowComments(v => !v);
    if (!commentsLoaded) {
      try {
        const data = await communityService.getComments(post.id);
        setComments(data);
        setCommentCount(data.length);
        setCommentsLoaded(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Realtime: new comments while section is open
  useEffect(() => {
    if (!showComments) return;
    const channel = communityService.subscribeToComments(post.id, newComment => {
      setComments(prev => {
        if (prev.find(c => c.id === newComment.id)) return prev;
        setCommentCount(c => c + 1);
        return [...prev, newComment];
      });
    });
    return () => { try { channel?.unsubscribe(); } catch {} };
  }, [showComments, post.id]);

  const submitComment = async (e) => {
    e.preventDefault();
    const content = commentInput.trim();
    if (!content || !user || !profile) return;
    setCommentLoading(true);
    setCommentInput('');
    try {
      const c = await communityService.addComment({
        postId: post.id,
        userId: user.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        content,
      });
      setComments(prev => [...prev, c]);
      setCommentCount(n => n + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReport = () => {
    setReported(true);
    setTimeout(() => setReported(false), 2500);
  };

  return (
    <article className="cm__post-card">
      {/* Header */}
      <div className="cm__post-header">
        <div className="cm__post-author-row">
          <Avatar username={post.username} avatarUrl={post.avatar_url} size={28} />
          <span className="cm__post-author-name">@{post.username}</span>
          <span className="cm__post-dot">·</span>
          <span className="cm__post-time">{timeAgo(post.created_at)}</span>
        </div>
        <span className="cm__post-tag-badge" style={{ background: tag.color + '18', color: tag.color, borderColor: tag.color + '44' }}>
          {tag.label}
        </span>
      </div>

      {/* Body */}
      <h3 className="cm__post-title">{post.title}</h3>
      <p className="cm__post-content">{post.content}</p>

      {/* Actions */}
      <div className="cm__post-actions">
        <button
          className={`cm__action-btn cm__action-btn--like ${liked ? 'cm__action-btn--liked' : ''}`}
          onClick={toggleLike}
          disabled={likeLoading}
          title={liked ? 'Unlike' : 'Like'}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          <span>{likes}</span>
        </button>

        <button className={`cm__action-btn ${showComments ? 'cm__action-btn--active' : ''}`} onClick={openComments}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
        </button>

        <button
          className={`cm__action-btn cm__action-btn--report ${reported ? 'cm__action-btn--reported' : ''}`}
          onClick={handleReport}
          title="Report"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          <span>{reported ? 'Reported' : 'Report'}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="cm__comments">
          {comments.length === 0 ? (
            <p className="cm__comments-empty">No comments yet. Be the first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="cm__comment">
                <Avatar username={c.username} avatarUrl={c.avatar_url} size={24} />
                <div className="cm__comment-body">
                  <div className="cm__comment-meta">
                    <span className="cm__comment-user">@{c.username}</span>
                    <span className="cm__comment-time">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="cm__comment-text">{c.content}</p>
                </div>
              </div>
            ))
          )}
          {user && profile ? (
            <form className="cm__comment-form" onSubmit={submitComment}>
              <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={24} />
              <input
                className="cm__comment-input"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                maxLength={500}
                disabled={commentLoading}
              />
              <button className="cm__comment-submit" type="submit" disabled={!commentInput.trim() || commentLoading}>
                {commentLoading ? '...' : 'Post'}
              </button>
            </form>
          ) : (
            <button className="cm__comment-login" onClick={onLogin}>Sign in to comment</button>
          )}
        </div>
      )}
    </article>
  );
}

// ── NewPostModal ───────────────────────────────────────────────────────────────
function NewPostModal({ user, profile, onClose, onCreated }) {
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag]         = useState('discussion');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const post = await communityService.createPost({
        userId: user.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        title: title.trim(),
        content: content.trim(),
        tag,
      });
      onCreated(post);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create post');
      setLoading(false);
    }
  };

  return (
    <div className="cm__modal-overlay" onClick={onClose}>
      <div className="cm__modal" onClick={e => e.stopPropagation()}>
        <div className="cm__modal-header">
          <h2 className="cm__modal-title">New Post</h2>
          <button className="cm__modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="cm__modal-field">
            <label className="cm__modal-label">Tag</label>
            <div className="cm__tag-picker">
              {TAGS.filter(t => t.value !== 'all').map(t => (
                <button key={t.value} type="button"
                  className={`cm__tag-option ${tag === t.value ? 'cm__tag-option--active' : ''}`}
                  style={tag === t.value ? { background: t.color + '18', color: t.color, borderColor: t.color } : {}}
                  onClick={() => setTag(t.value)}
                >{t.label}</button>
              ))}
            </div>
          </div>
          <div className="cm__modal-field">
            <label className="cm__modal-label">Title</label>
            <input className="cm__modal-input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What's on your mind?" maxLength={120} required autoFocus />
          </div>
          <div className="cm__modal-field">
            <label className="cm__modal-label">Content</label>
            <textarea className="cm__modal-textarea" value={content} onChange={e => setContent(e.target.value)}
              placeholder="Share more details..." rows={5} maxLength={2000} required />
          </div>
          {error && <p className="cm__modal-error">{error}</p>}
          <button className="cm__modal-submit" type="submit" disabled={loading || !title.trim() || !content.trim()}>
            {loading ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── ChatView ──────────────────────────────────────────────────────────────────
function ChatView({ user, profile, onLogin }) {
  const [messages, setMessages]     = useState([]);
  const [chatInput, setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    communityService.getMessages()
      .then(setMessages).catch(console.error).finally(() => setChatLoading(false));
  }, []);

  useEffect(() => {
    const ch = communityService.subscribeToMessages(msg => setMessages(prev => [...prev, msg]));
    return () => { try { ch?.unsubscribe(); } catch {} };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content || !user || !profile) return;
    setChatInput('');
    try {
      await communityService.sendMessage({ userId: user.id, username: profile.username, avatarUrl: profile.avatar_url, content });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="cm__chat-full">
      <div className="cm__chat-messages cm__chat-messages--full">
        {chatLoading ? (
          <div className="cm__chat-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="cm__chat-empty">No messages yet. Say hi!</div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`cm__chat-msg ${user && msg.user_id === user.id ? 'cm__chat-msg--own' : ''}`}>
            <Avatar username={msg.username} avatarUrl={msg.avatar_url} size={30} />
            <div className="cm__chat-msg-body">
              <div className="cm__chat-msg-meta">
                <span className="cm__chat-msg-user">@{msg.username}</span>
                <span className="cm__chat-msg-time">{timeAgo(msg.created_at)}</span>
              </div>
              <p className="cm__chat-msg-text">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {user && profile ? (
        <form className="cm__chat-form cm__chat-form--full" onSubmit={send}>
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={32} />
          <input className="cm__chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)}
            placeholder="Message everyone..." maxLength={500} autoComplete="off" autoFocus />
          <button className="cm__chat-send" type="submit" disabled={!chatInput.trim()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      ) : (
        <button className="cm__chat-login-btn" onClick={onLogin}>Sign in to join the chat</button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommunityPage({ user, profile, onLogin }) {
  const [view, setView]           = useState('feed');   // 'feed' | 'chat'
  const [posts, setPosts]         = useState([]);
  const [activeTag, setActiveTag] = useState('all');
  const [likedIds, setLikedIds]   = useState(new Set());
  const [showNewPost, setShowNewPost] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);

  // Load posts
  useEffect(() => {
    setPostsLoading(true);
    communityService.getPosts(activeTag === 'all' ? null : activeTag)
      .then(setPosts).catch(console.error).finally(() => setPostsLoading(false));
  }, [activeTag]);

  // Load user's liked posts
  useEffect(() => {
    if (!user) { setLikedIds(new Set()); return; }
    communityService.getUserLikedPostIds(user.id)
      .then(setLikedIds).catch(console.error);
  }, [user]);

  // Realtime: new posts
  useEffect(() => {
    const ch = communityService.subscribeToPosts(newPost => {
      if (activeTag === 'all' || newPost.tag === activeTag) {
        setPosts(prev => [newPost, ...prev]);
      }
    });
    return () => { try { ch?.unsubscribe(); } catch {} };
  }, [activeTag]);

  const handleLikeToggled = useCallback((postId, liked) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      liked ? next.add(postId) : next.delete(postId);
      return next;
    });
  }, []);

  const handlePostCreated = (post) => {
    if (activeTag === 'all' || post.tag === activeTag) setPosts(prev => [post, ...prev]);
  };

  return (
    <div className="cm">
      {/* ── Page header with view toggle ── */}
      <div className="cm__header">
        <div className="cm__header-left">
          <h1 className="cm__title">Community</h1>
          <p className="cm__subtitle">Share doubts, updates, and connect with fellow learners</p>
        </div>
        <div className="cm__view-toggle">
          <button
            className={`cm__toggle-btn ${view === 'feed' ? 'cm__toggle-btn--active' : ''}`}
            onClick={() => setView('feed')}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Feed
          </button>
          <button
            className={`cm__toggle-btn ${view === 'chat' ? 'cm__toggle-btn--active' : ''}`}
            onClick={() => setView('chat')}
          >
            <span className="cm__chat-live-dot" />
            Live Chat
          </button>
        </div>
      </div>

      {/* ── Feed View ── */}
      {view === 'feed' && (
        <div className="cm__feed">
          <div className="cm__feed-toolbar">
            <div className="cm__tag-filters">
              {TAGS.map(t => (
                <button key={t.value}
                  className={`cm__tag-filter ${activeTag === t.value ? 'cm__tag-filter--active' : ''}`}
                  style={activeTag === t.value ? { background: t.color + '18', color: t.color, borderColor: t.color } : {}}
                  onClick={() => setActiveTag(t.value)}
                >{t.label}</button>
              ))}
            </div>
            {user && profile ? (
              <button className="cm__new-post-btn" onClick={() => setShowNewPost(true)}>+ New Post</button>
            ) : (
              <button className="cm__new-post-btn cm__new-post-btn--ghost" onClick={onLogin}>Sign in to post</button>
            )}
          </div>

          {postsLoading ? (
            <div className="cm__skeleton-list">
              {[1, 2, 3].map(i => <div key={i} className="cm__skeleton-card" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="cm__empty">
              <span className="cm__empty-icon">💬</span>
              <p>No posts yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="cm__posts">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  profile={profile}
                  likedByMe={likedIds.has(post.id)}
                  onLikeToggled={handleLikeToggled}
                  onLogin={onLogin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat View ── */}
      {view === 'chat' && (
        <ChatView user={user} profile={profile} onLogin={onLogin} />
      )}

      {showNewPost && user && profile && (
        <NewPostModal user={user} profile={profile}
          onClose={() => setShowNewPost(false)} onCreated={handlePostCreated} />
      )}
    </div>
  );
}
