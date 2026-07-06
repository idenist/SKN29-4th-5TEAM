import HeroSection from '../components/home/HeroSection.jsx';
import HomeStats from '../components/home/HomeStats.jsx';
import NewsPreviewList from '../components/home/NewsPreviewList.jsx';
import PolicyPreviewList from '../components/home/PolicyPreviewList.jsx';
import QuickMenu from '../components/home/QuickMenu.jsx';

const quickMenus = [
  {
    title: '정책검색',
    description: '지역, 나이, 관심 분야로 정책을 빠르게 찾아보세요.',
    to: '/policies'
  },
  {
    title: 'AI챗봇',
    description: '궁금한 지원 정책을 자연어로 물어보세요.',
    to: '/chat'
  },
  {
    title: '커뮤니티',
    description: '청년 정책 경험과 정보를 함께 나눠요.',
    to: '/community'
  },
  {
    title: '마이페이지',
    description: '스크랩, 최근 본 정책, 알림을 모아봅니다.',
    to: '/mypage'
  },
  {
    title: '뉴스/영상',
    description: '정책 뉴스와 설명 영상을 한 번에 확인하세요.',
    to: '/news'
  }
];

const stats = [
  { label: '등록 정책', value: '2,640+', caption: '전국 청년 지원 정보' },
  { label: '맞춤 추천', value: '1:1', caption: '프로필 기반 추천 흐름' },
  { label: '커뮤니티', value: '320+', caption: '정책 후기와 질문' },
  { label: '알림/스크랩', value: 'D-7', caption: '마감 전 확인 지원' }
];

const policies = [
  {
    id: 'policy-1',
    title: '청년 월세 한시 특별지원',
    region: '전국',
    category: '주거',
    status: '모집중',
    deadline: '2026.07.31',
    summary: '무주택 청년의 월세 부담을 낮추기 위한 주거비 지원 정책입니다.'
  },
  {
    id: 'policy-2',
    title: '청년도약계좌 연계 지원',
    region: '전국',
    category: '금융',
    status: '상시',
    deadline: '상시 접수',
    summary: '자산 형성을 준비하는 청년을 위한 저축 지원 프로그램입니다.'
  },
  {
    id: 'policy-3',
    title: '서울 청년 취업사관학교',
    region: '서울',
    category: '일자리',
    status: '접수예정',
    deadline: '2026.08.12',
    summary: '디지털 실무 교육과 취업 연계를 제공하는 교육 지원 사업입니다.'
  }
];

const news = [
  {
    id: 'news-1',
    title: '2026년 청년 주거 지원 접수 일정 공개',
    source: '청년정책 브리핑',
    date: '2026.07.06'
  },
  {
    id: 'news-2',
    title: '지역별 청년 창업 지원금 확대 추진',
    source: '정책뉴스',
    date: '2026.07.05'
  },
  {
    id: 'news-3',
    title: '취업 준비 청년 대상 교육 바우처 안내',
    source: '고용지원 소식',
    date: '2026.07.04'
  }
];

export default function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <QuickMenu items={quickMenus} />
      <HomeStats stats={stats} />
      <PolicyPreviewList policies={policies} />
      <NewsPreviewList news={news} />
    </div>
  );
}
