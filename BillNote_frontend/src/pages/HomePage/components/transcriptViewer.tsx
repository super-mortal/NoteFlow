"use client"

import { useTaskStore } from "@/store/taskStore"
import { useEffect, useState } from "react"
import {ScrollArea} from "@/components/ui/scroll-area.tsx";

interface Segment {
  start: number
  end: number
  text: string
  speaker?: string
}

interface Task {
  transcript?: {
    segments?: Segment[]
  }
}

const TranscriptViewer = () => {
  const getCurrentTask = useTaskStore((state) => state.getCurrentTask)
  const currentTaskId = useTaskStore((state) => state.currentTaskId)
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    setTask(getCurrentTask())
  }, [currentTaskId, getCurrentTask])

  return (
    <div className="transcript-viewer flex h-full w-full flex-col rounded-md border bg-white p-3 shadow-sm">
      <h2 className="mb-3 text-sm font-medium">转写结果</h2>
      {!task?.transcript?.segments?.length ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">暂无转写内容</div>
      ) : (
        <ScrollArea className="w-full flex-1 overflow-y-auto">
          <div className="space-y-1">
            {task.transcript.segments.map((segment, index) => (
              <div
                key={index}
                className="rounded-md p-2 text-sm leading-relaxed text-slate-700 break-words hover:bg-slate-50 transition-colors"
              >
                {segment.speaker && (
                  <span className="mr-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                    {segment.speaker}
                  </span>
                )}
                {segment.text}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      {task?.transcript?.segments?.length > 0 && (
        <div className="mt-3 flex justify-between border-t pt-2 text-[10px] text-slate-500 shrink-0">
          <span>共 {task.transcript.segments.length} 条片段</span>
        </div>
      )}
    </div>
  )
}

export default TranscriptViewer
