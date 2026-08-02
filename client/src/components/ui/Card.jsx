import { forwardRef } from 'react'

const Card = forwardRef(
  (
    {
      children,
      className = '',
      hover = false,
      padding = 'md',
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    }

    const hoverStyles = hover
      ? 'hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-hover)] transition-all duration-200 ease-out cursor-pointer'
      : ''

    return (
      <Component
        ref={ref}
        className={`
          bg-[var(--color-surface)]
          border
          border-[var(--color-border)]
          rounded-lg
          shadow-[var(--shadow-sm)]
          ${paddings[padding]}
          ${hoverStyles}
          ${className}
        `}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

export default Card