/* NoteForm.tsx — 重构版 -------------------------------------------------- */
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  Info,
  Loader2,
  Plus,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert.tsx'
import { generateNote } from '@/services/note.ts'
import { uploadFile } from '@/services/upload.ts'
import { useTaskStore } from '@/store/taskStore'
import { useModelStore } from '@/store/modelStore'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import { noteStyles, noteFormats, videoPlatforms } from '@/constant/note.ts'
import { fetchModels } from '@/services/model.ts'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PlatformIconGroup from '@/components/PlatformIconGroup'
import CollapsibleSection from '@/components/CollapsibleSection'

/* -------------------- 校验 Schema（不变）--------------------------- */
const formSchema = z
  .object({
    video_url: z.string().optional(),
    platform: z.string().nonempty('请选择平台'),
    quality: z.enum(['fast', 'medium', 'slow']),
    screenshot: z.boolean().optional(),
    link: z.boolean().optional(),
    model_name: z.string().nonempty('请选择模型'),
    format: z.array(z.string()).default([]),
    style: z.string().nonempty('请选择笔记生成风格'),
    extras: z.string().optional(),
    video_understanding: z.boolean().optional(),
    video_interval: z.coerce.number().min(1).max(30).default(6).optional(),
    grid_size: z
      .tuple([z.coerce.number().min(1).max(10), z.coerce.number().min(1).max(10)])
      .default([2, 2])
      .optional(),
  })
  .superRefine(({ video_url, platform }, ctx) => {
    if (platform === 'local') {
      if (!video_url) {
        ctx.addIssue({ code: 'custom', message: '本地视频路径不能为空', path: ['video_url'] })
      }
    }
    else {
      if (!video_url) {
        ctx.addIssue({ code: 'custom', message: '视频链接不能为空', path: ['video_url'] })
      }
      else {
        try {
          const url = new URL(video_url)
          if (!['http:', 'https:'].includes(url.protocol))
            throw new Error()
        }
        catch {
          ctx.addIssue({ code: 'custom', message: '请输入正确的视频链接', path: ['video_url'] })
        }
      }
    }
  })

export type NoteFormValues = z.infer<typeof formSchema>

/* -------------------- 可复用子组件 -------------------- */
const SectionHeader = ({ title, tip }: { title: string; tip?: string }) => (
  <div className="my-3 flex items-center justify-between">
    <h2 className="block text-sm font-medium text-foreground">{title}</h2>
    {tip && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="hover:text-primary h-3.5 w-3.5 cursor-pointer text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="text-xs">{tip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
)

const CheckboxGroup = ({
  value = [],
  onChange,
  disabledMap,
}: {
  value?: string[]
  onChange: (v: string[]) => void
  disabledMap: Record<string, boolean>
}) => (
  <div className="flex flex-wrap gap-2">
    {noteFormats.map(({ label, value: v }) => (
      <label key={v} className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
        <Checkbox
          checked={value.includes(v)}
          disabled={disabledMap[v]}
          onCheckedChange={checked =>
            onChange(checked ? [...value, v] : value.filter(x => x !== v))
          }
        />
        <span>{label}</span>
      </label>
    ))}
  </div>
)

/* -------------------- 主组件 -------------------- */
const NoteForm = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  /* ---- 全局状态 ---- */
  const { addPendingTask, currentTaskId, setCurrentTask, getCurrentTask, retryTask } =
    useTaskStore()
  const { loadEnabledModels, modelList, showFeatureHint, setShowFeatureHint } = useModelStore()

  /* ---- 表单 ---- */
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: 'bilibili',
      quality: 'medium',
      model_name: modelList[0]?.model_name || '',
      style: 'minimal',
      video_interval: 6,
      grid_size: [2, 2],
      format: [],
    },
  })
  const currentTask = getCurrentTask()

  /* ---- 派生状态（只 watch 一次，提高性能） ---- */
  const platform = useWatch({ control: form.control, name: 'platform' }) as string
  const videoUnderstandingEnabled = useWatch({ control: form.control, name: 'video_understanding' })
  const editing = currentTask && currentTask.id

  const goModelAdd = () => {
    navigate("/settings/model");
  };
  /* ---- 副作用 ---- */
  useEffect(() => {
    loadEnabledModels()
    return
  }, [])
  useEffect(() => {
    if (!currentTask) return
    const { formData } = currentTask

    form.reset({
      platform: formData.platform || 'bilibili',
      video_url: formData.video_url || '',
      model_name: formData.model_name || modelList[0]?.model_name || '',
      style: formData.style || 'minimal',
      quality: formData.quality || 'medium',
      extras: formData.extras || '',
      screenshot: formData.screenshot ?? false,
      link: formData.link ?? false,
      video_understanding: formData.video_understanding ?? false,
      video_interval: formData.video_interval ?? 6,
      grid_size: formData.grid_size ?? [2, 2],
      format: formData.format ?? [],
    })
  }, [
    currentTaskId,
    modelList.length,
    currentTask?.formData,
  ])

  /* ---- 帮助函数 ---- */
  const isGenerating = () => !['SUCCESS', 'FAILED', undefined].includes(getCurrentTask()?.status)
  const generating = isGenerating()
  const handleFileUpload = async (file: File, cb: (url: string) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    setIsUploading(true)
    setUploadSuccess(false)

    try {
      const data = await uploadFile(formData)
      cb(data.url)
      setUploadSuccess(true)
    } catch (err) {
      console.error('上传失败:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (values: NoteFormValues) => {
    const payload: NoteFormValues = {
      ...values,
      provider_id: modelList.find(m => m.model_name === values.model_name)!.provider_id,
      task_id: currentTaskId || '',
    }
    if (currentTaskId) {
      retryTask(currentTaskId, payload)
      return
    }

    try {
      const data = await generateNote(payload)
      addPendingTask(data.task_id, values.platform, payload)
    } catch (e: any) {
      if (e?.data?.reason === 'transcriber_model_not_ready') {
        const downloading = e?.data?.downloading
        toast.error(
          downloading
            ? '转写模型正在下载中，请稍候再提交'
            : '转写模型尚未下载，请先去「音频转写配置」页下载',
        )
        if (!downloading) navigate('/settings/transcriber')
        return
      }
      console.error('提交任务失败：', e)
    }
  }
  const onInvalid = (errors: any) => {
    console.warn('表单校验失败：', errors)
  }
  const handleCreateNew = () => {
    setCurrentTask(null)
    form.reset({
      platform: 'bilibili',
      quality: 'medium',
      model_name: modelList[0]?.model_name || '',
      style: 'minimal',
      video_interval: 6,
      grid_size: [2, 2],
      format: [],
      video_url: '',
      extras: '',
      screenshot: false,
      link: false,
      video_understanding: false,
    })
  }

  /* -------------------- 渲染 -------------------- */
  return (
    <div className="h-full w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          {/* 提交/新建按钮 */}
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  type="submit"
                  disabled={generating}
                  className="flex-1 bg-gradient-to-r from-primary to-indigo-500 text-white shadow-sm hover:shadow-md transition-all"
                >
                  {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  重新生成
                </Button>
                <Button type="button" variant="outline" className="shrink-0" onClick={handleCreateNew}>
                  <Plus className="mr-1 h-4 w-4" />
                  新建
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                disabled={generating}
                className="w-full bg-gradient-to-r from-primary to-indigo-500 text-white shadow-sm hover:shadow-md transition-all"
              >
                {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-1.5 h-4 w-4" />
                {generating ? '正在生成…' : '生成笔记'}
              </Button>
            )}
          </div>

          {/* 视频链接 */}
          <SectionHeader title="视频链接" tip="支持 B 站、YouTube 等平台" />

          {/* 平台图标按钮组 */}
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PlatformIconGroup
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!!editing}
                  />
                </FormControl>
                <FormMessage style={{ display: 'none' }} />
              </FormItem>
            )}
          />

          {/* 链接输入 + 快捷平台选择保留一个平铺 */}
          <FormField
            control={form.control}
            name="video_url"
            render={({ field }) => (
              <FormItem className="flex-1">
                {platform === 'local' ? (
                  <>
                    <Input disabled={!!editing} placeholder="请输入本地视频路径" {...field} />
                    <div
                      className="hover:border-primary mt-2 flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 transition-colors"
                      onDragOver={e => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={e => {
                        e.preventDefault()
                        const file = e.dataTransfer.files?.[0]
                        if (file) handleFileUpload(file, field.onChange)
                      }}
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'video/*'
                        input.onchange = e => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) handleFileUpload(file, field.onChange)
                        }
                        input.click()
                      }}
                    >
                      {isUploading ? (
                        <p className="text-center text-sm text-primary">上传中，请稍候…</p>
                      ) : uploadSuccess ? (
                        <p className="text-center text-sm text-success">上传成功！</p>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground">
                          拖拽文件到这里上传 <br />
                          <span className="text-xs text-muted-foreground/60">或点击选择文件</span>
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <Input disabled={!!editing} placeholder="粘贴视频链接，或选择平台后输入链接" {...field} />
                )}
                <FormMessage style={{ display: 'none' }} />
              </FormItem>
            )}
          />

          {/* 模型 + 风格分两行 */}
          {modelList.length > 0 ? (
            <FormField
              control={form.control}
              name="model_name"
              render={({ field }) => (
                <FormItem>
                  <SectionHeader title="模型" tip="不同模型效果不同，建议自行测试" />
                  <Select
                    onOpenChange={() => { loadEnabledModels() }}
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full min-w-0 truncate border-primary/30 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelList.map(m => (
                        <SelectItem key={m.id} value={m.model_name}>
                          {m.model_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormItem>
              <SectionHeader title="模型" tip="配置 AI 模型以生成笔记" />
              <Button type={'button'} variant={'outline'} onClick={goModelAdd} className="w-full border-primary/30 text-primary">
                请先添加模型
              </Button>
              <FormMessage />
            </FormItem>
          )}

          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <SectionHeader title="笔记风格" tip="选择生成笔记的呈现风格" />
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full min-w-0 truncate border-primary/30 focus:ring-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {noteStyles.map(({ label, value }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ======== 高级选项（折叠） ======== */}
          <CollapsibleSection title="高级选项">
            {/* 笔记格式 */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <SectionHeader title="笔记格式" tip="选择要包含的笔记元素" />
                  <CheckboxGroup
                    value={field.value}
                    onChange={field.onChange}
                    disabledMap={{
                      link: platform === 'local',
                      screenshot: !videoUnderstandingEnabled,
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 视频理解 */}
            <SectionHeader title="视频理解" tip="将视频截图发给多模态模型辅助分析" />
            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="video_understanding"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-xs text-muted-foreground">启用</FormLabel>
                      <Checkbox
                        checked={videoUnderstandingEnabled}
                        onCheckedChange={v => form.setValue('video_understanding', v)}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="video_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">采样间隔（秒）</FormLabel>
                      <Input disabled={!videoUnderstandingEnabled} type="number" {...field} className="h-8" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grid_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">拼图尺寸（列 × 行）</FormLabel>
                      <div className="flex items-center gap-1">
                        <Input
                          disabled={!videoUnderstandingEnabled}
                          type="number"
                          value={field.value?.[0] || 3}
                          onChange={e => field.onChange([+e.target.value, field.value?.[1] || 3])}
                          className="w-14 h-8"
                        />
                        <span className="text-muted-foreground text-xs">x</span>
                        <Input
                          disabled={!videoUnderstandingEnabled}
                          type="number"
                          value={field.value?.[1] || 3}
                          onChange={e => field.onChange([field.value?.[0] || 3, +e.target.value])}
                          className="w-14 h-8"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Alert variant="warning" className="text-xs py-2">
                <AlertDescription>
                  <strong>提示：</strong>视频理解功能必须使用多模态模型。
                </AlertDescription>
              </Alert>
            </div>

            {/* 备注 */}
            <FormField
              control={form.control}
              name="extras"
              render={({ field }) => (
                <FormItem>
                  <SectionHeader title="备注" tip="可在 Prompt 结尾附加自定义说明" />
                  <Textarea placeholder="笔记需要罗列出 xxx 关键点…" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleSection>
        </form>
      </Form>
    </div>
  )
}

export default NoteForm
