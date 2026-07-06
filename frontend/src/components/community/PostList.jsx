import PostCard from './PostCard.jsx';

export default function PostList({ posts = [] }) {
  return (
    <div className="community-post-list">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
