import ProviderCard from '@/components/Form/modelForm/components/providerCard.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useProviderStore } from '@/store/providerStore'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'

const Provider = () => {
  const providers = useProviderStore(state => state.provider)
  const navigate = useNavigate()
  const handleClick = () => {
    navigate(`/settings/model/new`)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 标题 */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">模型供应商</h3>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{providers?.length || 0} 个供应商</p>
      </div>

      {/* 搜索 + 添加 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-8 w-full rounded-md border border-border/60 bg-muted/50 pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-white transition-colors"
            placeholder="搜索供应商..."
          />
        </div>
        <Button type="button" onClick={handleClick} size="sm" className="h-8 shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" />
          添加
        </Button>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-2 gap-2">
        {providers?.map((provider, index) => (
          <ProviderCard
            key={index}
            providerName={provider.name}
            Icon={provider.logo}
            id={provider.id}
            enable={provider.enabled}
          />
        ))}
      </div>
    </div>
  )
}
export default Provider
