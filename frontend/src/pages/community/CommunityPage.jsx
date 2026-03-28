import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityService } from '../../services/supabase/communityService';
import { Avatar, PostCard } from './communityShared';
import { TAGS, timeAgo, updatePostInList, upsertPost } from './communityUtils';
import { censorText } from '../../utils/profanityFilter';
import './CommunityPage.css';

function NewPostModal({ user, profile, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('discussion');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
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
      <div className="cm__modal" onClick={event => event.stopPropagation()}>
        <div className="cm__modal-header">
          <h2 className="cm__modal-title">New Post</h2>
          <button className="cm__modal-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={submit}>
          <div className="cm__modal-field">
            <label className="cm__modal-label">Tag</label>
            <div className="cm__tag-picker">
              {TAGS.filter(tagOption => tagOption.value !== 'all').map(tagOption => (
                <button
                  key={tagOption.value}
                  type="button"
                  className={`cm__tag-option ${tag === tagOption.value ? 'cm__tag-option--active' : ''}`}
                  style={tag === tagOption.value ? { background: `${tagOption.color}18`, color: tagOption.color, borderColor: tagOption.color } : {}}
                  onClick={() => setTag(tagOption.value)}
                >
                  {tagOption.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cm__modal-field">
            <label className="cm__modal-label">Title</label>
            <input
              className="cm__modal-input"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="What's on your mind?"
              maxLength={120}
              required
              autoFocus
            />
          </div>
          <div className="cm__modal-field">
            <label className="cm__modal-label">Content</label>
            <textarea
              className="cm__modal-textarea"
              value={content}
              onChange={event => setContent(event.target.value)}
              placeholder="Share more details..."
              rows={5}
              maxLength={2000}
              required
            />
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

function ChatView({ user, profile, onLogin }) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    communityService.getMessages()
      .then(setMessages)
      .catch(console.error)
      .finally(() => setChatLoading(false));
  }, []);

  useEffect(() => {
    const channel = communityService.subscribeToMessages(message => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      try { channel?.unsubscribe(); } catch (error) { console.error(error); }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async event => {
    event.preventDefault();
    const content = censorText(chatInput.trim());
    if (!content || !user || !profile) return;

    setChatInput('');
    try {
      await communityService.sendMessage({
        userId: user.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        content,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="cm__chat-full">
      <div className="cm__chat-messages cm__chat-messages--full">
        {chatLoading ? (
          <div className="cm__chat-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="cm__chat-empty">No messages yet. Say hi!</div>
        ) : messages.map(message => (
          <div key={message.id} className={`cm__chat-msg ${user && message.user_id === user.id ? 'cm__chat-msg--own' : ''}`}>
            <Avatar username={message.username} avatarUrl={message.avatar_url} size={30} />
            <div className="cm__chat-msg-body">
              <div className="cm__chat-msg-meta">
                <span className="cm__chat-msg-user">@{message.username}</span>
                <span className="cm__chat-msg-time">{timeAgo(message.created_at)}</span>
              </div>
              <p className="cm__chat-msg-text">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {user && profile ? (
        <form className="cm__chat-form cm__chat-form--full" onSubmit={send}>
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={32} />
          <input
            className="cm__chat-input"
            value={chatInput}
            onChange={event => setChatInput(censorText(event.target.value))}
            placeholder="Message everyone..."
            maxLength={500}
            autoComplete="off"
            autoFocus
          />
          <button className="cm__chat-send" type="submit" disabled={!chatInput.trim()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      ) : (
        <button className="cm__chat-login-btn" onClick={onLogin}>Sign in to join the chat</button>
      )}
    </div>
  );
}

export default function CommunityPage({ user, profile, onLogin }) {
  const navigate = useNavigate();
  const [view, setView] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [activeTag, setActiveTag] = useState('all');
  const [likedIds, setLikedIds] = useState(new Set());
  const [showNewPost, setShowNewPost] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = useCallback(async tag => {
    setPostsLoading(true);
    try {
      const data = await communityService.getPosts(tag === 'all' ? null : tag);
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(activeTag);
  }, [activeTag, loadPosts]);

  const loadLikedIds = useCallback(async currentUser => {
    if (!currentUser) {
      setLikedIds(new Set());
      return;
    }

    try {
      const ids = await communityService.getUserLikedPostIds(currentUser.id);
      setLikedIds(ids);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadLikedIds(user);
  }, [user, loadLikedIds]);

  useEffect(() => {
    const channel = communityService.subscribeToPosts({
      onInsert: newPost => {
        if (activeTag === 'all' || newPost.tag === activeTag) {
          setPosts(prev => upsertPost(prev, newPost));
        }
      },
      onUpdate: updatedPost => {
        setPosts(prev => updatePostInList(prev, updatedPost, activeTag));
      },
    });

    return () => {
      try { channel?.unsubscribe(); } catch (error) { console.error(error); }
    };
  }, [activeTag]);

  const handleLikeToggled = useCallback((postId, liked) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (liked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  const handlePostCreated = useCallback(post => {
    if (activeTag === 'all' || post.tag === activeTag) {
      setPosts(prev => upsertPost(prev, post));
    }
  }, [activeTag]);

  const openPost = useCallback(postId => {
    navigate(`/community/${postId}`);
  }, [navigate]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return posts;

    return posts.filter(post => {
      const searchable = [post.title, post.content, post.username, post.tag].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(query);
    });
  }, [posts, searchQuery]);

  return (
    <div className="cm">
      <div className="cm__header">
        <div className="cm__header-left">
          <h1 className="cm__title">Community</h1>
          <p className="cm__subtitle">Share doubts, updates, and connect with fellow learners</p>
        </div>
        <div className="cm__view-toggle">
          <button className={`cm__toggle-btn ${view === 'feed' ? 'cm__toggle-btn--active' : ''}`} onClick={() => setView('feed')}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Feed
          </button>
          <button className={`cm__toggle-btn ${view === 'chat' ? 'cm__toggle-btn--active' : ''}`} onClick={() => setView('chat')}>
            <span className="cm__chat-live-dot" />
            Live Chat
          </button>
        </div>
      </div>

      {view === 'feed' && (
        <div className="cm__feed">
          <div className="cm__feed-toolbar">
            <div className="cm__feed-controls">
              <label className="cm__search" aria-label="Search posts">
                <svg className="cm__search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input className="cm__search-input" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search posts" />
                {searchQuery && (
                  <button type="button" className="cm__search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                    x
                  </button>
                )}
              </label>
              <div className="cm__tag-filters">
                {TAGS.map(tag => (
                  <button
                    key={tag.value}
                    className={`cm__tag-filter ${activeTag === tag.value ? 'cm__tag-filter--active' : ''}`}
                    style={activeTag === tag.value ? { background: `${tag.color}18`, color: tag.color, borderColor: tag.color } : {}}
                    onClick={() => setActiveTag(tag.value)}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            {user && profile ? (
              <button className="cm__new-post-btn" onClick={() => setShowNewPost(true)}>+ New Post</button>
            ) : (
              <button className="cm__new-post-btn cm__new-post-btn--ghost" onClick={onLogin}>Sign in to post</button>
            )}
          </div>

          {!!searchQuery.trim() && !postsLoading && (
            <div className="cm__search-meta">
              {filteredPosts.length} result{filteredPosts.length === 1 ? '' : 's'} for "{searchQuery.trim()}"
            </div>
          )}

          {postsLoading ? (
            <div className="cm__skeleton-list">
              {[1, 2, 3].map(index => <div key={index} className="cm__skeleton-card" />)}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="cm__empty">
              <span className="cm__empty-icon">{searchQuery.trim() ? '🔎' : '💬'}</span>
              <p>{searchQuery.trim() ? 'No posts match your search.' : 'No posts yet. Be the first to share!'}</p>
            </div>
          ) : (
            <div className="cm__posts">
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  likedByMe={likedIds.has(post.id)}
                  onLikeToggled={handleLikeToggled}
                  onLogin={onLogin}
                  onOpenPost={openPost}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'chat' && <ChatView user={user} profile={profile} onLogin={onLogin} />}

      {showNewPost && user && profile && (
        <NewPostModal user={user} profile={profile} onClose={() => setShowNewPost(false)} onCreated={handlePostCreated} />
      )}
    </div>
  );
}
