export default function PageContainer({ children, size = 'lg', className = '' }) {
  const classes = ['layout-page-container', `layout-page-container-${size}`, className]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
