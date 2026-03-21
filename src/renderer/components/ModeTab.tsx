import { cn } from '@/renderer/lib/utils'

interface ModeTabProps {
  label: string
  active: boolean
  onClick: () => void
}

export default function ModeTab({ label, active, onClick }: ModeTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
        'border-b-2 bg-transparent',
        active
          ? 'border-gold text-gold'
          : 'border-transparent text-text/60 hover:text-text hover:bg-surface-hover'
      )}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {label}
    </button>
  )
}
