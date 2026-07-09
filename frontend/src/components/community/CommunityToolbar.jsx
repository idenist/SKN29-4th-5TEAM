import Button from '../common/Button.jsx';
import SearchBar from '../common/SearchBar.jsx';
import Select from '../common/Select.jsx';
import Toolbar from '../layout/Toolbar.jsx';
import { communityCategoryOptions } from '../../services/adapters/communityAdapter.js';

const categoryOptions = [{ value: 'all', label: '전체' }, ...communityCategoryOptions];

export default function CommunityToolbar({
  keyword,
  onKeywordChange,
  onSearch,
  category,
  onCategoryChange,
  onWriteClick
}) {
  return (
    <Toolbar className="community-toolbar">
      <SearchBar
        value={keyword}
        onChange={onKeywordChange}
        onSubmit={onSearch}
        placeholder="제목, 내용으로 검색"
        label="커뮤니티 검색어"
      />
      <div className="community-toolbar-actions">
        <Select
          label="카테고리"
          value={category}
          options={categoryOptions}
          placeholder=""
          onChange={(event) => onCategoryChange(event.target.value)}
        />
        <Button type="button" onClick={onWriteClick}>
          글쓰기
        </Button>
      </div>
    </Toolbar>
  );
}
