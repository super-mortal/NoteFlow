import { Outlet } from 'react-router-dom'
import Options from '@/components/Form/DownloaderForm/Options.tsx'
import ProxyConfig from '@/components/Form/DownloaderForm/ProxyConfig.tsx'
import { ScrollArea } from '@/components/ui/scroll-area'

const Downloader = () => {
  return (
    <div className="flex h-full gap-4 bg-muted/30 p-4">
      {/* 左侧栏 */}
      <aside className="flex w-72 shrink-0 flex-col gap-4">
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-4 pr-1">
            <Options />
          </div>
        </ScrollArea>
        <ProxyConfig />
      </aside>

      {/* 右侧内容 */}
      <main className="flex-1 overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <Outlet />
      </main>
    </div>
  )
}

export default Downloader
