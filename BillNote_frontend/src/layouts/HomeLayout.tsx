import { FC, useState } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import { ScrollArea } from "@/components/ui/scroll-area.tsx"
import SidePanel from '@/components/SidePanel'
import TopNavbar from '@/components/TopNavbar'

interface IProps {
  NoteForm: React.ReactNode
  Preview: React.ReactNode
  History: React.ReactNode
}

const SIDEBAR_WIDTH = 300 // px

const HomeLayout: FC<IProps> = ({ NoteForm, Preview, History }) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <div
          style={{ width: collapsed ? 0 : SIDEBAR_WIDTH }}
          className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        >
          <SidePanel
            NoteForm={NoteForm}
            History={History}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(true)}
          />
        </div>

        {/* 侧边栏折叠时的展开按钮 */}
        {collapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(false)}
                  className="flex h-full w-8 shrink-0 items-center justify-center border-r border-border/50 bg-surface-sidebar hover:bg-accent transition-colors"
                >
                  <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>展开侧边栏</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* 主内容区 */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white animate-fade-in-up">
          <ScrollArea className="h-full">
            <div className="p-6">
              {Preview}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}

export default HomeLayout
