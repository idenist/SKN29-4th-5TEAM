import Card from '../common/Card.jsx';

export default function AuthCard({ kicker, title, description, children, footer }) {
  return (
    <Card className="auth-content-card" padding="none">
      <header className="auth-content-header">
        {kicker ? <p className="eyebrow">{kicker}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="auth-content-body">{children}</div>
      {footer ? <footer className="auth-content-footer">{footer}</footer> : null}
    </Card>
  );
}
