import { useEffect, useState } from 'react';
import HeroSection from '../components/home/HeroSection.jsx';
import HomeStats from '../components/home/HomeStats.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import NewsPreviewList from '../components/home/NewsPreviewList.jsx';
import PolicyPreviewList from '../components/home/PolicyPreviewList.jsx';
import { getNaverNews } from '../services/newsApi.js';
import { getPolicies } from '../services/policyApi.js';

const stats = [
  { value: '26,803', label: '통합 지원 정보' },
  { value: '3,165', label: '정책 제공 기관' },
  { value: '6개', label: '맞춤 지원 분야' }
];

export default function HomePage() {
  const [policies, setPolicies] = useState([]);
  const [news, setNews] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchPolicyPreview = async () => {
      try {
        const nextPolicies = await getPolicies({ keyword: '청년' });
        if (isMounted) setPolicies(nextPolicies.slice(0, 3));
      } catch {
        if (isMounted) setPolicies([]);
      }
    };

    const fetchNewsPreview = async () => {
      try {
        const nextNews = await getNaverNews('청년월세지원', 3);
        if (isMounted) setNews(nextNews);
      } catch {
        if (isMounted) setNews([]);
      }
    };

    fetchPolicyPreview();
    fetchNewsPreview();

    return () => {
      isMounted = false;
    };
  }, []);

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
