import { forwardRef, cloneElement, Children } from 'react'

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      asChild = false,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex
      items-center
      justify-center
      gap-2
      font-medium
      rounded-md
      transition-all
      duration-200
      ease-out
      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-offset-2
      disabled:opacity-50
      disabled:cursor-not-allowed
      active:scale-[0.98]
    `

    const variants = {
      primary: `
        bg-[var(--color-primary)]
        text-[var(--color-bg)]
        hover:bg-[var(--color-primary-hover)]
        focus-visible:ring-[var(--color-primary)]
      `,
      secondary: `
        bg-[var(--color-secondary)]
        text-white
        hover:bg-[var(--color-secondary-hover)]
        focus-visible:ring-[var(--color-secondary)]
      `,
      outline: `
        border
        border-[var(--color-border)]
        bg-transparent
        text-[var(--color-text)]
        hover:bg-[var(--color-primary-muted)]
        hover:border-[var(--color-border-hover)]
        focus-visible:ring-[var(--color-primary)]
      `,
      ghost: `
        bg-transparent
        text-[var(--color-text)]
        hover:bg-[var(--color-primary-muted)]
        focus-visible:ring-[var(--color-primary)]
      `,
      danger: `
        bg-[var(--color-danger)]
        text-white
        hover:bg-[var(--color-secondary-hover)]
        focus-visible:ring-[var(--color-danger)]
      `,
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    }

    const width = fullWidth ? 'w-full' : ''
    const composedClass = `${baseStyles} ${variants[variant] || ''} ${sizes[size]} ${width} ${className}`.replace(/\s+/g, ' ').trim()

    const content = (
      <>
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span aria-hidden="true">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </>
    )

    // asChild: render child element with button styles (Radix slot pattern)
    if (asChild) {
      const child = Children.only(children)
      return cloneElement(child, {
        ref,
        className: `${composedClass} ${child.props.className || ''}`.trim(),
        disabled: disabled || loading,
        'aria-label': ariaLabel,
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        className={composedClass}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button