import httpx
from datetime import datetime

CREATIVE_CENTER_BASE = "https://ads.tiktok.com/creative_radar_api/v1"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Referer": "https://ads.tiktok.com/business/creativecenter/",
}

async def get_trending_hashtags(region="FR", period=7, limit=20):
    url = f"{CREATIVE_CENTER_BASE}/hashtag/list"
    params = {"period": period, "region": region, "limit": limit, "page": 1, "sort_by": "popular"}
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
            r = await client.get(url, params=params)
            data = r.json()
        hashtags = []
        for item in data.get("data", {}).get("list", []):
            hashtags.append({
                "hashtag": item.get("hashtag_name"),
                "video_views": item.get("video_views"),
                "rank": item.get("rank"),
                "region": region,
                "source": "tiktok_creative_center",
                "ts": datetime.utcnow().isoformat()
            })
        return hashtags
    except Exception as e:
        print(f"Erreur TikTok hashtags: {e}")
        return []

async def get_trending_sounds(region="FR", limit=20):
    url = f"{CREATIVE_CENTER_BASE}/sound/list"
    params = {"period": 7, "region": region, "limit": limit, "page": 1, "sort_by": "popular"}
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
            r = await client.get(url, params=params)
            data = r.json()
        sounds = []
        for item in data.get("data", {}).get("list", []):
            sounds.append({
                "sound_name": item.get("sound_name"),
                "author": item.get("author_name"),
                "video_count": item.get("video_cnt"),
                "rank": item.get("rank"),
                "region": region,
                "source": "tiktok_creative_center",
                "ts": datetime.utcnow().isoformat()
            })
        return sounds
    except Exception as e:
        print(f"Erreur TikTok sons: {e}")
        return []

async def get_all_tiktok_data(region="FR"):
    import asyncio
    hashtags, sounds = await asyncio.gather(
        get_trending_hashtags(region),
        get_trending_sounds(region)
    )
    return {
        "hashtags": hashtags,
        "sounds": sounds,
        "region": region,
        "ts": datetime.utcnow().isoformat()
    }
