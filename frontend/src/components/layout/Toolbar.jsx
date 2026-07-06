export default function Toolbar({ children, align = 'between', className = '' }) {
  const classes = ['layout-toolbar', `layout-toolbar-${align}`, className].filter(Boolean).join(' ');

  return <div className={classes}>{children}</div>;
}
