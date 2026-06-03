from pytrends.request import TrendReq
from datetime import datetime

def get_trending_searches(geo="FR"):
    pytrends = TrendReq(hl='fr-FR', tz=360)
    try:
        trending = pytrends.trending_searches(pn=geo)
        return [{"keyword": kw, "source": "google_trends", "geo": geo, "ts": datetime.utcnow().isoformat()} for kw in trending[0].tolist()]
    except Exception as e:
        print(f"Erreur Google Trends: {e}")
        return []

def get_interest_over_time(keywords, geo="FR", timeframe="now 7-d"):
    pytrends = TrendReq(hl='fr-FR', tz=360)
    try:
        pytrends.build_payload(keywords[:5], cat=0, timeframe=timeframe, geo=geo)
        df = pytrends.interest_over_time()
        if df.empty:
            return []
        result = []
        for kw in keywords[:5]:
            if kw in df.columns:
                result.append({
                    "keyword": kw,
                    "avg_interest": int(df[kw].mean()),
                    "peak": int(df[kw].max()),
                    "trend": "rising" if df[kw].iloc[-1] > df[kw].iloc[0] else "falling",
                })
        return result
    except Exception as e:
        print(f"Erreur interest: {e}")
        return []

def get_content_creator_keywords():
    categories = {
        "viral_formats": ["POV tiktok", "day in my life", "get ready with me", "storytime"],
        "trending_niches": ["satisfying", "asmr", "transformation", "challenge"],
    }
    pytrends = TrendReq(hl='fr-FR', tz=360)
    results = {}
    for category, kws in categories.items():
        try:
            pytrends.build_payload(kws[:4], timeframe='now 7-d', geo='')
            df = pytrends.interest_over_time()
            if not df.empty:
                scores = {kw: int(df[kw].mean()) for kw in kws[:4] if kw in df.columns}
                results[category] = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        except:
            pass
    return results
