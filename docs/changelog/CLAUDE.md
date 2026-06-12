# Changelog 编写规范

## 文件结构

更新日志按 **主版本号（X）** 分组归档到 `docs/changelog/` 目录下：

| 版本范围 | 文件 |
|---------|------|
| V0.x.x（0.0.0 ~ 0.z.z） | `docs/changelog/V0.x.x.md` |
| V1.x.x（1.0.0 ~ 1.z.z） | `docs/changelog/V1.x.x.md` |
| V2.x.x（2.0.0 ~ 2.z.z） | `docs/changelog/V2.x.x.md` |
| …… | 以此类推 |

**规则**：只要语义化版本的主版本号（X）相同，无论次版本号（Y）和补丁号（Z）如何变化，都写在同一个 markdown 文档中。

## 命名规则

- 文件名：`V<主版本号>.x.x.md`
- 例如：`V0.x.x.md`、`V1.x.x.md`、`V2.x.x.md`

## 文档格式

### 整体结构

```markdown
# Changelog — V<主版本号>.x.x

所有 **V<主版本号>.x.x** 系列版本的重要变更记录于此。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [<版本号>] - <YYYY-MM-DD>

### Added

- ...

### Changed

- ...

### Fixed

- ...

### Removed

- ...

### Docs

- ...

### Internal

- ...
```

### 变更类型

| 类型 | 含义 |
|------|------|
| `### Added` | 新增功能 |
| `### Changed` | 功能变更、配置变更 |
| `### Fixed` | Bug 修复 |
| `### Removed` | 移除功能 |
| `### Deprecated` | 弃用功能（可选） |
| `### Security` | 安全修复（可选） |
| `### Docs` | 文档更新 |
| `### Internal` | 工程化、CI、重构等内部变更 |

### 编写要点

1. **每条变更以列表项 `-` 开头**
2. **重要变更使用粗体**：`- **功能名称**：描述`
3. **复杂变更可分行缩进**：在列表项下用 `  - 子项` 展开细节
4. **技术引用使用行内代码**：\`文件名\`、\`函数名()\`
5. **日期格式**：`YYYY-MM-DD`
6. **中文优先**：描述以中文为主，技术术语保留英文

## 新增版本记录

当发布新版本时：

1. 确定版本号的三段式语义版本（X.Y.Z）
2. 根据主版本号 X 找到对应的 `docs/changelog/V<X>.x.x.md`文件
3. 按照 Keep a Changelog 格式追加新版本条目
