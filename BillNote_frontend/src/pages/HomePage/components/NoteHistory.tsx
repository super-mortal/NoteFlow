import { useTaskStore } from '@/store/taskStore'
import { cn } from '@/lib/utils.ts'
import { Trash, Search } from 'lucide-react'
import { Button } from '@/components/ui/button.tsx'
import Fuse from 'fuse.js'
import StatusBadge from '@/components/StatusBadge'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import LazyImage from "@/components/LazyImage.tsx";
import { FC, useState, useEffect, useMemo } from 'react'
import { videoPlatforms } from '@/constant/note.ts'

interface NoteHistoryProps {
  onSelect: (taskId: string) => void
  selectedId: string | null
}

const statusConfig: Record<string, { variant: 'success' | 'error' | 'info' | 'warning'; label: string }> = {
  SUCCESS: { variant: 'success', label: '已完成' },
  FAILED: { variant: 'error', label: '失败' },
  PENDING: { variant: 'warning', label: '排队中' },
  PARSING: { variant: 'info', label: '解析中' },
  DOWNLOADING: { variant: 'info', label: '下载中' },
  TRANSCRIBING: { variant: 'info', label: '转写中' },
  SUMMARIZING: { variant: 'info', label: '总结中' },
}

const NoteHistory: FC<NoteHistoryProps> = ({ onSelect, selectedId }) => {
  const tasks = useTaskStore(state => state.tasks)
  const removeTask = useTaskStore(state => state.removeTask)
  const baseURL = (String(import.meta.env.VITE_API_BASE_URL || 'api')).replace(/\/$/, '')
  const [rawSearch, setRawSearch] = useState('')
  const [search, setSearch] = useState('')
  const fuse = useMemo(() => new Fuse(tasks, {
    keys: ['audioMeta.title'],
    threshold: 0.4
  }), [tasks])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rawSearch === '') return
      setSearch(rawSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [rawSearch])

  const filteredTasks = search.trim()
    ? fuse.search(search).map(result => result.item)
    : tasks

  const getPlatformLabel = (platform: string) => {
    const p = videoPlatforms.find(v => v.value === platform)
    return p?.label || platform
  }

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return ''
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diff = now - then
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    return `${days}天前`
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索笔记标题..."
            className="w-full rounded-md border border-border/60 bg-muted/50 pl-8 pr-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-white transition-colors"
            value={rawSearch}
            onChange={e => setRawSearch(e.target.value)}
          />
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 py-8 text-center">
          <p className="text-sm text-muted-foreground/60">暂无记录</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索笔记标题..."
          className="w-full rounded-md border border-border/60 bg-muted/50 pl-8 pr-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-white transition-colors"
          value={rawSearch}
          onChange={e => setRawSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        {filteredTasks.map(task => {
          const cfg = statusConfig[task.status] || { variant: 'warning' as const, label: task.status || '未知' }
          return (
            <div
              key={task.id}
              onClick={() => onSelect(task.id)}
              className={cn(
                'group flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-all',
                selectedId === task.id
                  ? 'border-primary/40 bg-primary-lighter shadow-sm'
                  : 'border-border/40 bg-white hover:border-border/80 hover:shadow-sm'
              )}
            >
              {/* 封面 */}
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {task.platform === 'local' ? (
                  <img
                    src={task.audioMeta.cover_url ? `${task.audioMeta.cover_url}` : '/placeholder.png'}
                    alt="封面"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <LazyImage
                    src={
                      task.audioMeta.cover_url
                        ? `${baseURL}/image_proxy?url=${encodeURIComponent(task.audioMeta.cover_url)}`
                        : '/placeholder.png'
                    }
                    alt="封面"
                  />
                )}
              </div>

              {/* 内容 */}
              <div className="min-w-0 flex-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="truncate text-sm font-medium text-foreground">
                        {task.audioMeta.title || '未命名笔记'}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.audioMeta.title || '未命名笔记'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge
                    variant={cfg.variant}
                    label={cfg.label}
                    animated={cfg.variant === 'info'}
                  />
                  <span className="text-[10px] text-muted-foreground/50">
                    {getPlatformLabel(task.platform)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">
                    {formatRelativeTime(task.createdAt)}
                  </span>
                </div>
              </div>

              {/* 删除 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation()
                        removeTask(task.id)
                      }}
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>删除</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NoteHistory
