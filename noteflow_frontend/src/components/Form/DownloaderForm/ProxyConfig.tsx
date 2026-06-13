import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getProxyConfig, updateProxyConfig } from '@/services/proxy'
import { Globe, ExternalLink, ShieldCheck, Info } from 'lucide-react'

// 全局代理配置：作用于 LLM API + 转写 API（Groq 等）+ yt-dlp 视频下载。
const ProxyConfig = () => {
  const [enabled, setEnabled] = useState(false)
  const [url, setUrl] = useState('')
  const [effective, setEffective] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const cfg = await getProxyConfig()
        setEnabled(cfg.enabled)
        setUrl(cfg.url)
        setEffective(cfg.effective)
      } catch {
        /* 拦截器已 toast */
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSave = async () => {
    if (enabled && !url.trim()) {
      toast.error('请填写代理地址，或关闭代理开关')
      return
    }
    setSaving(true)
    try {
      const cfg = await updateProxyConfig({ enabled, url: url.trim() })
      setEnabled(cfg.enabled)
      setUrl(cfg.url)
      setEffective(cfg.effective)
      toast.success('代理配置已保存')
    } catch {
      /* 拦截器已 toast */
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-white p-5 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-text-tertiary">加载代理配置…</span>
      </div>
    )
  }

  const fromEnv = !enabled && !!effective

  return (
    <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">全局代理</h3>
            <p className="text-xs text-text-tertiary">作用于 AI 接口、转写接口及视频下载</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="mb-3 space-y-1.5">
        <Input
          placeholder="http://127.0.0.1:7890"
          value={url}
          disabled={!enabled}
          onChange={e => setUrl(e.target.value)}
          className="text-sm"
        />
        {fromEnv && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <Info className="h-3 w-3" />
            当前生效（来自环境变量）：{effective}
          </p>
        )}
        {enabled && effective && effective !== url && (
          <p className="flex items-center gap-1 text-xs text-green-600">
            <ShieldCheck className="h-3 w-3" />
            当前生效：{effective}
          </p>
        )}
        {enabled && effective && effective === url && (
          <p className="flex items-center gap-1 text-xs text-green-600">
            <ShieldCheck className="h-3 w-3" />
            已生效
          </p>
        )}
      </div>

      {/* 使用场景说明 */}
      <details className="group mb-3">
        <summary className="flex cursor-pointer items-center gap-1 text-xs text-text-secondary hover:text-text-tertiary">
          <ExternalLink className="h-3 w-3 transition-transform group-open:rotate-90" />
          查看使用说明
        </summary>
        <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-text-secondary">
          <p className="font-medium text-foreground">全局代理适用于以下场景：</p>
          <ul className="space-y-1">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">🤖</span>
              <span>AI 大模型接口（如 OpenAI、Claude API）</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">🎙️</span>
              <span>在线转写接口（如 Groq）</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">📹</span>
              <span>视频下载（如 YouTube / yt-dlp）</span>
            </li>
          </ul>
          <p className="mt-1 font-medium text-foreground">常用代理地址：</p>
          <ul className="space-y-0.5 font-mono text-xs">
            <li><span className="inline-block w-40 shrink-0">http://127.0.0.1:7890</span><span className="text-text-tertiary ml-1">— Clash 默认</span></li>
            <li><span className="inline-block w-40 shrink-0">http://127.0.0.1:10809</span><span className="text-text-tertiary ml-1">— v2rayN HTTP</span></li>
            <li><span className="inline-block w-40 shrink-0">socks5://127.0.0.1:10808</span><span className="text-text-tertiary ml-1">— v2rayN SOCKS5</span></li>
          </ul>
          <p className="flex items-start gap-1.5 mt-1">
            <span className="mt-0.5 shrink-0">💡</span>
            <span>开启后所有对外请求走代理，关闭则直连。国内平台（B站、抖音）不需要代理。</span>
          </p>
        </div>
      </details>

      <Button size="sm" onClick={handleSave} disabled={saving} className="w-full gap-1.5">
        {saving ? (
          <>
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            保存中…
          </>
        ) : (
          <>
            <ShieldCheck className="h-3.5 w-3.5" />
            保存代理配置
          </>
        )}
      </Button>
    </div>
  )
}

export default ProxyConfig
