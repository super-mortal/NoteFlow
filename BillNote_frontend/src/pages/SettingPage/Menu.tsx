import {
  BotMessageSquare,
  Captions,
  HardDriveDownload,
  Info,
  Activity,
} from 'lucide-react'
import MenuBar, { IMenuProps } from '@/pages/SettingPage/components/menuBar.tsx'

const Menu = () => {
  const menuList: IMenuProps[] = [
    {
      id: 'model',
      name: 'AI 模型设置',
      icon: <BotMessageSquare />,
      path: '/settings/model',
    },
    {
      id: 'transcriber',
      name: '音频转写配置',
      icon: <Captions />,
      path: '/settings/transcriber',
    },
    {
      id: 'download',
      name: '下载配置',
      icon: <HardDriveDownload />,
      path: '/settings/download',
    },
    {
      id: 'monitor',
      name: '部署监控',
      icon: <Activity />,
      path: '/settings/monitor',
    },
    {
      id: 'about',
      name: '关于',
      icon: <Info />,
      path: '/settings/about',
    },
  ]
  return (
    <div className="flex h-full flex-col gap-1">
      <div className="px-3 pb-3 border-b border-border/50">
        <h2 className="text-lg font-semibold">设置</h2>
        <p className="text-xs text-muted-foreground/70 mt-0.5">全局配置与模型管理</p>
      </div>
      <div className="flex-1 pt-2 space-y-0.5">
        {menuList?.map(item => (
          <MenuBar key={item.id} menuItem={item} />
        ))}
      </div>
    </div>
  )
}
export default Menu
