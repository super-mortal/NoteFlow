import { useState } from 'react'
import { useProviderStore } from '@/store/providerStore'
import { Button } from '@/components/ui/button.tsx'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AILogo from '@/components/Form/modelForm/Icons'
import toast from 'react-hot-toast'
import { deleteProvider } from '@/services/model'

interface ProviderListProps {
  selectedId: string | null
  isCreating: boolean
  onSelect: (id: string) => void
  onCreate: () => void
}

const ProviderList = ({ selectedId, isCreating, onSelect, onCreate }: ProviderListProps) => {
  const providers = useProviderStore(state => state.provider)
  const updateProvider = useProviderStore(state => state.updateProvider)
  const removeProvider = useProviderStore(state => state.removeProvider)
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  const handleToggle = async (e: React.MouseEvent, provider: any) => {
    e.stopPropagation()
    try {
      await updateProvider({
        ...provider,
        enabled: provider.enabled === 1 ? 0 : 1,
      })
    } catch {
      toast.error('切换失败')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  const handleDelete = async (id: string) => {
    setContextMenu(null)
    if (!window.confirm('确定要删除该供应商及其所有模型配置吗？')) return
    try {
      await deleteProvider(id)
      removeProvider(id)
      toast.success('已删除供应商')
    } catch {
      toast.error('删除失败')
    }
  }

  // 点击空白处关闭右键菜单
  const handlePaneClick = () => {
    if (contextMenu) setContextMenu(null)
  }

  return (
    <div className="flex h-full flex-col" onClick={handlePaneClick}>
      {/* Header */}
      <div className="px-3 pb-3">
        <h3 className="text-sm font-semibold">模型供应商</h3>
        <p className="mt-0.5 text-xs text-text-tertiary">{providers?.length || 0} 个供应商</p>
      </div>

      {/* 列表 */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-1">
        {providers?.map(provider => {
          const isActive = selectedId === provider.id && !isCreating
          const isChecked = provider.enabled === 1
          return (
            <div
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              onContextMenu={e => handleContextMenu(e, provider.id)}
              className={cn(
                'relative flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all',
                isActive
                  ? 'bg-primary-lighter text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {/* 活跃指示条 */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              )}

              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                <AILogo name={provider.logo || provider.name} size={18} />
              </div>

              <div className="min-w-0 flex-1 text-base font-medium truncate">
                {provider.name}
              </div>

              <div onClick={e => handleToggle(e, provider)}>
                <Switch checked={isChecked} className="scale-75" />
              </div>
            </div>
          )
        })}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 w-40 rounded-lg border border-border/40 bg-white py-1 shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleDelete(contextMenu.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除供应商
            </button>
          </div>
        </>
      )}

      {/* 添加按钮 */}
      <div className="px-1 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreate}
          className={cn(
            'w-full gap-1.5 text-xs',
            isCreating && 'border-primary/40 bg-primary-lighter text-primary',
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          添加新供应商
        </Button>
      </div>
    </div>
  )
}

export default ProviderList
