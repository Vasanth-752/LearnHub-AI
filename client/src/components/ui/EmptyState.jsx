import { LucideIcon } from 'lucide-react'
import Button from './Button'

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className = '',
  illustrationClassName = '',
}) => {
  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        text-center
        py-12
        px-4
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div
          className={`
            w-16 h-16
            rounded-full
            bg-[var(--color-primary-muted)]
            flex items-center justify-center
            text-[var(--color-primary)]
            mb-4
            ${illustrationClassName}
          `}
          aria-hidden="true"
        >
          <Icon className="w-8 h-8" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-[var(--color-text-secondary)] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          leftIcon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState