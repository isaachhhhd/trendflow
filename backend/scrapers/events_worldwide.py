import httpx
from datetime import datetime, date
import os

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

async def get_world_events_today():
    today = date.today()
    url = f"https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/{today.month:02d}/{today.day:02d}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url)
            data = r.json()
        events = []
        for event in data.get("events", [])[:8]:
            events.append({"type": "historical", "year": event.get("year"), "text": event.get("text"), "source": "wikipedia"})
        for holiday in data.get("holidays", []):
            events.append({"type": "holiday", "text": holiday.get("text"), "source": "wikipedia"})
        return {"date": today.isoformat(), "events": events}
    except Exception as e:
        print(f"Erreur Wikipedia: {e}")
        return {}

async def get_news_trending(category="entertainment", country="fr", page_size=15):
    if not NEWS_API_KEY:
        return await get_news_fallback(category)
    url = "https://newsapi.org/v2/top-headlines"
    params = {"country": country, "category": category, "pageSize": page_size, "apiKey": NEWS_API_KEY}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, params=params)
            data = r.json()
        return [{"title": a.get("title"), "description": a.get("description"), "source": a.get("source", {}).get("name"), "url": a.get("url"), "category": category} for a in data.get("articles", [])]
    except:
        return await get_news_fallback(category)

async def get_news_fallback(category="general"):
    import xml.etree.ElementTree as ET
    feeds = {
        "entertainment": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtWnZHZ0pHVWlnQVAB",
        "general": "https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr"
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(feeds.get(category, feeds["general"]))
        root = ET.fromstring(r.content)
        return [{"title": item.findtext("title",""), "url": item.findtext("link",""), "source": "google_news_rss", "category": category} for item in root.findall(".//item")[:12]]
    except:
        return []

async def get_trending_hashtag_events():
    today = date.today()
    recurring = [
        {"name": "Pride Month", "month": 6, "day": 1, "category": "social"},
        {"name": "Summer Solstice", "month": 6, "day": 21, "category": "seasonal"},
        {"name": "Fête Nationale FR", "month": 7, "day": 14, "category": "france"},
        {"name": "Halloween", "month": 10, "day": 31, "category": "seasonal"},
        {"name": "Black Friday", "month": 11, "day": 29, "category": "shopping"},
        {"name": "Christmas", "month": 12, "day": 25, "category": "seasonal"},
        {"name": "New Year's Eve", "month": 12, "day": 31, "category": "seasonal"},
        {"name": "Valentine's Day", "month": 2, "day": 14, "category": "lifestyle"},
        {"name": "Earth Day", "month": 4, "day": 22, "category": "environment"},
    ]
    upcoming = []
    for event in recurring:
        event_date = date(today.year, event["month"], event["day"])
        if event_date < today:
            event_date = date(today.year + 1, event["month"], event["day"])
        days_until = (event_date - today).days
        if 0 <= days_until <= 30:
            upcoming.append({
                "name": event["name"],
                "date": event_date.isoformat(),
                "days_until": days_until,
                "category": event["category"],
                "urgency": "now" if days_until <= 3 else "soon" if days_until <= 7 else "upcoming"
            })
    upcoming.sort(key=lambda x: x["days_until"])
    return upcoming

async def get_all_news_categories():
    import asyncio
    categories = ["entertainment", "technology", "sports", "general"]
    tasks = [get_news_trending(cat) for cat in categories]
    results = await asyncio.gather(*tasks)
    return {cat: articles for cat, articles in zip(categories, results)}
