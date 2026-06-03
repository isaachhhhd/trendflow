"""
TrendFlow API - FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from datetime import datetime
import os

from scrapers.google_trends import get_trending_searches, get_content_creator_keywords
from scrapers.youtube_trending import get_trending_by_categories, extract_tiktok_signals
from scrapers.reddit_viral import get_all_creator_trends
from scrapers.tiktok_creative import get_all_tiktok_data
from scrapers.events_worldwide import get_world_events_today, get_trending_hashtag_events, get_all_news_categories, get_news_trending

app = FastAPI(title="TrendFlow API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_cache = {}
CACHE_TTL = 3600

def cache_get(key):
    entry = _cache.get(key)
    if not entry: return None
    if (datetime.utcnow() - entry["ts"]).seconds > CACHE_TTL: return None
    return entry["data"]

def cache_set(key, data):
    _cache[key] = {"data": data, "ts": datetime.utcnow()}

@app.get("/")
async def root():
    return {"status": "ok", "service": "TrendFlow API"}

@app.get("/api/dashboard")
async def get_dashboard(region: str = "FR"):
    cached = cache_get(f"dashboard_{region}")
    if cached: return cached
    results = await asyncio.gather(
        get_trending_searches(region),
        get_trending_by_categories(region),
        get_all_creator_trends(),
        get_all_tiktok_data(region),
        get_world_events_today(),
        get_trending_hashtag_events(),
        get_all_news_categories(),
        get_content_creator_keywords(),
        return_exceptions=True
    )
    google, youtube_cats, reddit, tiktok, wiki_events, upcoming, news, creator_kws = results
    all_yt = []
    if isinstance(youtube_cats, dict):
        for vids in youtube_cats.values(): all_yt.extend(vids)
    dashboard = {
        "meta": {"region": region, "generated_at": datetime.utcnow().isoformat(), "sources_count": 7},
        "google_trends": google if isinstance(google, list) else [],
        "youtube": {"by_category": youtube_cats if isinstance(youtube_cats, dict) else {}},
        "reddit": reddit if isinstance(reddit, dict) else {},
        "tiktok": tiktok if isinstance(tiktok, dict) else {},
        "events": {"today": wiki_events if isinstance(wiki_events, dict) else {}, "upcoming": upcoming if isinstance(upcoming, list) else []},
        "news": news if isinstance(news, dict) else {},
        "creator_keywords": creator_kws if isinstance(creator_kws, dict) else {}
    }
    cache_set(f"dashboard_{region}", dashboard)
    return dashboard

@app.get("/api/trends/tiktok")
async def tiktok_endpoint(region: str = "FR"):
    data = await get_all_tiktok_data(region)
    return data

@app.get("/api/events")
async def events_endpoint():
    return {"today": await get_world_events_today(), "upcoming": await get_trending_hashtag_events()}

@app.get("/api/news")
async def news_endpoint(category: str = "entertainment"):
    return await get_news_trending(category)
