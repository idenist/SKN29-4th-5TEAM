import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import SignupPage from '../pages/SignupPage.jsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx';
import PolicySearchPage from '../pages/PolicySearchPage.jsx';
import PolicyDetailPage from '../pages/PolicyDetailPage.jsx';
import ChatPage from '../pages/ChatPage.jsx';
import CommunityPage from '../pages/CommunityPage.jsx';
import CommunityDetailPage from '../pages/CommunityDetailPage.jsx';
import MyPage from '../pages/MyPage.jsx';
import ProfileEditPage from '../pages/ProfileEditPage.jsx';
import PasswordChangePage from '../pages/PasswordChangePage.jsx';
import NotificationPage from '../pages/NotificationPage.jsx';
import NewsPage from '../pages/NewsPage.jsx';
import VideoPage from '../pages/VideoPage.jsx';

function PlaceholderRoute({ title, description }) {
  return (
    <section className="page-shell">
      <p className="eyebrow">준비 중</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </section>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'policies', element: <PolicySearchPage /> },
      { path: 'policies/:itemId', element: <PolicyDetailPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'community', element: <CommunityPage /> },
      { path: 'community/:postId', element: <CommunityDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'mypage', element: <MyPage /> },
          { path: 'mypage/profile', element: <ProfileEditPage /> },
          { path: 'mypage/password', element: <PasswordChangePage /> },
          { path: 'notifications', element: <NotificationPage /> }
        ]
      },
      { path: 'news', element: <NewsPage /> },
      { path: 'videos', element: <VideoPage /> }
    ]
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> }
    ]
  },
  {
    path: '*',
    element: (
      <PlaceholderRoute
        title="페이지를 찾을 수 없습니다"
        description="요청한 경로가 없거나 아직 연결되지 않았습니다."
      />
    )
  }
]);
