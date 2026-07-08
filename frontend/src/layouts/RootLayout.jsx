import { Link, Outlet } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageContainer from '../components/layout/PageContainer.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function RootLayout() {
  const { sessionMessage, clearSessionMessage } = useAuth();

  return (
    <div className="layout-root">
      <Header />
      {sessionMessage ? (
        <div className="layout-session-banner" role="status">
          <span>{sessionMessage}</span>
          <Link to="/login" onClick={clearSessionMessage}>
            로그인
          </Link>
        </div>
      ) : null}
      <main className="layout-main">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
