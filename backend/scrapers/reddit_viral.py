import httpx
from datetime import datetime
from collections import Counter
import re

HEADERS = {"User-Agent": "TrendFlow/1.0 content creator trends aggregator"}

SUBREDDITS = [
    "TikTokCreators", "NewTubers", "videos", "PublicFreakout",
    "funny", "nextfuckinglevel", "interestingasfuck", "BeAmazed",
    "LifeProTips", "todayilearned"
]

async def get_hot_posts(subreddit, limit=10):
    url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={limit}"
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=10) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return []
            data = r.json()
        posts = []
        for post in data.get("data", {}).get("children", []):
            p = post.get("data", {})
            if p.get("stickied"):
                continue
            posts.append({
                "title": p.get("title"),
                "subreddit": subreddit,
                "score": p.get("score", 0),
                "num_comments": p.get("num_comments", 0),
                "url": f"https://reddit.com{p.get('permalink')}",
                "source": "reddit",
                "ts": datetime.utcnow().isoformat()
            })
        return posts
    except Exception as e:
        print(f"Erreur Reddit {subreddit}: {e}")
        return []

async def get_all_creator_trends():
    import asyncio
    tasks = [get_hot_posts(sub, 5) for sub in SUBREDDITS[:8]]
    results = await asyncio.gather(*tasks)
    all_posts = []
    for posts in results:
        all_posts.extend(posts)
    all_posts.sort(key=lambda x: x.get("score", 0), reverse=True)
    keywords = extract_viral_keywords([p["title"] for p in all_posts[:20]])
    return {
        "top_posts": all_posts[:20],
        "viral_keywords": keywords,
        "ts": datetime.utcnow().isoformat()
    }

def extract_viral_keywords(titles):
    stopwords = {"the","a","an","is","in","on","at","to","for","of","and","or","my","i","this","that","it","he","she"}
    words = []
    for title in titles:
        tokens = re.findall(r'\b[a-zA-Z]{3,}\b', title.lower())
        words.extend([w for w in tokens if w not in stopwords])
    return [{"word": w, "count": c} for w, c in Counter(words).most_common(15)]
