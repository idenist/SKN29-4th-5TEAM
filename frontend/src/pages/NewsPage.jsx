import React, { useState, useEffect } from 'react';

export default function NewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);

        setNewsList([
          { id: 1, title: '2026 청년 월세 지원 확대', summary: '국토부, 청년 주거비 부담 완화를 위해 지원 규모를 대폭 확대하기로 결정...', publisher: '한국일보', date: '2026-07-06', link: 'https://example.com' },
          { id: 2, title: '청년도약계좌 가입 조건 완화', summary: '금융위, 중위소득 기준 변경으로 더 많은 청년들이 가입할 수 있게...', publisher: '경제신문', date: '2026-07-05', link: 'https://example.com' },
          { id: 3, title: '[속보] 청년 정책 예산 조기 소진 예상', summary: '올해 책정된 청년 지원 예산이 신청자 급증으로 조기 소진될 전망...', publisher: '이젠뉴스', date: '2026-07-06', link: null },
        ]);
      } catch (err) {
        setError('뉴스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (isLoading) return <div style={{ padding: '20px' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (newsList.length === 0) return <div style={{ padding: '20px' }}>표시할 뉴스가 없습니다.</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '5px' }}>📰 청년 정책 주요 뉴스</h1>
      <p style={{ color: '#555', marginBottom: '20px' }}>청년 키워드 기반의 최신 뉴스를 확인해보세요.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {newsList.map((news) => (
          <div key={news.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #ddd', padding: '20px', borderRadius: '12px', backgroundColor: '#fff' }}>
            <h3 style={{ marginTop: '0', marginBottom: '10px' }}>{news.title}</h3>
            <p style={{ margin: '0 0 10px 0', lineHeight: '1.5' }}>{news.summary}</p>

            <p style={{ fontSize: '12px', color: '#ff6b6b', margin: '0 0 15px 0' }}>
              ※ 뉴스 요약이 잘려 보일 수 있습니다. 정확한 내용은 원문을 확인해주세요.
            </p>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <small style={{ color: '#888' }}>{news.publisher} | {news.date}</small>

              {news.link ? (
                <a href={news.link} target="_blank" rel="noopener noreferrer">
                  <button style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer' }}>
                    원문 보기
                  </button>
                </a>
              ) : (
                <button disabled style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#e9ecef', color: '#adb5bd', cursor: 'not-allowed' }}>
                  원문 없음
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}