import { useEffect, useState } from 'react';
import Button from '../common/Button.jsx';
import Select from '../common/Select.jsx';

const filterOptions = {
  category: ['전체', '주거', '금융', '취업', '교육', '창업'],
  region: ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전'],
  // status: ['전체', '신청가능', '마감임박', '마감'],
  income: ['전체', '제한없음', '중위소득', '저소득']
};

function toSelectOptions(values) {
  return values.map((value) => ({ value, label: value }));
}

export default function PolicyFilterPanel({ filters, onChange, onReset }) {
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const updateDraft = (key, value) => {
    if (key === 'includeClosed') {
      setDraftFilters((current) => ({ ...current, includeClosed: value }));
      return;
    }
    setDraftFilters((current) => ({ ...current, [key]: value || '전체' }));
  };

  const applyFilters = () => {
    onChange?.(draftFilters);
  };

  const resetFilters = () => {
    setDraftFilters({
      age: '',
      category: '전체',
      region: '전체',
      includeClosed: false,
      income: '전체'
    });
    onReset?.();
  };

  return (
    <aside className="policy-condition-sidebar" aria-label="정책 조건 입력 필터">
      <div className="policy-condition-title-row">
        <h2 className="policy-condition-title">조건 입력 필터</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="policy-condition-reset"
          onClick={resetFilters}
        >
          초기화
        </Button>
      </div>

      <div className="policy-condition-card">
        <div className="policy-condition-age-field">
          <label htmlFor="policy-age-filter">나이</label>
          <input
            id="policy-age-filter"
            type="number"
            min="0"
            max="99"
            inputMode="numeric"
            value={draftFilters.age}
            onChange={(event) => updateDraft('age', event.target.value)}
            placeholder="나이 입력"
          />
        </div>
        <Select
          label="분야"
          value={draftFilters.category}
          options={toSelectOptions(filterOptions.category)}
          placeholder=""
          onChange={(event) => updateDraft('category', event.target.value)}
          className="policy-condition-select"
        />
        <Select
          label="지역"
          value={draftFilters.region}
          options={toSelectOptions(filterOptions.region)}
          placeholder=""
          onChange={(event) => updateDraft('region', event.target.value)}
          className="policy-condition-select"
        />
        

        <Select
          label="소득조건"
          value={draftFilters.income}
          options={toSelectOptions(filterOptions.income)}
          placeholder=""
          onChange={(event) => updateDraft('income', event.target.value)}
          className="policy-condition-select"
        />

        <Button type="button" fullWidth className="policy-condition-apply" onClick={applyFilters}>
          조건 적용
        </Button>
      </div>

      <div className="policy-condition-tip">
        <strong>조건 입력 팁</strong>
        <ul>
          <li>먼저 검색창에서 궁금한 정책을<br />검색해 주세요.</li>
          <li>더 정확한 결과가 필요하면<br />분야, 지역, 소득조건을<br />추가로 적용해 주세요.</li>
        </ul>
      </div>
    </aside>
  );
}
