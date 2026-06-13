import { FC } from 'react'
import SidePanel from '@/components/SidePanel'

interface IProps {
  NoteForm: React.ReactNode
  Preview: React.ReactNode
  History: React.ReactNode
}

const SIDEBAR_WIDTH = 300

const HomeLayout: FC<IProps> = ({ NoteForm, Preview, History }) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏（固定宽度，不可折叠） */}
        <div style={{ width: SIDEBAR_WIDTH }} className="shrink-0 overflow-hidden">
          <SidePanel
            NoteForm={NoteForm}
            History={History}
          />
        </div>

        {/* 主内容区 — 移除 ScrollArea 外包装，让 MarkdownViewer 自行管理滚动 */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white animate-fade-in-up">
          {Preview}
        </main>
      </div>
    </div>
  )
}

export default HomeLayout
