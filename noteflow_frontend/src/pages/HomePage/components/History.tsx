import NoteHistory from '@/pages/HomePage/components/NoteHistory.tsx'
import { useTaskStore } from '@/store/taskStore'
import { Clock } from 'lucide-react'

const History = () => {
  const currentTaskId = useTaskStore(state => state.currentTaskId)
  const setCurrentTask = useTaskStore(state => state.setCurrentTask)
  return (
    <div className={'flex h-full w-full flex-col gap-2 p-3'}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span>生成历史</span>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">
          {useTaskStore.getState().tasks.length} 条记录
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NoteHistory onSelect={setCurrentTask} selectedId={currentTaskId} />
      </div>
    </div>
  )
}

export default History
