import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '홈', end: true },
  { to: '/chat', label: 'AI 챗봇' },
  { to: '/policies', label: '정책 검색' },
  { to: '/news', label: '뉴스' },
  { to: '/videos', label: '영상' },
  { to: '/community', label: '커뮤니티' }
];

export default function GlobalNav({ className = '' }) {
  return (
    <nav className={`layout-nav ${className}`.trim()} aria-label="주요 메뉴">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'layout-nav-link active' : 'layout-nav-link')}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
