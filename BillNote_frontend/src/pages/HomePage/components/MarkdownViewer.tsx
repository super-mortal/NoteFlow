import { useState, useEffect, useRef, useMemo, memo, FC } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button.tsx'
import { Copy, Download, ArrowRight, Play, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Error from '@/components/Lottie/error.tsx'
import Loading from '@/components/Lottie/Loading.tsx'
import Idle from '@/components/Lottie/Idle.tsx'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark as codeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import gfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import 'katex/dist/katex.min.css'
import 'github-markdown-css/github-markdown-light.css'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { useTaskStore } from '@/store/taskStore'
import { noteStyles } from '@/constant/note.ts'
import TranscriptViewer from '@/pages/HomePage/components/transcriptViewer.tsx'
import MarkmapEditor from '@/pages/HomePage/components/MarkmapComponent.tsx'
import ChatPanel from '@/pages/HomePage/components/ChatPanel.tsx'
import VideoBanner from '@/pages/HomePage/components/VideoBanner.tsx'
import StatusBadge from '@/components/StatusBadge'
import PipelineProgress from '@/components/PipelineProgress'
import ViewTabs, { ViewTabId, DEFAULT_TABS } from '@/components/ViewTabs'

interface VersionNote {
  ver_id: string
  content: string
  style: string
  model_name: string
  created_at?: string
}

interface MarkdownViewerProps {
  content: string | VersionNote[]
  status: 'idle' | 'loading' | 'success' | 'failed'
}

const pipelineSteps = [
  { label: '解析链接', key: 'PARSING' },
  { label: '下载音频', key: 'DOWNLOADING' },
  { label: '转写文字', key: 'TRANSCRIBING' },
  { label: '总结内容', key: 'SUMMARIZING' },
  { label: '保存完成', key: 'SUCCESS' },
]

const remarkPlugins = [gfm, remarkMath]
const rehypePlugins = [rehypeKatex, rehypeSlug]

/**
 * 构建 ReactMarkdown components 对象，baseURL 用于修正图片路径。
 */
function createMarkdownComponents(baseURL: string) {
  return {
    h1: ({ children, ...props }: any) => (
      <h1
        className="text-primary my-6 scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2
        className="text-primary mt-10 mb-4 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3
        className="text-primary mt-8 mb-4 scroll-m-20 text-xl font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4
        className="text-primary mt-6 mb-2 scroll-m-20 text-lg font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h4>
    ),
    p: ({ children, ...props }: any) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
        {children}
      </p>
    ),
    a: ({ href, children, ...props }: any) => {
      const isOriginLink =
        typeof children[0] === 'string' &&
        (children[0] as string).startsWith('原片 @')

      if (isOriginLink) {
        const timeMatch = (children[0] as string).match(/原片 @ (\d{2}:\d{2})/)
        const timeText = timeMatch ? timeMatch[1] : '原片'

        return (
          <span className="origin-link my-2 inline-flex">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              {...props}
            >
              <Play className="h-3.5 w-3.5" />
              <span>原片（{timeText}）</span>
            </a>
          </span>
        )
      }

      if (href?.startsWith('#')) {
        const handleAnchorClick = (e: React.MouseEvent) => {
          e.preventDefault()
          const id = decodeURIComponent(href.slice(1))
          let target = document.getElementById(id)
          if (!target) {
            const normalize = (s: string) =>
              s.replace(/[-：:\s*\[\]]/g, '').toLowerCase()
            const search = normalize(id)
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
            for (const h of headings) {
              const text = h.textContent || ''
              if (normalize(text).includes(search) || search.includes(normalize(text))) {
                target = h
                break
              }
            }
          }
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } else {
            toast.error('未找到对应章节')
          }
        }

        return (
          <a
            href={href}
            onClick={handleAnchorClick}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-0.5 font-medium underline underline-offset-4"
            {...props}
          >
            {children}
          </a>
        )
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-0.5 font-medium underline underline-offset-4"
          {...props}
        >
          {children}
          {href?.startsWith('http') && (
            <ExternalLink className="ml-0.5 inline-block h-3 w-3" />
          )}
        </a>
      )
    },
    img: ({ node, ...props }: any) => {
      let src = props.src
      if (src.startsWith('/')) {
        src = baseURL + src
      }
      props.src = src

      return (
        <div className="my-8 flex justify-center">
          <Zoom>
            <img
              {...props}
              className="max-w-full cursor-zoom-in rounded-lg object-cover shadow-md transition-all hover:shadow-lg"
              style={{ maxHeight: '500px' }}
            />
          </Zoom>
        </div>
      )
    },
    strong: ({ children, ...props }: any) => (
      <strong className="text-primary font-bold" {...props}>
        {children}
      </strong>
    ),
    li: ({ children, ...props }: any) => {
      const rawText = String(children)
      const isFakeHeading = /^(\*\*.+\*\*)$/.test(rawText.trim())

      if (isFakeHeading) {
        return (
          <div className="text-primary my-4 text-lg font-bold">{children}</div>
        )
      }

      return (
        <li className="my-1" {...props}>
          {children}
        </li>
      )
    },
    ul: ({ children, ...props }: any) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
        {children}
      </ol>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="border-primary/20 text-muted-foreground mt-6 border-l-4 pl-4 italic"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      const codeContent = String(children).replace(/\n$/, '')

      if (!inline && match) {
        return (
          <div className="group bg-muted relative my-6 overflow-hidden rounded-lg border shadow-sm">
            <div className="bg-muted text-muted-foreground flex items-center justify-between px-4 py-1.5 text-sm font-medium">
              <div>{match[1].toUpperCase()}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeContent)
                  toast.success('代码已复制')
                }}
                className="bg-background/80 hover:bg-background flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                复制
              </button>
            </div>
            <SyntaxHighlighter
              style={codeStyle}
              language={match[1]}
              PreTag="div"
              className="!bg-muted !m-0 !p-0"
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '0.9rem',
              }}
              {...props}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        )
      }

      return (
        <code
          className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      )
    },
    table: ({ children, ...props }: any) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th
        className="border-muted-foreground/20 border px-4 py-2 text-left font-medium [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td
        className="border-muted-foreground/20 border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      >
        {children}
      </td>
    ),
    hr: ({ ...props }: any) => (
      <hr className="border-muted-foreground/20 my-8" {...props} />
    ),
  }
}

const MarkdownViewer: FC<MarkdownViewerProps> = memo(({ status }) => {
  const [copied, setCopied] = useState(false)
  const [currentVerId, setCurrentVerId] = useState<string>('')
  const [selectedContent, setSelectedContent] = useState<string>('')
  const [modelName, setModelName] = useState<string>('')
  const [style, setStyle] = useState<string>('')
  const [createTime, setCreateTime] = useState<string>('')
  const [viewTab, setViewTab] = useState<ViewTabId>('markdown')
  const baseURL = (String(import.meta.env.VITE_API_BASE_URL || '').replace('/api','') || '').replace(/\/$/, '')
  const getCurrentTask = useTaskStore.getState().getCurrentTask
  const currentTask = useTaskStore(state => state.getCurrentTask())
  const taskStatus = currentTask?.status || 'PENDING'
  const retryTask = useTaskStore.getState().retryTask
  const isMultiVersion = Array.isArray(currentTask?.markdown)
  const [showTranscribe, setShowTranscribe] = useState(false)
  const [showChat, setShowChat] = useState<false | 'half' | 'full'>(false)
  const [viewMode, setViewMode] = useState<'map' | 'preview'>('preview')
  const svgRef = useRef<SVGSVGElement>(null)

  // 缓存 ReactMarkdown components，仅在 baseURL 变化时重建
  const markdownComponents = useMemo(() => createMarkdownComponents(baseURL), [baseURL])

  // 多版本内容处理
  useEffect(() => {
    if (!currentTask) return

    if (!isMultiVersion) {
      setCurrentVerId('')
      setModelName(currentTask.formData.model_name)
      setStyle(currentTask.formData.style)
      setCreateTime(currentTask.createdAt)
      setSelectedContent(currentTask?.markdown)
    } else {
      const latestVersion = [...currentTask.markdown].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      if (latestVersion) {
        setCurrentVerId(latestVersion.ver_id)
      }
    }
  }, [currentTask?.id, taskStatus])
  useEffect(() => {
    if (!currentTask || !isMultiVersion) return

    const currentVer = currentTask.markdown.find(v => v.ver_id === currentVerId)
    if (currentVer) {
      setModelName(currentVer.model_name)
      setStyle(currentVer.style)
      setCreateTime(currentVer.created_at || '')
      setSelectedContent(currentVer.content)
    }
  }, [currentVerId, currentTask?.id])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedContent)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      toast.error('复制失败')
    }
  }

  const handleDownload = () => {
    const task = getCurrentTask()
    const name = task?.audioMeta.title || 'note'
    const blob = new Blob([selectedContent], { type: 'text/markdown;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${name}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /** 同步 viewTab → viewMode 兼容逻辑 */
  useEffect(() => {
    if (viewTab === 'mindmap') {
      setViewMode('map')
    } else {
      setViewMode('preview')
    }
  }, [viewTab])

  // ========== 状态渲染 ==========

  if (status === 'loading') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-6 text-muted-foreground">
        <PipelineProgress steps={pipelineSteps} currentStep={taskStatus} />
        <div className="text-center">
          <p className="text-sm text-muted-foreground/70">正在生成笔记，请稍候…</p>
          <p className="mt-1 text-xs text-muted-foreground/50">这可能需要几秒钟时间，取决于视频长度</p>
        </div>
      </div>
    )
  }

  if (status === 'idle') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center space-y-5 text-muted-foreground">
        <Idle />
        <div className="text-center">
          <p className="text-lg font-bold">从一条链接，到一篇结构化笔记</p>
          <p className="mt-2 text-sm text-muted-foreground/70">粘贴视频链接，AI 自动完成</p>
        </div>
        <div className="flex items-center gap-4 text-center">
          {[{ label: '解析元数据' }, { label: '提取音频' }, { label: '语音转文字' }, { label: 'AI 分析' }, { label: '生成笔记' }].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-xs text-muted-foreground/60">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'failed' && !isMultiVersion) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <Error />
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">笔记生成失败</p>
          <p className="mt-2 mb-4 text-xs text-red-400">请检查后台或稍后再试</p>
          <Button onClick={() => retryTask(currentTask.id)} size="lg">
            重试
          </Button>
        </div>
      </div>
    )
  }

  const hasContent = selectedContent && selectedContent !== 'loading' && selectedContent !== 'empty'

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* 操作栏: 视图切换 + 操作按钮 */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-white/95 px-4 py-2 backdrop-blur-sm">
        <ViewTabs
          activeTab={viewTab}
          onChange={setViewTab}
        />

        <div className="flex items-center gap-1">
          {/* 版本选择 */}
          {isMultiVersion && hasContent && (
            <select
              className="h-7 rounded-md border border-border/50 bg-muted px-2 text-xs text-muted-foreground"
              value={currentVerId}
              onChange={e => setCurrentVerId(e.target.value)}
            >
              {(currentTask?.markdown || []).map((v: any) => (
                <option key={v.ver_id} value={v.ver_id}>
                  版本 {v.ver_id?.slice(-6)}
                </option>
              ))}
            </select>
          )}

          {hasContent && (
            <>
              <span className="hidden md:flex items-center gap-1.5">
                <StatusBadge variant="info" label={modelName} />
                <StatusBadge variant="neutral" label={noteStyles.find(s => s.value === style)?.label || style} />
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                导出
              </button>
              <button
                onClick={() => setShowTranscribe(!showTranscribe)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                原文参照
              </button>
              <button
                onClick={() => setShowChat(showChat ? false : 'half')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                  showChat ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                AI 问答
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======== 内容区 ======== */}
      <div className="flex flex-1 overflow-hidden">
        {hasContent ? (
          <>
            {viewTab === 'mindmap' ? (
              <div className="flex w-full flex-1 overflow-hidden">
                <MarkmapEditor
                  value={selectedContent}
                  onChange={() => {}}
                  height="100%"
                  title={currentTask?.audioMeta?.title || '思维导图'}
                />
              </div>
            ) : (
              <>
                {showChat === 'full' && currentTask ? (
                  <div className="h-full w-full">
                    <ChatPanel taskId={currentTask.id} mode="full" onModeChange={setShowChat} />
                  </div>
                ) : (
                  <>
                    <ScrollArea className="min-w-0 flex-1">
                      <div className="px-2 pt-1">
                        <VideoBanner
                          audioMeta={currentTask?.audioMeta}
                          videoUrl={currentTask?.formData?.video_url}
                        />
                      </div>
                      <div className='markdown-body w-full px-2'>
                        <ReactMarkdown
                          remarkPlugins={remarkPlugins}
                          rehypePlugins={rehypePlugins}
                          components={markdownComponents}
                        >
                          {selectedContent.replace(/^>\s*来源链接：[^\n]*\n*/m, '')}
                        </ReactMarkdown>
                      </div>
                    </ScrollArea>
                    {showTranscribe && (
                      <div className={'ml-2 w-2/4'}>
                        <TranscriptViewer />
                      </div>
                    )}
                    {showChat === 'half' && currentTask && (
                      <div className="ml-2 h-full w-1/2 shrink-0">
                        <ChatPanel taskId={currentTask.id} mode="half" onModeChange={setShowChat} />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="w-[300px] flex-col justify-items-center">
              <div className="bg-primary-light mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <ArrowRight className="text-primary h-8 w-8" />
              </div>
              <p className="mb-2 text-muted-foreground">输入视频链接并点击"生成笔记"按钮</p>
              <p className="text-xs text-muted-foreground/60">支持哔哩哔哩、YouTube等视频网站</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

MarkdownViewer.displayName = 'MarkdownViewer'

export default MarkdownViewer
