import Button from '../common/Button.jsx';
import Select from '../common/Select.jsx';
import Card from '../common/Card.jsx';

const filterOptions = {
  category: ['전체', '주거', '금융', '취업', '교육', '창업'],
  region: ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전'],
  status: ['전체', '신청가능', '마감임박', '마감'],
  income: ['전체', '제한없음', '중위소득', '저소득']
};

function toSelectOptions(values) {
  return values.map((value) => ({ value, label: value }));
}

export default function PolicyFilterPanel({ filters, onChange, onReset }) {
  const updateFilter = (key, value) => {
    onChange?.({ ...filters, [key]: value || '전체' });
  };

  return (
    <Card className="policy-filter-panel">
      <header className="policy-filter-header">
        <h2>필터</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          초기화
        </Button>
      </header>
      <div className="policy-filter-fields">
        <Select
          label="분야"
          value={filters.category}
          options={toSelectOptions(filterOptions.category)}
          placeholder=""
          onChange={(event) => updateFilter('category', event.target.value)}
        />
        <Select
          label="지역"
          value={filters.region}
          options={toSelectOptions(filterOptions.region)}
          placeholder=""
          onChange={(event) => updateFilter('region', event.target.value)}
        />
        <Select
          label="상태"
          value={filters.status}
          options={toSelectOptions(filterOptions.status)}
          placeholder=""
          onChange={(event) => updateFilter('status', event.target.value)}
        />
        <Select
          label="소득조건"
          value={filters.income}
          options={toSelectOptions(filterOptions.income)}
          placeholder=""
          onChange={(event) => updateFilter('income', event.target.value)}
        />
      </div>
    </Card>
  );
}
