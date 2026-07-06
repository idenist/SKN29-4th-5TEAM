import { NavLink } from 'react-router-dom';
import GlobalNav from './GlobalNav.jsx';
import UserMenu from './UserMenu.jsx';

export default function Header() {
  return (
    <header className="layout-header">
      <div className="layout-header-inner">
        <NavLink to="/" className="layout-brand" aria-label="이젠, 안심 홈">
          <span className="layout-brand-mark">EA</span>
          <span className="layout-brand-text">이젠, 안심</span>
        </NavLink>
        <GlobalNav />
        <UserMenu />
      </div>
    </header>
  );
}
