# 发版手册

推送 `v*` 标签 → CI 自动构建桌面端安装包 + Docker 镜像 → 用户自动更新。

---

## 发版流程

### 1. 确保代码已提交

```bash
git status                  # 确认工作区干净
git log --oneline -3        # 确认最新提交正确
```

### 2. 打 tag 并推送

```bash
git tag v0.2.4
git push origin v0.2.4
```

tag 名即版本号，推送到 GitHub 后会触发以下 CI 工作流：

| 工作流 | 触发条件 | 产物 |
|---|---|---|
| `.github/workflows/release-desktop.yml` | `v*` tag 推送 | Windows / macOS 安装包 + `update.json` → GitHub Releases |
| `.github/workflows/docker-push.yml` | `v*` tag 推送 | Docker 镜像 → `ghcr.io/super-mortal/noteflow/backend:latest` + `ghcr.io/super-mortal/noteflow/frontend:latest` |

---

## 用户如何更新

### 桌面端

启动 3 秒后自动检测新版本 → 关于页弹出「发现新版本」卡片 → 点击「立即更新」→ 下载 → 安装 → 重启。

也支持在「关于」页面手动点击「检查更新」按钮。

### Docker 部署

Watchtower（已内置于 `docker-compose.yml`）每 24 小时自动检查 GHCR 镜像更新 → 发现新版本后自动拉取重启。

---

## 发布前检查清单

- [ ] CHANGELOG 已写入本次变更（`docs/changelog/V0.x.x.md`）
- [ ] 代码已提交，工作区干净
- [ ] GitHub Secrets 中已配置 `TAURI_PRIVATE_KEY`（桌面端签名密钥）

---

## 紧急修复

直接在主分支上修复并提交，然后打 patch tag 推送：

```bash
git add .
git commit -m "fix: 修复xxx问题"
git tag v0.2.5
git push origin v0.2.5
```

---
