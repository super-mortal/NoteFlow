import { useState, useEffect } from 'react'
import { useProviderStore } from '@/store/providerStore'
import ProviderList from '@/components/Form/modelForm/Provider.tsx'
import ProviderConfig from '@/components/Form/modelForm/Form.tsx'
import { Brain } from 'lucide-react'

const Model = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const fetchProviderList = useProviderStore(state => state.fetchProviderList)

  useEffect(() => {
    fetchProviderList()
  }, [])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setIsCreating(false)
  }

  const handleCreate = () => {
    setSelectedId(null)
    setIsCreating(true)
  }

  const handleSaved = () => {
    fetchProviderList()
  }

  return (
    <div className="flex h-full gap-4 bg-muted/30 p-4">
      {/* 左侧：供应商列表 */}
      <aside className="flex w-56 shrink-0 flex-col">
        <ProviderList
          selectedId={selectedId}
          isCreating={isCreating}
          onSelect={handleSelect}
          onCreate={handleCreate}
        />
      </aside>

      {/* 右侧：配置面板 */}
      <main className="flex-1 overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        {selectedId || isCreating ? (
          <ProviderConfig
            providerId={selectedId}
            isCreate={isCreating}
            onSaved={handleSaved}
            onCancel={() => { setSelectedId(null); setIsCreating(false) }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Brain className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
              <p className="text-sm text-text-secondary">请从左侧选择一个供应商</p>
              <p className="mt-1 text-xs text-text-tertiary">查看和修改 AI 模型供应商配置</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Model
