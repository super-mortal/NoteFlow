import { Switch } from '@/components/ui/switch'
import { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AILogo from '@/components/Form/modelForm/Icons'
import { useProviderStore } from '@/store/providerStore'
import { cn } from '@/lib/utils'

export interface IProviderCardProps {
  id: string
  providerName: string
  Icon: string
  enable: number
}

const ProviderCard: FC<IProviderCardProps> = ({
  providerName,
  Icon,
  id,
}) => {
  const navigate = useNavigate()
  const updateProvider = useProviderStore(state => state.updateProvider)
  const enabled = useProviderStore(state => state.provider.find(p => p.id === id)?.enabled)

  const isChecked = enabled === 1
  const { id: currentId } = useParams()
  const isActive = currentId === id

  const handleToggle = (checked: boolean) => {
    const allProviders = useProviderStore.getState().provider
    const provider = allProviders.find(p => p.id === id)
    if (!provider) return
    updateProvider({
      ...provider,
      enabled: checked ? 1 : 0,
    })
  }

  return (
    <div
      onClick={() => navigate(`/settings/model/${id}`)}
      className={cn(
        'flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all hover:shadow-sm',
        isActive
          ? 'border-primary/40 bg-primary-lighter shadow-sm'
          : 'border-border/50 bg-white hover:border-border/80',
      )}
    >
      {/* 图标 + 开关 */}
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
          <AILogo name={Icon} size={22} />
        </div>
        <div onClick={e => e.stopPropagation()}>
          <Switch checked={isChecked} onCheckedChange={handleToggle} />
        </div>
      </div>

      {/* 名称 */}
      <div className="text-sm font-medium text-foreground truncate">
        {providerName}
      </div>

      {/* 状态标签 */}
      <div className="text-xs text-muted-foreground/60">
        {isChecked ? '已启用' : '已禁用'}
      </div>
    </div>
  )
}
export default ProviderCard
