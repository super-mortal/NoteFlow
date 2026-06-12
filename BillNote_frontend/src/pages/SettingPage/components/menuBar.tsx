import { FC, JSX } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface IMenuProps {
  id: string
  name: string
  icon: JSX.Element
  path: string
}

interface IMenuItem {
  menuItem: IMenuProps
}

const MenuBar: FC<IMenuItem> = ({ menuItem }) => {
  const location = useLocation()
  const isActive =
    location.pathname.startsWith(menuItem.path + '/') || location.pathname === menuItem.path

  return (
    <Link to={menuItem.path} className="block">
      <div
        className={cn(
          'relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary-light text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {/* 活跃指示条 */}
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
        )}

        <span className="h-5 w-5 shrink-0">{menuItem.icon}</span>
        <span>{menuItem.name}</span>
      </div>
    </Link>
  )
}

export default MenuBar
