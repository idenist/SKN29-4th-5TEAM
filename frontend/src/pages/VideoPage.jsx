import React, { useState, useEffect } from 'react';

const VideoPage = () => {
  const [videoList, setVideoList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // API 호출을 흉내내는 함수
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        
        // ✨ 지침서 6.5 반영: 영상 제목, '설명', '출처' 데이터 추가
        setVideoList([
          { 
            id: '1', 
            title: '2026 알면 돈이 되는 청년 정책 총정리', 
            description: '올해 새롭게 바뀌는 청년 주거, 취업, 금융 지원 정책들을 10분 만에 완벽하게 정리해드립니다. 놓치면 손해보는 혜택들 꼭 확인하세요!',
            source: '대한민국 정부 공식 유튜브',
            embedId: 'y-m4hB8xQG8' 
          },
          { 
            id: '2', 
            title: '청년 월세 특별지원 신청 방법 및 A to Z', 
            description: '월 최대 20만 원 지원! 청년 월세 특별지원 사업의 정확한 신청 자격과 필요 서류, 신청 방법을 단계별로 알려드립니다.',
            source: '국토교통부',
            embedId: 'M7lc1UVf-VE' 
          }
        ]);
      } catch (err) {
        // 공통 안내 문구 반영: API 실패 시 오류 안내
        setError('영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // 상태별 예외 처리 (로딩, 에러, 빈 데이터)
  if (isLoading) return <div style={{ padding: '20px' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (videoList.length === 0) return <div style={{ padding: '20px' }}>표시할 영상이 없습니다.</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '5px' }}>📺 청년 정책 핵심 영상</h1>
      <p style={{ color: '#555', marginBottom: '30px' }}>글로 읽기 복잡한 정책, 영상으로 쉽고 빠르게 알아보세요!</p>

      {/* ✨ 지침서 반영: 모바일 카드 배치가 깨지지 않는 반응형 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {videoList.map((video) => (
          <div key={video.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
            
            {/* ✨ 지침서 반영: iframe 고정 높이 대신 반응형 16:9 비율 최우선 적용 */}
            {/* 영상 로드 실패 시 뒤에 깔린 대체 문구가 보이도록 relative 설정 */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* ✨ 지침서 반영: 외부 영상 로드 실패 시 대체 안내 문구 */}
              <span style={{ position: 'absolute', color: '#888', fontSize: '14px', zIndex: 0 }}>
                현재 영상을 불러올 수 없습니다.
              </span>

              {/* ✨ 지침서 반영: 자동 재생 금지 (URL 파라미터에 autoplay 없음) */}
              <iframe
                style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}
                src={`https://www.youtube.com/embed/${video.embedId}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            {/* 영상 텍스트 정보 영역 (제목, 설명, 출처) */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', lineHeight: '1.4' }}>{video.title}</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#555', lineHeight: '1.5', flexGrow: 1 }}>
                {video.description}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <small style={{ color: '#007bff', fontWeight: 'bold' }}>출처: {video.source}</small>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPage;