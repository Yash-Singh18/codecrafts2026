export const TAGS = [
  { value: 'all', label: 'All', color: '#6366f1' },
  { value: 'doubt', label: 'Doubt', color: '#f59e0b' },
  { value: 'update', label: 'Update', color: '#10b981' },
  { value: 'discussion', label: 'Discussion', color: '#6366f1' },
  { value: 'resource', label: 'Resource', color: '#3b82f6' },
  { value: 'achievement', label: 'Achievement', color: '#ec4899' },
];

export const TAG_META = Object.fromEntries(TAGS.map(tag => [tag.value, tag]));

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function upsertPost(posts, incomingPost) {
  return [incomingPost, ...posts.filter(post => post.id !== incomingPost.id)];
}

export function updatePostInList(posts, updatedPost, activeTag = 'all') {
  if (activeTag !== 'all' && updatedPost.tag !== activeTag) {
    return posts.filter(post => post.id !== updatedPost.id);
  }

  return posts.map(post => (post.id === updatedPost.id ? updatedPost : post));
}
