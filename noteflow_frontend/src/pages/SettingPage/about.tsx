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
} from 'lucide-react'
import logo from '@/assets/icon.png'
import { useInView } from 'react-intersection-observer'

const DISPLAY_VERSION = '0.0.0'

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
            </div>
          </div>
        </FadeInSection>

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
                  { step: '3', title: '启动前端', code: 'cd BillNote_frontend\npnpm install\npnpm dev' },
                  { step: '4', title: '访问应用', code: '访问 http://localhost:3015' },
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
                href="https://github.com/super-mortal/NoteFlow"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                Star &amp; PR Welcome
                <ExternalLink className="ml-0.5 inline-block h-3 w-3" />
              </a>
            </p>
          </footer>
        </FadeInSection>
      </div>
    </ScrollArea>
  )
}
