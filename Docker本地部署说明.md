# NoteFlow Docker 本地部署说明

## 部署架构

使用 **Docker Compose** 编排三个容器，通过 Nginx 统一对外提供服务：

```
用户浏览器 → localhost:3015
                    │
              ┌─────┴─────┐
              │   Nginx    │  (nginx:1.25-alpine, 反向代理)
              └─────┬─────┘
                    │
          ┌────────┴────────┐
          ▼                  ▼
   ┌─────────────┐   ┌──────────────┐
   │   Frontend   │   │   Backend    │
   │ (nginx静态)  │   │ (FastAPI)    │
   │   端口 80    │   │  端口 8483   │
   └─────────────┘   └──────┬───────┘
                            │
                     ┌──────┴──────┐
                     │  SQLite DB  │
                     │ (./backend) │
                     └─────────────┘
```

## 容器说明

| 容器名 | 镜像 | 用途 | 内存限制 |
|--------|------|------|---------|
| `bilinote-backend` | 本地构建 | Python FastAPI 后端 | 4GB |
| `bilinote-frontend` | 本地构建 | React 前端（Nginx 托管静态文件） | 512MB |
| `bilinote-nginx` | `nginx:1.25-alpine` | 反向代理，端口 3015 → 内部分发 | 256MB |

## 核心配置

### 环境变量 (`.env`)

```
APP_PORT=3015           # 浏览器访问端口
BACKEND_PORT=8483       # 后端内部通信端口
TRANSCRIBER_TYPE=fast-whisper  # 转写引擎
WHISPER_MODEL_SIZE=tiny        # Whisper 模型大小
```

### 数据持久化

通过 `volumes` 将容器内 `/app` 绑定到宿主机 `./backend` 目录：

```
./backend/
├── bili_note.db           ← SQLite 数据库（供应商配置、笔记历史）
├── config/                ← 转写器运行时配置
├── static/screenshots/    ← 视频截图
└── uploads/               ← 上传的本地视频
```

**容器删除不会丢失数据**，所有数据在宿主机 `./backend` 目录中。

## 常用命令

### 首次部署/重建

```powershell
# 完整构建并启动（首次或代码有变更时）
docker compose up --build -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f backend    # 后端日志
docker compose logs -f frontend   # 前端日志
docker compose logs -f nginx      # nginx 日志
```

### 日常启动/停止

```powershell
# 启动（已有镜像，秒级）
docker compose up -d

# 停止
docker compose down

# 重启某个容器
docker compose restart backend
docker compose restart nginx    # 502 时重启 nginx
```

### 清理空间

```powershell
# 清理 Docker 构建缓存（可回收 1-2GB）
docker buildx prune -f

# 查看 Docker 磁盘占用
docker system df
```

## 注意事项

### 1. 构建慢 / 网络超时

首次构建需要下载：
- Python 基础镜像 (~150MB)
- 前端 Node 基础镜像 (~130MB)
- 所有 Python 依赖包 (~130 个，共约 400MB)
- 所有前端 npm 依赖包 (~1000 个)

在国内已配置清华镜像加速：
- `APT_MIRROR=mirrors.tuna.tsinghua.edu.cn`
- `PIP_INDEX=https://pypi.tuna.tsinghua.edu.cn/simple`

如果 pip 下载超时，重新执行 `docker compose build backend` 即可从断点继续。

### 2. Whisper 模型下载

配置 `TRANSCRIBER_TYPE=fast-whisper` + `WHISPER_MODEL_SIZE=tiny` 时：
- 模型在首次转写时自动从 HuggingFace 下载（约 75MB）
- 已配置 `HF_ENDPOINT=https://hf-mirror.com` 国内镜像
- 模型缓存位于容器内 `~/.cache/huggingface/`，容器删除后丢失

如果想避免下载，可改用在线转写引擎：
- **Groq**：需 API Key，速度快
- **必剪**：无需配置
- **快手**：无需配置
- **OpenAI 兼容**：需 Base URL + API Key

### 3. 代码变更后更新

```powershell
# 重新构建并启动（会利用缓存，只重新构建有变更的层）
docker compose up --build -d

# 如果只改了后端代码（通过绑定挂载同步），也可直接重启：
docker compose restart backend
```

### 4. 502 Bad Gateway

出现 502 时，重启 nginx 即可：

```powershell
docker compose restart nginx
```

原因是容器重建后 Docker 分配了新 IP，nginx 缓存的旧地址失效。

## 初始配置

部署完成后：

1. 浏览器访问 `http://localhost:3015`
2. 进入「设置」→「模型供应商」→「添加供应商」
3. 填入 AI 模型信息（如 DeepSeek / OpenAI）
4. 进入「设置」→「音频转写配置」选择转写引擎
5. 开始使用
