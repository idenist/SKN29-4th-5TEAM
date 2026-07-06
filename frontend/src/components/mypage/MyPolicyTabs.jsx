import { useState } from 'react';
import Tabs from '../common/Tabs.jsx';
import ScrappedPolicies from './ScrappedPolicies.jsx';
import ViewedPolicies from './ViewedPolicies.jsx';
import SearchHistoryList from './SearchHistoryList.jsx';

export default function MyPolicyTabs({ scrappedPolicies, viewedPolicies, searchHistory }) {
  const [activeTab, setActiveTab] = useState('scraps');

  const tabs = [
    { value: 'scraps', label: '스크랩 정책' },
    { value: 'viewed', label: '최근 본 정책' },
    { value: 'history', label: '검색 기록' }
  ];

  return (
    <section className="mypage-tabs-panel">
      <Tabs tabs={tabs} activeValue={activeTab} onChange={setActiveTab} ariaLabel="마이페이지 정책 탭">
        {activeTab === 'scraps' ? <ScrappedPolicies policies={scrappedPolicies} /> : null}
        {activeTab === 'viewed' ? <ViewedPolicies policies={viewedPolicies} /> : null}
        {activeTab === 'history' ? <SearchHistoryList items={searchHistory} /> : null}
      </Tabs>
    </section>
  );
}
