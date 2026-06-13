import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils.ts'

interface PipelineStep {
  label: string
  key: string
}

interface PipelineProgressProps {
  steps: PipelineStep[]
  currentStep: string
  className?: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  { label: '解析链接', key: 'PARSING' },
  { label: '下载音频', key: 'DOWNLOADING' },
  { label: '转写文字', key: 'TRANSCRIBING' },
  { label: '总结内容', key: 'SUMMARIZING' },
  { label: '保存完成', key: 'SUCCESS' },
]

const PipelineProgress = ({ steps = PIPELINE_STEPS, currentStep, className }: PipelineProgressProps) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className={cn('w-full max-w-md', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isPending = index > currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center">
              {/* 图标 */}
              <div className="relative">
                {isCompleted ? (
                  <CheckCircle2 className="h-8 w-8 text-success" />
                ) : isCurrent ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Circle className="h-8 w-8 text-muted-foreground/30" />
                )}
              </div>

              {/* 标签 */}
              <span
                className={cn(
                  'mt-1.5 whitespace-nowrap text-xs',
                  isCompleted && 'text-success font-medium',
                  isCurrent && 'text-primary font-medium',
                  isPending && 'text-muted-foreground/50',
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* 进度条 */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, ((currentIndex) / (steps.length - 1)) * 100))}%`,
          }}
        />
      </div>

      {currentStep && currentIndex < steps.length - 1 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {steps[currentIndex]?.label || ''}中…
        </p>
      )}
    </div>
  )
}

export default PipelineProgress
