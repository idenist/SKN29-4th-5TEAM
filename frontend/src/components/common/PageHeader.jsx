export default function PageHeader({ kicker, title, description, actions }) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header-text">
        {kicker ? <p className="ui-page-kicker">{kicker}</p> : null}
        <h1 className="ui-page-title">{title}</h1>
        {description ? <p className="ui-page-description">{description}</p> : null}
      </div>
      {actions ? <div className="ui-page-actions">{actions}</div> : null}
    </header>
  );
}

// Example: <PageHeader title="정책 검색" actions={<Button>검색</Button>} />
