import { cn } from '@/lib/utils.ts'

export type StatusVariant =
  | 'success'   // 绿色 — 完成
  | 'warning'   // 黄色 — 等待中/处理中
  | 'error'     // 红色 — 失败
  | 'info'      // 蓝色 — 进行中
  | 'neutral'   // 灰色 — 空闲/默认

interface IStatusBadgeProps {
  variant: StatusVariant
  label: string
  className?: string
  animated?: boolean
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error:   'bg-red-50 text-red-700 border-red-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
}

const dotStyles: Record<StatusVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-gray-400',
}

const StatusBadge = ({ variant, label, className, animated }: IStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          dotStyles[variant],
          animated && 'animate-pulse',
        )}
      />
      {label}
    </span>
  )
}

export default StatusBadge
