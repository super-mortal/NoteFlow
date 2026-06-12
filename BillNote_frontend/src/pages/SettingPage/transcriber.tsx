import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/Skeleton'
import {
  AudioLines,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Save,
  Plus,
  Trash2,
  Key,
  Globe,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  getTranscriberConfig,
  updateTranscriberConfig,
  getModelsStatus,
  downloadModel,
  addWhisperModel,
  deleteWhisperModel,
  TranscriberConfig,
  ModelStatus,
} from '@/services/transcriber'

const isWhisperType = (type: string) =>
  type === 'fast-whisper' || type === 'mlx-whisper'

export default function Transcriber() {
  const [config, setConfig] = useState<TranscriberConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [selectedModelSize, setSelectedModelSize] = useState('')
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([])
  const [mlxModelStatuses, setMlxModelStatuses] = useState<ModelStatus[]>([])
  const [mlxAvailable, setMlxAvailable] = useState(false)
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [openaiModelName, setOpenaiModelName] = useState('whisper-1')
  const [newModelName, setNewModelName] = useState('')
  const [newModelTarget, setNewModelTarget] = useState('')
  const [addingModel, setAddingModel] = useState(false)

  const reloadConfig = useCallback(async () => {
    try {
      setConfig(await getTranscriberConfig())
    } catch { /* silent */ }
  }, [])

  const fetchModelsStatus = useCallback(async () => {
    try {
      const data = await getModelsStatus()
      setModelStatuses(data.whisper)
      setMlxModelStatuses(data.mlx_whisper)
      setMlxAvailable(data.mlx_available)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTranscriberConfig()
        setConfig(data)
        setSelectedType(data.transcriber_type)
        setSelectedModelSize(data.whisper_model_size)
        setOpenaiBaseUrl(data.openai_transcriber_base_url || '')
        setOpenaiApiKey(data.openai_transcriber_api_key || '')
        setOpenaiModelName(data.openai_transcriber_model || 'whisper-1')
      } catch {
        toast.error('获取转写器配置失败')
      } finally {
        setLoading(false)
      }
    }
    load()
    fetchModelsStatus()
  }, [fetchModelsStatus])

  useEffect(() => {
    const hasDownloading =
      modelStatuses.some(m => m.downloading) || mlxModelStatuses.some(m => m.downloading)
    if (!hasDownloading) return
    const timer = setInterval(fetchModelsStatus, 3000)
    return () => clearInterval(timer)
  }, [modelStatuses, mlxModelStatuses, fetchModelsStatus])

  const handleSave = async () => {
    if (isWhisperType(selectedType)) {
      const pool = selectedType === 'mlx-whisper' ? mlxModelStatuses : modelStatuses
      const target = pool.find(m => m.model_size === selectedModelSize)
      if (target && !target.downloaded && !target.downloading) {
        const sizeHint: Record<string, string> = {
          'tiny': '~75MB',
          'base': '~150MB',
          'small': '~500MB',
          'medium': '~1.5GB',
          'large-v3': '~3GB',
          'large-v3-turbo': '~1.6GB',
        }
        const ok = window.confirm(
          `选择 ${selectedType} / ${selectedModelSize} 后，首次转写时会下载该模型（${sizeHint[selectedModelSize] || '体积未知'}）。\n` +
          `网络较差时容易中断；推荐改用 Groq / 必剪 / 快手 等在线引擎。\n\n继续保存吗？`,
        )
        if (!ok) return
      }
    }

    setSaving(true)
    try {
      const payload: Record<string, string | undefined> = {
        transcriber_type: selectedType,
      }
      if (isWhisperType(selectedType)) {
        payload.whisper_model_size = selectedModelSize
      }
      if (selectedType === 'openai-compatible') {
        payload.openai_transcriber_base_url = openaiBaseUrl
        payload.openai_transcriber_api_key = openaiApiKey
        payload.openai_transcriber_model = openaiModelName
      }
      await updateTranscriberConfig(payload as any)
      toast.success('转写器配置已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (modelSize: string, transcriberType: string) => {
    try {
      await downloadModel({ model_size: modelSize, transcriber_type: transcriberType })
      toast.success(`模型 ${modelSize} 开始下载`)
      setTimeout(fetchModelsStatus, 1000)
    } catch {
      toast.error('下载请求失败')
    }
  }

  const handleAddCustomModel = async () => {
    const name = newModelName.trim()
    const target = newModelTarget.trim()
    if (!name || !target) {
      toast.error('请填写模型名称和 HF repo_id / 本地路径')
      return
    }
    setAddingModel(true)
    try {
      await addWhisperModel({ name, target })
      toast.success(`已添加自定义模型 ${name}`)
      setNewModelName('')
      setNewModelTarget('')
      await reloadConfig()
      await fetchModelsStatus()
    } catch { /* silent */ } finally {
      setAddingModel(false)
    }
  }

  const handleDeleteCustomModel = async (name: string) => {
    try {
      await deleteWhisperModel(name)
      toast.success(`已删除自定义模型 ${name}`)
      if (selectedModelSize === name) setSelectedModelSize('tiny')
      await reloadConfig()
      await fetchModelsStatus()
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border/50 p-5 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="rounded-lg border border-border/50 p-5 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!config) {
    return <div className="p-6 text-center text-muted-foreground">无法加载配置</div>
  }

  const currentModels = selectedType === 'mlx-whisper' ? mlxModelStatuses : modelStatuses

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">音频转写配置</h2>
        <p className="mt-1 text-sm text-muted-foreground/70">
          选择视频音频转写为文字所使用的引擎，保存后对新任务立即生效
        </p>
      </div>

      {/* 两栏布局 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左栏：转写引擎 */}
        <div className="rounded-lg border border-border/50 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AudioLines className="h-4 w-4 text-primary" />
            转写引擎
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">转写器类型</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.available_types.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isWhisperType(selectedType) && (
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Whisper 模型大小</label>
                <Select value={selectedModelSize} onValueChange={setSelectedModelSize}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.whisper_model_sizes.map(size => {
                      const status = currentModels.find(m => m.model_size === size)
                      return (
                        <SelectItem key={size} value={size}>
                          <span className="flex items-center gap-2">
                            {size}
                            {status?.downloaded && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  模型越大精度越高，但速度更慢、占用更多显存
                </p>
              </div>
            )}

            {selectedType === 'mlx-whisper' && !config.mlx_whisper_available && (
              <Alert variant="warning" className="text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription>
                  MLX Whisper 当前不可用。需要 macOS 平台并安装{' '}
                  <code className="rounded bg-muted px-1">pip install mlx_whisper</code>
                </AlertDescription>
              </Alert>
            )}

            {selectedType === 'openai-compatible' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" /> Base URL
                  </label>
                  <Input
                    value={openaiBaseUrl}
                    onChange={e => setOpenaiBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="h-9 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Key className="h-3 w-3" /> API Key
                  </label>
                  <Input
                    type="password"
                    value={openaiApiKey}
                    onChange={e => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="h-9 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">模型名称</label>
                  <Input
                    value={openaiModelName}
                    onChange={e => setOpenaiModelName(e.target.value)}
                    placeholder="whisper-1"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || (selectedType === 'mlx-whisper' && !config.mlx_whisper_available)}
              className="gap-1.5"
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存配置
            </Button>
          </div>
        </div>

        {/* 右栏：模型管理 */}
        {isWhisperType(selectedType) && (
          <div className="rounded-lg border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4 text-primary" />
              模型管理
              <span className="text-xs font-normal text-muted-foreground/70">
                {selectedType === 'mlx-whisper' ? 'MLX Whisper' : 'Faster Whisper'}
              </span>
            </div>

            {currentModels.length > 0 && (
              <div className="space-y-2">
                {currentModels.map(model => (
                  <div
                    key={model.model_size}
                    className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium">{model.model_size}</span>
                      {model.downloaded ? (
                        <Badge variant="default" className="bg-green-500 text-white text-xs">
                          已下载
                        </Badge>
                      ) : model.downloading ? (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          下载中
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">未下载</Badge>
                      )}
                    </div>
                    {!model.downloaded && !model.downloading && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(model.model_size, selectedType)}
                        className="h-7 text-xs gap-1"
                      >
                        <Download className="h-3 w-3" />
                        下载
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 自定义模型 */}
            {selectedType === 'fast-whisper' && (
              <div className="space-y-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  自定义模型
                </div>
                <Alert className="text-xs border-border/40 py-2">
                  <AlertDescription>
                    填 <b>HF repo_id</b>（自动下载）或<b>本地路径</b>（目录内需含 model.bin）。
                    添加后可在上方选择使用。
                  </AlertDescription>
                </Alert>

                {config.whisper_custom_models && Object.keys(config.whisper_custom_models).length > 0 && (
                  <div className="space-y-1.5">
                    {Object.entries(config.whisper_custom_models).map(([name, target]) => {
                      const status = modelStatuses.find(m => m.model_size === name)
                      return (
                        <div key={name} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {name}
                              {status?.downloaded && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                              {status?.downloading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                            </div>
                            <div className="truncate text-xs text-muted-foreground/60" title={target}>
                              {target}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 text-red-400 hover:text-red-600"
                            onClick={() => handleDeleteCustomModel(name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="模型名称"
                    value={newModelName}
                    onChange={e => setNewModelName(e.target.value)}
                    className="h-8 text-xs sm:max-w-[140px]"
                  />
                  <Input
                    placeholder="HF repo_id 或本地路径"
                    value={newModelTarget}
                    onChange={e => setNewModelTarget(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button onClick={handleAddCustomModel} disabled={addingModel} size="sm" className="h-8 gap-1 text-xs">
                    {addingModel ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    添加
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
