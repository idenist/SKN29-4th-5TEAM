export default function Card({
  as: Component = 'section',
  children,
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) {
  const classes = [
    'ui-card',
    `ui-card-padding-${padding}`,
    interactive ? 'ui-card-interactive' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

// Example: <Card interactive>정책 카드 내용</Card>
