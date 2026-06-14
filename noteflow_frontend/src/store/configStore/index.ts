import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface SystemState {
  showFeatureHint: boolean // ✅ 是否显示功能提示
  setShowFeatureHint: (value: boolean) => void

  // 后续如果有其他全局状态，可以继续加
  sidebarCollapsed: boolean // ✅ 侧边栏是否收起
  setSidebarCollapsed: (value: boolean) => void

  // 首页「启用高级参数」开关：开启后提交任务会带上设置页配置的高级参数
  useAdvancedConfig: boolean
  setUseAdvancedConfig: (value: boolean) => void
}
// 暂不启用
export const useSystemStore = create<SystemState>()(
  persist(
    set => ({
      showFeatureHint: true,
      setShowFeatureHint: value => set({ showFeatureHint: value }),

      sidebarCollapsed: false,
      setSidebarCollapsed: value => set({ sidebarCollapsed: value }),

      useAdvancedConfig: false,
      setUseAdvancedConfig: value => set({ useAdvancedConfig: value }),
    }),
    {
      name: 'system-store', // 本地存储的 key
    }
  )
)
