import React, { useState, useEffect } from 'react';
import Spinner from '../components/common/Spinner.jsx';
import { getNaverNews } from '../services/newsApi.js';

export default function NewsPage() {
  // 🧭 8대 핵심 청년 정책 검색 키워드 탭
  const keywords = ['청년정책', '청년수당', '청년월세지원', '청년도약계좌', '내일배움카드', '취업장려금', '창업지원', '주거지원'];
  
  const [selectedKeyword, setSelectedKeyword] = useState('청년월세지원'); 
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNaverNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNewsList(await getNaverNews(selectedKeyword, 10));
      } catch (err) {
        setError('뉴스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNaverNews();
  }, [selectedKeyword]);

  const getSubTags = (keyword) => {
    if (keyword === '청년월세지원') return ['청년월세지원', '주거지원', '지원금'];
    if (keyword === '청년수당') return ['청년수당', '생활안정', '서울시'];
    return [keyword, '정책', '지원'];
  };

  const featuredNews = newsList[0];
  const remainingNews = newsList.slice(1);

  return (
    /* 🛠️ [수정 포인트] 기존 연회색(#f4f5f9) 배경을 제거하고 완전 화이트(#ffffff)로 깨끗하게 변경 */
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', padding: '40px 60px', fontFamily: 'sans-serif' }}>
      
      {/* 🏷️ 상단 타이틀 및 가이드라인 설명 섹션 */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 6px 0' }}>청년 정책 뉴스</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
          관심 키워드별로 선별한 정책·지원 관련 뉴스를 제공합니다. 정확한 정보 확인을 위해 원문 링크를 확인해 주세요.
        </p>
      </div>

      {/* 💡 블루 그라데이션 톤의 핵심 안내문 배너 */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 20px', fontSize: '13.5px', color: '#1e40af', lineHeight: '1.5', marginBottom: '25px' }}>
        💡 <strong>안내사항:</strong> 본 페이지의 청년 뉴스 요약본은 정보 제공용이므로, 정확한 지원 자격 및 세부 금액은 반드시 원문 링크를 통해 최종 확인을 권장합니다.
      </div>

      {/* 🧭 8대 정책 키워드 필터 탭 바 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
        {keywords.map((kw) => (
          <button
            key={kw}
            onClick={() => setSelectedKeyword(kw)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: selectedKeyword === kw ? '1px solid #2563eb' : '1px solid #e5e7eb',
              backgroundColor: selectedKeyword === kw ? '#2563eb' : '#fff',
              color: selectedKeyword === kw ? '#fff' : '#4b5563',
              fontSize: '13.5px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}
          >
            #{kw}
          </button>
        ))}
      </div>

      {/* 🛡️ 로딩 및 에러 처리 모듈 */}
      {isLoading && newsList.length === 0 ? (
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
          <Spinner label="시안에 맞춘 브리핑 뉴스를 정제하고 있습니다..." />
        </div>
      ) : error ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#ef4444', fontWeight: '500' }}>{error}</div>
      ) : newsList.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#6b7280' }}>표시할 브리핑 뉴스가 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
          
          {/* 1️⃣ [수정 포인트] 오늘의 주요 브리핑 카드에 연한 하늘색 배경(#f0f7ff) 적용 */}
          {featuredNews && (
            <div style={{ backgroundColor: '#f0f7ff', borderRadius: '16px', border: '1px solid #bfdbfe', padding: '30px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.01)', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
                <span>★</span> 오늘의 주요 브리핑
              </div>
              
              <a href={featuredNews.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ margin: '0 0 14px 0', fontSize: '22px', fontWeight: 'bold', color: '#111827', lineHeight: '1.4', cursor: 'pointer' }}>
                  {featuredNews.title}
                </h2>
              </a>

              <p style={{ margin: '0 0 24px 0', fontSize: '14.5px', color: '#4b5563', lineHeight: '1.7' }}>
                {featuredNews.summary}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #dbeafe' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* 주요 브리핑 내부 뱃지는 배경과 구별되도록 약간 더 선명하게 고수 */}
                  {getSubTags(selectedKeyword).map(tag => (
                    <span key={tag} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '5px 12px', borderRadius: '6px', fontSize: '12.5px', fontWeight: '500' }}>{tag}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{featuredNews.source} · {featuredNews.publishedAt}</span>
                  <a href={featuredNews.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13.5px', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                    원문 보기 ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 2️⃣ 정보 중심의 가로 리스트형 카드 구역 (흰색 바탕 위에 깔끔한 카드 라인업) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {remainingNews.map((news) => (
              <div 
                key={news.id} 
                style={{ 
                  display: 'flex', 
                  backgroundColor: '#fff', 
                  borderRadius: '16px', 
                  border: '1px solid #e5e7eb', 
                  padding: '24px', 
                  gap: '24px', 
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* 왼쪽 고정 문서 아이콘 박스 */}
                <a 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ width: '52px', height: '52px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ alignSelf: 'center' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </a>

                {/* 중앙 메인 정보 구역 */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {/* 리스트 뉴스 연블루 뱃지 태그 */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {getSubTags(selectedKeyword).map((tag, idx) => (
                      <span 
                        key={idx} 
                        style={{ 
                          backgroundColor: '#eff6ff', 
                          color: '#2563eb', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11.5px', 
                          fontWeight: '500' 
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 제목 링크 */}
                  <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#111827', cursor: 'pointer', lineHeight: '1.4' }}>
                      {news.title}
                    </h3>
                  </a>

                  <p style={{ margin: '0', fontSize: '13.5px', color: '#6b7280', lineHeight: '1.5' }}>
                    {news.summary}
                  </p>
                </div>

                {/* 우측 수직 정렬형 메타 프레임 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0, minWidth: '160px', borderLeft: '1px solid #f1f5f9', paddingLeft: '20px' }}>
                  <span style={{ fontSize: '12.5px', color: '#9ca3af', marginBottom: '8px' }}>
                    {news.source} · {news.publishedAt}
                  </span>
                  <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                    원문 보기 ↗
                  </a>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
