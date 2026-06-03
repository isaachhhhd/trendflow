import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://your-backend.railway.app"; // À remplacer

const REGIONS = [
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "US", flag: "🇺🇸", name: "USA" },
  { code: "GB", flag: "🇬🇧", name: "UK" },
  { code: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "", flag: "🌍", name: "Global" },
];

// ── Mock data so app works standalone ──────────────────────────────────────
const MOCK = {
  meta: { region: "FR", generated_at: new Date().toISOString(), sources_count: 7 },
  google_trends: [
    { keyword: "AI video", geo: "FR" }, { keyword: "ChatGPT", geo: "FR" },
    { keyword: "POV tiktok", geo: "FR" }, { keyword: "Satisfying clips", geo: "FR" },
    { keyword: "Day in my life", geo: "FR" }, { keyword: "Get ready with me", geo: "FR" },
    { keyword: "Storytime", geo: "FR" }, { keyword: "Challenge viral", geo: "FR" },
  ],
  tiktok: {
    hashtags: [
      { hashtag: "fyp", video_views: 980000000, rank: 1 },
      { hashtag: "viral", video_views: 750000000, rank: 2 },
      { hashtag: "foryou", video_views: 620000000, rank: 3 },
      { hashtag: "trending", video_views: 480000000, rank: 4 },
      { hashtag: "pourtoi", video_views: 390000000, rank: 5 },
      { hashtag: "grwm", video_views: 310000000, rank: 6 },
      { hashtag: "satisfying", video_views: 280000000, rank: 7 },
      { hashtag: "dayinmylife", video_views: 250000000, rank: 8 },
    ],
    sounds: [
      { sound_name: "Espresso", author: "Sabrina Carpenter", video_count: 2400000, rank: 1 },
      { sound_name: "Feather", author: "Sabrina Carpenter", video_count: 1800000, rank: 2 },
      { sound_name: "APT.", author: "ROSE & Bruno Mars", video_count: 1500000, rank: 3 },
      { sound_name: "Die With A Smile", author: "Lady Gaga", video_count: 1200000, rank: 4 },
      { sound_name: "Original Sound", author: "@creator_fr", video_count: 980000, rank: 5 },
    ],
  },
  reddit: {
    top_posts: [
      { title: "This transformation took 30 days", subreddit: "nextfuckinglevel", score: 48200 },
      { title: "POV: you discovered this life hack", subreddit: "LifeProTips", score: 39500 },
      { title: "Nobody talks about this everyday hack", subreddit: "todayilearned", score: 31200 },
      { title: "Rating every outfit from TikTok", subreddit: "funny", score: 28900 },
      { title: "Day 1 vs Day 30 results", subreddit: "BeAmazed", score: 24300 },
    ],
    viral_keywords: [
      { word: "transformation", count: 12 }, { word: "hack", count: 9 },
      { word: "nobody", count: 8 }, { word: "viral", count: 7 },
      { word: "rating", count: 6 }, { word: "reaction", count: 5 },
    ],
  },
  events: {
    upcoming: [
      { name: "Pride Month", days_until: 2, category: "social", urgency: "now" },
      { name: "Summer Solstice", days_until: 18, category: "seasonal", urgency: "upcoming" },
      { name: "Fête Nationale FR", days_until: 41, category: "france", urgency: "upcoming" },
    ],
    today: {
      events: [
        { type: "holiday", text: "World Bicycle Day" },
        { type: "historical", year: 1989, text: "Tiananmen Square protests" },
      ]
    }
  },
  news: {
    entertainment: [
      { title: "TikTok announces new creator monetization tools", source: "TechCrunch" },
      { title: "Short-form video dominates Q2 2026 engagement metrics", source: "Forbes" },
      { title: "New viral format sweeping across Gen Z creators", source: "Wired" },
    ],
    technology: [
      { title: "AI video generation tools hit record adoption", source: "The Verge" },
      { title: "CapCut releases major AI editing update", source: "Mashable" },
    ],
  },
};

// ── Utility ─────────────────────────────────────────────────────────────────
function fmtViews(n) {
  if (!n) return "--";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return n.toString();
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

// ── Components ───────────────────────────────────────────────────────────────

function Pill({ children, color = "#ff2d55" }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      background: color + "22", color, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.05em", border: `1px solid ${color}44`,
    }}>
      {children}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 16, padding: "20px", backdropFilter: "blur(8px)",
      transition: "border-color 0.2s", ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "0.02em" }}>
          {title}
        </span>
      </div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, marginLeft: 26 }}>{sub}</div>}
    </div>
  );
}

function LiveDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: "#ff2d55",
        boxShadow: "0 0 0 0 #ff2d5560",
        animation: "pulse 1.5s infinite",
      }} />
      <span style={{ fontSize: 10, color: "#ff2d55", fontWeight: 700, letterSpacing: "0.1em" }}>LIVE</span>
    </span>
  );
}

function HashtagRow({ item, idx }) {
  const max = 980000000;
  const pct = Math.min(100, ((item.video_views || 0) / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ width: 18, fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>#{idx + 1}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>#{item.hashtag}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{fmtViews(item.video_views)} views</span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: "linear-gradient(90deg, #ff2d55, #ff6b35)", transition: "width 0.8s" }} />
        </div>
      </div>
    </div>
  );
}

function SoundRow({ item, idx }) {
  const colors = ["#ff2d55", "#ff6b35", "#ffd60a", "#30d158", "#0a84ff"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: colors[idx % colors.length] + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎵</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.sound_name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{item.author} · {fmtViews(item.video_count)} vids</div>
      </div>
      <Pill color={colors[idx % colors.length]}>#{item.rank}</Pill>
    </div>
  );
}

function EventBadge({ event }) {
  const color = event.urgency === "now" ? "#ff2d55" : event.urgency === "soon" ? "#ff9f0a" : "#30d158";
  const label = event.urgency === "now" ? "NOW" : event.urgency === "soon" ? "SOON" : `${event.days_until}d`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 12px", borderRadius: 10, background: color + "11", border: `1px solid ${color}33` }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
        {event.category === "social" ? "🏳️‍🌈" : event.category === "sports" ? "🏆" : event.category === "france" ? "🇫🇷" : event.category === "shopping" ? "🛍️" : "📅"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{event.name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Content opportunity</div>
      </div>
      <Pill color={color}>{label}</Pill>
    </div>
  );
}

function TrendKeyword({ item }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "3px", padding: "5px 10px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "default" }}>
      <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{item.keyword || item.word}</span>
      {item.count && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>×{item.count}</span>}
    </div>
  );
}

function StatBox({ label, value, color = "#fff", sub }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "'Syne', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function TrendFlow() {
  const [region, setRegion] = useState("FR");
  const [data, setData] = useState(MOCK);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/dashboard?region=${region}`);
      if (!r.ok) throw new Error("API unavailable");
      const json = await r.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (e) {
      setData(MOCK);
      setError("Mode démo -- connectez votre backend Railway");
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setInterval(fetchData, 60 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchData]);

  const hashtags = data?.tiktok?.hashtags || [];
  const sounds = data?.tiktok?.sounds || [];
  const googleTrends = data?.google_trends || [];
  const redditPosts = data?.reddit?.top_posts || [];
  const viralKws = data?.reddit?.viral_keywords || [];
  const upcomingEvents = data?.events?.upcoming || [];
  const todayEvents = data?.events?.today?.events || [];
  const news = data?.news || {};
  const allNews = Object.values(news).flat().slice(0, 8);

  const tabs = [
    { id: "overview", label: "Overview", icon: "⚡" },
    { id: "tiktok", label: "TikTok", icon: "🎵" },
    { id: "content", label: "Contenu", icon: "🎬" },
    { id: "events", label: "Events", icon: "📅" },
    { id: "news", label: "News", icon: "📰" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 #ff2d5560; } 50% { box-shadow: 0 0 0 6px #ff2d5500; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080810", fontFamily: "'Space Mono', monospace", color: "#fff", maxWidth: 420, margin: "0 auto", position: "relative" }}>

        {/* Background mesh */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #ff2d5518 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: 100, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #0a84ff12 0%, transparent 70%)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 900, letterSpacing: "-0.03em" }}>
                    trend<span style={{ color: "#ff2d55" }}>flow</span>
                  </span>
                  <LiveDot />
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  Updated {timeAgo(lastUpdate.toISOString())} · {data?.meta?.sources_count || 7} sources
                </div>
              </div>
              <button onClick={fetchData} disabled={loading} style={{
                background: loading ? "rgba(255,255,255,0.05)" : "rgba(255,45,85,0.15)",
                border: "1px solid rgba(255,45,85,0.3)", color: "#ff2d55", borderRadius: 10,
                padding: "6px 12px", fontSize: 11, fontFamily: "'Space Mono', monospace",
                cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5
              }}>
                <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>⟳</span>
                {loading ? "..." : "Refresh"}
              </button>
            </div>

            {/* Region selector */}
            <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
              {REGIONS.map(r => (
                <button key={r.code} onClick={() => setRegion(r.code)} style={{
                  flexShrink: 0, padding: "4px 10px", borderRadius: 99, fontSize: 11,
                  border: region === r.code ? "1px solid #ff2d55" : "1px solid rgba(255,255,255,0.1)",
                  background: region === r.code ? "rgba(255,45,85,0.15)" : "rgba(255,255,255,0.04)",
                  color: region === r.code ? "#ff2d55" : "rgba(255,255,255,0.5)",
                  cursor: "pointer", fontFamily: "'Space Mono', monospace",
                }}>
                  {r.flag} {r.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ margin: "12px 20px 0", padding: "8px 12px", borderRadius: 10, background: "rgba(255,159,10,0.1)", border: "1px solid rgba(255,159,10,0.3)", fontSize: 10, color: "#ff9f0a" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)", marginTop: 16 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, padding: "10px 4px", fontSize: 9, fontFamily: "'Space Mono', monospace",
                border: "none", borderBottom: activeTab === t.id ? "2px solid #ff2d55" : "2px solid transparent",
                background: "transparent", color: activeTab === t.id ? "#ff2d55" : "rgba(255,255,255,0.35)",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                transition: "color 0.15s", letterSpacing: "0.02em"
              }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: "16px 16px 100px", animation: "fadeIn 0.3s ease" }}>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div>
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                  <StatBox label="Hashtags" value={hashtags.length} color="#ff2d55" sub="trending" />
                  <StatBox label="Sounds" value={sounds.length} color="#ffd60a" sub="viral" />
                  <StatBox label="Events" value={upcomingEvents.length} color="#30d158" sub="upcoming" />
                </div>

                {/* Top Google Trends */}
                <Card style={{ marginBottom: 12 }}>
                  <SectionTitle icon="🔍" title="Google Trends" sub="Recherches en hausse aujourd'hui" />
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {googleTrends.slice(0, 12).map((t, i) => <TrendKeyword key={i} item={t} />)}
                  </div>
                </Card>

                {/* Top Hashtags preview */}
                <Card style={{ marginBottom: 12 }}>
                  <SectionTitle icon="🔥" title="Top TikTok Hashtags" sub={`Région: ${region || "Global"}`} />
                  {hashtags.slice(0, 5).map((h, i) => <HashtagRow key={i} item={h} idx={i} />)}
                </Card>

                {/* Reddit viral */}
                <Card style={{ marginBottom: 12 }}>
                  <SectionTitle icon="📈" title="Formats viraux Reddit" sub="Signaux précoces de contenu" />
                  {redditPosts.slice(0, 4).map((p, i) => (
                    <div key={i} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", borderLeft: "2px solid rgba(255,45,85,0.4)" }}>
                      <div style={{ fontSize: 11, color: "#fff", lineHeight: 1.4 }}>{p.title}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                        r/{p.subreddit} · {fmtViews(p.score)} pts
                      </div>
                    </div>
                  ))}
                </Card>

                {/* Upcoming events */}
                {upcomingEvents.length > 0 && (
                  <Card>
                    <SectionTitle icon="⏰" title="Opportunités imminentes" sub="Contenu à préparer maintenant" />
                    {upcomingEvents.slice(0, 3).map((e, i) => <EventBadge key={i} event={e} />)}
                  </Card>
                )}
              </div>
            )}

            {/* TIKTOK TAB */}
            {activeTab === "tiktok" && (
              <div>
                <Card style={{ marginBottom: 12 }}>
                  <SectionTitle icon="#️⃣" title="Hashtags Tendances" sub="Triés par volume de vues" />
                  {hashtags.map((h, i) => <HashtagRow key={i} item={h} idx={i} />)}
                </Card>
                <Card>
                  <SectionTitle icon="🎵" title="Sons Viraux" sub="Utilise-les maintenant" />
                  {sounds.map((s, i) => <SoundRow key={i} item={s} idx={i} />)}
                </Card>
              </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === "content" && (
              <div>
                <Card style={{ marginBottom: 12 }}>
                  <SectionTitle icon="💡" title="Mots-clés créateurs" sub="Formats qui convertissent" />
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {viralKws.map((k, i) => <TrendKeyword key={i} item={k} />)}
                  </div>
                </Card>

                <Card style={{ marginBottom: 12 }}>
                  <SectionTitle icon="🎬" title="Formats viraux du moment" sub="Tirés de Reddit & YouTube" />
                  {redditPosts.map((p, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.5 }}>{p.title}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                        <Pill color="#ff2d55">r/{p.subreddit}</Pill>
                        <Pill color="#0a84ff">{fmtViews(p.score)} pts</Pill>
                      </div>
                    </div>
                  ))}
                </Card>

                {/* Content ideas generator */}
                <Card style={{ background: "linear-gradient(135deg, rgba(255,45,85,0.08), rgba(10,132,255,0.08))", border: "1px solid rgba(255,45,85,0.2)" }}>
                  <SectionTitle icon="🤖" title="Idées de contenu" sub="Générées depuis les tendances" />
                  {[
                    `POV: ${googleTrends[0]?.keyword || "viral topic"} en 60 secondes`,
                    `Day in my life -- ${upcomingEvents[0]?.name || "trending event"} edition`,
                    `Rating every ${googleTrends[2]?.keyword || "trend"} I tried this week`,
                    `Nobody talks about ${viralKws[0]?.word || "this hack"}`,
                    `${sounds[0]?.sound_name || "Trending sound"} × transformation content`,
                  ].map((idea, i) => (
                    <div key={i} style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 8, background: "rgba(255,255,255,0.04)", fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                      ✦ {idea}
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <div>
                {upcomingEvents.length > 0 && (
                  <Card style={{ marginBottom: 12 }}>
                    <SectionTitle icon="⏳" title="Événements à venir" sub="30 jours -- créez en avance" />
                    {upcomingEvents.map((e, i) => <EventBadge key={i} event={e} />)}
                  </Card>
                )}
                {todayEvents.length > 0 && (
                  <Card>
                    <SectionTitle icon="📖" title="Aujourd'hui dans l'histoire" sub="Via Wikipedia" />
                    {todayEvents.map((e, i) => (
                      <div key={i} style={{ marginBottom: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                          <Pill color={e.type === "holiday" ? "#30d158" : "#0a84ff"}>
                            {e.type === "holiday" ? "🎉 Holiday" : e.type === "birthday" ? "🎂 Birthday" : `📅 ${e.year}`}
                          </Pill>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{e.text}</div>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {/* NEWS TAB */}
            {activeTab === "news" && (
              <div>
                <Card>
                  <SectionTitle icon="📰" title="Actualités créateurs" sub="Sources agrégées en temps réel" />
                  {allNews.map((a, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                      onClick={() => a.url && window.open(a.url, "_blank")}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 4 }}>{a.title}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{a.source}</span>
                        {a.url && <span style={{ fontSize: 10, color: "#0a84ff" }}>→ Read</span>}
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>

          {/* Bottom nav bar */}
          <div style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 420, padding: "10px 16px 20px",
            background: "rgba(8,8,16,0.95)", backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.07)", zIndex: 100
          }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center", letterSpacing: "0.1em" }}>
              TRENDFLOW · 7 SOURCES · AUTO-REFRESH 1H · 0€
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
