import HeroSection from '../components/home/HeroSection.jsx';
import HomeStats from '../components/home/HomeStats.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import NewsPreviewList from '../components/home/NewsPreviewList.jsx';
import PolicyPreviewList from '../components/home/PolicyPreviewList.jsx';

const stats = [
  { value: '26,803', label: '통합 지원 정보' },
  { value: '3,165', label: '정책 제공 기관' },
  { value: '6개', label: '맞춤 지원 분야' }
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
      <HomeStats stats={stats} />
      <HowItWorks />
      <div className="home-lower-content">
        <PolicyPreviewList policies={policies} />
        <NewsPreviewList news={news} />
      </div>
    </div>
  );
}
