import { useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Select from '../components/common/Select.jsx';
import VideoGrid from '../components/video/VideoGrid.jsx';
import { videoCategories, videoMock } from '../data/videoMock.js';

const categoryOptions = videoCategories.map((category) => ({ value: category, label: category }));

function matchesKeyword(item, keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;
  return [item.title, item.description, ...item.tags].join(' ').toLowerCase().includes(normalized);
}

export default function VideoPage() {
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [category, setCategory] = useState('전체');

  const filteredVideos = useMemo(() => {
    return videoMock.filter((item) => {
      const categoryMatched = category === '전체' || item.category === category;
      return categoryMatched && matchesKeyword(item, submittedKeyword);
    });
  }, [category, submittedKeyword]);

  return (
    <div className="media-page">
      <PageHeader
        kicker="Videos"
        title="청년 정책 영상"
        description="정책 신청 방법과 활용 팁을 mock 영상 카드로 정리했습니다."
      />

      <section className="media-toolbar" aria-label="영상 검색과 필터">
        <SearchBar
          value={keyword}
          onChange={setKeyword}
          onSubmit={() => setSubmittedKeyword(keyword)}
          placeholder="영상 제목, 설명, 태그로 검색"
          label="영상 검색어"
        />
        <Select
          label="카테고리"
          value={category}
          options={categoryOptions}
          placeholder=""
          onChange={(event) => setCategory(event.target.value)}
        />
      </section>

      <section className="media-result-summary">
        <strong>{filteredVideos.length}개 영상</strong>
        <span>{submittedKeyword ? `검색어: ${submittedKeyword}` : '전체 영상을 표시 중입니다.'}</span>
      </section>

      {filteredVideos.length > 0 ? (
        <VideoGrid videos={filteredVideos} />
      ) : (
        <EmptyState title="영상이 없습니다" description="검색어를 줄이거나 카테고리를 전체로 변경해 보세요." />
      )}
    </div>
  );
}
