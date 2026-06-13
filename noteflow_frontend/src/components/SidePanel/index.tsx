import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotebookPen, History as HistoryIcon, Settings } from 'lucide-react'
import logo from '@/assets/icon.png'
import { Button } from '@/components/ui/button'

interface ISidePanelProps {
  NoteForm: React.ReactNode
  History: React.ReactNode
}

const SidePanel = ({ NoteForm, History }: ISidePanelProps) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-border/50 bg-white">
      {/* 品牌区 + 右侧操作按钮 */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-border/40">
        {/* 左侧品牌 */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl">
            <img src={logo} alt="NoteFlow" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold text-foreground">NoteFlow</span>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-1">
          {/* 设置按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/settings')}
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex shrink-0 items-center gap-1 px-4 pt-3 pb-2">
        <button
          onClick={() => setActiveTab('new')}
          data-state={activeTab === 'new' ? 'active' : 'inactive'}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground"
        >
          <NotebookPen className="h-3.5 w-3.5" />
          新建
        </button>
        <button
          onClick={() => setActiveTab('history')}
          data-state={activeTab === 'history' ? 'active' : 'inactive'}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground"
        >
          <HistoryIcon className="h-3.5 w-3.5" />
          历史
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'new' ? (
          <div className="h-full overflow-y-auto px-4 pb-4">
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
