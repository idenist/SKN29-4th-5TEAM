export default function FormLayout({ children, title, description, actions, className = '', onSubmit }) {
  const content = (
    <>
      {(title || description) && (
        <header className="layout-form-header">
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </header>
      )}
      <div className="layout-form-fields">{children}</div>
      {actions ? <div className="layout-form-actions">{actions}</div> : null}
    </>
  );

  if (onSubmit) {
    return (
      <form className={`layout-form ${className}`.trim()} onSubmit={onSubmit}>
        {content}
      </form>
    );
  }

  return <div className={`layout-form ${className}`.trim()}>{content}</div>;
}
