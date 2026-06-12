import { videoPlatforms } from '@/constant/note.ts'

interface IPlatformIconGroupProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const PlatformIconGroup = ({ value, onChange, disabled }: IPlatformIconGroupProps) => {
  return (
    <div className="flex gap-1.5">
      {videoPlatforms.map(p => {
        const isActive = value === p.value
        return (
          <button
            key={p.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p.value)}
            data-active={isActive}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all data-[active=true]:border-primary data-[active=true]:bg-primary-light data-[active=true]:text-primary data-[active=false]:border-border/60 data-[active=false]:text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            title={p.label}
          >
            <span className="h-4 w-4 shrink-0">{p.logo()}</span>
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default PlatformIconGroup
