import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import {
  Github,
  ExternalLink,
  Globe,
  FileText,
  Paintbrush,
  Eye,
  Cpu,
  Mic,
  BrainCircuit,
  Image,
  ArrowUpRight,
  ScrollText,
  Frame,
  Sparkles,
  Command,
  ChevronRight,
  RefreshCw,
  Download,
} from 'lucide-react'
import logo from '@/assets/icon.png'
import { useInView } from 'react-intersection-observer'
import { useState, useEffect, useCallback } from 'react'
import { Progress } from 'antd'
import { isTauri } from '@tauri-apps/api/core'

const DISPLAY_VERSION = __APP_VERSION__

/* ── Check for updates ── */

// GitHub API 检查最新版本（通用，桌面端和 Web 共用 */
async function checkGitHubLatestVersion(): Promise<{ latest: string; url: string } | null> {
  try {
    const res = await fetch(
      'https://api.github.com/repos/super-mortal/NoteFlow/releases/latest',
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const tag = data.tag_name ?? ''
    const version = tag.startsWith('v') ? tag.slice(1) : tag
    return { latest: version, url: data.html_url ?? '' }
  } catch {
    return null
  }
}

type UpdateState =
  | { type: 'idle' }
  | { type: 'checking' }
  | { type: 'up-to-date' }
  | { type: 'available'; version: string; body?: string }
  | { type: 'downloading'; progress: number }
  | { type: 'downloaded' }
  | { type: 'error'; message: string }

/* ── A simple fade-in-up wrapper ── */
function FadeInSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${
        inView
          ? 'translate-y-0 opacity-100'
          : 'translate-y-6 opacity-0'
      }`}
    >
      {children}
    </div>
  )
}

/* ── Feature data ── */
const features = [
  {
    title: '多平台支持',
    desc: 'Bilibili、YouTube、抖音、本地视频',
    icon: Globe,
    colSpan: 'col-span-1',
  },
  {
    title: '笔记格式选择',
    desc: '返回多种笔记格式，满足不同需求',
    icon: FileText,
    colSpan: 'col-span-1',
  },
  {
    title: '笔记风格选择',
    desc: '多种笔记风格，个性化定制输出',
    icon: Paintbrush,
    colSpan: 'col-span-1',
  },
  {
    title: '多模态视频理解',
    desc: '结合视觉和音频，全面理解视频内容',
    icon: Eye,
    colSpan: 'col-span-2',
  },
  {
    title: '自定义大模型 API',
    desc: '自由接入各类大语言模型',
    icon: Cpu,
    colSpan: 'col-span-1',
  },
  {
    title: '本地音频转写',
    desc: 'Fast-Whisper 等模型本地转写',
    icon: Mic,
    colSpan: 'col-span-1',
  },
  {
    title: '结构化笔记',
    desc: '自动生成结构化 Markdown 笔记',
    icon: ScrollText,
    colSpan: 'col-span-1',
  },
  {
    title: '智能截图',
    desc: '可选插入自动截取的关键画面',
    icon: Image,
    colSpan: 'col-span-1',
  },
  {
    title: '内容跳转',
    desc: '关联原视频的时间锚点跳转链接',
    icon: ArrowUpRight,
    colSpan: 'col-span-1',
  },
  {
    title: 'RAG 智能问答',
    desc: '基于向量检索，对笔记内容进行 AI 问答',
    icon: BrainCircuit,
    colSpan: 'col-span-2',
  },
]

export default function AboutPage() {
  const [updateState, setUpdateState] = useState<UpdateState>({ type: 'idle' })
  const [upgradeInfo, setUpgradeInfo] = useState<{ version: string; body: string } | null>(null)

  const checkForUpdates = useCallback(async () => {
    setUpdateState({ type: 'checking' })

    if (isTauri()) {
      // 桌面端：使用 Tauri updater
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const { relaunch } = await import('@tauri-apps/plugin-process')
        const updateResult = await check()
        if (updateResult?.available) {
          setUpgradeInfo({ version: updateResult.version, body: updateResult.body ?? '' })
          setUpdateState({ type: 'available', version: updateResult.version, body: updateResult.body })
        } else {
          // 没有新版本但 GitHub 可能有（updater 基于 update.json，可能延迟），
          // 再查 GitHub API 做兜底
          const gh = await checkGitHubLatestVersion()
          if (gh && gh.latest !== DISPLAY_VERSION) {
            setUpgradeInfo({ version: gh.latest, body: '' })
            setUpdateState({ type: 'available', version: gh.latest })
          } else {
            setUpdateState({ type: 'up-to-date' })
          }
        }
      } catch (e) {
        // 失败时降级到 GitHub API
        const gh = await checkGitHubLatestVersion()
        if (gh && gh.latest !== DISPLAY_VERSION) {
          setUpgradeInfo({ version: gh.latest, body: '' })
          setUpdateState({ type: 'available', version: gh.latest })
        } else {
          setUpdateState({ type: 'error', message: String(e) })
        }
      }
    } else {
      // Docker / Web：检查 GitHub API
      const gh = await checkGitHubLatestVersion()
      if (gh && gh.latest !== DISPLAY_VERSION) {
        setUpgradeInfo({ version: gh.latest, body: '' })
        setUpdateState({ type: 'available', version: gh.latest })
      } else {
        setUpdateState({ type: 'up-to-date' })
      }
    }
  }, [])

  const handleUpdateNow = useCallback(async () => {
    if (!isTauri()) {
      // 非桌面端：跳转到 GitHub Releases
      window.open('https://github.com/super-mortal/NoteFlow/releases/latest', '_blank')
      setUpdateState({ type: 'idle' })
      setUpgradeInfo(null)
      return
    }

    // 桌面端：下载并安装
    try {
      setUpdateState({ type: 'downloading', progress: 0 })
      const { check } = await import('@tauri-apps/plugin-updater')
      const { relaunch } = await import('@tauri-apps/plugin-process')
      const updateResult = await check()
      if (updateResult?.available) {
        const interval = setInterval(() => {
          setUpdateState(prev => ({
            ...prev,
            type: 'downloading' as const,
            progress: Math.min((prev as any).progress + 0.1, 0.9),
          }))
        }, 2000)
        await updateResult.downloadAndInstall()
        clearInterval(interval)
        setUpdateState({ type: 'downloaded' })
        setUpgradeInfo(null)
        await relaunch()
      }
    } catch {
      setUpdateState({ type: 'error', message: '下载更新失败，请稍后重试' })
    }
  }, [])

  const handleSkip = useCallback(() => {
    setUpdateState({ type: 'idle' })
    setUpgradeInfo(null)
  }, [])

  // 自动检查更新（只在桌面端启动时检查一次）
  useEffect(() => {
    if (isTauri()) {
      const timer = setTimeout(() => checkForUpdates(), 3000)
      return () => clearTimeout(timer)
    }
  }, [checkForUpdates])

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="mx-auto min-h-full max-w-4xl px-6 py-12 md:py-16">
        {/* ═══ Hero ═══ */}
        <FadeInSection>
          <div className="mb-14 flex flex-col items-center text-center">
            <div className="mb-5 flex items-center justify-center">
              <div className="mr-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary-light ring-1 ring-primary/10">
                <img
                  src={logo}
                  alt="NoteFlow Logo"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold tracking-tight">
                  NoteFlow
                </h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded-md bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/15">
                    v{DISPLAY_VERSION}
                  </span>
                  <span className="text-xs text-text-tertiary">AI 视频笔记生成工具</span>
                </div>
              </div>
            </div>

            <p className="text-text-secondary mx-auto mb-6 max-w-xl text-base leading-relaxed">
              让 AI 为你的视频做笔记 —— 输入链接，自动提取内容，
              生成结构清晰、重点明确的 Markdown 笔记。
            </p>

            <div className="mb-7 flex flex-wrap justify-center gap-2">
              {['MIT License', 'React 19', 'FastAPI', 'Docker Compose', 'Active'].map(
                (label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="border-border/40 bg-white/70 text-xs font-normal"
                  >
                    {label}
                  </Badge>
                ),
              )}
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <a
                  href="https://github.com/super-mortal/NoteFlow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <Github className="h-4 w-4" />
                  GitHub 仓库
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/" className="gap-2">
                  <Command className="h-4 w-4" />
                  开始使用
                </a>
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={checkForUpdates}
                disabled={updateState.type === 'checking'}
              >
                <RefreshCw className={`h-4 w-4 ${updateState.type === 'checking' ? 'animate-spin' : ''}`} />
                {updateState.type === 'checking'
                  ? '检查中...'
                  : updateState.type === 'up-to-date'
                    ? '已是最新'
                    : '检查更新'}
              </Button>
            </div>
          </div>
        </FadeInSection>

        {/* ═══ 更新弹窗 ═══ */}
        {updateState.type === 'available' && upgradeInfo && (
          <FadeInSection delay={50}>
            <section className="mb-14">
              <Card className="border-primary/30 shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col items-center text-center">
                    <Download className="mb-3 h-8 w-8 text-primary" />
                    <h2 className="mb-2 text-lg font-semibold">发现新版本 v{upgradeInfo.version}</h2>
                    <p className="text-text-secondary mb-4 text-sm leading-relaxed">
                      当前版本 v{DISPLAY_VERSION}，是否下载更新？
                    </p>
                    {upgradeInfo.body && (
                      <div className="mb-4 max-h-32 w-full overflow-y-auto rounded-lg bg-muted/40 p-3 text-left text-xs leading-relaxed">
                        {upgradeInfo.body}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button onClick={handleUpdateNow} className="gap-2">
                        <Download className="h-4 w-4" />
                        立即更新
                      </Button>
                      <Button variant="outline" onClick={handleSkip}>
                        稍后再说
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </FadeInSection>
        )}

        {updateState.type === 'downloading' && (
          <FadeInSection delay={50}>
            <section className="mb-14">
              <Card className="border-primary/30 shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col items-center text-center">
                    <h2 className="mb-3 text-lg font-semibold">正在下载更新...</h2>
                    <Progress
                      percent={Math.round(((updateState as any).progress ?? 0) * 100)}
                      status="active"
                      className="w-full max-w-sm"
                    />
                    <p className="text-text-tertiary mt-3 text-xs">
                      下载完成后将自动重启应用
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </FadeInSection>
        )}

        {updateState.type === 'downloaded' && (
          <FadeInSection delay={50}>
            <section className="mb-14">
              <Card className="border-success/30 shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col items-center text-center">
                    <h2 className="mb-1 text-lg font-semibold text-success">更新完成</h2>
                    <p className="text-text-secondary text-sm">应用正在重启以应用更新...</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </FadeInSection>
        )}

        {updateState.type === 'error' && (
          <FadeInSection delay={50}>
            <section className="mb-14">
              <Card className="border-red-300 shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col items-center text-center">
                    <h2 className="mb-2 text-base font-semibold text-red-500">检查更新失败</h2>
                    <p className="text-text-tertiary mb-3 text-xs">
                      {(updateState as any).message || '无法连接到更新服务器，请稍后重试'}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setUpdateState({ type: 'idle' })}>
                      关闭
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </FadeInSection>
        )}

        {(updateState.type === 'up-to-date') && (
          <FadeInSection delay={50}>
            <section className="mb-14">
              <Card className="border-border/40 shadow-sm">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-text-tertiary">当前已是最新版本</span>
                    <Badge variant="secondary" className="text-xs">
                      v{DISPLAY_VERSION}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </section>
          </FadeInSection>
        )}

        {/* ═══ 项目简介 ═══ */}
        <FadeInSection delay={100}>
          <section className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">项目简介</h2>
            </div>
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <p className="text-text-secondary leading-relaxed">
                  NoteFlow 是一个开源的 AI 视频笔记助手，支持通过哔哩哔哩、YouTube、抖音等视频链接，
                  自动提取内容并生成结构清晰、重点明确的 Markdown 格式笔记。
                  支持插入截图、原片跳转、AI 问答等功能，让视频学习更高效。
                </p>
              </CardContent>
            </Card>
          </section>
        </FadeInSection>

        {/* ═══ 功能特性 - Bento Grid ═══ */}
        <FadeInSection delay={200}>
          <section className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <Frame className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">功能特性</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <div
                    key={i}
                    className={`${f.colSpan} group relative rounded-xl border border-border/40 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md md:p-5`}
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold">{f.title}</h3>
                    <p className="text-text-tertiary text-xs leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        </FadeInSection>

        {/* ═══ 快速开始 ═══ */}
        <FadeInSection delay={300}>
          <section className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <ChevronRight className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">快速开始</h2>
            </div>

            <Tabs defaultValue="docker">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="docker">Docker 部署</TabsTrigger>
                <TabsTrigger value="manual">手动安装</TabsTrigger>
              </TabsList>

              <TabsContent value="docker" className="space-y-5">
                {[
                  { step: '1', title: '克隆仓库', code: 'git clone https://github.com/super-mortal/NoteFlow.git\ncd NoteFlow\ncp .env.example .env' },
                  { step: '2', title: '启动 Docker Compose', code: 'docker compose up --build -d' },
                  { step: '3', title: '访问应用', code: '访问 http://localhost:3015' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                      {item.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 text-sm font-medium">{item.title}</h3>
                      <pre className="overflow-x-auto rounded-lg border border-border/40 bg-muted/40 p-3.5 text-sm leading-relaxed">
                        <code>{item.code}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="manual" className="space-y-5">
                {[
                  { step: '1', title: '克隆仓库', code: 'git clone https://github.com/super-mortal/NoteFlow.git\ncd NoteFlow\ncp .env.example .env' },
                  { step: '2', title: '启动后端', code: 'cd backend\npip install -r requirements.txt\npython main.py' },
                  { step: '3', title: '启动前端', code: 'cd noteflow_frontend\npnpm install\npnpm dev' },
                  { step: '4', title: '访问应用', code: '访问 http://localhost:3015' },
                  { step: '5', title: '安装 FFmpeg（必需）', code: '后端依赖 FFmpeg 处理音视频，请先安装：\n👉 https://ffmpeg.org/download.html\nWindows 推荐：https://www.gyan.dev/ffmpeg/builds/\n已安装但未加入 PATH 时，可在 .env 中指定：\nFFMPEG_BIN_PATH=/your/custom/ffmpeg/bin' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                      {item.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 text-sm font-medium">{item.title}</h3>
                      <pre className="overflow-x-auto rounded-lg border border-border/40 bg-muted/40 p-3.5 text-sm leading-relaxed">
                        <code>{item.code}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </section>
        </FadeInSection>

        {/* ═══ License + Footer ═══ */}
        <FadeInSection delay={400}>
          <footer className="border-t border-border/30 pt-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <Badge
                variant="secondary"
                className="border-border/30 bg-white/60 text-xs font-medium text-text-secondary"
              >
                MIT License
              </Badge>
            </div>
            <p className="text-text-tertiary mb-2 text-xs">
              Copyright &copy; {new Date().getFullYear()} super-mortal
            </p>
            <p className="text-text-tertiary text-xs">
              你的支持与反馈是我持续优化的动力 —
              <a
                href="https://github.com/super-mortal/NoteFlow/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                反馈与建议
                <ExternalLink className="ml-0.5 inline-block h-3 w-3" />
              </a>
            </p>
          </footer>
        </FadeInSection>
      </div>
    </ScrollArea>
  )
}
