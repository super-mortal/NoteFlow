import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx'

interface ICollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection = ({ title, defaultOpen = false, children }: ICollapsibleSectionProps) => {
  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-2">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg:first-child]:rotate-0">
        <ChevronRight className="h-4 w-4 -rotate-90 transition-transform duration-200 group-data-[state=open]:rotate-0" />
        <ChevronDown className="h-4 w-4 rotate-0 transition-transform duration-200 group-data-[state=open]:-rotate-90 hidden" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden transition-all duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <div className="space-y-3 pl-6">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default CollapsibleSection
