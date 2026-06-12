import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import logo from '@/assets/icon.png'
import BackendLogPanel from '@/components/BackendHealth/BackendLogPanel'
import { useBackendEvents } from '@/components/BackendHealth/useBackendEvents'

type Health = 'green' | 'yellow' | 'red' | 'unknown'

const HEALTH_POLL_MS = 5000
const SYS_HEALTH_PATH = '/sys_health'

function backendBase(): string {
  const fromEnv = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  return ((fromEnv && fromEnv.length > 0) ? fromEnv : '/api').replace(/\/$/, '')
}

const TopNavbar = () => {
  const { status, isTauri, exitCode, logs, restart, copyLogs } = useBackendEvents()
  const [logOpen, setLogOpen] = useState(false)
  const [healthCheckFailures, setHealthCheckFailures] = useState(0)
  const [lastHealthOk, setLastHealthOk] = useState<boolean | null>(null)

  // 健康轮询（仅 Tauri 环境）
  useEffect(() => {
    if (!isTauri) return
    let mounted = true

    async function ping() {
      try {
        const res = await fetch(`${backendBase()}${SYS_HEALTH_PATH}`)
        const ok = res.ok
        if (!mounted) return
        if (ok) {
          setHealthCheckFailures(0)
          setLastHealthOk(true)
        } else {
          setHealthCheckFailures(c => c + 1)
          setLastHealthOk(false)
        }
      } catch {
        if (!mounted) return
        setHealthCheckFailures(c => c + 1)
        setLastHealthOk(false)
      }
    }

    ping()
    const t = setInterval(ping, HEALTH_POLL_MS)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [isTauri])

  const health: Health = (() => {
    if (status === 'terminated') return 'red'
    if (healthCheckFailures >= 3) return 'red'
    if (lastHealthOk === false) return 'yellow'
    if (lastHealthOk === true) return 'green'
    return 'unknown'
  })()

  const colorMap: Record<Health, string> = {
    green: 'bg-green-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    unknown: 'bg-gray-400',
  }

  const labelMap: Record<Health, string> = {
    green: '后端运行正常',
    yellow: '后端运行中（部分检查未通过）',
    red: status === 'terminated' ? `后端已退出 (code=${exitCode ?? 'unknown'})` : '后端无响应',
    unknown: '后端状态未知',
  }

  return (
    <>
      <nav className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-surface-navbar px-5 backdrop-blur-md">
        {/* 左侧品牌 */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl">
            <img src={logo} alt="NoteFlow" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold text-foreground">NoteFlow</span>
        </Link>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-1">
          {/* 后端健康指示灯（仅桌面端） */}
          {isTauri && (
            <button
              onClick={() => setLogOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
              title={labelMap[health]}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${colorMap[health]}${health === 'red' || health === 'yellow' ? ' animate-pulse' : ''}`}
              />
              <span>后端</span>
            </button>
          )}

          {/* 设置入口 */}
          <Link
            to="/settings"
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="设置"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </nav>

      {/* 日志面板（复现有组件） */}
      {logOpen && (
        <BackendLogPanel
          status={status}
          exitCode={exitCode}
          logs={logs}
          health={health}
          onRestart={restart}
          onCopyLogs={copyLogs}
          onClose={() => setLogOpen(false)}
        />
      )}
    </>
  )
}

export default TopNavbar
