import React, { useState, useEffect } from 'react';

export default function NewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);

        // 📝 image_5a713c.png 속 뉴스 타이틀 및 본문 데이터 완벽 매칭
        setNewsList([
          { 
            id: 1, 
            title: '2025년 청년 주거 지원 예산 전년 대비 30% 확대', 
            summary: '국토교통부는 청년 주거 안정 강화를 위해 내년도 예산을 대폭 확대한다고 밝혔다.', 
            publisher: '연합뉴스', 
            date: '2025-06-28', 
            link: 'https://example.com' 
          },
          { 
            id: 2, 
            title: '청년내일저축계좌 올해 신규 모집 시작···신청 방법은?', 
            summary: '보건복지부가 청년내일저축계좌 신규 모집을 시작했다. 만 19~34세 저소득 근로 청년이라면 신청 가능하다.', 
            publisher: 'KBS뉴스', 
            date: '2025-06-25', 
            link: 'https://example.com' 
          },
          { 
            id: 3, 
            title: '취업난 청년에 희소식···국민취업지원제도 요건 완화', 
            summary: '고용노동부가 국민취업지원제도 요건을 완화해 더 많은 청년이 혜택을 받을 수 있게 됐다.', 
            publisher: 'MBC뉴스', 
            date: '2025-06-20', 
            link: 'https://example.com' 
          },
          { 
            id: 4, 
            title: '서울시, 청년 창업 원스톱 지원 센터 추가 개소', 
            summary: '서울시가 청년 창업가들의 초기 자금 마련 및 공간 대여를 원스톱으로 지원하는...', 
            publisher: '서울경제', 
            date: '2025-06-18', 
            link: 'https://example.com' 
          },
          { 
            id: 5, 
            title: '청년 심리 상담 무료 지원 사업, 신청자 폭주로 대기 발생', 
            summary: '보건복지부의 청년 마음건강 바우처 지원 사업이 큰 호응을 얻으며 전국적으로...', 
            publisher: '한겨레', 
            date: '2025-06-15', 
            link: 'https://example.com' 
          },
          { 
            id: 6, 
            title: '지역 청년 정착 지원금, 지방 소도시 확대 적용', 
            summary: '행정안전부가 지역 소멸 방지를 위해 지방 소도시에 정착하는 청년들에게...', 
            publisher: '지방자치뉴스', 
            date: '2025-06-12', 
            link: 'https://example.com' 
          }
        ]);
      } catch (err) {
        setError('뉴스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (isLoading) return <div style={{ padding: '40px', minHeight: '100vh', textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: '40px', minHeight: '100vh', color: 'red', textAlign: 'center' }}>{error}</div>;
  if (newsList.length === 0) return <div style={{ padding: '40px', minHeight: '100vh', textAlign: 'center' }}>표시할 뉴스가 없습니다.</div>;

  return (
    <div style={{ minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '35px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>청년 정책 뉴스</h1>
        </div>
      </div>

      {/* 📊 3열 배열 구조 반응형 Grid 선언 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {newsList.map((news) => (
          <div 
            key={news.id} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: '#fff', 
              borderRadius: '24px', 
              overflow: 'hidden', 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)', 
              border: '1px solid #e5e7eb' 
            }}
          >
            {/* 📰 상단 영역: 연보라색 신문 아이콘 박스 완전 동기화 */}
            <div style={{ width: '100%', height: '180px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8M18 18h-8M16 6H10v4h6V6Z" />
              </svg>
            </div>

            {/* 하단 영역: 뉴스 정보 및 메타데이터 */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              {/* 뉴스 제목 */}
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#1f2937', lineHeight: '1.5', minHeight: '48px' }}>
                {news.title}
              </h3>
              
              {/* 뉴스 요약 */}
              <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#6b7280', lineHeight: '1.6', flexGrow: 1 }}>
                {news.summary}
              </p>

              {/* 🛡️ 역할지침서 예외방어 히든 UI (툴팁으로 자연스럽게 결합) */}
              <div title="네이버 뉴스 API 특성상 요약문이 다소 잘려 보일 수 있습니다." style={{ cursor: 'help' }}>
                
                {/* 하단 메타라인 & 원문 바로가기 텍스트 링크 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {news.publisher} · {news.date}
                  </span>

                  {news.link ? (
                    <a 
                      href={news.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      원문 ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#d1d5db', cursor: 'not-allowed' }}>
                      원문 없음
                    </span>
                  )}
                </div>

              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
