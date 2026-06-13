# 修改汇总 — 清理图片 + 全面更名为 NoteFlow

## 一、清理未使用的图片

### ✅ 以下图片确认在代码中被引用，保留

| 文件 | 引用位置 |
|------|---------|
| `src/assets/icon.png` | 5 处 import（TopNavbar、SidePanel、SettingLayout、Onboarding、about） |
| `src/assets/customAI.png` | `Icons/index.tsx` 中 import CustomLogo |
| `src/assets/wechat.png` | 需要确认（src/assets 下） |
| `public/icon.png` | `index.html` 中 favicon 引用 |
| `public/placeholder.png` | `NoteHistory.tsx` 中加载失败回退显示 |
| `src-tauri/icons/*` | `tauri.conf.json` 引用 |
| `doc/icon.png` | `README.md` 中 `<img src="./doc/icon.png">` |
| `BillNote_extension/extension/assets/icon.svg` | 扩展 manifest |
| `BillNote_extension/extension/assets/icon-512.png` | 扩展 manifest |
| `BillNote_extension/src/assets/logo.svg` | 扩展组件引用 |

### ❌ 以下图片未在代码中引用，建议删除

| 文件 | 大小 | 说明 |
|------|------|------|
| `doc/BiliNote.png` | 784 KB | 旧项目名图片，不再使用 |
| `doc/logo-1024.png` | 891 KB | 无任何引用 |
| `doc/wechat.png` | 11 KB | 无任何引用 |
| `doc/wechat.JPG` | 250 KB | 无任何引用 |
| `doc/wechat-gzh.png` | 28 KB | 无任何引用 |
| `doc/wechat-group-1.png` | 574 KB | 无任何引用 |
| `doc/wechat-group-2.png` | 575 KB | 无任何引用 |
| `doc/wechat-group-3.png` | 582 KB | 无任何引用 |
| `doc/wechat-group-4.png` | 579 KB | 无任何引用 |
| `doc/wechat-group-5.png` | 503 KB | 无任何引用 |
| `doc/remote-install-wechat.png` | 494 KB | 无任何引用 |
| `logo.png`（根目录） | 288 KB | 无任何引用 |
| `public/1.png` | 1.2 MB | 无任何引用（Vite 默认示例） |
| `public/preview_1.png` | 162 KB | 无任何引用 |
| `public/vite.svg` | 1.5 KB | Vite 默认，未引用 |
| `src/assets/react.svg` | 4 KB | Vite 默认模板，未引用 |
| `src/assets/wechat.png` | 11 KB | 需要再确认是否引用（grep 未找到） |

### 🧹 运行时生成的文件（可清理，不影响功能）

| 路径 | 说明 |
|------|------|
| `backend/data/grid_output/grid_1~3.jpg` | 视频理解截图网格，自动生成 |
| `backend/data/output_frames/frame_*.jpg` | 视频逐帧截图，自动生成 |
| `backend/static/screenshots/screenshot_*.jpg` | 原片截图，自动生成 |
| `BillNote_frontend/dist/` | 前端构建产物（运行 pnpm build 重新生成） |

---

## 二、全面更名为 NoteFlow

### 2.1 目录名 — 需要手动重命名（共 2 个）

| 当前目录 | 新目录 |
|---------|-------|
| `BillNote_frontend/` | `noteflow_frontend/` |
| `BillNote_extension/` | `noteflow_extension/` |

⚠️ **目录改名影响极大**，会牵涉所有导入路径、CI 脚本、Docker 配置、CLAUDE.md 文档、gitignore 等。建议先改代码引用，目录重名名最后一步执行。

### 2.2 需要改的代码内容（按优先级排列）

#### 🔴 高优先级（npm 包名 + 数据库 + Docker）

| 文件 | 当前内容 | 改为 |
|------|---------|------|
| `BillNote_frontend/package.json` | `"name": "bili_note"` | `"name": "noteflow"` |
| `BillNote_extension/package.json` | `"name": "bilinote-extension"` | `"name": "noteflow-extension"` |
| `.env.example` | `bili_note.db` | `noteflow.db` |
| `.gitignore` | `/backend/bili_note.db` | `/backend/noteflow.db` |
| `.gitignore` | `/BiliNote_frontend/.idea/*` | `/noteflow_frontend/.idea/*`（目录改名后） |
| `.gitignore` | `/BiliNote_frontend/src-tauri/bin/` | `/noteflow_frontend/src-tauri/bin/`（目录改名后） |
| `backend/app/db/sqlite_client.py` | `"bili_note.db"` | `"noteflow.db"` |
| `backend/app/db/engine.py` | `"sqlite:///bili_note.db"` | `"sqlite:///noteflow.db"` |
| `docker-compose.yml` | `container_name: bilinote-*` | `container_name: noteflow-*` |
| `docker-compose.gpu.yml` | `container_name: bilinote-*` | `container_name: noteflow-*` |
| `Dockerfile.complete` | `bili_note.db` | `noteflow.db` |
| `Dockerfile.complete` | `--name bilinote` | `--name noteflow` |
| `Docker本地部署说明.md` | `bilinote-*` + `bili_note.db` | `noteflow-*` + `noteflow.db` |
| `CLAUDE.md` | `backend/app/db/bili_note.db` | `backend/app/db/noteflow.db` |
| `CLAUDE.md` | `BillNote_frontend` 引用 | `noteflow_frontend`（目录改名后） |
| `CLAUDE.md` | `BillNote_extension` 引用 | `noteflow_extension`（目录改名后） |

#### 🟡 中优先级（前端代码中的项目名字符串/import路径）

| 文件 | 当前内容 | 改为 |
|------|---------|------|
| `BillNote_extension/src/logic/constants.ts` | `'bilinote-settings'` | `'noteflow-settings'` |
| `BillNote_extension/src/logic/constants.ts` | `'bilinote-tasks'` | `'noteflow-tasks'` |
| `BillNote_extension/src/logic/bilibili-subtitle.ts` | `console.warn('[bilinote] ...')` | `console.warn('[noteflow] ...')` |
| `BillNote_extension/src/logic/bilibili-subtitle.ts` | `console.info('[bilinote] ...')` | `console.info('[noteflow] ...')` |
| `BillNote_extension/src/background/main.ts` | `'bilinote-start'` (message type) | `'noteflow-start'` |
| `BillNote_extension/src/background/main.ts` | `'bilinote-summarize-page'` (menu ID) | `'noteflow-summarize-page'` |
| `BillNote_extension/src/contentScripts/views/App.vue` | `sendMessage('bilinote-start'` | `sendMessage('noteflow-start'` |
| `BillNote_extension/src/contentScripts/views/App.vue` | `class="bilinote-fab"` | `class="noteflow-fab"` |
| `BillNote_extension/src/components/MarkdownView.vue` | `'bilinote'` (下载文件名 fallback) | `'noteflow'` |
| `BillNote_extension/src/sidepanel/Sidepanel.vue` | `'bilinote'` (文件名 fallback ×2) | `'noteflow'` |
| `BillNote_frontend/src-tauri/src/lib.rs` | `.bilinote_write_probe` | `.noteflow_write_probe` |
| `BillNote_frontend/src/pages/Onboarding/index.tsx` | 注释 `bilinote-onboarded` | `noteflow-onboarded` |

#### 🟢 低优先级（文档、注释、README）

| 文件 | 说明 |
|------|------|
| `RELEASING.md` | `bilinote-extension-X.Y.Z.zip` → `noteflow-extension-X.Y.Z.zip` |
| `README.md` | 上游项目名 BiliNote 保留（不是我们的名字，是上游） |
| `docs/changelog/V0.x.x.md` | 历史记录中提及的旧名，无需修改 |

### 2.3 `bilibili` 平台标识（**不需要改动**）

所有 `bilibili` 字符串是 **B站平台标识**，不是项目名，不需要修改。涉及文件包括：
- `backend/app/downloaders/bilibili_downloader.py`
- `backend/app/downloaders/bilibili_subtitle.py`
- `backend/app/validators/video_url_validator.py`
- `frontend` 中 `platform: 'bilibili'` 默认值
- `BiliBiliLogo` React 组件名
- `BilibiliSubtitleFetcher` 类名等

### 2.4 注意事项

1. **目录改名顺序**：最后一步执行，先改完所有代码引用再改目录
2. **`BillNote_frontend/` vs `noteflow_frontend/`**：改名后所有 `tsconfig.json` 的 path alias（`@/` → `./src`）、vite config（proxy 路径）、Docker nginx 配置等都需要同步更新
3. **`BillNote_extension/` vs `noteflow_extension/`**：改名后 manifest.json 的路径、构建脚本、zip 打包输出路径等都需要更新
4. **数据库文件**：`bili_note.db` → `noteflow.db`，已存在的数据库需要手动重命名，否则会丢失数据
