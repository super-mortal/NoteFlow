import { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface IProviderCardProps {
  id: string
  providerName: string
  Icon: any
  hasCookie?: boolean
}

const ProviderCard: FC<IProviderCardProps> = ({ providerName, Icon, id, hasCookie }) => {
  const navigate = useNavigate()
  const { id: currentId } = useParams()
  const isActive = currentId === id

  return (
    <div
      onClick={() => navigate(`/settings/download/${id}`)}
      className={cn(
        'group relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200',
        isActive
          ? 'border-primary/30 bg-primary-lighter shadow-sm'
          : 'border-border/40 bg-white shadow-sm hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md',
      )}
    >
      {/* 活跃指示条 */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
      )}

      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive
            ? 'bg-primary text-white'
            : 'bg-primary-light text-primary group-hover:bg-primary group-hover:text-white',
        )}
      >
        <Icon />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{providerName}</div>
        <div className="mt-0.5 text-xs text-text-tertiary">
          {hasCookie ? '已配置 Cookie' : '未配置'}
        </div>
      </div>
    </div>
  )
}

export default ProviderCard
