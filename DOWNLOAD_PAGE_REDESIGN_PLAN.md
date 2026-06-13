# /settings/download 页面改版方案

## 一、页面现状

`Downloader.tsx` 是设置页的下载配置板块，内部由左栏 + 右栏组成：

```
┌─────────────┬──────────────────────────────┐
│  ProxyConfig │                              │
│  (全局代理)    │  <Outlet> = DownloaderForm   │
│              │  (Cookie 编辑表单)            │
│  Options     │                              │
│  (平台列表)    │                              │
└─────────────┴──────────────────────────────┘
```

**左栏**（`flex-1/5`）：
- `ProxyConfig` — 代理开关 + 输入框 + 保存按钮，`border-neutral-200` 老样式
- `Options` — 各平台列表卡片（`providerCard.tsx`），使用 `border-[#f3f3f3]` + CSS Module 过渡样式

**右栏**（`flex-4/5`）：
- `DownloaderForm` — 使用 react-hook-form + zod，简单的一个 Cookie 输入框 + 保存按钮

## 二、存在的问题

### 问题 1：保存空 cookie 被拦截
```typescript
// Form.tsx 第 22-24 行
const CookieSchema = z.object({
  cookie: z.string().min(10, '请填写有效 Cookie'),
})
```
用户在保存后想清空 Cookie（让该平台留白），会触发 `min(10)` 校验失败。后端 `CookieUpdateRequest.cookie: str` 接受空字符串，`CookieConfigManager.set()` 也能写入 `{"cookie": ""}` — 前端 zod 是唯一限制。

### 问题 2：UI 风格老旧
- 使用 CSS Modules（`index.module.css`）与项目当前 Tailwind v4 不一致
- `border-[#f3f3f3]`、`bg-[#F0F0F0]` 硬编码色值，未使用项目 CSS 变量
- 缺少 hover 交互反馈、品牌色元素
- 代理配置以卡片形式混入左侧列表，层级不清

### 问题 3：缺少使用指南
- 用户不清楚如何获取各平台 Cookie
- 全局代理的适用场景（访问 OpenAI / Groq / YouTube）只有一句简短说明

## 三、改造方案

### 3.1 布局结构（重新分区）

```
┌──────────────────────────────────────────┐
│  🔗 全局代理配置                            │
│  独立区域，与下载器配置平级                  │
│  代理地址输入 + 开关 + 保存                 │
│  增加代理使用场景说明                        │
├──────────────────────────────────────────┤
│  🍪 下载器 Cookie 配置                      │
│  ┌──────────┬──────────┬──────────┐      │
│  │ 哔哩哔哩  │ YouTube  │  抖音    │      │
│  │ 已配置/空 │ 已配置/空 │ 已配置/空 │      │
│  ├──────────┼──────────┼──────────┤      │
│  │  快手    │          │          │      │
│  └──────────┴──────────┴──────────┘      │
│  → 点击任一平台弹出 Cookie 编辑            │
│    (内联展开或右侧面板)                    │
│  → 编辑区域包含：                          │
│    - Cookie 输入框（允许空白保存）           │
│    - 📖 如何获取此平台 Cookie 折叠说明      │
│    - 保存按钮                              │
└──────────────────────────────────────────┘
```

### 3.2 需修改的文件

| 文件 | 改动 |
|------|------|
| `Downloader.tsx` | 改为两栏卡片式布局，去掉 `flex-1/5` + `flex-4/5` 老结构 |
| `Options.tsx` | 改为网格卡片布局（grid grid-cols-2 或 3）展示平台，显示已配置状态 |
| `providerCard.tsx` | 重写为卡片样式（品牌色 hover 效果），删除 CSS module |
| `ProxyConfig.tsx` | 改为独立卡片区域，增强代理说明文案，UI 对齐品牌色 |
| `Form.tsx` | 修复空 cookie 保存问题 + 新增各平台 cookie 获取指南 + 折叠展开说明 |
| `index.module.css` | **删除**（所有样式迁移到 Tailwind） |

### 3.3 关键改动细节

#### 3.3.1 修复空白保存
- 将 zod schema 改为 `cookie: z.string()` — 无长度限制
- 如果想在前端提示"至少要填什么"，用 `min(0)` 或完全不加校验，让用户自由输入和清空

#### 3.3.2 Cookie 获取指南（每个平台折叠说明）

**哔哩哔哩**：
1. 打开 https://www.bilibili.com 并登录
2. 按 F12 打开开发者工具 → Application（应用）→ Storage → Cookies → `https://www.bilibili.com`
3. 找到 `SESSDATA`，复制其 Value
4. 或者：在 Console 输入 `document.cookie` 复制全部（包含 `buvid3=...; SESSDATA=...`）

**YouTube**：
1. 打开 https://www.youtube.com 并登录 Google 账号
2. 按 F12 → Application → Cookies → `https://www.youtube.com`
3. 找到 `__Secure-3PSID` 或复制整个 `document.cookie`
4. 注意：需要将 Cookie 保存为 Netscape 格式或完整字符串

**抖音**：
1. 打开 https://www.douyin.com 并登录
2. 按 F12 → Application → Cookies → `https://www.douyin.com`
3. 确保有 `msToken` 和 `sessionid` 等关键字段
4. Console 输入 `document.cookie` 复制全部
5. 抖音 Cookie 有效期较短，过期需更新

**快手**：
1. 打开 https://www.kuaishou.com 并登录
2. 按 F12 → Application → Cookies → `https://www.kuaishou.com`
3. Console 输入 `document.cookie` 复制全部

**通用说明**：
- 所有平台都在对应网页登录后，通过 F12 开发者工具获取
- 推荐使用 Application 面板逐个复制关键字段，而不是直接粘贴 `document.cookie`（某些 HttpOnly 标记的字段不可通过 JS 读取，但 yt-dlp 可能需要它们）
- 如果使用 `document.cookie` 方式不行，请从 Application 面板手动复制每个 Cookie 的 Name 和 Value

#### 3.3.3 全局代理说明增强

在 `ProxyConfig.tsx` 中增加详细的说明文字：
```
全局代理作用于三个场景：
1. 🤖 AI 大模型接口（如 OpenAI、Claude API）
2. 🎙️ 在线转写接口（如 Groq）
3. 📹 视频下载（如 YouTube / yt-dlp）

常用代理地址：
- http://127.0.0.1:7890  （Clash 默认）
- http://127.0.0.1:10809  （v2rayN 默认 http）
- socks5://127.0.0.1:10808（v2rayN 默认 socks5）

开启后：所有对外请求走代理
关闭后：仅直连（国内平台可正常使用）
```

#### 3.3.4 视觉对齐

- 所有 `border-[#f3f3f3]` → `border-border/40`
- 所有 `bg-[#F0F0F0]` → `bg-primary-light`
- 平台卡片激活态 `text-blue-600` → `text-primary` + `bg-primary-lighter`
- 删除 `index.module.css`，所有 hover 效果用 Tailwind `hover:` 实现
- 适配 `FadeInSection` 滚动登场动效（与 about 页保持一致）

### 3.4 改动范围总结

- **修改 4 个文件**：`Downloader.tsx`, `Options.tsx`, `providerCard.tsx`, `Form.tsx`
- **修改 1 个文件**：`ProxyConfig.tsx`（增强文案）
- **删除 1 个文件**：`index.module.css`
- **零新增依赖**
- **无后端改动**
