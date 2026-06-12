import { useState } from 'react'
import { NotebookPen, History as HistoryIcon, PanelLeftClose } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx'

interface ISidePanelProps {
  NoteForm: React.ReactNode
  History: React.ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
}

const SidePanel = ({ NoteForm, History, collapsed, onToggleCollapse }: ISidePanelProps) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-border/50 bg-surface-sidebar">
      {/* 头部区域 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4">
        {/* 标签切换 */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          <button
            onClick={() => setActiveTab('new')}
            data-state={activeTab === 'new' ? 'active' : 'inactive'}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground"
          >
            <NotebookPen className="h-3.5 w-3.5" />
            新建笔记
          </button>
          <button
            onClick={() => setActiveTab('history')}
            data-state={activeTab === 'history' ? 'active' : 'inactive'}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            生成历史
          </button>
        </div>

        {/* 折叠按钮 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span>收起侧边栏</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'new' ? (
          <div className="h-full overflow-y-auto p-4">
            {NoteForm}
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {History}
          </div>
        )}
      </div>
    </aside>
  )
}

export default SidePanel
