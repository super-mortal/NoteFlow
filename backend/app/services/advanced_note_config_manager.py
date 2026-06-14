import json
from pathlib import Path
from typing import Optional, Dict, Any, List


class AdvancedNoteConfigManager:
    """管理笔记生成「高级参数」配置，存储在 JSON 文件中。

    这些参数（笔记格式、视频理解、备注等）从首页表单迁移到设置页统一配置，
    首页只保留一个「是否启用高级参数」的开关。
    """

    def __init__(self, filepath: str = "config/advanced_note.json"):
        self.path = Path(filepath)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _read(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {}
        try:
            with self.path.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write(self, data: Dict[str, Any]):
        with self.path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_config(self) -> Dict[str, Any]:
        """获取当前高级参数配置，未设置时回退到默认值。"""
        data = self._read()
        return {
            "format": data.get("format", []),
            "extras": data.get("extras", ""),
            "video_understanding": data.get("video_understanding", False),
            "video_interval": data.get("video_interval", 6),
            "grid_size": data.get("grid_size", [2, 2]),
        }

    def update_config(
        self,
        format: Optional[List[str]] = None,
        extras: Optional[str] = None,
        video_understanding: Optional[bool] = None,
        video_interval: Optional[int] = None,
        grid_size: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """更新高级参数配置并持久化（仅更新非 None 字段）。"""
        data = self._read()
        if format is not None:
            data["format"] = format
        if extras is not None:
            data["extras"] = extras
        if video_understanding is not None:
            data["video_understanding"] = video_understanding
        if video_interval is not None:
            data["video_interval"] = video_interval
        if grid_size is not None:
            data["grid_size"] = grid_size
        self._write(data)
        return self.get_config()
