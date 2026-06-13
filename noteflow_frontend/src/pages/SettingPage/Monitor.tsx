import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/Skeleton'
import {
  Server,
  Cpu,
  AudioLines,
  Film,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { getDeployStatus, DeployStatus } from '@/services/system'

export default function Monitor() {
  const [status, setStatus] = useState<DeployStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDeployStatus()
      setStatus(data)
      setLastUpdated(new Date())
    } catch {
      setError('无法连接到后端服务')
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const StatusBadgeInner = ({ ok, label }: { ok: boolean; label?: string }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        ok
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {label || (ok ? '正常' : '异常')}
    </span>
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">部署监控</h2>
          <p className="mt-1 text-sm text-muted-foreground/70">实时监控系统各组件运行状态</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground/60">
              最后更新: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading} className="gap-1.5">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            刷新
          </Button>
        </div>
      </div>

      {/* 加载骨架屏 */}
      {loading && !status && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border border-border/50 p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 2×2 仪表盘卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 后端 */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Server className="h-4 w-4 text-blue-500" />
              后端 FastAPI
            </CardTitle>
            {status && (
              <StatusBadgeInner ok={status.backend.status === 'running'} label={status.backend.status === 'running' ? '运行中' : '已停止'} />
            )}
          </CardHeader>
          <CardContent>
            {loading && !status ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                加载中...
              </div>
            ) : status ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态</span>
                  <span className={status.backend.status === 'running' ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                    {status.backend.status === 'running' ? '运行中' : status.backend.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">端口</span>
                  <span className="font-mono text-xs">{status.backend.port}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* GPU */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Cpu className="h-4 w-4 text-green-500" />
              CUDA GPU
            </CardTitle>
            {status && (
              <StatusBadgeInner ok={status.cuda.available} label={status.cuda.available ? '已启用' : '未启用'} />
            )}
          </CardHeader>
          <CardContent>
            {loading && !status ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                加载中...
              </div>
            ) : status ? (
              <div className="space-y-1.5 text-sm">
                {status.cuda.available ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GPU</span>
                      <span className="font-medium">{status.cuda.gpu_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CUDA 版本</span>
                      <span className="font-mono text-xs">{status.cuda.version}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">CUDA 不可用，将使用 CPU 模式</div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Whisper */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AudioLines className="h-4 w-4 text-purple-500" />
              Whisper 模型
            </CardTitle>
            {status && (() => {
              const isLocal = status.whisper.transcriber_type === 'fast-whisper' || status.whisper.transcriber_type === 'mlx-whisper'
              if (!isLocal) return <StatusBadgeInner ok={true} label="在线引擎" />
              return <StatusBadgeInner ok={status.whisper.downloaded} label={status.whisper.downloaded ? '已下载' : '未下载'} />
            })()}
          </CardHeader>
          <CardContent>
            {loading && !status ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                加载中...
              </div>
            ) : status ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型大小</span>
                  <span className="font-medium">{status.whisper.model_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">转写引擎</span>
                  <span className="font-mono text-xs">{status.whisper.transcriber_type}</span>
                </div>
                {(status.whisper.transcriber_type === 'fast-whisper' || status.whisper.transcriber_type === 'mlx-whisper') && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">本地下载</span>
                    <span className={status.whisper.downloaded ? 'font-medium text-green-600' : 'font-medium text-amber-600'}>
                      {status.whisper.downloaded ? '已就绪' : '未下载'}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* FFmpeg */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Film className="h-4 w-4 text-orange-500" />
              FFmpeg
            </CardTitle>
            {status && (
              <StatusBadgeInner ok={status.ffmpeg.available} label={status.ffmpeg.available ? '可用' : '不可用'} />
            )}
          </CardHeader>
          <CardContent>
            {loading && !status ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                加载中...
              </div>
            ) : status ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态</span>
                  <span className={status.ffmpeg.available ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                    {status.ffmpeg.available ? '已安装' : '未安装'}
                  </span>
                </div>
                {!status.ffmpeg.available && (
                  <div className="text-xs text-red-500">请安装 FFmpeg 并添加到系统 PATH</div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
