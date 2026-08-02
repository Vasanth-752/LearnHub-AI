const Skeleton = ({
  variant = 'text',
  width = '100%',
  height,
  lines = 3,
  className = '',
  ...props
}) => {
  const baseStyles = `
    bg-[var(--color-surface)]
    rounded-md
    animate-shimmer
    ${className}
  `

  if (variant === 'circular') {
    return (
      <div
        style={{ width, height: height || width, borderRadius: '50%' }}
        className={baseStyles}
        aria-hidden="true"
        {...props}
      />
    )
  }

  if (variant === 'rectangular') {
    return (
      <div
        style={{ width, height: height || '120px' }}
        className={baseStyles}
        aria-hidden="true"
        {...props}
      />
    )
  }

  // Text variant - multiple lines
  return (
    <div
      style={{ width }}
      className={`${baseStyles} space-y-3`}
      aria-hidden="true"
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '1rem',
            width: i === lines - 1 ? '60%' : '100%',
          }}
          className="bg-[var(--color-surface)] rounded-md animate-shimmer"
        />
      ))}
    </div>
  )
}

export default Skeleton