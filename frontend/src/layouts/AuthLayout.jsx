import { NavLink, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-card" aria-label="auth">
        <NavLink to="/" className="auth-logo" aria-label="Go to home">
          <span className="auth-logo-mark">EA</span>
          <span>이젠, 안심</span>
        </NavLink>
        <Outlet />
      </section>
    </main>
  );
}
