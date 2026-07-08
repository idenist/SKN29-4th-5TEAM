import { NavLink, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-card" aria-label="auth">
        <NavLink to="/" className="auth-logo" aria-label="Go to home">
          <img className="auth-logo-mark" src="/home_logo.png" alt="" aria-hidden="true" />
          <span>이젠, 안쉼</span>
        </NavLink>
        <Outlet />
      </section>
    </main>
  );
}
