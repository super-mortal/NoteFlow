import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getDownloaderCookie, updateDownloaderCookie } from '@/services/downloader'
import { useParams } from 'react-router-dom'
import { videoPlatforms } from '@/constant/note.ts'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Cookie, BookOpen, ChevronDown, RotateCcw, ExternalLink } from 'lucide-react'

// 允许空字符串 — 用户可以清空 Cookie 后保存（留白）
const CookieSchema = z.object({
  cookie: z.string(),
})

/* ── 各平台 Cookie 获取指南 ── */
const COOKIE_GUIDES: Record<string, { key: string; steps: string[]; tips: string }> = {
  bilibili: {
    key: 'SESSDATA',
    steps: [
      '打开 https://www.bilibili.com 并登录你的账号',
      '按 F12 打开开发者工具 → 选择 "Application"（应用）标签',
      '左侧展开 Cookies → 选择 https://www.bilibili.com',
      '找到名为 SESSDATA 的行，复制其 Value',
      '或者：在 Console（控制台）输入 document.cookie 回车，复制全部输出',
    ],
    tips: 'B站 Cookie 主要需要 SESSDATA 字段，有效期较长，一次配置可长期使用。推荐在 Application 面板中单独复制 SESSDATA。',
  },
  youtube: {
    key: '__Secure-3PSID / SAPISID',
    steps: [
      '打开 https://www.youtube.com 并登录你的 Google 账号',
      '按 F12 → Application → Cookies → https://www.youtube.com',
      '建议逐个复制以下字段：__Secure-3PSID、__Secure-3PAPISID、SAPISID、APISID',
      '或者：在 Console 输入 document.cookie 回车，复制全部',
    ],
    tips: 'YouTube Cookie 有效期较短（约 1-3 天），过期后需重新配置。多个关键字段建议从 Application 面板逐一复制，而不是仅用 document.cookie。',
  },
  douyin: {
    key: 'msToken + sessionid',
    steps: [
      '打开 https://www.douyin.com 并登录你的抖音账号',
      '按 F12 → Application → Cookies → https://www.douyin.com',
      '关键字段：msToken、sessionid、ttwid',
      '在 Console 输入 document.cookie 回车，复制全部内容',
    ],
    tips: '抖音 Cookie 有效期较短，msToken 和 sessionid 较为重要。如果遇到下载失败，请重新获取 Cookie。',
  },
  kuaishou: {
    key: 'kuaishou.login.*',
    steps: [
      '打开 https://www.kuaishou.com 并登录你的快手账号',
      '按 F12 → Application → Cookies → https://www.kuaishou.com',
      '在 Console 输入 document.cookie 回车，复制全部内容',
    ],
    tips: '快手 Cookie 主要获取登录态相关字段即可。',
  },
}

const COOKIE_GENERAL_TIPS = [
  '所有平台都需要**先登录账号**，再通过 F12 开发者工具获取 Cookie',
  '推荐使用 Application 面板逐个复制关键字段，而不是直接粘贴 document.cookie',
  '部分 HttpOnly 标记的字段无法通过 JS（document.cookie）读取，如果 yt-dlp 下载失败，请从 Application 面板手动复制',
  'Cookie 会过期，遇到下载失败请先尝试更新 Cookie',
]

const DownloaderForm = () => {
  const form = useForm({
    resolver: zodResolver(CookieSchema),
    defaultValues: { cookie: '' },
  })
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [guideOpen, setGuideOpen] = useState(false)

  const platform = videoPlatforms.find(item => item.value === id)
  const guide = id ? COOKIE_GUIDES[id] : undefined

  useEffect(() => {
    const loadCookie = async () => {
      setLoading(true)
      try {
        const res = await getDownloaderCookie(id)
        form.reset({ cookie: res?.cookie || '' })
      } catch {
        form.reset({ cookie: '' })
      } finally {
        setLoading(false)
      }
    }
    if (id) loadCookie()
  }, [id])

  const onSubmit = async values => {
    try {
      await updateDownloaderCookie({
        platform: id,
        cookie: values.cookie,
      })
      toast.success('保存成功')
    } catch {
      toast.error('保存失败')
    }
  }

  const handleClear = () => {
    form.setValue('cookie', '')
  }

  if (!id) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Cookie className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
          <p className="text-sm text-text-secondary">请从左侧选择一个平台</p>
          <p className="mt-1 text-xs text-text-tertiary">配置各平台下载所需的 Cookie</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-text-tertiary">加载中…</span>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* 头部信息 */}
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <Cookie className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{platform?.label} Cookie 配置</h2>
                  <p className="text-xs text-text-tertiary">
                    Cookie 用于携带登录态，使下载器能访问平台内容
                  </p>
                </div>
              </div>
            </div>

            {/* Cookie 输入 */}
            <FormField
              control={form.control}
              name="cookie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Cookie</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={`粘贴 ${platform?.label} 的 Cookie…`}
                      className="min-h-[100px] resize-y text-sm font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="h-7 gap-1 text-xs text-text-tertiary hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      清空
                    </Button>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="gap-1.5">
              <Cookie className="h-4 w-4" />
              保存 Cookie
            </Button>

            {/* Cookie 获取指南 */}
            {guide && (
              <details
                open={guideOpen}
                onToggle={e => setGuideOpen(e.currentTarget.open)}
                className="group rounded-xl border border-border/40 bg-white"
              >
                <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-medium hover:text-primary transition-colors">
                  <BookOpen className="h-4 w-4 text-primary" />
                  如何获取 {platform?.label} Cookie？
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180 text-text-tertiary" />
                </summary>
                <div className="border-t border-border/40 px-4 pb-4 pt-3">
                  <div className="space-y-2.5">
                    {guide.steps.map((step, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                          {i + 1}
                        </div>
                        <p className="pt-0.5 leading-relaxed text-text-secondary">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="font-medium mb-1">💡 提示</p>
                    <p>{guide.tips}</p>
                  </div>
                </div>
              </details>
            )}

            {/* 通用提示 */}
            <details className="group rounded-xl border border-border/40 bg-white">
              <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-medium hover:text-primary transition-colors">
                <ExternalLink className="h-4 w-4 text-text-tertiary" />
                通用说明 & 注意事项
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180 text-text-tertiary" />
              </summary>
              <div className="border-t border-border/40 px-4 pb-4 pt-3">
                <ul className="space-y-2 text-sm text-text-secondary">
                  {COOKIE_GENERAL_TIPS.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">•</span>
                      <span dangerouslySetInnerHTML={{ __html: tip }} />
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </form>
        </Form>
      </div>
    </ScrollArea>
  )
}

export default DownloaderForm
