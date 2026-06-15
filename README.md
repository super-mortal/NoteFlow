<div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
    <p align="center">
  <img src="./noteflow_frontend/public/icon.png" alt="NoteFlow Logo" width="50" height="50" />
</p>
<h1 align="center" > NoteFlow <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsuper-mortal%2FNoteFlow%2Fmain%2Fnoteflow_frontend%2Fsrc-tauri%2Ftauri.conf.json&query=%24.version&style=flat&label=%20" alt="version" /></h1>
</div>

<p align="center"><i>让碎片知识，流动成笔记 —— NoteFlow</i></p>

---

## 📖 关于这个项目

**NoteFlow** 基于 [BiliNote](https://github.com/JefferyHcool/BiliNote) 开源项目进行了二次开发。感谢原项目在 AI 笔记方向上做出的优秀贡献。不过在使用的过程中我发现项目存在以下问题：

- **Whisper 模型下载困难**：本地转写模型容易下载失败，且失败后没有明确提示
- **音频转写引擎接入不便**：仅支持固定几种转写服务，并且都少见，对普通人不够友好
- **模型提供商配置流程繁琐**：新增模型提供商时步骤繁琐，稍微落后
- **错误提示不够清晰**：部分异常信息笼统，无法直观了解原因，排查问题需要翻代码
- **笔记的高级功能未完成**：笔记高级功能未完成，后端截图之后不会发送给AI理解
- **UI 细节可打磨**：页面 UI 体验不足，子路由刷新白屏、配置页面层级不清晰等

基于以上观察，我对项目进行了优化和重构，希望能带来更顺畅的使用体验，也会持续维护下去

v0.0.0 版本发布于 2026-06-12，是 NoteFlow 的第一个发布版本，是逐渐优化和重构的开始，此版本主要变更如下：

### 品牌更名与 Logo 更新
- 项目从 **BiliNote** 更名为 **NoteFlow**，更新了全套 Logo 图标
- Tauri 配置：更新 productName、identifier、窗口标题、后端进程名
- 前端页面：更新所有页面的标题、侧边栏、欢迎页、关于页的品牌名称
- LocalStorage：存储键名从 `bilinote-*` 改为 `noteflow-*`
- Logo 图标：从源文件生成多尺寸 PNG 和 ICO 图标

### 新增 OpenAI 兼容音频转写模型
- 支持使用任何遵循 OpenAI Audio API 规范的服务商进行音频转写
- 智能 URL 补全（自动补全 /v1 路径）
- 自动压缩超过 18MB 的音频文件
- 支持直接在转写配置页填写 Base URL 和 API Key，无需先配置 LLM 供应商

### 抖音下载器修复
- API 响应数据空值检查，修复 `'NoneType' object is not subscriptable` 错误
- 新增 `modal_id`、`/note/`、`share/video/` 等 URL 格式支持
- 增加 HTTP 请求超时配置，避免长时间卡死
- 嵌套字典访问改用 `.get()` 方法，提供安全默认值

### 全局代理配置
- 一处配置同时作用于 AI 模型接口、转写接口、YouTube 下载
- 支持 `HTTP_PROXY` 环境变量兜底

---

## 🚀 部署指南

### Docker 部署（推荐）

一键启动，自动包含 Watchtower 更新守护，每次发版自动拉取最新镜像更新。

#### 1. 克隆仓库

```bash
git clone https://github.com/super-mortal/NoteFlow.git
cd NoteFlow
```

#### 2. 配置环境变量

```bash
cp .env.example .env
```

按需编辑 `.env`，通常默认值即可直接启动。

#### 3. 启动服务

```bash
docker compose up --build -d
```

> 首次启动需要本地构建镜像和下载 Whisper 模型，时间取决于网络状况。

#### 4. 访问应用

打开浏览器访问 http://localhost:3015

#### 5. 配置大模型

进入设置页 → 模型供应商 → 添加你的 LLM API Key（支持 OpenAI、DeepSeek、Qwen 等兼容接口），然后就可以开始使用了。

> 💡 **Whisper 模型下载加速**：国内用户如果模型下载慢，在 `.env` 中设置 `HF_ENDPOINT=https://hf-mirror.com`（默认已配置）。

> 💡 **Docker 国内镜像加速**：拉不到 Docker Hub 时设置 `BASE_REGISTRY=docker.m.daocloud.io`。

#### 自动更新

Docker 部署内置了 Watchtower，每 24 小时自动检查 GitHub Container Registry 上的新版本。发布新版本后无需手动操作，Watchtower 会自动拉取镜像并重启容器。

---

### 桌面端（Windows / macOS）

#### 下载安装

从 [GitHub Releases](https://github.com/super-mortal/NoteFlow/releases/latest) 页面下载最新版本安装包：

| 平台 | 下载文件 |
|---|---|
| **Windows** | `NoteFlow_<版本号>_x64-setup.exe` |
| **macOS (Apple Silicon)** | `NoteFlow_<版本号>_aarch64.dmg` |
| **macOS (Intel)** | `NoteFlow_<版本号>_x64.dmg` |

下载后双击安装即可。

> **安装路径注意事项**：Windows 安装路径和用户名请勿包含非 ASCII 字符（如中文）和空格，否则可能导致 PyInstaller 后端启动失败。

### 手动部署（开发用）

#### 环境要求

- Python 3.11+
- Node.js 20+
- pnpm 9
- FFmpeg（[下载安装](https://ffmpeg.org/download.html)）

#### 后端

```bash
cd backend
pip install -r requirements.txt
python main.py
```

后端启动在 http://127.0.0.1:8483

#### 前端

```bash
cd noteflow_frontend
pnpm install
pnpm dev
```

前端开发服务器启动在 http://localhost:3015，自动代理 `/api` 请求到后端。

---

## 🖥️ 技术架构

| 层级 | 技术栈 |
|------|--------|
| **前端** | React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| **后端** | Python 3.11 + FastAPI + SQLAlchemy + SQLite |
| **AI 集成** | OpenAI 兼容接口 / DeepSeek / Qwen / Faster-Whisper / Groq |
| **桌面端** | Tauri 2 |
| **部署** | Docker Compose（3 容器：Nginx + Frontend + Backend） |

---

## ✨ 核心功能

- [x] 支持多平台：Bilibili、YouTube、本地视频、抖音、快手
- [x] 支持笔记格式选择
- [x] 支持笔记风格选择（学术风、口语风、重点提取等）
- [x] 支持多模态视频理解
- [x] 支持多版本记录保留
- [x] 支持自行配置大模型（OpenAI、DeepSeek、Qwen 等）
- [x] 支持本地模型音频转写（Fast-Whisper、Groq、BCut、OpenAI 兼容）
- [x] 自动生成结构化 Markdown 笔记
- [x] 可选插入截图（自动截取）
- [x] 可选内容跳转链接（关联原视频）
- [x] 任务记录与历史回看
- [x] 基于 RAG 的笔记内容 AI 问答（支持 Function Calling）
- [x] 笔记顶部视频封面 Banner 展示
- [x] 桌面端应用（Windows / macOS）
- [x] GPU 加速转写

## 备注

> NoteFlow的 V0.0.0 版本是基于 BiliNote 的V2.4.0版本开发的，**f5bfb43619d001a0f0fe03b3830068cb719db5e8**
  此后的版本由我独立自主开发。完整更新记录见 [docs/changelog/](docs/changelog/)。

---

## 📜 License

本项目基于 MIT 协议开源。详情请参见 [LICENSE](./LICENSE)。

