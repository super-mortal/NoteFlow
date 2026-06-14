import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/Skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SlidersHorizontal, Save, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  getAdvancedNoteConfig,
  updateAdvancedNoteConfig,
  AdvancedNoteConfig,
} from '@/services/advancedNote'

export default function AdvancedNote() {
  const [config, setConfig] = useState<AdvancedNoteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [format, setFormat] = useState<string[]>([])
  const [extras, setExtras] = useState('')
  const [videoUnderstanding, setVideoUnderstanding] = useState(false)
  const [videoInterval, setVideoInterval] = useState(6)
  const [gridCols, setGridCols] = useState(2)
  const [gridRows, setGridRows] = useState(2)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdvancedNoteConfig()
        setConfig(data)
        setFormat(data.format || [])
        setExtras(data.extras || '')
        setVideoUnderstanding(!!data.video_understanding)
        setVideoInterval(data.video_interval ?? 6)
        setGridCols(data.grid_size?.[0] ?? 2)
        setGridRows(data.grid_size?.[1] ?? 2)
      } catch {
        toast.error('获取高级参数配置失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateAdvancedNoteConfig({
        format,
        extras,
        video_understanding: videoUnderstanding,
        video_interval: videoInterval,
        grid_size: [gridCols, gridRows],
      })
      toast.success('高级参数配置已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">笔记高级参数</h2>
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          配置生成笔记时的高级参数。在首页「笔记风格」下方开启「启用高级参数」开关后，
          这些参数将应用到新生成的笔记任务。
        </p>
      </div>

      {/* 主卡片 */}
      <div className="rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">高级参数</h3>
            <p className="text-xs text-text-tertiary">保存后对开启开关的新笔记任务生效</p>
          </div>
        </div>

        <div className="space-y-6 p-5">
          {/* 笔记格式 */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary">笔记格式</label>
            <div className="flex flex-wrap gap-3">
              {config.available_formats.map(({ label, value }) => (
                <label key={value} className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={format.includes(value)}
                    onCheckedChange={checked =>
                      setFormat(checked ? [...format, value] : format.filter(x => x !== value))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-text-tertiary">
              提示：原片跳转对本地视频无效；原片截图依赖下方「视频理解」开启。
            </p>
          </div>

          {/* 视频理解 */}
          <div className="border-t border-border/30 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-medium text-text-secondary">视频理解</label>
                <p className="text-xs text-text-tertiary">将视频截图发给多模态模型辅助分析</p>
              </div>
              <Switch checked={videoUnderstanding} onCheckedChange={setVideoUnderstanding} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">采样间隔（秒）</label>
                <Input
                  disabled={!videoUnderstanding}
                  type="number"
                  min={1}
                  max={30}
                  value={videoInterval}
                  onChange={e => setVideoInterval(+e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">拼图列数</label>
                <Input
                  disabled={!videoUnderstanding}
                  type="number"
                  min={1}
                  max={10}
                  value={gridCols}
                  onChange={e => setGridCols(+e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">拼图行数</label>
                <Input
                  disabled={!videoUnderstanding}
                  type="number"
                  min={1}
                  max={10}
                  value={gridRows}
                  onChange={e => setGridRows(+e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <Alert variant="warning" className="mt-3 text-xs py-2">
              <AlertDescription>
                <strong>提示：</strong>视频理解功能必须使用多模态模型。
              </AlertDescription>
            </Alert>
          </div>

          {/* 备注 */}
          <div className="border-t border-border/30 pt-5">
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">备注</label>
            <Textarea
              placeholder="笔记需要罗列出 xxx 关键点…"
              value={extras}
              onChange={e => setExtras(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="mt-1.5 text-xs text-text-tertiary">在 Prompt 结尾附加自定义说明</p>
          </div>
        </div>

        <div className="flex justify-end border-t border-border/30 px-5 py-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            保存配置
          </Button>
        </div>
      </div>
    </div>
  )
}
