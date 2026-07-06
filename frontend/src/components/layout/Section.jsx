export default function Section({ children, title, description, actions, className = '' }) {
  return (
    <section className={`layout-section ${className}`.trim()}>
      {(title || description || actions) && (
        <header className="layout-section-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="layout-section-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
