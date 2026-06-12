import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Settings } from 'lucide-react'
import React from 'react'
import logo from '@/assets/icon.png'

interface ISettingLayoutProps {
  Menu: React.ReactNode
}
const SettingLayout = ({ Menu }: ISettingLayoutProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden bg-muted/30">
        {/* 左侧导航 */}
        <aside className="flex w-[260px] shrink-0 flex-col border-r border-border/50 bg-white">
          {/* Header */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl">
                <img src={logo} alt="logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-base font-bold">NoteFlow</span>
            </Link>

            <div className="flex items-center gap-1">
              {/* 设置图标（当前页面指示） */}
              <div className="flex items-center justify-center rounded-md p-1.5 text-primary" title="设置">
                <Settings className="h-4 w-4" />
              </div>

              {/* 返回首页按钮 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/"
                      className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>返回首页</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </header>

          {/* 菜单内容 */}
          <div className="flex-1 overflow-y-auto p-3">
            {Menu}
          </div>
        </aside>

        {/* 右侧内容区 */}
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default SettingLayout
