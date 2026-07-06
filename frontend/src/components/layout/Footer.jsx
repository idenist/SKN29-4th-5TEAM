import { NavLink } from 'react-router-dom';

const footerGroups = [
  {
    title: '정책',
    links: [
      { to: '/policies', label: '정책검색' },
      { to: '/mypage', label: '스크랩' }
    ]
  },
  {
    title: '커뮤니티',
    links: [
      { to: '/community', label: '게시글' },
      { to: '/news', label: '뉴스' }
    ]
  },
  {
    title: 'AI',
    links: [
      { to: '/chat', label: 'AI챗봇' },
      { to: '/videos', label: '영상' }
    ]
  }
];

export default function Footer() {
  return (
    <footer className="layout-footer">
      <div className="layout-footer-inner">
        <section className="layout-footer-about">
          <h2>이젠, 안심</h2>
          <p>청년 정책 탐색과 AI 상담을 한 곳에서 이어갈 수 있는 서비스입니다.</p>
        </section>
        <div className="layout-footer-links">
          {footerGroups.map((group) => (
            <section key={group.title} className="layout-footer-group">
              <h3>{group.title}</h3>
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </section>
          ))}
        </div>
      </div>
    </footer>
  );
}
