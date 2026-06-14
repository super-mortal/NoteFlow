/* NoteForm.tsx — 重构版 -------------------------------------------------- */
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
  Sparkles,
} from 'lucide-react'
import { generateNote } from '@/services/note.ts'
import { uploadFile } from '@/services/upload.ts'
import { useTaskStore } from '@/store/taskStore'
import { useModelStore } from '@/store/modelStore'
import { useSystemStore } from '@/store/configStore'
import { getAdvancedNoteConfig } from '@/services/advancedNote'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
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
import { Switch } from '@/components/ui/switch.tsx'
import { noteStyles, videoPlatforms } from '@/constant/note.ts'
import { fetchModels } from '@/services/model.ts'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PlatformIconGroup from '@/components/PlatformIconGroup'

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

/* -------------------- 主组件 -------------------- */
const NoteForm = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  /* ---- 全局状态 ---- */
  const { addPendingTask, currentTaskId, setCurrentTask, getCurrentTask, retryTask } =
    useTaskStore()
  const { loadEnabledModels, modelList, showFeatureHint, setShowFeatureHint } = useModelStore()
  const { useAdvancedConfig, setUseAdvancedConfig } = useSystemStore()

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

    // 方案A：编辑老任务时，开关跟随该任务当年是否启用了高级参数（以 video_understanding
    // 或非空 format/extras 作为「用过高级参数」的判据），保证重试=复现。
    const usedAdvanced =
      !!formData.video_understanding ||
      (!!formData.format && formData.format.length > 0) ||
      !!formData.extras
    setUseAdvancedConfig(usedAdvanced)

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
    // 高级参数处理：
    //  - 编辑/重试老任务（方案A）：沿用该任务原有的高级参数，保证重试结果一致；
    //  - 开启「启用高级参数」开关：读取设置页后端配置；
    //  - 否则：提交默认空值，让后端走无高级参数的默认行为。
    let advancedOverrides: Partial<NoteFormValues> = {}
    if (editing && currentTask?.formData) {
      const fd = currentTask.formData
      advancedOverrides = {
        format: fd.format ?? [],
        extras: fd.extras ?? '',
        video_understanding: fd.video_understanding ?? false,
        video_interval: fd.video_interval ?? 6,
        grid_size: fd.grid_size ?? [2, 2],
      }
    } else if (useAdvancedConfig) {
      try {
        const cfg = await getAdvancedNoteConfig()
        advancedOverrides = {
          format: cfg.format ?? [],
          extras: cfg.extras ?? '',
          video_understanding: !!cfg.video_understanding,
          video_interval: cfg.video_interval ?? 6,
          grid_size: cfg.grid_size ?? [2, 2],
        }
      } catch (e) {
        console.error('读取高级参数配置失败：', e)
        toast.error('读取高级参数配置失败，请检查设置页')
        return
      }
    } else {
      advancedOverrides = {
        format: [],
        extras: '',
        video_understanding: false,
      }
    }

    const payload: NoteFormValues = {
      ...values,
      ...advancedOverrides,
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

          {/* ======== 启用高级参数开关 ======== */}
          <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">启用高级参数</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-pointer text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[220px]">
                    开启后，将应用「设置 → 笔记高级参数」中配置的笔记格式、视频理解、备注等参数。
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={useAdvancedConfig}
              onCheckedChange={setUseAdvancedConfig}
              disabled={!!editing}
            />
          </div>
        </form>
      </Form>
    </div>
  )
}

export default NoteForm
