import os
import httpx
from datetime import datetime

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

async def upsert_trends(table, data):
    if not SUPABASE_URL or not data:
        return False
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(url, headers=HEADERS, json=data)
            return r.status_code in (200, 201, 204)
    except Exception as e:
        print(f"Erreur Supabase {table}: {e}")
        return False

async def fetch_latest(table, limit=50):
    if not SUPABASE_URL:
        return []
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {"order": "ts.desc", "limit": limit}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=HEADERS, params=params)
            return r.json()
    except Exception as e:
        print(f"Erreur Supabase fetch {table}: {e}")
        return []

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS google_trends (
    id BIGSERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    geo TEXT,
    source TEXT,
    ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tiktok_hashtags (
    id BIGSERIAL PRIMARY KEY,
    hashtag TEXT,
    video_views BIGINT,
    rank INT,
    region TEXT,
    ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tiktok_sounds (
    id BIGSERIAL PRIMARY KEY,
    sound_name TEXT,
    author TEXT,
    video_count INT,
    rank INT,
    region TEXT,
    ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reddit_posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    subreddit TEXT,
    score INT,
    url TEXT,
    ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS world_events (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    event_date DATE,
    days_until INT,
    category TEXT,
    ts TIMESTAMPTZ DEFAULT NOW()
);
"""
