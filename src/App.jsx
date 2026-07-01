import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── MOCK DATA ENGINE ───────────────────────────────────────────────────────
const COMPANIES = [
  { name: "Stripe", industry: "Fintech", size: "5,000+", logo: "💳", growth: "+23%", funding: "$600M", hq: "San Francisco, CA" },
  { name: "Notion", industry: "SaaS / Productivity", size: "1,000-5,000", logo: "📝", growth: "+41%", funding: "$340M", hq: "New York, NY" },
  { name: "Figma", industry: "Design Tools", size: "1,000-5,000", logo: "🎨", growth: "+35%", funding: "$330M", hq: "San Francisco, CA" },
  { name: "Datadog", industry: "Cloud Monitoring", size: "5,000+", logo: "🐶", growth: "+28%", funding: "Public", hq: "New York, NY" },
  { name: "Vercel", industry: "Developer Tools", size: "500-1,000", logo: "▲", growth: "+52%", funding: "$250M", hq: "San Francisco, CA" },
  { name: "Linear", industry: "Project Management", size: "100-500", logo: "⚡", growth: "+67%", funding: "$52M", hq: "San Francisco, CA" },
  { name: "Anthropic", industry: "AI / Machine Learning", size: "1,000-5,000", logo: "🧠", growth: "+120%", funding: "$7.3B", hq: "San Francisco, CA" },
  { name: "Supabase", industry: "Developer Tools", size: "100-500", logo: "⚙️", growth: "+89%", funding: "$116M", hq: "Singapore" },
  { name: "Resend", industry: "Email Infrastructure", size: "50-100", logo: "📧", growth: "+145%", funding: "$28M", hq: "San Francisco, CA" },
  { name: "Clerk", industry: "Auth / Identity", size: "100-500", logo: "🔐", growth: "+78%", funding: "$55M", hq: "San Francisco, CA" },
];

const FIRST_NAMES = ["Sarah", "James", "Amira", "Wei", "Carlos", "Priya", "Michael", "Elena", "David", "Fatima", "Alex", "Yuki", "Omar", "Lisa", "Raj", "Nina", "Tom", "Aisha", "Marcus", "Sofia"];
const LAST_NAMES = ["Chen", "Williams", "Patel", "Garcia", "Kim", "Johnson", "Okafor", "Mueller", "Santos", "Tanaka", "Ali", "Anderson", "Nakamura", "Rodriguez", "Singh", "Brown", "Johansson", "Mohammed", "Taylor", "Nguyen"];
const TITLES = ["VP of Engineering", "Head of Sales", "CTO", "Director of Product", "Chief Revenue Officer", "VP of Marketing", "Head of Growth", "Director of Engineering", "CPO", "SVP of Operations", "Head of Partnerships", "Director of Data Science", "VP of Customer Success", "Head of DevRel", "Director of Security"];
const SENIORITY = ["C-Suite", "VP", "Director", "Manager", "Senior"];
const SIGNALS = ["Job Change", "Funding Round", "Hiring Surge", "Product Launch", "Expansion", "Leadership Change", "Tech Stack Change", "IPO Filing"];
const AVATARS = ["👩‍💻", "👨‍💼", "👩‍💼", "👨‍💻", "🧑‍💼", "👩‍🔬", "👨‍🔬", "🧑‍💻"];

function generateLeads(count = 40) {
  const leads = [];
  for (let i = 0; i < count; i++) {
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const title = TITLES[Math.floor(Math.random() * TITLES.length)];
    const seniority = SENIORITY[Math.floor(Math.random() * SENIORITY.length)];
    const signalCount = Math.floor(Math.random() * 3) + 1;
    const leadSignals = [];
    for (let s = 0; s < signalCount; s++) {
      leadSignals.push(SIGNALS[Math.floor(Math.random() * SIGNALS.length)]);
    }
    leads.push({
      id: i + 1,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      title,
      seniority,
      company: company.name,
      companyData: company,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.name.toLowerCase().replace(/\s/g, "")}.com`,
      signals: [...new Set(leadSignals)],
      score: Math.floor(Math.random() * 40) + 60,
      lastActive: `${Math.floor(Math.random() * 24) + 1}h ago`,
      connections: Math.floor(Math.random() * 12) + 1,
      mutualConnections: Math.floor(Math.random() * 5),
      engaged: Math.random() > 0.5,
      saved: false,
      replied: Math.random() > 0.7,
      inSequence: false,
      sequenceStep: 0,
      tags: [],
      notes: "",
      location: company.hq,
      yearsInRole: Math.floor(Math.random() * 5) + 1,
      profileViews: Math.floor(Math.random() * 200) + 10,
    });
  }
  return leads;
}

// ─── ICON COMPONENTS ────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    filter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    building: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>,
    bolt: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    starFilled: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    target: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    layers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    link: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    tag: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    arrowRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    sparkle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    list: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    play: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    pause: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    chevDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
    chevRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
    grid: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    moon: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    sun: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    inbox: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
    workflow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="6" height="6" rx="1"/><rect x="16" y="4" width="6" height="6" rx="1"/><rect x="9" y="14" width="6" height="6" rx="1"/><path d="M8 7h8M5 10v4h4M19 10v4h-4"/></svg>,
  };
  return icons[name] || null;
};

// ─── SCORE BADGE ────────────────────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
  const bg = score >= 85 ? "rgba(16,185,129,0.12)" : score >= 70 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
  return (
    <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
      {score}
    </span>
  );
};

// ─── SIGNAL PILL ────────────────────────────────────────────────────────────
const signalColors = {
  "Job Change": { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
  "Funding Round": { bg: "rgba(16,185,129,0.12)", color: "#34d399" },
  "Hiring Surge": { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  "Product Launch": { bg: "rgba(244,114,182,0.12)", color: "#f472b6" },
  "Expansion": { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  "Leadership Change": { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  "Tech Stack Change": { bg: "rgba(45,212,191,0.12)", color: "#2dd4bf" },
  "IPO Filing": { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
};
const SignalPill = ({ signal }) => {
  const s = signalColors[signal] || { bg: "rgba(255,255,255,0.06)", color: "#aaa" };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{signal}</span>;
};

// ─── MINI SPARKLINE ─────────────────────────────────────────────────────────
const Sparkline = ({ data, color = "#818cf8", width = 80, height = 24 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── NOTIFICATION SYSTEM ────────────────────────────────────────────────────
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: "#10b981", error: "#ef4444", info: "#6366f1" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#1a1a2e", border: `1px solid ${colors[type]}40`, borderRadius: 12,
      padding: "14px 22px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: `0 8px 32px ${colors[type]}20`, animation: "slideUp 0.3s ease",
      fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", fontSize: 14,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[type] }} />
      {message}
    </div>
  );
};

// ─── AI MESSAGE COMPOSER ────────────────────────────────────────────────────
const AIComposer = ({ lead, onClose, addToast }) => {
  const [tone, setTone] = useState("professional");
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  const templates = {
    professional: `Hi ${lead.firstName},\n\nI noticed ${lead.companyData.name} recently ${lead.signals[0]?.toLowerCase() || "made some exciting moves"}. Given your role as ${lead.title}, I'd love to explore how we might collaborate.\n\nWould you be open to a brief conversation this week?\n\nBest regards`,
    casual: `Hey ${lead.firstName}! 👋\n\nSaw some cool things happening at ${lead.companyData.name} — congrats on the ${lead.signals[0]?.toLowerCase() || "growth"}!\n\nWould love to chat about how we could help supercharge what you're building. Free for a quick call?`,
    value: `${lead.firstName},\n\nCompanies in ${lead.companyData.industry} are seeing 3x pipeline growth with our approach. Given ${lead.companyData.name}'s ${lead.signals[0]?.toLowerCase() || "trajectory"}, I put together a brief analysis that might be relevant.\n\nWorth 15 minutes of your time?\n\nBest`,
    referral: `Hi ${lead.firstName},\n\nA mutual connection suggested I reach out. Given your experience leading ${lead.title.toLowerCase().includes("engineering") ? "engineering" : "growth"} at ${lead.companyData.name}, I think there's a strong fit.\n\nI've helped similar teams at ${COMPANIES[Math.floor(Math.random() * 3)].name} achieve remarkable results. Open to connecting?\n\nCheers`,
  };

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setMessage(templates[tone]);
      setGenerating(false);
    }, 800);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#12121f", borderRadius: 20, width: "90%", maxWidth: 620,
        border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#818cf8" }}><Icon name="sparkle" size={20} /></span>
              <span style={{ color: "#f0f0f5", fontWeight: 700, fontSize: 18, fontFamily: "'Space Grotesk', sans-serif" }}>AI Message Composer</span>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><Icon name="x" /></button>
          </div>
          <p style={{ color: "#8888aa", fontSize: 13, margin: "8px 0 0" }}>Crafting message for <strong style={{ color: "#c4b5fd" }}>{lead.name}</strong> at {lead.companyData.name}</p>
        </div>

        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[["professional", "Professional"], ["casual", "Casual"], ["value", "Value-First"], ["referral", "Warm Referral"]].map(([key, label]) => (
              <button key={key} onClick={() => setTone(key)} style={{
                background: tone === key ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${tone === key ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                color: tone === key ? "#a5b4fc" : "#888", borderRadius: 8, padding: "6px 14px",
                cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          <button onClick={generate} disabled={generating} style={{
            width: "100%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
            color: "#fff", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: generating ? 0.7 : 1, marginBottom: 16,
          }}>
            <Icon name="sparkle" size={16} />
            {generating ? "Generating..." : "Generate with AI"}
          </button>

          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Your message will appear here..." style={{
            width: "100%", minHeight: 180, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 14, lineHeight: 1.6,
            resize: "vertical", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ color: "#666", fontSize: 12 }}>{message.length} characters</span>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { addToast("Saved to drafts", "info"); onClose(); }} style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#aaa", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>Save Draft</button>
              <button onClick={() => { addToast("Message sent!", "success"); onClose(); }} style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                color: "#fff", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6,
              }}><Icon name="send" size={14} /> Send InMail</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LEAD DETAIL PANEL ──────────────────────────────────────────────────────
const LeadDetail = ({ lead, onClose, onSave, onAddToSequence, addToast }) => {
  const [tab, setTab] = useState("overview");
  const [notes, setNotes] = useState(lead.notes);
  const [showComposer, setShowComposer] = useState(false);
  const sparkData = Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 20);

  return (
    <>
      {showComposer && <AIComposer lead={lead} onClose={() => setShowComposer(false)} addToast={addToast} />}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 90vw)", zIndex: 900,
        background: "#0d0d1a", borderLeft: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto", boxShadow: "-12px 0 48px rgba(0,0,0,0.5)", animation: "slideIn 0.3s ease",
      }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
              }}>{lead.avatar}</div>
              <div>
                <h2 style={{ color: "#f0f0f5", margin: 0, fontSize: 20, fontFamily: "'Space Grotesk', sans-serif" }}>{lead.name}</h2>
                <p style={{ color: "#8888aa", margin: "2px 0", fontSize: 14 }}>{lead.title}</p>
                <p style={{ color: "#6366f1", margin: 0, fontSize: 13, fontWeight: 600 }}>{lead.companyData.logo} {lead.company}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4 }}><Icon name="x" /></button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={() => setShowComposer(true)} style={{
              flex: 1, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
              color: "#fff", padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}><Icon name="mail" size={14} /> Message</button>
            <button onClick={() => { onSave(lead.id); addToast(lead.saved ? "Removed from saved" : "Lead saved!", lead.saved ? "info" : "success"); }} style={{
              flex: 1, background: lead.saved ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${lead.saved ? "#fbbf24" : "rgba(255,255,255,0.08)"}`,
              color: lead.saved ? "#fbbf24" : "#aaa", padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}><Icon name={lead.saved ? "starFilled" : "star"} size={14} /> {lead.saved ? "Saved" : "Save"}</button>
            <button onClick={() => { onAddToSequence(lead.id); addToast("Added to sequence", "success"); }} style={{
              flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#aaa", padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}><Icon name="bolt" size={14} /> Sequence</button>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {["overview", "activity", "notes"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, background: "none", border: "none", borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
              color: tab === t ? "#c4b5fd" : "#666", padding: "12px", cursor: "pointer",
              fontSize: 13, fontWeight: 600, textTransform: "capitalize", transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding: "20px 28px" }}>
          {tab === "overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Lead Score", value: <ScoreBadge score={lead.score} /> },
                  { label: "Seniority", value: lead.seniority },
                  { label: "Location", value: lead.location },
                  { label: "Years in Role", value: `${lead.yearsInRole}y` },
                  { label: "Mutual Connections", value: lead.mutualConnections },
                  { label: "Profile Views", value: lead.profileViews },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 16px" }}>
                    <div style={{ color: "#666", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                    <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginTop: 4 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Engagement Trend</div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16 }}>
                  <Sparkline data={sparkData} width={420} height={40} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Active Signals</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {lead.signals.map((s, i) => <SignalPill key={i} signal={s} />)}
                </div>
              </div>

              <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 12, padding: 16, border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Icon name="sparkle" size={16} />
                  <span style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 700 }}>AI Insight</span>
                </div>
                <p style={{ color: "#c4b5fd", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {lead.firstName} has been actively engaging with content related to {lead.companyData.industry.toLowerCase()}.
                  Their company recently showed {lead.signals[0]?.toLowerCase()} signals. Best time to reach out: <strong>Tuesday-Thursday, 9-11 AM</strong> based on their activity patterns.
                </p>
              </div>
            </>
          )}

          {tab === "activity" && (
            <div>
              {[
                { time: "2h ago", event: "Viewed your profile", icon: "eye" },
                { time: "1d ago", event: "Liked a post about AI automation", icon: "star" },
                { time: "3d ago", event: "Changed job title", icon: "trending" },
                { time: "1w ago", event: "Company announced funding round", icon: "bolt" },
                { time: "2w ago", event: "Connected with 3 mutual contacts", icon: "link" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", flexShrink: 0 }}>
                    <Icon name={a.icon} size={16} />
                  </div>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: 14 }}>{a.event}</div>
                    <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "notes" && (
            <div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this lead..." style={{
                width: "100%", minHeight: 200, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 14, lineHeight: 1.6,
                resize: "vertical", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
              }} />
              <button onClick={() => addToast("Notes saved", "success")} style={{
                marginTop: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                color: "#fff", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}>Save Notes</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── SEQUENCE BUILDER ───────────────────────────────────────────────────────
const SequenceBuilder = ({ leads, onClose, addToast }) => {
  const [steps, setSteps] = useState([
    { type: "email", delay: 0, subject: "Introduction", template: "professional" },
    { type: "linkedin", delay: 2, subject: "Connection Request", template: "casual" },
    { type: "email", delay: 5, subject: "Follow Up", template: "value" },
    { type: "linkedin", delay: 8, subject: "Value Share", template: "value" },
    { type: "email", delay: 12, subject: "Final Touch", template: "casual" },
  ]);
  const sequenceLeads = leads.filter(l => l.inSequence);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#12121f", borderRadius: 20, width: "90%", maxWidth: 700, maxHeight: "85vh", overflow: "auto",
        border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "#12121f", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#818cf8" }}><Icon name="workflow" size={22} /></span>
              <span style={{ color: "#f0f0f5", fontWeight: 700, fontSize: 18, fontFamily: "'Space Grotesk', sans-serif" }}>Sequence Builder</span>
              <span style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {sequenceLeads.length} leads
              </span>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><Icon name="x" /></button>
          </div>
        </div>

        <div style={{ padding: "20px 28px" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: step.type === "email" ? "rgba(99,102,241,0.15)" : "rgba(59,130,246,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: step.type === "email" ? "#818cf8" : "#60a5fa",
                }}>
                  <Icon name={step.type === "email" ? "mail" : "link"} size={18} />
                </div>
                {i < steps.length - 1 && <div style={{ width: 2, height: 32, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />}
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>{step.subject}</span>
                    <span style={{ color: "#666", fontSize: 12, marginLeft: 10 }}>
                      {step.delay === 0 ? "Immediately" : `Day ${step.delay}`}
                    </span>
                  </div>
                  <span style={{ color: "#666", fontSize: 11, textTransform: "uppercase", fontWeight: 700 }}>{step.type}</span>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => {
            setSteps([...steps, { type: "email", delay: steps[steps.length-1].delay + 3, subject: "New Step", template: "professional" }]);
          }} style={{
            width: "100%", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)",
            color: "#666", padding: "12px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8,
          }}><Icon name="plus" size={14} /> Add Step</button>

          <button onClick={() => { addToast(`Sequence launched for ${sequenceLeads.length} leads!`, "success"); onClose(); }} style={{
            width: "100%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
            color: "#fff", padding: "14px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 700, marginTop: 20,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}><Icon name="play" size={16} /> Launch Sequence</button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [leads, setLeads] = useState(() => generateLeads(40));
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("leads");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [filters, setFilters] = useState({ seniority: [], industry: [], signals: [], minScore: 0 });
  const [sortBy, setSortBy] = useState("score");
  const [viewMode, setViewMode] = useState("list");
  const [commandOpen, setCommandOpen] = useState(false);
  const searchRef = useRef(null);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleFilter = (key, value) => {
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value],
    }));
  };

  const toggleSave = (id) => setLeads(l => l.map(x => x.id === id ? { ...x, saved: !x.saved } : x));
  const addToSequence = (id) => setLeads(l => l.map(x => x.id === id ? { ...x, inSequence: true } : x));

  const filteredLeads = useMemo(() => {
    let result = leads.filter(l => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.company.toLowerCase().includes(search.toLowerCase()) && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.seniority.length && !filters.seniority.includes(l.seniority)) return false;
      if (filters.industry.length && !filters.industry.includes(l.companyData.industry)) return false;
      if (filters.signals.length && !filters.signals.some(s => l.signals.includes(s))) return false;
      if (l.score < filters.minScore) return false;
      return true;
    });
    if (activeView === "saved") result = result.filter(l => l.saved);
    if (activeView === "sequences") result = result.filter(l => l.inSequence);
    result.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "company") return a.company.localeCompare(b.company);
      return 0;
    });
    return result;
  }, [leads, search, filters, activeView, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    saved: leads.filter(l => l.saved).length,
    inSequence: leads.filter(l => l.inSequence).length,
    avgScore: Math.round(leads.reduce((a, b) => a + b.score, 0) / leads.length),
    hotLeads: leads.filter(l => l.score >= 85).length,
    engaged: leads.filter(l => l.engaged).length,
  }), [leads]);

  return (
    <div style={{ minHeight: "100vh", background: "#090914", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input:focus, textarea:focus { border-color: #6366f1 !important; outline: none; }
        button { font-family: 'DM Sans', sans-serif; transition: all 0.15s ease; }
        button:hover { filter: brightness(1.15); }
        button:active { transform: scale(0.98); }
      `}</style>

      {/* ─── TOASTS ─── */}
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}

      {/* ─── LEAD DETAIL ─── */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={toggleSave}
          onAddToSequence={addToSequence}
          addToast={addToast}
        />
      )}

      {/* ─── SEQUENCE BUILDER ─── */}
      {showSequence && <SequenceBuilder leads={leads} onClose={() => setShowSequence(false)} addToast={addToast} />}

      {/* ─── HEADER ─── */}
      <header style={{
        background: "rgba(9,9,20,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px",
        position: "sticky", top: 0, zIndex: 800, height: 64, display: "flex", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 40 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff",
          }}>P</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#f0f0f5", letterSpacing: "-0.02em" }}>
            ProspectIQ
          </span>
          <span style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: "0.05em" }}>PRO</span>
        </div>

        <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
          <Icon name="search" size={16} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads, companies, or titles..."
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "9px 16px 9px 36", color: "#e2e8f0", fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 6,
            fontSize: 11, color: "#666", fontFamily: "'JetBrains Mono', monospace",
          }}>⌘K</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowSequence(true)} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#aaa", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}><Icon name="workflow" size={15} /> Sequences</button>
          <button style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 6, position: "relative" }}>
            <Icon name="bell" />
            <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
          </button>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #34d399)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
          }}>Y</div>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        {/* ─── SIDEBAR ─── */}
        <nav style={{
          width: 240, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 12px", flexShrink: 0, display: "flex", flexDirection: "column",
        }}>
          {[
            { id: "leads", icon: "target", label: "Lead Discovery", count: stats.total },
            { id: "saved", icon: "star", label: "Saved Leads", count: stats.saved },
            { id: "sequences", icon: "bolt", label: "Active Sequences", count: stats.inSequence },
            { id: "accounts", icon: "building", label: "Accounts", count: COMPANIES.length },
            { id: "analytics", icon: "chart", label: "Analytics" },
            { id: "inbox", icon: "inbox", label: "Smart Inbox", badge: 3 },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
              background: activeView === item.id ? "rgba(99,102,241,0.1)" : "transparent",
              border: "none", color: activeView === item.id ? "#a5b4fc" : "#777", cursor: "pointer",
              width: "100%", textAlign: "left", fontSize: 14, fontWeight: 500, marginBottom: 2, position: "relative",
            }}>
              <Icon name={item.icon} size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count !== undefined && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>{item.count}</span>
              )}
              {item.badge && (
                <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>{item.badge}</span>
              )}
            </button>
          ))}

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
            <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))", borderRadius: 14, padding: 16, border: "1px solid rgba(99,102,241,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Icon name="sparkle" size={14} />
                <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700 }}>AI Credits</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ color: "#c4b5fd", fontSize: 24, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>847</span>
                <span style={{ color: "#666", fontSize: 12 }}>/ 1,000</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 4, marginTop: 8 }}>
                <div style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)", width: "84.7%", height: "100%", borderRadius: 4 }} />
              </div>
            </div>
          </div>
        </nav>

        {/* ─── MAIN CONTENT ─── */}
        <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>

          {/* ─── ANALYTICS VIEW ─── */}
          {activeView === "analytics" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#f0f0f5", marginBottom: 24 }}>Pipeline Analytics</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Response Rate", value: "34%", change: "+8%", color: "#10b981", sparkData: [20,25,22,30,28,34] },
                  { label: "Meetings Booked", value: "23", change: "+12%", color: "#6366f1", sparkData: [10,12,15,18,20,23] },
                  { label: "Pipeline Value", value: "$142K", change: "+24%", color: "#f59e0b", sparkData: [50,65,70,90,110,142] },
                  { label: "Avg. Deal Cycle", value: "18 days", change: "-3 days", color: "#8b5cf6", sparkData: [28,25,22,20,19,18] },
                ].map((m, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                      <span style={{ color: "#f0f0f5", fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>{m.value}</span>
                      <span style={{ color: m.color, fontSize: 13, fontWeight: 700 }}>{m.change}</span>
                    </div>
                    <div style={{ marginTop: 12 }}><Sparkline data={m.sparkData} color={m.color} width={160} height={30} /></div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#f0f0f5", marginBottom: 16 }}>Outreach Performance</h3>
                <div style={{ display: "flex", gap: 4, alignItems: "end", height: 160 }}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                    const h = [65, 85, 72, 95, 80, 30, 20][i];
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: "100%", height: h * 1.5, borderRadius: "8px 8px 4px 4px",
                          background: `linear-gradient(180deg, rgba(99,102,241,${0.3 + h / 200}), rgba(99,102,241,0.1))`,
                          border: "1px solid rgba(99,102,241,0.2)", transition: "all 0.3s",
                        }} />
                        <span style={{ color: "#666", fontSize: 11, fontWeight: 600 }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#f0f0f5", marginBottom: 16 }}>Top Performing Signals</h3>
                  {[
                    { signal: "Job Change", rate: "42%", bar: 84 },
                    { signal: "Funding Round", rate: "38%", bar: 76 },
                    { signal: "Hiring Surge", rate: "31%", bar: 62 },
                    { signal: "Product Launch", rate: "27%", bar: 54 },
                  ].map((s, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#ccc", fontSize: 13 }}>{s.signal}</span>
                        <span style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 700 }}>{s.rate}</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6 }}>
                        <div style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)", width: `${s.bar}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#f0f0f5", marginBottom: 16 }}>Lead Score Distribution</h3>
                  {[
                    { range: "90-100", count: stats.hotLeads, color: "#10b981" },
                    { range: "75-89", count: leads.filter(l => l.score >= 75 && l.score < 90).length, color: "#6366f1" },
                    { range: "60-74", count: leads.filter(l => l.score >= 60 && l.score < 75).length, color: "#f59e0b" },
                  ].map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 4, background: d.color }} />
                      <span style={{ color: "#ccc", fontSize: 13, width: 60 }}>{d.range}</span>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6 }}>
                        <div style={{ background: d.color, width: `${(d.count / leads.length) * 100}%`, height: "100%", borderRadius: 4 }} />
                      </div>
                      <span style={{ color: "#888", fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", width: 30, textAlign: "right" }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── ACCOUNTS VIEW ─── */}
          {activeView === "accounts" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#f0f0f5", marginBottom: 24 }}>Target Accounts</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {COMPANIES.map((c, i) => {
                  const companyLeads = leads.filter(l => l.company === c.name);
                  return (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 20,
                      border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s",
                    }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontSize: 28 }}>{c.logo}</span>
                          <div>
                            <div style={{ color: "#f0f0f5", fontWeight: 700, fontSize: 16, fontFamily: "'Space Grotesk', sans-serif" }}>{c.name}</div>
                            <div style={{ color: "#888", fontSize: 12 }}>{c.industry}</div>
                          </div>
                        </div>
                        <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700 }}>{c.growth}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "#666", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Size</div>
                          <div style={{ color: "#ccc", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{c.size}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "#666", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Funding</div>
                          <div style={{ color: "#ccc", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{c.funding}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "#666", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Leads</div>
                          <div style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{companyLeads.length}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <Sparkline data={Array.from({ length: 8 }, () => Math.floor(Math.random() * 80) + 20)} color="#818cf8" width={260} height={28} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── INBOX VIEW ─── */}
          {activeView === "inbox" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#f0f0f5", marginBottom: 24 }}>Smart Inbox</h2>
              {[
                { from: "Sarah Chen", company: "Stripe", subject: "Re: Partnership Opportunity", preview: "Thanks for reaching out! I'd love to schedule a call...", time: "2h ago", unread: true, avatar: "👩‍💻" },
                { from: "James Williams", company: "Notion", subject: "Following up on our chat", preview: "Great speaking with you yesterday. Here are the materials...", time: "5h ago", unread: true, avatar: "👨‍💼" },
                { from: "Amira Patel", company: "Figma", subject: "Introduction from mutual contact", preview: "Hi! David mentioned you might be a great person to...", time: "1d ago", unread: false, avatar: "👩‍💼" },
                { from: "Wei Garcia", company: "Datadog", subject: "Interested in learning more", preview: "Your message caught my attention. We're currently evaluating...", time: "2d ago", unread: false, avatar: "👨‍💻" },
              ].map((msg, i) => (
                <div key={i} style={{
                  display: "flex", gap: 16, padding: "18px 20px", marginBottom: 2,
                  background: msg.unread ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.02)",
                  borderRadius: 14, border: `1px solid ${msg.unread ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)"}`,
                  cursor: "pointer", transition: "all 0.2s",
                }} onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = msg.unread ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.02)"}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: "rgba(99,102,241,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
                  }}>{msg.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#f0f0f5", fontWeight: msg.unread ? 700 : 500, fontSize: 14 }}>{msg.from}</span>
                        <span style={{ color: "#666", fontSize: 12 }}>at {msg.company}</span>
                        {msg.unread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1" }} />}
                      </div>
                      <span style={{ color: "#666", fontSize: 12 }}>{msg.time}</span>
                    </div>
                    <div style={{ color: "#ccc", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{msg.subject}</div>
                    <div style={{ color: "#777", fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.preview}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── LEADS VIEW ─── */}
          {(activeView === "leads" || activeView === "saved" || activeView === "sequences") && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Stats Bar */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Total Leads", value: stats.total, icon: "target", color: "#6366f1" },
                  { label: "Hot Leads", value: stats.hotLeads, icon: "bolt", color: "#ef4444" },
                  { label: "Avg Score", value: stats.avgScore, icon: "chart", color: "#10b981" },
                  { label: "Saved", value: stats.saved, icon: "star", color: "#f59e0b" },
                  { label: "In Sequence", value: stats.inSequence, icon: "play", color: "#8b5cf6" },
                  { label: "Engaged", value: stats.engaged, icon: "trending", color: "#2dd4bf" },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "14px 16px",
                    border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                      <Icon name={s.icon} size={18} />
                    </div>
                    <div>
                      <div style={{ color: "#f0f0f5", fontSize: 20, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                      <div style={{ color: "#666", fontSize: 11, fontWeight: 600 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setShowFilters(!showFilters)} style={{
                    background: showFilters ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${showFilters ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                    color: showFilters ? "#a5b4fc" : "#aaa", padding: "8px 14px", borderRadius: 10,
                    cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                  }}><Icon name="filter" size={14} /> Filters
                    {(filters.seniority.length + filters.industry.length + filters.signals.length > 0) && (
                      <span style={{ background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 800, padding: "0 6px", borderRadius: 10 }}>
                        {filters.seniority.length + filters.industry.length + filters.signals.length}
                      </span>
                    )}
                  </button>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#aaa", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer", appearance: "none", paddingRight: 30,
                  }}>
                    <option value="score">Sort: Score</option>
                    <option value="name">Sort: Name</option>
                    <option value="company">Sort: Company</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#666", fontSize: 13 }}>{filteredLeads.length} results</span>
                  <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button onClick={() => setViewMode("list")} style={{
                      background: viewMode === "list" ? "rgba(99,102,241,0.15)" : "transparent", border: "none",
                      color: viewMode === "list" ? "#a5b4fc" : "#666", padding: "6px 10px", cursor: "pointer", borderRadius: "7px 0 0 7px",
                    }}><Icon name="list" size={16} /></button>
                    <button onClick={() => setViewMode("grid")} style={{
                      background: viewMode === "grid" ? "rgba(99,102,241,0.15)" : "transparent", border: "none",
                      color: viewMode === "grid" ? "#a5b4fc" : "#666", padding: "6px 10px", cursor: "pointer", borderRadius: "0 7px 7px 0",
                    }}><Icon name="grid" size={16} /></button>
                  </div>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div style={{
                  background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 20, marginBottom: 16,
                  border: "1px solid rgba(255,255,255,0.06)", animation: "slideUp 0.2s ease",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                    <div>
                      <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Seniority</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {SENIORITY.map(s => (
                          <button key={s} onClick={() => toggleFilter("seniority", s)} style={{
                            background: filters.seniority.includes(s) ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${filters.seniority.includes(s) ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                            color: filters.seniority.includes(s) ? "#a5b4fc" : "#888", padding: "4px 12px", borderRadius: 8,
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Industry</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[...new Set(COMPANIES.map(c => c.industry))].map(ind => (
                          <button key={ind} onClick={() => toggleFilter("industry", ind)} style={{
                            background: filters.industry.includes(ind) ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${filters.industry.includes(ind) ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                            color: filters.industry.includes(ind) ? "#a5b4fc" : "#888", padding: "4px 12px", borderRadius: 8,
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                          }}>{ind}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Signals</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {SIGNALS.map(s => (
                          <button key={s} onClick={() => toggleFilter("signals", s)} style={{
                            background: filters.signals.includes(s) ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${filters.signals.includes(s) ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                            color: filters.signals.includes(s) ? "#a5b4fc" : "#888", padding: "4px 12px", borderRadius: 8,
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: "#888", fontSize: 12 }}>Min Score: {filters.minScore}</span>
                      <input type="range" min={0} max={95} value={filters.minScore} onChange={e => setFilters(f => ({ ...f, minScore: parseInt(e.target.value) }))}
                        style={{ width: 160, accentColor: "#6366f1" }} />
                    </div>
                    <button onClick={() => setFilters({ seniority: [], industry: [], signals: [], minScore: 0 })} style={{
                      background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}>Clear All Filters</button>
                  </div>
                </div>
              )}

              {/* Lead List */}
              {viewMode === "list" ? (
                <div>
                  {filteredLeads.map((lead, i) => (
                    <div key={lead.id} onClick={() => setSelectedLead(lead)} style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", marginBottom: 2,
                      background: "rgba(255,255,255,0.02)", borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "all 0.15s",
                      animation: `fadeIn ${0.1 + i * 0.02}s ease`,
                    }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, background: "rgba(99,102,241,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
                      }}>{lead.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#f0f0f5", fontWeight: 600, fontSize: 14 }}>{lead.name}</span>
                          {lead.saved && <span style={{ color: "#fbbf24" }}><Icon name="starFilled" size={12} /></span>}
                          {lead.inSequence && <span style={{ color: "#8b5cf6" }}><Icon name="bolt" size={12} /></span>}
                        </div>
                        <div style={{ color: "#888", fontSize: 12, marginTop: 1 }}>{lead.title} at <span style={{ color: "#a5b4fc" }}>{lead.company}</span></div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", maxWidth: 220, justifyContent: "flex-end" }}>
                        {lead.signals.slice(0, 2).map((s, j) => <SignalPill key={j} signal={s} />)}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right", minWidth: 80 }}>
                        <ScoreBadge score={lead.score} />
                        <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>{lead.lastActive}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleSave(lead.id); addToast(lead.saved ? "Removed" : "Saved!", lead.saved ? "info" : "success"); }} style={{
                        background: "none", border: "none", color: lead.saved ? "#fbbf24" : "#444", cursor: "pointer", padding: 4, flexShrink: 0,
                      }}><Icon name={lead.saved ? "starFilled" : "star"} size={16} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {filteredLeads.map((lead, i) => (
                    <div key={lead.id} onClick={() => setSelectedLead(lead)} style={{
                      background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 20,
                      border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s",
                      animation: `fadeIn ${0.1 + i * 0.03}s ease`,
                    }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                          }}>{lead.avatar}</div>
                          <div>
                            <div style={{ color: "#f0f0f5", fontWeight: 700, fontSize: 14 }}>{lead.name}</div>
                            <div style={{ color: "#888", fontSize: 12 }}>{lead.seniority}</div>
                          </div>
                        </div>
                        <ScoreBadge score={lead.score} />
                      </div>
                      <div style={{ color: "#aaa", fontSize: 13, marginTop: 12 }}>{lead.title}</div>
                      <div style={{ color: "#6366f1", fontSize: 13, fontWeight: 600, marginTop: 2 }}>{lead.companyData.logo} {lead.company}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                        {lead.signals.map((s, j) => <SignalPill key={j} signal={s} />)}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ color: "#555", fontSize: 12 }}>{lead.lastActive}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={e => { e.stopPropagation(); toggleSave(lead.id); }} style={{
                            background: "none", border: "none", color: lead.saved ? "#fbbf24" : "#444", cursor: "pointer", padding: 2,
                          }}><Icon name={lead.saved ? "starFilled" : "star"} size={14} /></button>
                          <button onClick={e => { e.stopPropagation(); addToSequence(lead.id); addToast("Added to sequence", "success"); }} style={{
                            background: "none", border: "none", color: lead.inSequence ? "#8b5cf6" : "#444", cursor: "pointer", padding: 2,
                          }}><Icon name="bolt" size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredLeads.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <div style={{ color: "#888", fontSize: 16, fontWeight: 600 }}>No leads match your criteria</div>
                  <div style={{ color: "#555", fontSize: 14, marginTop: 4 }}>Try adjusting your filters or search terms</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
