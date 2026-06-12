import datetime
import json
import os
import re
from typing import Union, Optional
from urllib.parse import quote, urlencode

import httpx
import requests
from pydantic import BaseModel

from app.downloaders.base import Downloader
from app.downloaders.douyin_helper.abogus import ABogus
from app.enmus.note_enums import DownloadQuality
from app.models.audio_model import AudioDownloadResult
from app.services.cookie_manager import CookieConfigManager
from app.utils.path_helper import get_data_dir
from dotenv import load_dotenv

load_dotenv()
DOUYIN_DOMAIN = "https://www.douyin.com"

cfm=CookieConfigManager()
def get_timestamp(unit: str = "milli"):
    """
    根据给定的单位获取当前时间 (Get the current time based on the given unit)

    Args:
        unit (str): 时间单位，可以是 "milli"、"sec"、"min" 等
            (The time unit, which can be "milli", "sec", "min", etc.)

    Returns:
        int: 根据给定单位的当前时间 (The current time based on the given unit)
    """

    now = datetime.datetime.utcnow() - datetime.datetime(1970, 1, 1)
    if unit == "milli":
        return int(now.total_seconds() * 1000)
    elif unit == "sec":
        return int(now.total_seconds())
    elif unit == "min":
        return int(now.total_seconds() / 60)
    else:
        raise ValueError("Unsupported time unit")


class DouyinConfig:
    HEADERS = {
        "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
        "Referer": "https://www.douyin.com/",
        "Cookie": None
    }

    PROXIES = {
        "http": None,
        "https": None,
    }

    MS_TOKEN = {
        "url": "https://mssdk.bytedance.com/web/report",
        "magic": 538969122,
        "version": 1,
        "dataType": 8,
        "strData": "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",
        "User-Agent": "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47"
    }

    TTWID = {
        "url": "https://ttwid.bytedance.com/ttwid/union/register/",
        "data": '{"region":"cn","aid":1768,"needFid":false,"service":"www.ixigua.com","migrate_info":{"ticket":"","source":"node"},"cbUrlProtocol":"https","union":true}'
    }


class BaseRequestModel(BaseModel):
    device_platform: str = "webapp"
    aid: str = "6383"
    channel: str = "channel_pc_web"
    pc_client_type: int = 1
    version_code: str = "290100"
    version_name: str = "29.1.0"
    cookie_enabled: str = "true"
    screen_width: int = 1920
    screen_height: int = 1080
    browser_language: str = "zh-CN"
    browser_platform: str = "Win32"
    browser_name: str = "Chrome"
    browser_version: str = "130.0.0.0"
    browser_online: str = "true"
    engine_name: str = "Blink"
    engine_version: str = "130.0.0.0"
    os_name: str = "Windows"
    os_version: str = "10"
    cpu_core_num: int = 12
    device_memory: int = 8
    platform: str = "PC"
    downlink: str = "10"
    effective_type: str = "4g"
    from_user_page: str = "1"
    locate_query: str = "false"
    need_time_list: str = "1"
    pc_libra_divert: str = "Windows"
    publish_video_strategy_type: str = "2"
    round_trip_time: str = "0"
    show_live_replay_strategy: str = "1"
    time_list_query: str = "0"
    whale_cut_token: str = ""
    update_version_code: str = "170400"
    msToken: str = None


class DouyinDownloader(Downloader):
    def __init__(self, cookie=None):
        super().__init__()
        self.headers_config = DouyinConfig.HEADERS.copy()
        self.headers_config["Cookie"] = cfm.get('douyin')
        print(self.headers_config)
        self.proxies_config = DouyinConfig.PROXIES.copy()
        self.ttwid_config = DouyinConfig.TTWID.copy()
        self.ms_token_config = DouyinConfig.MS_TOKEN.copy()

    @staticmethod
    def find_url(string: str) -> list:
        url = re.findall('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', string)
        return url

    def extract_video_id(self, url: str) -> str:
        video_url = self.find_url(url)

        if len(video_url):
            video_url = video_url[0]
            try:
                response = requests.head(video_url, allow_redirects=True, timeout=10)
                url = response.url
            except Exception as e:
                print(f"URL重定向失败，使用原始URL: {e}")
                # 如果重定向失败，继续使用原始URL
                url = video_url
        
        # 支持多种抖音URL格式
        patterns = [
            r'video/(\d+)',           # https://www.douyin.com/video/7647097158558181610
            r'aweme_id=(\d+)',        # ?aweme_id=7647097158558181610
            r'modal_id=(\d+)',        # https://www.douyin.com/jingxuan?modal_id=7647097158558181610
            r'/note/(\d+)',           # https://www.douyin.com/note/7647097158558181610
            r'share/video/(\d+)',     # 分享链接格式
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                video_id = match.group(1)
                print(f"成功提取视频ID: {video_id} (使用模式: {pattern})")
                return video_id
        
        print(f"无法从URL中提取视频ID: {url}")
        return ""

    def gen_real_msToken(self) -> str:
        try:
            payload = json.dumps(
                {
                    "magic": self.ms_token_config["magic"],
                    "version": self.ms_token_config["version"],
                    "dataType": self.ms_token_config["dataType"],
                    "strData": self.ms_token_config["strData"],
                    "tspFromClient": get_timestamp(),
                }
            )
            headers = {
                "User-Agent": self.headers_config["User-Agent"],
                "Content-Type": "application/json",
            }
            transport = httpx.HTTPTransport(retries=5)
            with httpx.Client(transport=transport) as client:
                try:
                    response = client.post(
                        self.ms_token_config["url"], content=payload, headers=headers
                    )
                    response.raise_for_status()

                    msToken = str(httpx.Cookies(response.cookies).get("msToken"))
                    if len(msToken) not in [120, 128]:
                        raise ValueError("响应内容：{0}， Douyin msToken API 的响应内容不符合要求。".format(msToken))

                    return msToken
                except Exception as e:
                    raise ValueError("Douyin msToken API 请求失败：{0}".format(e))
        except Exception as e:
            raise ValueError("Douyin msToken API{0}".format(e))

    def fetch_video_info(self, video_url: str) -> json:
        try:

            aweme_id = self.extract_video_id(video_url)
            if not aweme_id:
                raise ValueError(f"无法从URL中提取视频ID: {video_url}")
            
            kwargs = self.headers_config
            print("@kwargs:", kwargs)
            base_params = BaseRequestModel().model_dump()
            base_params["msToken"] = self.gen_real_msToken()

            base_params["aweme_id"] = aweme_id
            bogus = ABogus()
            ab_value = bogus.get_value(base_params)
            a_bogus = quote(ab_value, safe='')
            print("@a_bogus:", a_bogus)
            print(base_params)
            query_str = urlencode(base_params)
            full_url = f"{DOUYIN_DOMAIN}/aweme/v1/web/aweme/detail/?{query_str}&a_bogus={a_bogus}"

            print("Request URL:", full_url)

            response = requests.get(full_url, headers=kwargs, timeout=30)
            response.raise_for_status()  # 检查HTTP错误
            
            result = response.json()
            print("Response JSON:", result)
            
            # 检查API响应是否有效
            if not result:
                raise ValueError("API返回空响应")
            
            # 检查是否有错误信息
            if 'status_code' in result and result['status_code'] != 0:
                error_msg = result.get('status_msg', '未知错误')
                raise ValueError(f"抖音API返回错误: {error_msg}")
            
            return result
        except requests.exceptions.RequestException as e:
            print(f"网络请求失败: {e}")
            raise ValueError(f"网络请求失败: {e}")
        except json.JSONDecodeError as e:
            print(f"JSON解析失败: {e}")
            raise ValueError(f"API响应JSON解析失败: {e}")
        except Exception as e:
            print(f"获取视频信息失败: {e}")
            raise ValueError(f"获取视频信息失败: {e}")

    def download(
            self,
            video_url: str,
            output_dir: Union[str, None] = None,
            quality: DownloadQuality = "fast",
            need_video: Optional[bool] = False
    ) -> AudioDownloadResult:
        try:
            print(
                f"正在下载视频: {video_url}，保存路径: {output_dir}，质量: {quality}"
            )
            if output_dir is None:
                output_dir = get_data_dir()
            if not output_dir:
                output_dir = self.cache_data
            os.makedirs(output_dir, exist_ok=True)

            output_path = os.path.join(output_dir, "%(id)s.%(ext)s")

            video_data = self.fetch_video_info(video_url)
            
            # 检查 video_data 是否为空
            if not video_data or 'aweme_detail' not in video_data:
                raise ValueError(f"获取视频信息失败，API返回数据为空或格式不正确: {video_data}")
            
            aweme_detail = video_data.get('aweme_detail', {})
            if not aweme_detail:
                raise ValueError("视频详情数据为空")
            
            # 安全获取视频ID
            aweme_id = aweme_detail.get('aweme_id')
            if not aweme_id:
                raise ValueError("无法获取视频ID")
            
            output_path = output_path % {
                "id": aweme_id,
                "ext": "mp3",
            }
            
            # 安全获取音频URL
            music_info = aweme_detail.get('music', {})
            play_url_info = music_info.get('play_url', {})
            url = play_url_info.get('uri')
            
            if not url:
                raise ValueError("无法获取音频播放地址")
            
            # 下载音频
            audio_data = requests.get(url)
            with open(output_path, 'wb') as f:
                f.write(audio_data.content)
            print(url)
            
            # 安全获取标签
            tags = []
            video_tags = aweme_detail.get('video_tag', [])
            if video_tags:
                for tag in video_tags:
                    tag_name = tag.get('tag_name') if isinstance(tag, dict) else None
                    if tag_name:
                        tags.append(tag_name)
            
            # 安全获取封面URL
            cover_url = ""
            video_info = aweme_detail.get('video', {})
            if video_info:
                cover_original = video_info.get('cover_original_scale', {})
                url_list = cover_original.get('url_list', [])
                if url_list and len(url_list) > 0:
                    cover_url = url_list[0]
                else:
                    # 尝试获取备用封面
                    cover_info = video_info.get('cover', {})
                    if cover_info and 'url_list' in cover_info:
                        backup_urls = cover_info.get('url_list', [])
                        if backup_urls:
                            cover_url = backup_urls[0]
            
            # 安全获取标题
            title = aweme_detail.get('item_title', '') or aweme_detail.get('desc', '未知标题')
            
            # 安全获取时长
            duration = video_info.get('duration', 0) if video_info else 0
            
            # 安全获取描述
            caption = aweme_detail.get('caption', '') or aweme_detail.get('desc', '')

            return AudioDownloadResult(
                file_path=output_path,
                title=title,
                duration=duration,
                cover_url=cover_url,
                platform="douyin",
                video_id=aweme_id,
                raw_info={
                    'tags': caption + ' ' + ' '.join(tags),
                },
                video_path=None  # ❗音频下载不包含视频路径
            )
        except Exception as e:
            print(f"抖音下载失败: {str(e)}")
            raise ValueError(f"抖音视频下载失败: {str(e)}")

    def download_video(self, video_url: str, output_dir: Union[str, None] = None) -> str:

        try:

            if output_dir is None:
                output_dir = get_data_dir()
            if not output_dir:
                output_dir = self.cache_data
            os.makedirs(output_dir, exist_ok=True)

            video_id = self.extract_video_id(video_url)
            if not video_id:
                raise ValueError(f"无法从URL中提取视频ID: {video_url}")
            
            video_path = os.path.join(output_dir, f"{video_id}.mp4")
            if os.path.exists(video_path):
                return video_path

            output_path = os.path.join(output_dir, "%(id)s.%(ext)s")

            video_data = self.fetch_video_info(video_url)
            
            # 安全检查
            if not video_data or 'aweme_detail' not in video_data:
                raise ValueError("获取视频信息失败")
            
            aweme_detail = video_data.get('aweme_detail', {})
            aweme_id = aweme_detail.get('aweme_id')
            
            if not aweme_id:
                raise ValueError("无法获取视频ID")
            
            output_path = output_path % {
                "id": aweme_id,
                "ext": "mp4",
            }
            
            # 安全获取视频下载地址
            video_info = aweme_detail.get('video', {})
            download_addr = video_info.get('download_addr', {})
            url_list = download_addr.get('url_list', [])
            
            if not url_list or len(url_list) == 0:
                # 尝试备用地址
                play_addr = video_info.get('play_addr', {})
                url_list = play_addr.get('url_list', [])
            
            if not url_list or len(url_list) == 0:
                raise ValueError("无法获取视频下载地址")
            
            url = url_list[0]
            _data = requests.get(url, allow_redirects=True, headers=self.headers_config, timeout=60)
            _data.raise_for_status()

            with open(output_path, 'wb') as f:
                f.write(_data.content)

            return output_path
        except Exception as e:
            print(f"视频下载失败: {e}")
            raise ValueError(f"抖音视频下载失败: {e}")



if __name__ == '__main__':
    dy = DouyinDownloader(
        cookie='')

    dy.download(
        '7.43 11/16 gba:/ j@P.xS 以“马成钢”的视角打开《抓娃娃》笼中鸟，何时飞 # 独白 # 人物故事  https://v.douyin.com/0pcFVdG_lx4/ 复制此链接，打开Dou音搜索，直接观看视频！'
    )
