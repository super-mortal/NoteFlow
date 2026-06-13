import { cn } from '@/lib/utils.ts'

export type ViewTabId = 'markdown' | 'mindmap'

interface ViewTab {
  id: ViewTabId
  label: string
  icon?: React.ReactNode
}

interface ViewTabsProps {
  tabs: ViewTab[]
  activeTab: ViewTabId
  onChange: (tab: ViewTabId) => void
  className?: string
}

const DEFAULT_TABS: ViewTab[] = [
  { id: 'markdown', label: 'Markdown' },
  { id: 'mindmap', label: '思维导图' },
]

const ViewTabs = ({ tabs = DEFAULT_TABS, activeTab, onChange, className }: ViewTabsProps) => {
  return (
    <div className={cn('flex gap-0.5 rounded-lg bg-muted p-0.5', className)}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            data-active={isActive}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
              'data-[active=true]:bg-white data-[active=true]:text-foreground data-[active=true]:shadow-sm',
              'data-[active=false]:text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export type { ViewTab }
export { DEFAULT_TABS }
export default ViewTabs
