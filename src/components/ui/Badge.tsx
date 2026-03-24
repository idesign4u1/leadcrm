import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  color?: string
  className?: string
  dot?: boolean
}

export default function Badge({ label, color = '#6B7280', className, dot = true }: BadgeProps) {
  // Convert hex to rgba for background
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const bgColor = hexToRgba(color, 0.12)

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ backgroundColor: bgColor, color }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  )
}
