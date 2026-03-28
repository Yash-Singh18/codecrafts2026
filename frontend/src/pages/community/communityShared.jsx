import { useEffect, useState } from 'react';
import { communityService } from '../../services/supabase/communityService';
import { TAG_META, timeAgo } from './communityUtils';

export function Avatar({ username, avatarUrl, size = 32 }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className="cm__avatar" style={{ width: size, height: size }} />;
  }

  return (
    <div className="cm__avatar cm__avatar--initial" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {username?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export function CommentsPanel({ postId, user, profile, onLogin, initialCount = 0, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(initialCount);

  useEffect(() => {
    setCommentCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    onCountChange?.(commentCount);
  }, [commentCount, onCountChange]);

  useEffect(() => {
    let cancelled = false;

    setCommentsLoading(true);
    communityService.getComments(postId)
      .then(data => {
        if (cancelled) return;
        setComments(data);
        setCommentCount(data.length);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });

    const channel = communityService.subscribeToComments(postId, newComment => {
      setComments(prev => {
        if (prev.some(comment => comment.id === newComment.id)) return prev;
        setCommentCount(count => count + 1);
        return [...prev, newComment];
      });
    });

    return () => {
      cancelled = true;
      try { channel?.unsubscribe(); } catch (error) { console.error(error); }
    };
  }, [postId]);

  const submitComment = async (event) => {
    event.preventDefault();
    const content = commentInput.trim();
    if (!content || !user || !profile) return;

    setCommentLoading(true);
    setCommentInput('');
    try {
      const comment = await communityService.addComment({
        postId,
        userId: user.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        content,
      });
      setComments(prev => [...prev, comment]);
      setCommentCount(count => count + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <section className="cm__comments">
      <div className="cm__comments-header">
        <h2 className="cm__comments-title">Comments</h2>
        <span className="cm__comments-count">{commentCount}</span>
      </div>

      {commentsLoading ? (
        <p className="cm__comments-empty">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="cm__comments-empty">No comments yet. Be the first!</p>
      ) : (
        comments.map(comment => (
          <div key={comment.id} className="cm__comment">
            <Avatar username={comment.username} avatarUrl={comment.avatar_url} size={24} />
            <div className="cm__comment-body">
              <div className="cm__comment-meta">
                <span className="cm__comment-user">@{comment.username}</span>
                <span className="cm__comment-time">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="cm__comment-text">{comment.content}</p>
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
            onChange={event => setCommentInput(event.target.value)}
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
    </section>
  );
}

export function PostCard({
  post,
  user,
  likedByMe,
  onLikeToggled,
  onLogin,
  onOpenPost,
  isDetail = false,
  commentCountOverride,
}) {
  const [likes, setLikes] = useState(post.upvotes || 0);
  const [liked, setLiked] = useState(likedByMe);
  const [likeLoading, setLikeLoading] = useState(false);
  const [reported, setReported] = useState(false);
  const [commentCount, setCommentCount] = useState(commentCountOverride ?? post.comments_count ?? 0);
  const tag = TAG_META[post.tag] || TAG_META.discussion;
  const canOpenPost = typeof onOpenPost === 'function';
  const interactive = !isDetail && canOpenPost;

  useEffect(() => {
    setLiked(likedByMe);
  }, [likedByMe]);

  useEffect(() => {
    setLikes(post.upvotes || 0);
  }, [post.upvotes]);

  useEffect(() => {
    setCommentCount(commentCountOverride ?? post.comments_count ?? 0);
  }, [commentCountOverride, post.comments_count]);

  useEffect(() => {
    let active = true;

    const loadCommentCount = async () => {
      try {
        const count = await communityService.getCommentsCount(post.id);
        if (active) setCommentCount(count);
      } catch (error) {
        console.error(error);
      }
    };

    loadCommentCount();

    return () => {
      active = false;
    };
  }, [post.id]);

  const openPost = () => {
    if (canOpenPost) onOpenPost(post.id);
  };

  const handleCardKeyDown = (event) => {
    if (!interactive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPost();
    }
  };

  const toggleLike = async (event) => {
    event.stopPropagation();
    if (!user) {
      onLogin();
      return;
    }
    if (likeLoading) return;

    const nextLiked = !liked;
    setLikeLoading(true);
    setLiked(nextLiked);
    setLikes(prev => prev + (nextLiked ? 1 : -1));

    try {
      const result = await communityService.toggleLike(post.id);
      setLiked(result.liked);
      setLikes(result.new_upvotes);
      onLikeToggled(post.id, result.liked);
    } catch {
      setLiked(!nextLiked);
      setLikes(prev => prev + (nextLiked ? -1 : 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleOpenPost = (event) => {
    event.stopPropagation();
    openPost();
  };

  const handleReport = (event) => {
    event.stopPropagation();
    setReported(true);
    setTimeout(() => setReported(false), 2500);
  };

  return (
    <article
      className={`cm__post-card ${interactive ? 'cm__post-card--interactive' : ''} ${isDetail ? 'cm__post-card--detail' : ''}`}
      onClick={interactive ? openPost : undefined}
      onKeyDown={interactive ? handleCardKeyDown : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="cm__post-header">
        <div className="cm__post-author-row">
          <Avatar username={post.username} avatarUrl={post.avatar_url} size={28} />
          <span className="cm__post-author-name">@{post.username}</span>
          <span className="cm__post-dot">·</span>
          <span className="cm__post-time">{timeAgo(post.created_at)}</span>
        </div>
        <span className="cm__post-tag-badge" style={{ background: `${tag.color}18`, color: tag.color, borderColor: `${tag.color}44` }}>
          {tag.label}
        </span>
      </div>

      <h3 className="cm__post-title">{post.title}</h3>
      <p className={`cm__post-content ${isDetail ? 'cm__post-content--expanded' : ''}`}>{post.content}</p>

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

        <button className={`cm__action-btn ${isDetail ? 'cm__action-btn--active' : ''}`} onClick={handleOpenPost}>
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
    </article>
  );
}
