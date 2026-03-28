import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { communityService } from '../../services/supabase/communityService';
import { CommentsPanel, PostCard } from './communityShared';
import './CommunityPage.css';

export default function CommunityPostPage({ user, profile, onLogin }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [postLoading, setPostLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedIds, setLikedIds] = useState(new Set());
  const [commentCount, setCommentCount] = useState(0);

  const loadPost = useCallback(async currentPostId => {
    setPostLoading(true);
    setError('');
    try {
      const data = await communityService.getPost(currentPostId);
      setPost(data);
      setCommentCount(data?.comments_count || 0);
    } catch (err) {
      setPost(null);
      setError(err.code === 'PGRST116' ? 'Post not found.' : (err.message || 'Failed to load post.'));
    } finally {
      setPostLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPost(postId);
  }, [postId, loadPost]);

  useEffect(() => {
    const channel = communityService.subscribeToPost(postId, updatedPost => {
      setPost(updatedPost);
      setCommentCount(updatedPost.comments_count || 0);
    });

    return () => {
      try { channel?.unsubscribe(); } catch (error) { console.error(error); }
    };
  }, [postId]);

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

  const handleLikeToggled = useCallback((likedPostId, liked) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (liked) next.add(likedPostId);
      else next.delete(likedPostId);
      return next;
    });
  }, []);

  const openPost = useCallback(targetPostId => {
    if (targetPostId === postId) {
      document.querySelector('.cm__comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(`/community/${targetPostId}`);
  }, [navigate, postId]);

  return (
    <div className="cm cm--post-page">
      <div className="cm__post-layout">
        <Link className="cm__back-link" to="/community">&lt; Back to community</Link>

        {postLoading ? (
          <div className="cm__skeleton-list">
            <div className="cm__skeleton-card" />
          </div>
        ) : error ? (
          <div className="cm__empty">
            <p>{error}</p>
          </div>
        ) : post ? (
          <>
            <PostCard
              post={post}
              user={user}
              likedByMe={likedIds.has(post.id)}
              onLikeToggled={handleLikeToggled}
              onLogin={onLogin}
              onOpenPost={openPost}
              isDetail
              commentCountOverride={commentCount}
            />
            <CommentsPanel
              postId={post.id}
              user={user}
              profile={profile}
              onLogin={onLogin}
              initialCount={commentCount}
              onCountChange={setCommentCount}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
