import { cn } from '@/lib/utils.ts'

interface SkeletonProps {
  className?: string
}

const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className,
      )}
    />
  )
}

export { Skeleton }
