// frontend/src/pages/VideoPage.jsx
import React from 'react';

const VideoPage = () => {
  // 실제로는 API에서 불러올 수도 있지만, 일단 배열로 관리해 봅니다.
  const videoList = [
    { id: '1', title: '2026 알면 돈이 되는 청년 정책 총정리', embedId: 'y-m4hB8xQG8' }, // embedId는 유튜브 URL 뒤에 붙는 고유 코드입니다. (예시)
    { id: '2', title: '청년 월세 특별지원 신청 방법', embedId: 'M7lc1UVf-VE' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>📺 청년 정책 핵심 영상</h1>
      <p>복잡한 정책, 영상으로 쉽게 알아보세요!</p>

      {/* 영상 카드들을 담는 큰 그릇 (반응형 Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {videoList.map((video) => (
          <div key={video.id} style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* 유튜브 iframe 컨테이너 (16:9 비율 유지 핵심) */}
            <div style={{ width: '100%', aspectRatio: '16 / 9', backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${video.embedId}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                // 로드 실패 시 예외 처리를 위해 대체 이미지나 텍스트를 띄우는 로직을 추가할 수도 있습니다.
              ></iframe>
            </div>
            
            <h3 style={{ marginTop: '10px', fontSize: '18px' }}>{video.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPage;