import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageContainer from '../components/layout/PageContainer.jsx';

export default function RootLayout() {
  return (
    <div className="layout-root">
      <Header />
      <main className="layout-main">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
}
