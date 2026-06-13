import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Lock,
  TestTube,
  Zap,
  Server,
  ChevronDown,
  Info,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  getTranscriberConfig,
  updateTranscriberConfig,
  getModelsStatus,
  downloadModel,
  addWhisperModel,
  deleteWhisperModel,
  testTranscriberConnection,
  TranscriberConfig,
  ModelStatus,
} from '@/services/transcriber'

const isWhisperType = (type: string) =>
  type === 'fast-whisper' || type === 'mlx-whisper'

const TRANSCRIBER_LABELS: Record<string, string> = {
  'fast-whisper': 'Faster Whisper（本地）',
  'mlx-whisper': 'MLX Whisper（仅macOS）',
  'bcut': '必剪（在线）',
  'kuaishou': '快手（在线）',
  'groq': 'Groq（在线）',
  'openai-compatible': 'OpenAI 兼容（自定义）',
}

const TRANSCRIBER_ICONS: Record<string, any> = {
  'fast-whisper': AudioLines,
  'mlx-whisper': AudioLines,
  'bcut': Zap,
  'kuaishou': Zap,
  'groq': Zap,
  'openai-compatible': Server,
}

const ENGINE_DESCRIPTIONS: Record<string, string> = {
  'fast-whisper': '本地运行，无需网络，精度与模型大小相关',
  'mlx-whisper': 'Apple Silicon 本地运行，效率极高',
  'bcut': '调用必剪在线接口，无需配置，即开即用',
  'kuaishou': '调用快手在线接口，无需配置，即开即用',
  'groq': 'Groq 高速推理，需填写 API Key，推荐 whisper-large-v3',
  'openai-compatible': '兼容 OpenAI Audio API 的任意服务商，需填写接口信息',
}

export default function Transcriber() {
  const [config, setConfig] = useState<TranscriberConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [selectedModelSize, setSelectedModelSize] = useState('')
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([])
  const [mlxModelStatuses, setMlxModelStatuses] = useState<ModelStatus[]>([])
  const [mlxAvailable, setMlxAvailable] = useState(false)

  // OpenAI 兼容
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [openaiModelName, setOpenaiModelName] = useState('whisper-1')

  // Groq
  const [groqApiKey, setGroqApiKey] = useState('')
  const [groqModel, setGroqModel] = useState('whisper-large-v3')

  // Whisper 模型管理
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
        setGroqApiKey(data.groq_api_key || '')
        setGroqModel(data.groq_model || 'whisper-large-v3')
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
      if (selectedType === 'groq') {
        payload.groq_api_key = groqApiKey
        payload.groq_model = groqModel
      }
      await updateTranscriberConfig(payload as any)
      toast.success('转写器配置已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    let baseUrl = ''
    let apiKey = ''
    let modelName = ''

    if (selectedType === 'groq') {
      baseUrl = config?.groq_base_url || 'https://api.groq.com/openai/v1'
      apiKey = groqApiKey
      modelName = groqModel
    } else if (selectedType === 'openai-compatible') {
      baseUrl = openaiBaseUrl
      apiKey = openaiApiKey
      modelName = openaiModelName
    } else {
      toast.error('当前引擎无需测试连通性')
      return
    }

    if (!apiKey) {
      toast.error('请填写 API Key')
      return
    }

    setTesting(true)
    try {
      await testTranscriberConnection({ base_url: baseUrl, api_key: apiKey, model: modelName })
      toast.success('连接测试成功 🎉')
    } catch {
      toast.error('连接测试失败，请检查 API Key 和 Base URL')
    } finally {
      setTesting(false)
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
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">无法加载配置</p>
      </div>
    )
  }

  const currentModels = selectedType === 'mlx-whisper' ? mlxModelStatuses : modelStatuses
  const EngineIcon = TRANSCRIBER_ICONS[selectedType] || AudioLines

  return (
    <div className="space-y-6 p-6">
      {/* ═══ Header ═══ */}
      <div>
        <h2 className="text-xl font-semibold">音频转写配置</h2>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          将视频中的语音转换为文字，供 AI 生成笔记。选择不同的转写引擎，
          决定转写的速度、精度和是否需要联网。
        </p>
      </div>

      {/* ═══ 主卡片：转写引擎 ═══ */}
      <div className="rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
            <AudioLines className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">转写引擎</h3>
            <p className="text-xs text-text-tertiary">
              选择用于语音转文字的引擎，保存后对新笔记任务立即生效
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {/* 引擎选择 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">引擎类型</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full max-w-md">
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
            <p className="mt-1 text-xs text-text-tertiary">
              {ENGINE_DESCRIPTIONS[selectedType] || ''}
            </p>
          </div>

          {/* ── Faster Whisper / MLX Whisper 配置 ── */}
          {isWhisperType(selectedType) && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Whisper 模型大小</label>
              <Select value={selectedModelSize} onValueChange={setSelectedModelSize}>
                <SelectTrigger className="w-full max-w-md">
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
              <p className="mt-1 text-xs text-text-tertiary">
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

          {/* ── Groq 配置 ── */}
          {selectedType === 'groq' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Globe className="h-3 w-3" />
                  Base URL
                  <span className="rounded bg-primary-light px-1.5 py-0.5 text-[10px] text-primary">系统预设</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={config.groq_base_url || 'https://api.groq.com/openai/v1'}
                    disabled
                    className="h-9 font-mono text-sm text-text-secondary bg-white/50"
                  />
                  <Lock className="h-3.5 w-3.5 shrink-0 text-text-tertiary" title="此地址由系统提供，不可修改" />
                </div>
                <p className="mt-1 text-xs text-text-tertiary">Groq 官方接口地址，由系统提供，不可修改</p>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-text-secondary">
                  <Key className="h-3 w-3" />
                  API Key
                </label>
                <Input
                  type="password"
                  value={groqApiKey}
                  onChange={e => setGroqApiKey(e.target.value)}
                  placeholder="gsk_xxxxxxxxxxxxxxxx"
                  className="h-9 font-mono text-sm max-w-md"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-text-secondary">
                  <AudioLines className="h-3 w-3" />
                  模型名称
                </label>
                <Select value={groqModel} onValueChange={setGroqModel}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.groq_preset_models?.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                    <SelectItem value="_custom_">
                      <span className="text-text-tertiary">手动输入其他模型…</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {groqModel === '_custom_' && (
                  <Input
                    value={groqModel}
                    onChange={e => setGroqModel(e.target.value)}
                    placeholder="输入 Groq 支持的模型名称"
                    className="mt-2 h-9 font-mono text-sm max-w-md"
                  />
                )}
                <p className="mt-1 text-xs text-text-tertiary">Groq 推荐使用 whisper-large-v3，速度快且精度高</p>
              </div>
            </div>
          )}

          {/* ── OpenAI 兼容配置 ── */}
          {selectedType === 'openai-compatible' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-text-secondary">
                  <Globe className="h-3 w-3" />
                  Base URL
                </label>
                <Input
                  value={openaiBaseUrl}
                  onChange={e => setOpenaiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="h-9 font-mono text-sm max-w-md"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-text-secondary">
                  <Key className="h-3 w-3" />
                  API Key
                </label>
                <Input
                  type="password"
                  value={openaiApiKey}
                  onChange={e => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  className="h-9 font-mono text-sm max-w-md"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-text-secondary">模型名称</label>
                <Input
                  value={openaiModelName}
                  onChange={e => setOpenaiModelName(e.target.value)}
                  placeholder="whisper-1"
                  className="h-9 text-sm max-w-md"
                />
              </div>
            </div>
          )}

          {/* ── 在线引擎无需配置提示 ── */}
          {(selectedType === 'bcut' || selectedType === 'kuaishou') && (
            <Alert className="text-xs border-green-200 bg-green-50">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <AlertDescription className="text-green-700">
                {selectedType === 'bcut' ? '必剪' : '快手'} 为在线引擎，无需额外配置，选择后直接保存即可使用
              </AlertDescription>
            </Alert>
          )}

          {/* ── 操作按钮 ── */}
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存配置
            </Button>

            {(selectedType === 'groq' || selectedType === 'openai-compatible') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testing}
                className="gap-1.5"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                测试连通性
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ 卡片：模型管理（仅本地 Whisper 显示） ═══ */}
      {isWhisperType(selectedType) && (
        <div className="rounded-xl border border-border/40 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Download className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                模型管理
                <span className="ml-1.5 text-xs font-normal text-text-tertiary">
                  {selectedType === 'mlx-whisper' ? 'MLX Whisper' : 'Faster Whisper'}
                </span>
              </h3>
              <p className="text-xs text-text-tertiary">
                管理本地 Whisper 模型的下载与删除
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {currentModels.length > 0 && (
              <div className="space-y-2">
                {currentModels.map(model => (
                  <div
                    key={model.model_size}
                    className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium">{model.model_size}</span>
                      {model.downloaded ? (
                        <Badge variant="default" className="bg-green-500 text-white text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
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

            {/* 自定义模型（仅 fast-whisper） */}
            {selectedType === 'fast-whisper' && (
              <div className="space-y-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Plus className="h-3 w-3" />
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
                        <div key={name} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {name}
                              {status?.downloaded && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                              {status?.downloading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                            </div>
                            <div className="truncate text-xs text-text-tertiary" title={target}>
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
                  <Button
                    onClick={handleAddCustomModel}
                    disabled={addingModel}
                    size="sm"
                    className="h-8 gap-1 text-xs shrink-0"
                  >
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
        </div>
      )}

      {/* ═══ 使用说明（折叠） ═══ */}
      <details className="group rounded-xl border border-border/40 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-3.5 text-sm font-medium text-text-secondary hover:text-foreground transition-colors">
          <Info className="h-4 w-4 text-primary" />
          各引擎使用说明
          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180 text-text-tertiary" />
        </summary>
        <div className="border-t border-border/30 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <AudioLines className="h-3.5 w-3.5 text-primary" />
                Faster Whisper
              </div>
              <p className="text-xs text-text-tertiary leading-relaxed">
                本地运行，无需联网。精度取决于模型大小（tiny → large-v3），
                模型越大越慢但越准。需要 CUDA 或 CPU 运行。首次使用会自动下载所选模型。
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                必剪 / 快手
              </div>
              <p className="text-xs text-text-tertiary leading-relaxed">
                调用平台在线接口，无需任何配置。适合快速转写，但依赖网络，
                且可能受到平台接口限制。
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <Zap className="h-3.5 w-3.5 text-purple-500" />
                Groq
              </div>
              <p className="text-xs text-text-tertiary leading-relaxed">
                Groq 提供极快的 AI 推理速度。Base URL 由系统预设不可修改，
                仅需填写 API Key 并选择合适的模型。推荐使用 whisper-large-v3。
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <Server className="h-3.5 w-3.5 text-blue-500" />
                OpenAI 兼容
              </div>
              <p className="text-xs text-text-tertiary leading-relaxed">
                兼容任意遵循 OpenAI Audio API 规范的服务商，
                如 OpenAI 官方、硅基流动、各类中转 API 等。
                需自行填写 Base URL、API Key 和模型名称。
              </p>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}
