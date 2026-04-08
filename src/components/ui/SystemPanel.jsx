export function SystemPanel({ children, className = '', ...props }) {
  return (
    <div className={`system-panel ${className}`} {...props}>
      {children}
    </div>
  );
}
