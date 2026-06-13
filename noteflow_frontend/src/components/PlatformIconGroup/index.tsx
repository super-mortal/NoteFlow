import { videoPlatforms } from '@/constant/note.ts'

interface IPlatformIconGroupProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const PlatformIconGroup = ({ value, onChange, disabled }: IPlatformIconGroupProps) => {
  // 前 3 个在一行，后 2 个在第二行
  const firstRow = videoPlatforms.slice(0, 3)
  const secondRow = videoPlatforms.slice(3)

  return (
    <div className="flex flex-col gap-1.5">
      {/* 第一行：B站 / YouTube / 抖音 */}
      <div className="grid grid-cols-3 gap-1.5">
        {firstRow.map(p => {
          const isActive = value === p.value
          return (
            <button
              key={p.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.value)}
              data-active={isActive}
              className="flex items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-xs font-medium transition-all data-[active=true]:border-primary data-[active=true]:bg-primary-light data-[active=true]:text-primary data-[active=false]:border-border/60 data-[active=false]:text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              title={p.label}
            >
              <span className="h-4 w-4 shrink-0 flex items-center justify-center">{p.logo()}</span>
              <span className="truncate">{p.label}</span>
            </button>
          )
        })}
      </div>

      {/* 第二行：快手 / 本地视频 */}
      <div className="grid grid-cols-2 gap-1.5">
        {secondRow.map(p => {
          const isActive = value === p.value
          return (
            <button
              key={p.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p.value)}
              data-active={isActive}
              className="flex items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-xs font-medium transition-all data-[active=true]:border-primary data-[active=true]:bg-primary-light data-[active=true]:text-primary data-[active=false]:border-border/60 data-[active=false]:text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              title={p.label}
            >
              <span className="h-4 w-4 shrink-0 flex items-center justify-center">{p.logo()}</span>
              <span className="truncate">{p.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PlatformIconGroup
