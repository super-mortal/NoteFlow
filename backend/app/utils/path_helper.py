"""
统一数据目录工具。

桌面端（PyInstaller frozen + Tauri sidecar）：
  Tauri 用 .current_dir() 把后端 cwd 设成 NoteFlow.exe 所在目录（即安装目录），
  因此 os.getcwd() 在所有场景下都是最稳定的基准。

开发模式：
  python main.py 通常在 backend/ 下运行，os.getcwd() 即 backend/。

所有用户数据统一收敛到 <cwd>/data/ 下，子目录如下：

  data/
    notes/         ← note_results（Markdown、JSON、status）
    downloads/     ← yt-dlp 下载缓存（音频/视频）
    screenshots/   ← static/screenshots（视频截图）
    models/        ← Whisper 模型缓存
    exports/       ← PDF/DOCX 导出
    vector_db/     ← ChromaDB 向量索引
    noteflow.db    ← SQLite 主库
"""

import os
import sys

# ---------------------------------------------------------------------------
# 统一基准：永远使用 os.getcwd()
# ---------------------------------------------------------------------------

def _ensure(path: str) -> str:
    """创建目录（如不存在）并返回原路径。"""
    os.makedirs(path, exist_ok=True)
    return path


def get_data_root() -> str:
    """返回 data/ 根目录。"""
    return _ensure(os.path.join(os.getcwd(), "data"))


def get_notes_dir() -> str:
    """笔记输出目录：data/notes/（原 note_results）。"""
    return _ensure(os.path.join(get_data_root(), "notes"))


def get_downloads_dir() -> str:
    """下载缓存目录：data/downloads/。"""
    return _ensure(os.path.join(get_data_root(), "downloads"))


def get_screenshots_dir() -> str:
    """截图输出目录：data/screenshots/。"""
    return _ensure(os.path.join(get_data_root(), "screenshots"))


def get_models_dir(subdir: str = "whisper") -> str:
    """模型缓存目录：data/models/whisper/（与旧 APPDATA 行为解耦）。"""
    return _ensure(os.path.join(get_data_root(), "models", subdir))


def get_exports_dir() -> str:
    """导出目录：data/exports/。"""
    return _ensure(os.path.join(get_data_root(), "exports"))


def get_vector_db_dir() -> str:
    """向量数据库目录：data/vector_db/。"""
    return _ensure(os.path.join(get_data_root(), "vector_db"))


# ---------------------------------------------------------------------------
# 向后兼容别名（避免一次性大改，后续可以逐步清理）
# ---------------------------------------------------------------------------

def get_data_dir():
    """[兼容] 旧名，返回 data/downloads/。"""
    return get_downloads_dir()


def get_model_dir(subdir: str = "whisper") -> str:
    """[兼容] 旧名，返回 data/models/<subdir>/。"""
    return get_models_dir(subdir)


def get_app_dir(subdir: str = "") -> str:
    """[兼容] 返回 data/<subdir>/ 或 data/。"""
    if subdir:
        return _ensure(os.path.join(get_data_root(), subdir))
    return get_data_root()
