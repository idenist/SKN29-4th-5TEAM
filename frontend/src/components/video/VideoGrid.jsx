import VideoCard from './VideoCard.jsx';

export default function VideoGrid({ videos = [] }) {
  return (
    <div className="media-grid">
      {videos.map((item) => (
        <VideoCard key={item.id} item={item} />
      ))}
    </div>
  );
}
