export default function Badge({ children, variant = 'neutral', className = '' }) {
  const classes = ['ui-badge', `ui-badge-${variant}`, className].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
}

// Example: <Badge variant="success">모집중</Badge>
