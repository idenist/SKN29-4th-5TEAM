import { NavLink } from 'react-router-dom';

const footerLinks = [
  { to: '/privacy', label: '개인정보처리방침' },
  { to: '/terms', label: '이용약관' },
  { to: '/community', label: '문의하기' }
];

export default function Footer() {
  return (
    <footer className="layout-footer">
      <div className="layout-footer-inner">
        <section className="layout-footer-about">
          <h2>이젠, 안쉼</h2>
          <p>청년 정책 통합 플랫폼 · 2025 · REQ-N-05</p>
        </section>
        <div className="layout-footer-links">
          {footerLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
