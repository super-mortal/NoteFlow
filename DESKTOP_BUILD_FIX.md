# 桌面端构建问题分析报告

## 错误现象

安装 NoteFlow 桌面端后启动，后端无法连接，错误信息：

```
Failed to load Python DLL 'D:\always\noteflow\_internal\python311.dll'
LoadLibrary: 找不到指定的模块。
```

## 安装目录结构

```
D:\always\noteflow\
  ├── app.exe                    ← Tauri 主程序
  ├── NoteFlowBackend.exe        ← 后端 sidecar（在根目录）
  ├── uninstall.exe
  ├── bin\
  │   └── NoteFlowBackend\
  │       └── _internal\         ← Python 运行时（在子目录）
  │           ├── python311.dll
  │           ├── python3.dll
  │           ├── libcrypto-3.dll
  │           └── ...
  └── data\
```

## 根因分析

**路径不匹配：后端 exe 和 `_internal` 目录不在同一位置。**

| 组件 | 实际位置 | 后端期望位置 |
|------|---------|------------|
| `NoteFlowBackend.exe` | `D:\always\noteflow\` | — |
| `_internal\` | `D:\always\noteflow\bin\NoteFlowBackend\_internal\` | `D:\always\noteflow\_internal\` |

PyInstaller 打包的 exe 会在**自身所在目录**查找 `_internal` 文件夹。但：
- 后端 exe 被安装到根目录 `D:\always\noteflow\`
- `_internal` 被安装到子目录 `D:\always\noteflow\bin\NoteFlowBackend\_internal\`
- 后端启动时在根目录找 `_internal`，找不到就报错

## 修复方案

### 方案一：修改 resources 映射（推荐）

`tauri.conf.json` 中 resources 映射改为扁平结构，让 `_internal` 放在根目录与 sidecar exe 同级：

```json
"resources": {
    "bin/NoteFlowBackend/_internal": "_internal"
}
```

### 方案二：修改 CI 构建路径

将 PyInstaller 输出直接放到 `src-tauri/bin/` 根目录（不加 `NoteFlowBackend/` 子目录）：

```yaml
--distpath noteflow_frontend/src-tauri/bin
--name NoteFlowBackend
```

然后 `externalBin` 改为 `["bin/NoteFlowBackend"]`
resources 改为 `{"bin/_internal": "_internal"}`

### 方案三：通过 Tauri Rust 代码重设工作目录

在 `lib.rs` 的 `spawn_backend_sidecar()` 中，将 current_dir 设置为 sidecar exe 所在目录。

## 推荐

采用**方案一**，改动最小，只需修改 `tauri.conf.json` 中一行 resources 映射。
