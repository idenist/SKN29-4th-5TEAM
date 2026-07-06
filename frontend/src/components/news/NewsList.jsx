import NewsCard from './NewsCard.jsx';

export default function NewsList({ news = [] }) {
  return (
    <div className="media-list">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
