"""
Groq 语音转写器

Groq 实际上使用的是 OpenAI 兼容接口（/openai/v1），但提供极快的推理速度。
配置直接从 TranscriberConfigManager 读取，不再依赖 ProviderService。
"""
from abc import ABC
import os
import tempfile

import ffmpeg
from dotenv import load_dotenv

from app.decorators.timeit import timeit
from app.models.transcriber_model import TranscriptResult, TranscriptSegment
from app.transcriber.base import Transcriber
from app.utils.openai_client import build_openai_client
from app.utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)

MAX_SIZE_MB = 18
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

GROQ_BASE_URL = "https://api.groq.com/openai/v1"


def compress_audio(input_path: str, target_bitrate='64k') -> str:
    """压缩音频文件到指定码率"""
    output_fd, output_path = tempfile.mkstemp(suffix=".mp3")
    os.close(output_fd)
    ffmpeg.input(input_path).output(
        output_path,
        audio_bitrate=target_bitrate
    ).run(quiet=True, overwrite_output=True)
    return output_path


class GroqTranscriber(Transcriber, ABC):

    def __init__(self, api_key: str = None, model: str = "whisper-large-v3"):
        """
        初始化 Groq 转写器

        Args:
            api_key: Groq API Key，从 TranscriberConfigManager 读取
            model: Groq 支持的语音转写模型名称
        """
        self.api_key = api_key
        self.model = model
        logger.info(f"初始化 Groq 转写器: model={model}")

    @timeit
    def transcript(self, file_path: str) -> TranscriptResult:
        if not self.api_key:
            raise Exception(
                "Groq API Key 未配置，请先在「设置 → 音频转写配置」中选择 Groq 并填写 API Key。"
            )

        # 检查文件大小，超过限制则压缩
        file_size = os.path.getsize(file_path)
        if file_size > MAX_SIZE_BYTES:
            logger.info(
                f"文件超过 {MAX_SIZE_MB}MB，开始压缩"
                f"（当前 {round(file_size / (1024 * 1024), 2)}MB）"
            )
            file_path = compress_audio(file_path)
            logger.info(f"压缩完成，临时路径：{file_path}")

        client = build_openai_client(
            api_key=self.api_key,
            base_url=GROQ_BASE_URL,
            key_label="Groq 转写引擎的 API Key",
        )

        with open(file_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(file_path, file.read()),
                model=self.model,
                response_format="verbose_json",
            )
            logger.info(f"Groq 转写完成，语言: {transcription.language}")

        segments = []
        full_text = ""

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
            logger.warning("Groq 转写结果没有 segments 字段，使用完整文本")
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
