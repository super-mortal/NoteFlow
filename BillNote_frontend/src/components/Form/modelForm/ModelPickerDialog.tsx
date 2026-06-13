import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Plus, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModelItem {
  id: string
}

interface ModelPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  models: ModelItem[]
  existingModelNames: string[]
  loading: boolean
  onAddModel: (modelId: string) => Promise<void>
  onBatchAdd: (modelIds: string[]) => Promise<void>
}

export function ModelPickerDialog({
  open,
  onOpenChange,
  models,
  existingModelNames,
  loading,
  onAddModel,
  onBatchAdd,
}: ModelPickerDialogProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [addingSet, setAddingSet] = useState<Set<string>>(new Set())
  const [batchAdding, setBatchAdding] = useState(false)

  const normalizedExisting = new Set(existingModelNames.map(n => n.toLowerCase()))

  const filtered = models.filter(m => {
    if (!search.trim()) return true
    const kw = search.toLowerCase()
    return m.id.toLowerCase().includes(kw)
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const selectAllFiltered = () => {
    const ids = filtered.filter(m => !normalizedExisting.has(m.id.toLowerCase())).map(m => m.id)
    setSelected(new Set(ids))
  }

  const clearSelection = () => setSelected(new Set())

  const handleAddSingle = async (id: string) => {
    setAddingSet(prev => new Set(prev).add(id))
    try {
      await onAddModel(id)
    } finally {
      setAddingSet(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleBatchAdd = async () => {
    setBatchAdding(true)
    try {
      await onBatchAdd(Array.from(selected))
      setSelected(new Set())
    } finally {
      setBatchAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            可用模型
            {!loading && <span className="text-xs font-normal text-text-tertiary">共 {models.length} 个</span>}
          </DialogTitle>
        </DialogHeader>

        {/* 搜索 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="搜索模型..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>

        {/* 全选/取消 */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <button onClick={selectAllFiltered} className="hover:text-primary transition-colors">全选</button>
            <button onClick={clearSelection} className="hover:text-primary transition-colors">取消选择</button>
          </div>
        )}

        {/* 列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-text-tertiary">加载模型列表…</span>
          </div>
        ) : filtered.length > 0 ? (
          <ScrollArea className="max-h-80">
            <div className="space-y-0.5">
              {filtered.map(m => {
                const alreadyAdded = normalizedExisting.has(m.id.toLowerCase())
                const isAdding = addingSet.has(m.id)
                const isSelected = selected.has(m.id)
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      alreadyAdded ? 'opacity-50' : 'hover:bg-muted',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={alreadyAdded}
                      onChange={() => toggleSelect(m.id)}
                      className="h-3.5 w-3.5 rounded border-border text-primary accent-primary"
                    />
                    <span className="flex-1 truncate font-mono text-xs">{m.id}</span>
                    {alreadyAdded ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
                        <Check className="h-3 w-3" />
                        已添加
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isAdding}
                        onClick={() => handleAddSingle(m.id)}
                        className="h-7 w-7 shrink-0 p-0"
                      >
                        {isAdding ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-sm text-text-tertiary">
            {search ? '未找到匹配的模型' : '暂无可用模型'}
          </div>
        )}

        {/* 批量添加按钮 */}
        {!loading && selected.size > 0 && (
          <Button onClick={handleBatchAdd} disabled={batchAdding} className="w-full gap-1.5">
            {batchAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            添加选中 ({selected.size})
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
