# 发版手册（Release Manager）

本文档面向**发版执行者**，覆盖从 `develop` 切发版到产物上架商店的完整步骤。日常分支与提交规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 流程总览

```
develop  ──→  release/X.Y.Z  ──→  PR ─→  master  ──→  打 tag vX.Y.Z
                  │                    │
                  └──→ PR 回灌 ──→ develop
```

---

## 1. 切发布分支

```bash
git checkout develop && git pull origin develop
git checkout -b release/X.Y.Z
```

版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)：`MAJOR.MINOR.PATCH`。

## 2. 写 CHANGELOG，更新版本号

在 `release/X.Y.Z` 上：

- 编辑 [`CHANGELOG.md`](./CHANGELOG.md)，新增 `## [X.Y.Z] - YYYY-MM-DD` 段，按 Keep a Changelog 分类（Added / Changed / Fixed / Removed / Security / Internal）
- 编辑 [`README.md`](./README.md) 顶部标题中的版本号 + 新增"vX.Y.Z 新增"摘要段
- 重大变更也同步更新 [`CLAUDE.md`](./CLAUDE.md)

```bash
git commit -am "docs: vX.Y.Z CHANGELOG + README 版本"
git push -u origin release/X.Y.Z
```

## 3. 合并到 master + 回灌 develop

在 GitHub 上发起两个 PR：

| PR | base | 合并方式 | 合并后 commit 标题 |
|---|---|---|---|
| `release/X.Y.Z` → `master` | `master` | **Merge commit (--no-ff)** | `chore(release): vX.Y.Z` |
| `release/X.Y.Z` → `develop` | `develop` | **Merge commit (--no-ff)** | `chore(release): merge release/X.Y.Z back into develop` |

> ⚠️ Merge commit 的标题**必须**符合 `type(scope): subject` 格式（commitlint 在 push 到 master/develop 时会校验）。
> 历史上用过 `Release vX.Y.Z` 这种形式，会被 commitlint 报 `type-empty` / `subject-empty`。

`master` 分支保护要求 review 通过。回灌 `develop` 是为了把发版冻结期内的小修同步回来。

## 4. 打 tag

```bash
git checkout master && git pull origin master
git tag -a vX.Y.Z -m "NoteFlow vX.Y.Z

主线：
- ...

详见 CHANGELOG.md"
git push origin vX.Y.Z
```

## 5. 创建 GitHub Release（如果还没有）

如果你想自己写 release notes：

1. 打开 https://github.com/super-mortal/NoteFlow/releases/new
2. Tag: 选 `vX.Y.Z`
3. Title: `vX.Y.Z`
4. Body: 直接贴 [`CHANGELOG.md`](./CHANGELOG.md) 的对应段

## 6. 桌面端 (Tauri)

仓库已有 GitHub Actions 在 `v*` tag 时构建桌面端安装包并自动挂到 GitHub Release，无需额外操作。

## 7. 清理

```bash
# release 分支已合到 master 与 develop，删掉
git push origin --delete release/X.Y.Z
git branch -d release/X.Y.Z
```

---

## 紧急 hotfix 发版

线上紧急问题不走 `release/*`，走 `hotfix/*`：

```bash
git checkout master && git pull
git checkout -b hotfix/<scope>-<事项>
# … 修复 ...
# PR base=master 合入；同时 PR base=develop 回灌
```

合入 master 后通常打 patch tag（如 `v2.1.1`），CI 流程同上。

---

## 历史发布快查

| Version | Date | Tag |
|---|---|---|
| 2.1.0 | 2026-05-07 | [`v2.1.0`](https://github.com/JefferyHcool/BiliNote/releases/tag/v2.1.0) |
| 2.0.0 | (上游 web 端 v2.0.0) | [`v2.0.0`](https://github.com/JefferyHcool/BiliNote/releases/tag/v2.0.0) |
