// frontend/src/pages/NewsPage.jsx
import React, { useState, useEffect } from 'react';
// 민지님이 만들어두신 공통 컴포넌트를 불러와서 씁니다. (경로는 프로젝트에 맞게 수정)
// import Spinner from '../components/common/Spinner'; 
// import ErrorMessage from '../components/common/ErrorMessage';

const NewsPage = () => {
  // 1. 상태 관리 (데이터, 로딩상태, 에러상태)
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. 화면이 처음 켜질 때 뉴스 데이터를 불러오는 함수
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        // 실제 API 연동 시 백엔드 주소나 newsApi.js 함수로 교체합니다.
        // const response = await getYouthNews(); 
        // setNewsList(response.data);
        
        // 일단 UI 확인을 위해 가짜 데이터(Mock Data)를 넣어둡니다.
        setNewsList([
          { id: 1, title: '2026 청년 월세 지원 확대', summary: '국토부, 청년 주거비 부담 완화...', publisher: '한국일보', date: '2026-07-06', link: 'https://example.com' },
          { id: 2, title: '청년도약계좌 가입 조건 완화', summary: '금융위, 중위소득 기준 변경...', publisher: '경제신문', date: '2026-07-05', link: 'https://example.com' }
        ]);
      } catch (err) {
        setError('뉴스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'); // 에러 발생 시 안내 문구
      } finally {
        setIsLoading(false); // 성공하든 실패하든 로딩은 끝남
      }
    };

    fetchNews();
  }, []);

  // 3. 화면 렌더링 (순서대로 예외 처리)
  if (isLoading) return <div>로딩 중... (여기에 Spinner 컴포넌트 렌더링)</div>;
  if (error) return <div>{error} (여기에 ErrorMessage 컴포넌트 렌더링)</div>;
  if (newsList.length === 0) return <div>표시할 뉴스가 없습니다.</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>📰 청년 정책 주요 뉴스</h1>
      
      {/* 반응형 Grid 레이아웃 (CSS나 Tailwind를 사용해 PC 3열, 모바일 1열로 셋팅) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {newsList.map((news) => (
          <div key={news.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>{news.title}</h3>
            <p>{news.summary}</p>
            <small>{news.publisher} | {news.date}</small>
            <br />
            {/* 원문 링크가 있을 때만 버튼 노출 */}
            {news.link && (
              <a href={news.link} target="_blank" rel="noopener noreferrer">
                <button style={{ marginTop: '10px' }}>원문 보기</button>
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;