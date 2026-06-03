import httpx
from datetime import datetime
import os

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
BASE_URL = "https://www.googleapis.com/youtube/v3"

async def get_trending_videos(region_code="FR", category_id="0", max_results=10):
    if not YOUTUBE_API_KEY:
        return []
    params = {
        "part": "snippet,statistics",
        "chart": "mostPopular",
        "regionCode": region_code,
        "videoCategoryId": category_id,
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/videos", params=params)
            data = r.json()
        videos = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            videos.append({
                "id": item["id"],
                "title": snippet.get("title"),
                "channel": snippet.get("channelTitle"),
                "tags": snippet.get("tags", [])[:5],
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "region": region_code,
                "source": "youtube_trending",
                "ts": datetime.utcnow().isoformat()
            })
        return videos
    except Exception as e:
        print(f"Erreur YouTube: {e}")
        return []

async def get_trending_by_categories(region_code="FR"):
    categories = {
        "entertainment": "24",
        "music": "10",
        "comedy": "23",
        "howto_style": "26",
    }
    import asyncio
    all_results = {}
    for name, cat_id in categories.items():
        videos = await get_trending_videos(region_code, cat_id, 5)
        if videos:
            all_results[name] = videos
    return all_results

def extract_tiktok_signals(videos):
    signals = {"hot_topics": [], "viral_formats": []}
    for v in videos:
        title = v.get("title", "").lower()
        for fmt in ["pov", "day in my life", "challenge", "transformation", "asmr"]:
            if fmt in title:
                signals["viral_formats"].append({"format": fmt, "example": v["title"]})
        signals["hot_topics"].extend(v.get("tags", [])[:2])
    signals["hot_topics"] = list(set(signals["hot_topics"]))[:15]
    return signals
