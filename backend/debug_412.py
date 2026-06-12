#!/usr/bin/env python3
"""
调试脚本：测试 B站视频下载，诊断 412 错误
"""
import os
import sys
import logging

# 设置日志
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

def test_bilibili_download():
    """测试 B站视频下载"""
    try:
        import yt_dlp
        logger.info(f"✅ yt-dlp 版本: {yt_dlp.version.__version__}")
    except ImportError:
        logger.error("❌ yt-dlp 未安装！请运行: pip install yt-dlp")
        return

    # 测试视频
    test_url = "https://www.bilibili.com/video/BV1kM7R6TEAy"
    
    # 基础配置
    ydl_opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio/best',
        'quiet': False,
        'verbose': True,
        'extract_flat': 'in_playlist',
        'skip_download': True,  # 只提取信息，不实际下载
        'http_headers': {
            'Referer': 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
    }
    
    logger.info(f"\n{'='*60}")
    logger.info(f"测试 1: 不使用 Cookie")
    logger.info(f"{'='*60}")
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(test_url, download=False)
            logger.info(f"✅ 成功提取信息（无 Cookie）")
            logger.info(f"   标题: {info.get('title')}")
            logger.info(f"   时长: {info.get('duration')}秒")
    except Exception as e:
        logger.error(f"❌ 提取失败: {e}")
        
        # 检查是否是 412 错误
        if '412' in str(e):
            logger.warning(f"\n🔴 检测到 HTTP 412 错误！")
            logger.warning(f"   原因: B站反爬虫机制")
            logger.warning(f"   解决: 需要配置 Cookie")
    
    # 测试 2: 使用 Cookie（如果有）
    cookie_file = "config/downloader.json"
    if os.path.exists(cookie_file):
        import json
        try:
            with open(cookie_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
                cookie = config.get('bilibili', {}).get('cookie')
                
            if cookie:
                logger.info(f"\n{'='*60}")
                logger.info(f"测试 2: 使用 Cookie")
                logger.info(f"{'='*60}")
                
                # 写入临时 Cookie 文件
                import tempfile
                tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
                tmp.write("# Netscape HTTP Cookie File\n")
                for pair in cookie.split("; "):
                    if "=" in pair:
                        key, value = pair.split("=", 1)
                        tmp.write(f".bilibili.com\tTRUE\t/\tFALSE\t0\t{key}\t{value}\n")
                tmp.close()
                
                ydl_opts['cookiefile'] = tmp.name
                
                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(test_url, download=False)
                        logger.info(f"✅ 成功提取信息（使用 Cookie）")
                        logger.info(f"   标题: {info.get('title')}")
                except Exception as e:
                    logger.error(f"❌ 使用 Cookie 后仍失败: {e}")
                finally:
                    os.unlink(tmp.name)
        except Exception as e:
            logger.error(f"❌ 读取 Cookie 配置失败: {e}")
    else:
        logger.warning(f"\n⚠️  未找到 Cookie 配置文件: {cookie_file}")
    
    # 总结
    logger.info(f"\n{'='*60}")
    logger.info(f"诊断总结")
    logger.info(f"{'='*60}")
    logger.info("如果看到 HTTP 412 错误，请:")
    logger.info("1. 登录 B站 (https://www.bilibili.com)")
    logger.info("2. 按 F12 打开开发者工具 → Console")
    logger.info("3. 输入: copy(document.cookie)")
    logger.info("4. 在 NoteFlow 前端「设置 → 下载配置」粘贴")
    logger.info("5. 重启后端服务")

if __name__ == "__main__":
    test_bilibili_download()
