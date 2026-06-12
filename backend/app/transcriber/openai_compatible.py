"""
OpenAI 兼容接口的通用语音转写器
支持任何遵循 OpenAI Audio API 规范的供应商（OpenAI、Groq、硅基流动、中转 API 等）
"""
from abc import ABC
import os
import tempfile

import ffmpeg
from dotenv import load_dotenv

from app.decorators.timeit import timeit
from app.models.transcriber_model import TranscriptResult, TranscriptSegment
from app.services.provider import ProviderService
from app.services.transcriber_config_manager import TranscriberConfigManager
from app.transcriber.base import Transcriber
from app.utils.openai_client import build_openai_client
from app.utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)

MAX_SIZE_MB = 18
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


def compress_audio(input_path: str, target_bitrate='64k') -> str:
    """压缩音频文件到指定码率"""
    output_fd, output_path = tempfile.mkstemp(suffix=".mp3")
    os.close(output_fd)
    ffmpeg.input(input_path).output(
        output_path,
        audio_bitrate=target_bitrate
    ).run(quiet=True, overwrite_output=True)
    return output_path


def normalize_base_url(base_url: str) -> str:
    """
    智能补全 OpenAI API 的 base_url

    规则：
    - 已包含 /audio/transcriptions → 直接用（完整端点）
    - 以 /v1 结尾 → 保持原样（标准 base_url）
    - 其他 → 自动补 /v1（补全到标准格式）

    示例：
    - "https://api.siliconflow.cn/v1/audio/transcriptions" → 不变（完整端点）
    - "https://api.siliconflow.cn/v1" → 不变（标准 base_url）
    - "https://api.siliconflow.cn" → "https://api.siliconflow.cn/v1"
    - "https://api.openai.com/v1" → 不变
    """
    base_url = base_url.rstrip('/')

    # 如果已经是完整的 transcriptions 端点，直接返回
    if '/audio/transcriptions' in base_url:
        logger.info(f"检测到完整端点，直接使用: {base_url}")
        return base_url

    # 如果已经以 /v1 结尾，保持不变
    if base_url.endswith('/v1'):
        logger.info(f"检测到标准 base_url (以 /v1 结尾): {base_url}")
        return base_url

    # 否则自动补全 /v1
    normalized = f"{base_url}/v1"
    logger.info(f"自动补全 base_url: {base_url} → {normalized}")
    return normalized


class OpenAICompatibleTranscriber(Transcriber, ABC):
    """
    OpenAI 兼容接口的通用转写器

    支持的供应商：
    - OpenAI 官方 (https://api.openai.com/v1)
    - Groq (https://api.groq.com/openai/v1)
    - 硅基流动 (https://api.siliconflow.cn/v1)
    - DeepSeek (https://api.deepseek.com)
    - 任何遵循 OpenAI Audio API 的中转服务

    URL 格式说明：
    - 完整端点：https://api.xxx.com/v1/audio/transcriptions （直接使用）
    - 标准格式：https://api.xxx.com/v1 （自动补充 /audio/transcriptions）
    - 简短格式：https://api.xxx.com （自动补充 /v1/audio/transcriptions）

    配置方式：
    1. 在「音频转写配置」页选择「OpenAI 兼容」，直接填写 Base URL 和 API Key
    2. 或在「模型供应商」页面添加供应商，然后在转写配置中选择该供应商
    """

    def __init__(self, provider_id: str = None, model_name: str = None):
        """
        初始化 OpenAI 兼容转写器

        Args:
            provider_id: 供应商 ID（如 'openai', 'groq', 'siliconflow'）
            model_name: 模型名称（如 'whisper-1', 'whisper-large-v3', 'FunAudioLLM/SenseVoiceSmall'）
                       如果为 None，则从环境变量读取
        """
        self.provider_id = provider_id or os.getenv('OPENAI_TRANSCRIBER_PROVIDER', 'openai')
        self.model_name = model_name or os.getenv('OPENAI_TRANSCRIBER_MODEL', 'whisper-1')
        logger.info(f"初始化 OpenAI 兼容转写器: provider={self.provider_id}, model={self.model_name}")

    @timeit
    def transcript(self, file_path: str) -> TranscriptResult:
        """
        使用 OpenAI 兼容 API 转写音频

        Args:
            file_path: 音频文件路径

        Returns:
            TranscriptResult: 转写结果（包含分段和全文）
        """
        # 检查文件大小，超过限制则压缩
        file_size = os.path.getsize(file_path)
        if file_size > MAX_SIZE_BYTES:
            logger.info(
                f"文件超过 {MAX_SIZE_MB}MB，开始压缩"
                f"（当前 {round(file_size / (1024 * 1024), 2)}MB）"
            )
            file_path = compress_audio(file_path)
            logger.info(f"压缩完成，临时路径：{file_path}")

        # 获取 OpenAI 兼容转写器的凭证
        # 优先级：转写器配置（音频转写配置页） > 已有供应商 > 环境变量
        cfg = TranscriberConfigManager().get_config()
        base_url = cfg.get("openai_transcriber_base_url", "").strip()
        api_key = cfg.get("openai_transcriber_api_key", "").strip()

        if base_url and api_key:
            # 转写器配置中有完整的 Base URL 和 API Key，直接使用
            raw_base_url = base_url
            provider_name = "OpenAI 兼容转写器"
            logger.info("使用转写器配置中的 Base URL 和 API Key")
        else:
            # 回退到从已有 LLM 供应商读取
            provider = ProviderService.get_provider_by_id(self.provider_id)
            if not provider:
                raise Exception(
                    f"供应商 '{self.provider_id}' 未配置，且转写器配置中的 "
                    f"Base URL 或 API Key 为空。"
                    f"请在「音频转写配置」页面填写 OpenAI 兼容接口的 Base URL 和 API Key。"
                )
            raw_base_url = provider.get('base_url')
            api_key = provider.get('api_key')
            provider_name = provider.get('name')
            logger.info(f"使用模型供应商 {provider_name}")

        if not api_key:
            raise ValueError(
                f"{provider_name} 的 API Key 未配置，请先在「设置」里填写后再使用"
            )

        # 智能补全 base_url
        normalized_base_url = normalize_base_url(raw_base_url)

        logger.info(
            f"使用 {provider_name} "
            f"(原始URL: {raw_base_url}, 规范化URL: {normalized_base_url})"
        )

        key_label = f"{provider_name} 转写引擎的 API Key"
        client = build_openai_client(
            api_key=api_key,
            base_url=normalized_base_url,
            key_label=key_label,
        )
        with open(file_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(file_path, file.read()),
                model=self.model_name,
                response_format="verbose_json",  # 获取分段信息
            )
            logger.info(f"转写完成，语言: {transcription.language}")

        # 解析结果
        segments = []
        full_text = ""

        # 检查 segments 是否存在（有些 API 可能不返回分段信息）
        if hasattr(transcription, 'segments') and transcription.segments:
            for seg in transcription.segments:
                text = seg.text.strip()
                full_text += text + " "
                segments.append(TranscriptSegment(
                    start=seg.start,
                    end=seg.end,
                    text=text
                ))
        else:
            # 如果没有分段信息，使用完整文本并创建单个分段
            logger.warning("转写结果没有 segments 字段，使用完整文本创建单个分段")
            full_text = transcription.text if hasattr(transcription, 'text') else ""
            if full_text:
                segments.append(TranscriptSegment(
                    start=0.0,
                    end=0.0,
                    text=full_text.strip()
                ))

        result = TranscriptResult(
            language=transcription.language if hasattr(transcription, 'language') else "unknown",
            full_text=full_text.strip(),
            segments=segments,
            raw=transcription.to_dict() if hasattr(transcription, 'to_dict') else {}
        )

        return result
