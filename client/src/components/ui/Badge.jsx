const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-border-hover)]',
    success: 'bg-[rgba(74,222,128,0.12)] text-[var(--color-success)] border border-[rgba(74,222,128,0.3)]',
    warning: 'bg-[rgba(255,177,98,0.12)] text-[var(--color-primary)] border border-[var(--color-border-hover)]',
    danger: 'bg-[rgba(163,81,57,0.12)] text-[var(--color-danger)] border border-[rgba(163,81,57,0.3)]',
    neutral: 'bg-[var(--color-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        font-medium
        rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge