import { Check, ChevronRight, ListChecks, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: ListChecks,
    title: '상황을 알려주세요',
    description: '나이, 지역, 관심 분야를 입력하세요.'
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI가 조건을 분석해요',
    description: '질문에서 핵심 조건을 찾고 지원 정보를 비교합니다.',
    active: true
  },
  {
    number: '03',
    icon: Check,
    title: '맞춤 정책을 확인하세요',
    description: '추천 이유부터 신청 링크까지 한눈에 확인할 수 있어요.'
  }
];

export default function HowItWorks() {
  return (
    <section className="home-how" aria-labelledby="home-how-title">
      <div className="home-section-heading">
        <p>HOW IT WORKS</p>
        <h2 id="home-how-title">복잡한 정책 탐색을 더 간단하게</h2>
        <span>한 문장으로 질문하면 조건을 이해하고, 관련 정책과 신청 정보를 연결합니다.</span>
      </div>
      <div className="home-how-card">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <article key={step.number} className="home-how-step">
              <div className={`home-how-icon${step.active ? ' active' : ''}`}>
                <Icon size={28} aria-hidden="true" />
                <span>{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < steps.length - 1 ? <ChevronRight className="home-how-arrow" size={24} aria-hidden="true" /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
