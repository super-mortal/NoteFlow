# 桌面端启动失败排查（后端连不上）

> **问题现象**：安装后打开桌面端，一直卡在"第 1 步 · 后端连通性"，后端进程启动失败或端口绑定失败。
>
> **根因**：`tauri.conf.json` 中 `resources` 的路径映射错误，导致 PyInstaller 打包的 `_internal/` 目录放错了位置，后端 exe 找不到依赖。

---

## 问题分析

### Tauri 期望的安装结构

```
安装目录/
├── app.exe                        ← 桌面端主程序
├── bin/
│   └── NoteFlowBackend/
│       ├── NoteFlowBackend.exe    ← 后端 sidecar
│       └── _internal/             ← Python 运行时依赖（PyInstaller）
├── data/
├── config/
├── logs/
└── uploads/
```

### 实际安装结构

```
安装目录/
├── app.exe                        ← ✅ 正确
├── NoteFlowBackend.exe            ← ❌ 应该在 bin/NoteFlowBackend/ 下
├── _internal/                     ← ❌ 应该在 bin/NoteFlowBackend/_internal/ 下
├── data/
├── config/
├── logs/
└── uploads/
```

### 为什么

Tauri 的 `externalBin` 配置了 `"bin/NoteFlowBackend/NoteFlowBackend"`，它会自动在安装包中创建 `bin/NoteFlowBackend/` 子目录并把后端放进去，所以问题**不在这里**。

问题出在 `resources` 配置（`tauri.conf.json` 第 32 行）：

```json
"resources": {
    "bin/NoteFlowBackend/_internal": "_internal"
}
```

这一行的意思是：**把 `bin/NoteFlowBackend/_internal` 放到安装包的 `_internal`（根目录）**。

但 `NoteFlowBackend.exe` 在 `bin/NoteFlowBackend/` 下，它启动时会找自己**同目录**下的 `_internal/`（即 `bin/NoteFlowBackend/_internal/`），结果找不到，启动失败。

**正确映射应该是**：

```json
"resources": {
    "bin/NoteFlowBackend/_internal": "bin/NoteFlowBackend/_internal"
}
```

---

## 解决方案

### 修复代码（一劳永逸）

修改 `noteflow_frontend/src-tauri/tauri.conf.json` 第 32 行：

**改前**：
```json
"bin/NoteFlowBackend/_internal":"_internal"
```

**改后**：
```json
"bin/NoteFlowBackend/_internal":"bin/NoteFlowBackend/_internal"
```

同时删除冗余的 macOS 特殊处理（第 34-38 行，它与 Windows 的 resources 逻辑重复且路径不一致）：

**改前**：
```json
"macOS":{
    "files": {
        "Frameworks": "bin/NoteFlowBackend/_internal"
    }
}
```

**改后**：直接删除整个 `"macOS"` 块，或者统一改为正确的路径。

修复后重新构建安装包，安装即可正常启动。

---

### 手动修复已安装的版本（不重建）

如果不想重新构建安装包，可以手动把文件移动到正确位置：

```powershell
# 以管理员身份运行

# 1. 停掉 NoteFlow
Stop-Process -Name "app" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "NoteFlowBackend" -Force -ErrorAction SilentlyContinue

# 2. 创建正确的目录结构
New-Item -ItemType Directory -Force -Path "安装目录\bin\NoteFlowBackend"

# 3. 移动后端 exe
Move-Item -Force "安装目录\NoteFlowBackend.exe" "安装目录\bin\NoteFlowBackend\NoteFlowBackend.exe"

# 4. 移动依赖目录
Move-Item -Force "安装目录\_internal" "安装目录\bin\NoteFlowBackend\_internal"

# 5. 重新打开 NoteFlow
Start-Process "安装目录\app.exe"
```

将 `安装目录` 替换为你的实际路径，如 `D:\always\noteflow`。
