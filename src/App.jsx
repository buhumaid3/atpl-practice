import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plane, BookOpen, Flag, ChevronRight, ChevronLeft,
  Clock, CheckCircle, XCircle, SkipForward, Home,
  BarChart3, Bookmark, BookmarkCheck, ArrowRight,
  Target, Zap, TrendingUp, RotateCcw, X
} from "lucide-react";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const SUBJECTS = [
  { code: "ALL",  name: "All Subjects",  short: "ALL",  color: "#3B9EFF", bg: "#0F2040", count: 2380 },
  { code: "010",  name: "Air Law",       short: "010",  color: "#FF6B6B", bg: "#2A1010", count: 1274 },
  { code: "031",  name: "Mass & Balance",short: "031",  color: "#4ECDC4", bg: "#0A2422", count: 400  },
  { code: "032",  name: "Performance",   short: "032",  color: "#FFD93D", bg: "#2A2000", count: 706  },
];

const T = {
  bg:      "#09090B",
  panel:   "#0F1014",
  card:    "#131318",
  border:  "#1C1C22",
  borderHi:"#2A2A35",
  text:    "#F0F0F5",
  sub:     "#8888A0",
  dim:     "#444455",
  blue:    "#3B9EFF",
  green:   "#22C55E",
  red:     "#EF4444",
  amber:   "#F59E0B",
  white:   "#FFFFFF",
};

async function fetchQ(code, limit = 2500) {
  let url = `${SUPABASE_URL}/rest/v1/questions?select=*&limit=${limit}&order=id`;
  if (code !== "ALL") url += `&subject_code=eq.${code}`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  return r.json();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function fmt(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

function clean(t) {
  if (!t) return "";
  return t.replace(/^(N[°v"'`]+\s*\d+\s*[@©]?\s*[\d:]*\s*)/i,"")
          .replace(/^(Q\s+\d+\/\d+\s+N[°v"'`]+\s*\d+\s*[@©]?\s*[\d:]*\s*)/i,"")
          .replace(/^(—\s*QUESTIGN?.*?[\d:]+\s*)/i,"")
          .trim();
}

// Artificial Horizon SVG Component
function Horizon({ pitch = 0, roll = 0, size = 120 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.46;
  const pitchPx = (pitch / 30) * r;
  const sinR = Math.sin((roll * Math.PI) / 180);
  const cosR = Math.cos((roll * Math.PI) / 180);
  const dx = sinR * r * 1.5, dy = -cosR * r * 1.5;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <defs>
        <clipPath id="horizon-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A3A6B" />
          <stop offset="100%" stopColor="#2E5FA3" />
        </linearGradient>
        <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C3A1E" />
          <stop offset="100%" stopColor="#3D2610" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x={cx-r*2} y={cy-r*2} width={r*4} height={r*4} fill="url(#sky-grad)" clipPath="url(#horizon-clip)" />

      {/* Ground - rotated horizon line */}
      <g clipPath="url(#horizon-clip)" transform={`rotate(${roll} ${cx} ${cy})`}>
        <rect x={cx-r*2} y={cy+pitchPx} width={r*4} height={r*4} fill="url(#ground-grad)" />
        {/* Horizon line */}
        <line x1={cx-r*2} y1={cy+pitchPx} x2={cx+r*2} y2={cy+pitchPx} stroke="#4ECDC4" strokeWidth="1.5" opacity="0.8" />
        {/* Pitch marks */}
        {[-20,-10,10,20].map(p => (
          <g key={p}>
            <line
              x1={cx-12} y1={cy+pitchPx+(p/30)*r}
              x2={cx+12} y2={cy+pitchPx+(p/30)*r}
              stroke="rgba(255,255,255,0.3)" strokeWidth="1"
            />
          </g>
        ))}
      </g>

      {/* Fixed aircraft symbol */}
      <g transform={`translate(${cx},${cy})`}>
        <line x1="-20" y1="0" x2="-8" y2="0" stroke="#FFD93D" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8"  y1="0" x2="20"  y2="0" stroke="#FFD93D" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="0" cy="0" r="3" fill="#FFD93D" />
        <line x1="0" y1="-6" x2="0" y2="-12" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Roll arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.borderHi} strokeWidth="1" />

      {/* Roll marker */}
      <g transform={`rotate(${roll} ${cx} ${cy})`}>
        <polygon points={`${cx},${cy-r+2} ${cx-5},${cy-r+10} ${cx+5},${cy-r+10}`} fill="#FFD93D" opacity="0.8" />
      </g>
    </svg>
  );
}

// Animated counter
function Counter({ value, color = T.text, size = 28 }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDisplay(value), 150);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span style={{
      fontSize: size, fontWeight: "800", color,
      fontVariantNumeric: "tabular-nums",
      transition: "color 0.3s",
    }}>{display}</span>
  );
}

// Progress ring
function ProgressRing({ pct, size = 56, stroke = 4, color = T.blue }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen,     setScreen]     = useState("home");
  const [subject,    setSubject]    = useState("ALL");
  const [sessLen,    setSessLen]    = useState(20);
  const [queue,      setQueue]      = useState([]);
  const [idx,        setIdx]        = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [revealed,   setRevealed]   = useState(false);
  const [tab,        setTab]        = useState("question");
  const [score,      setScore]      = useState({ correct:0, wrong:0, skipped:0 });
  const [answers,    setAnswers]    = useState({});
  const [flagged,    setFlagged]    = useState(new Set());
  const [loading,    setLoading]    = useState(false);
  const [sSec,       setSSec]       = useState(0);
  const [qSec,       setQSec]       = useState(0);
  const [qTimes,     setQTimes]     = useState({});
  const [horizonAnim,setHorizonAnim]= useState({ pitch: 0, roll: 0 });
  const sRef = useRef(null), qRef = useRef(null), hRef = useRef(null);

  // Animate horizon on home screen
  useEffect(() => {
    if (screen === "home") {
      let t = 0;
      hRef.current = setInterval(() => {
        t += 0.02;
        setHorizonAnim({
          pitch: Math.sin(t * 0.7) * 6,
          roll: Math.sin(t * 0.4) * 8,
        });
      }, 50);
      return () => clearInterval(hRef.current);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "practice") {
      sRef.current = setInterval(() => setSSec(s => s+1), 1000);
      return () => clearInterval(sRef.current);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "practice") {
      setQSec(0);
      clearInterval(qRef.current);
      qRef.current = setInterval(() => setQSec(s => s+1), 1000);
      return () => clearInterval(qRef.current);
    }
  }, [idx, screen]);

  const startSession = useCallback(async (reviewFlagged = false) => {
    setLoading(true);
    const data = await fetchQ(subject);
    const valid = data.filter(q => q.correct_answer && q.option_a);
    let pool = reviewFlagged
      ? valid.filter(q => flagged.has(q.id))
      : shuffle(valid).slice(0, sessLen);
    if (!pool.length) pool = shuffle(valid).slice(0, sessLen);
    setQueue(pool); setIdx(0); setSelected(null); setRevealed(false);
    setTab("question"); setScore({correct:0,wrong:0,skipped:0});
    setAnswers({}); setSSec(0); setQSec(0); setQTimes({});
    setLoading(false); setScreen("practice");
  }, [subject, sessLen, flagged]);

  const q       = queue[idx];
  const opts    = q ? [q.option_a,q.option_b,q.option_c,q.option_d].filter(Boolean) : [];
  const correct = q?.correct_answer;
  const subInfo = SUBJECTS.find(s => s.code === (q?.subject_code || subject)) || SUBJECTS[0];
  const isFlagged = q && flagged.has(q.id);
  const pct = queue.length ? Math.round((idx / queue.length) * 100) : 0;
  const labels = ["A","B","C","D"];

  function pick(opt) {
    if (revealed) return;
    setSelected(opt); setRevealed(true);
    const ok = opt === correct;
    setScore(s => ({...s, [ok?"correct":"wrong"]: s[ok?"correct":"wrong"]+1}));
    setAnswers(a => ({...a, [idx]: {selected:opt, correct:ok}}));
    setQTimes(t => ({...t, [idx]: qSec}));
    clearInterval(qRef.current);
  }

  function skip() {
    if (revealed) return;
    setScore(s => ({...s, skipped: s.skipped+1}));
    setAnswers(a => ({...a, [idx]: {selected:null, correct:false}}));
    setQTimes(t => ({...t, [idx]: qSec}));
    goNext();
  }

  function goNext() {
    if (idx+1 >= queue.length) {
      clearInterval(sRef.current); clearInterval(qRef.current);
      setScreen("result");
    } else {
      setIdx(i => i+1); setSelected(null); setRevealed(false); setTab("question");
    }
  }

  function toggleFlag() {
    if (!q) return;
    setFlagged(f => { const n = new Set(f); n.has(q.id)?n.delete(q.id):n.add(q.id); return n; });
  }

  function exitPractice() {
    clearInterval(sRef.current); clearInterval(qRef.current);
    setScreen("home");
  }

  const avgTime = Object.values(qTimes).length
    ? Math.round(Object.values(qTimes).reduce((a,b)=>a+b,0)/Object.values(qTimes).length)
    : 0;

  const scorePct = (score.correct + score.wrong + score.skipped) > 0
    ? Math.round((score.correct / (score.correct + score.wrong + score.skipped)) * 100)
    : 0;

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Inter',-apple-system,sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2A2A35; border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .hover-card:hover { border-color: #2A2A35 !important; background: #161620 !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding:"16px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:T.panel }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#1A3A6B,#2E5FA3)", display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid #3B9EFF40` }}>
            <Plane size={16} color={T.blue} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.2px" }}>ATPL Practice</div>
            <div style={{ fontSize:11, color:T.sub }}>Aviation Exam Preparation</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          {flagged.size > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:6, background:T.card, border:`1px solid ${T.border}` }}>
              <Bookmark size={13} color={T.amber} />
              <span style={{ fontSize:12, color:T.amber, fontWeight:600 }}>{flagged.size}</span>
            </div>
          )}
          <div style={{ fontSize:12, color:T.sub }}>2,380 questions</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ flex:1, maxWidth:760, margin:"0 auto", width:"100%", padding:"32px 24px" }}>

        <div style={{ display:"flex", alignItems:"center", gap:32, marginBottom:40, padding:"32px", borderRadius:16, background:T.card, border:`1px solid ${T.border}`, animation:"fadeUp 0.4s ease" }}>
          <div style={{ flexShrink:0, position:"relative" }}>
            <div style={{ position:"absolute", inset:-8, borderRadius:"50%", background:"radial-gradient(circle,#1A3A6B40,transparent)", pointerEvents:"none" }} />
            <Horizon pitch={horizonAnim.pitch} roll={horizonAnim.roll} size={120} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:"2px", textTransform:"uppercase", color:T.blue, marginBottom:10 }}>Preflight Check</div>
            <h1 style={{ fontSize:28, fontWeight:800, lineHeight:1.15, letterSpacing:"-0.5px", marginBottom:8 }}>
              Ready for your<br />ATPL exam?
            </h1>
            <p style={{ fontSize:14, color:T.sub, lineHeight:1.65 }}>
              Practice with real exam questions sourced directly from the Aviation Exam database. Track every session.
            </p>
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:T.sub, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
            <Target size={12} color={T.sub} />
            Select Subject
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {SUBJECTS.map(s => {
              const active = subject === s.code;
              return (
                <div key={s.code} onClick={() => setSubject(s.code)}
                  className="hover-card"
                  style={{
                    padding:"16px 18px", borderRadius:12, cursor:"pointer",
                    border:`1px solid ${active ? s.color+"50" : T.border}`,
                    background: active ? s.bg : T.card,
                    transition:"all 0.2s",
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:active ? s.color : T.dim, marginTop:3, transition:"background 0.2s" }} />
                    <span style={{ fontSize:11, color:T.sub }}>{s.count.toLocaleString()} Q</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color: active ? s.color : T.text, transition:"color 0.2s" }}>{s.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session length */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:T.sub, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
            <Zap size={12} color={T.sub} />
            Session Length
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {[10,20,40,60].map(n => (
              <button key={n} onClick={() => setSessLen(n)} style={{
                flex:1, padding:"11px 0", borderRadius:10, cursor:"pointer",
                border:`1px solid ${sessLen===n ? T.blue+"60" : T.border}`,
                background: sessLen===n ? "#0F2040" : T.card,
                color: sessLen===n ? T.blue : T.sub,
                fontSize:14, fontWeight:700,
                transition:"all 0.2s",
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={() => startSession(false)} disabled={loading} style={{
          width:"100%", padding:"16px", borderRadius:12, cursor:"pointer",
          background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",
          border:`1px solid ${T.blue}40`,
          color:T.white, fontSize:15, fontWeight:700,
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          transition:"all 0.2s", marginBottom:10,
          boxShadow:"0 4px 20px rgba(59,158,255,0.15)",
        }}>
          {loading ? "Loading..." : <><Plane size={17} />Start Practice Session</>}
        </button>

        {flagged.size > 0 && (
          <button onClick={() => startSession(true)} style={{
            width:"100%", padding:"13px", borderRadius:12, cursor:"pointer",
            background:"transparent",
            border:`1px solid ${T.amber}40`,
            color:T.amber, fontSize:14, fontWeight:600,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            <BookmarkCheck size={15} />
            Review {flagged.size} Flagged Questions
          </button>
        )}
      </div>
    </div>
  );

  // ── PRACTICE ────────────────────────────────────────────────────────────────
  if (screen === "practice" && q) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Inter',-apple-system,sans-serif", display:"flex", flexDirection:"column" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          button { font-family: inherit; }
          @keyframes slideIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
          @keyframes pop { 0% { transform:scale(0.95); } 60% { transform:scale(1.02); } 100% { transform:scale(1); } }
          .slide-in { animation: slideIn 0.25s ease forwards; }
          .opt-btn:hover { border-color: #2A2A40 !important; background: #131320 !important; }
        `}</style>

        {/* Header */}
        <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:T.panel, position:"sticky", top:0, zIndex:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={exitPractice} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.sub, cursor:"pointer", fontSize:13, fontWeight:500 }}>
              <X size={14} />
              Exit
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, background:T.card, border:`1px solid ${T.border}` }}>
              <Clock size={13} color={T.sub} />
              <span style={{ fontSize:13, fontWeight:600, color:T.text, fontVariantNumeric:"tabular-nums" }}>{fmt(sSec)}</span>
            </div>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:"#0A2010", border:`1px solid ${T.green}30` }}>
              <CheckCircle size={13} color={T.green} />
              <span style={{ fontSize:13, fontWeight:700, color:T.green }}>{score.correct}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:"#200A0A", border:`1px solid ${T.red}30` }}>
              <XCircle size={13} color={T.red} />
              <span style={{ fontSize:13, fontWeight:700, color:T.red }}>{score.wrong}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, background:T.card, border:`1px solid ${T.border}` }}>
              <SkipForward size={13} color={T.sub} />
              <span style={{ fontSize:13, fontWeight:600, color:T.sub }}>{score.skipped}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ height:2, background:T.border }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${T.blue},${T.green})`, transition:"width 0.5s ease", boxShadow:`0 0 8px ${T.blue}60` }} />
        </div>

        <div style={{ flex:1, maxWidth:760, margin:"0 auto", width:"100%", padding:"24px 20px" }}>

          {/* Question meta */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <ProgressRing pct={pct} size={38} stroke={3} color={T.blue} />
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{idx+1} / {queue.length}</div>
                  <div style={{ fontSize:11, color:T.sub }}>question</div>
                </div>
              </div>
              <div style={{ width:1, height:28, background:T.border }} />
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <Clock size={12} color={T.sub} />
                <span style={{ fontSize:12, fontVariantNumeric:"tabular-nums", color:T.sub }}>
                  {revealed ? fmt(qTimes[idx]||0) : fmt(qSec)}
                </span>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={toggleFlag} style={{
                display:"flex", alignItems:"center", gap:5, padding:"7px 12px",
                borderRadius:8, border:`1px solid ${isFlagged ? T.amber+"60" : T.border}`,
                background: isFlagged ? "#201800" : "transparent",
                color: isFlagged ? T.amber : T.sub,
                cursor:"pointer", fontSize:12, fontWeight:600,
                transition:"all 0.2s",
              }}>
                {isFlagged ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isFlagged ? "Flagged" : "Flag"}
              </button>
              <div style={{ padding:"5px 12px", borderRadius:20, background:subInfo.bg, border:`1px solid ${subInfo.color}40` }}>
                <span style={{ fontSize:11, fontWeight:600, color:subInfo.color }}>{subInfo.short}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, marginBottom:22, gap:0 }}>
            {[
              { id:"question", label:"Question", icon:<BookOpen size={13}/> },
              { id:"explanation", label:"Explanation", icon:<BarChart3 size={13}/> },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display:"flex", alignItems:"center", gap:6, padding:"10px 18px",
                background:"transparent", border:"none",
                color: tab===t.id ? T.text : T.sub,
                fontSize:13, fontWeight: tab===t.id ? 600 : 400,
                cursor:"pointer",
                borderBottom: tab===t.id ? `2px solid ${T.blue}` : "2px solid transparent",
                marginBottom:-1,
                transition:"all 0.2s",
              }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {tab === "question" ? (
            <div className="slide-in" key={idx}>
              {/* Question */}
              <div style={{ fontSize:16, fontWeight:500, lineHeight:1.7, color:T.text, marginBottom:24, padding:"20px", borderRadius:12, background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${subInfo.color}` }}>
                {clean(q.question)}
              </div>

              {/* Options */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                {opts.map((opt, i) => {
                  const isC = revealed && opt === correct;
                  const isW = revealed && opt === selected && opt !== correct;
                  let borderCol = T.border, bgCol = T.card, textCol = T.text;
                  if (isC) { borderCol = T.green+"70"; bgCol = "#0A2010"; textCol = T.green; }
                  if (isW) { borderCol = T.red+"70";   bgCol = "#200A0A"; textCol = T.red;   }
                  return (
                    <button key={i} onClick={() => pick(opt)} className="opt-btn"
                      style={{
                        width:"100%", padding:"15px 18px", borderRadius:12,
                        border:`1px solid ${borderCol}`,
                        background:bgCol, color:textCol,
                        fontSize:14, fontWeight:500, lineHeight:1.55, textAlign:"left",
                        cursor: revealed?"default":"pointer", display:"flex", alignItems:"center", gap:14,
                        transition:"all 0.2s",
                        boxShadow: isC ? `0 0 16px ${T.green}15` : isW ? `0 0 16px ${T.red}15` : "none",
                      }}>
                      <span style={{
                        width:28, height:28, borderRadius:8, flexShrink:0,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:12, fontWeight:700,
                        background: isC ? T.green+"20" : isW ? T.red+"20" : T.border,
                        color: isC ? T.green : isW ? T.red : T.sub,
                        border:`1px solid ${isC ? T.green+"40" : isW ? T.red+"40" : T.borderHi}`,
                        transition:"all 0.2s",
                      }}>{labels[i]}</span>
                      <span style={{ flex:1 }}>{opt}</span>
                      {isC && <CheckCircle size={16} color={T.green} style={{ flexShrink:0 }} />}
                      {isW && <XCircle    size={16} color={T.red}   style={{ flexShrink:0 }} />}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display:"flex", gap:10 }}>
                {!revealed && (
                  <button onClick={skip} style={{
                    flex:1, padding:"13px", borderRadius:12,
                    border:`1px solid ${T.border}`, background:"transparent",
                    color:T.sub, fontSize:13, fontWeight:600, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}>
                    <SkipForward size={15} />Skip
                  </button>
                )}
                {revealed && (
                  <button onClick={goNext} style={{
                    flex:1, padding:"14px", borderRadius:12,
                    border:`1px solid ${T.blue}50`,
                    background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",
                    color:T.white, fontSize:14, fontWeight:700, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    boxShadow:"0 4px 16px rgba(59,158,255,0.2)",
                  }}>
                    {idx+1 >= queue.length ? "See Results" : "Next Question"}
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding:"24px", borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:600, letterSpacing:"1px", textTransform:"uppercase", color:T.sub, marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
                <BookOpen size={13} color={T.sub} />Explanation
              </div>
              {revealed ? (
                <>
                  <div style={{ padding:"14px 16px", borderRadius:10, background:"#0A2010", border:`1px solid ${T.green}30`, marginBottom:18 }}>
                    <div style={{ fontSize:11, color:T.sub, marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>Correct Answer</div>
                    <div style={{ color:T.green, fontWeight:600, fontSize:14, lineHeight:1.5 }}>{correct}</div>
                  </div>
                  <p style={{ color:T.sub, fontSize:13, lineHeight:1.75, marginBottom:18 }}>
                    Detailed explanations are coming in a future update. This question is from the{" "}
                    <span style={{ color:T.text, fontWeight:500 }}>{subInfo.name}</span> subject bank.
                  </p>
                  <div style={{ display:"flex", gap:20, padding:"12px 16px", borderRadius:8, background:T.border, fontSize:12, color:T.sub }}>
                    <span>ID: {q.filename?.replace("q_","").replace(".png","") || "—"}</span>
                    <span>Time: {fmt(qTimes[idx]||0)}</span>
                    <span>Subject: {q.subject_code}</span>
                  </div>
                  <button onClick={goNext} style={{
                    marginTop:16, width:"100%", padding:"13px", borderRadius:12,
                    border:`1px solid ${T.blue}50`, background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",
                    color:T.white, fontSize:13, fontWeight:700, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}>
                    {idx+1 >= queue.length ? "See Results" : "Next Question"}
                    <ChevronRight size={15} />
                  </button>
                </>
              ) : (
                <p style={{ color:T.sub, fontSize:13 }}>Answer the question first to see the explanation.</p>
              )}
            </div>
          )}

          {/* Question strip */}
          <div style={{ marginTop:24, display:"flex", gap:3, flexWrap:"wrap" }}>
            {queue.map((_,i) => {
              let bg = T.border;
              if (answers[i]?.correct) bg = T.green;
              else if (answers[i]?.selected) bg = T.red;
              else if (answers[i]) bg = T.sub;
              if (i === idx) bg = T.blue;
              return (
                <button key={i} onClick={() => { setIdx(i); setSelected(answers[i]?.selected||null); setRevealed(!!answers[i]); setTab("question"); }}
                  title={`Q${i+1}`}
                  style={{ width:18, height:6, borderRadius:3, background:bg, border:"none", cursor:"pointer", transition:"all 0.2s", opacity:i===idx?1:0.6, boxShadow:i===idx?`0 0 6px ${T.blue}`:""}} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (screen === "result") {
    const total = score.correct + score.wrong + score.skipped;
    const finalPct = total > 0 ? Math.round((score.correct/total)*100) : 0;
    const pass = finalPct >= 75;
    return (
      <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Inter',-apple-system,sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }
          button { font-family:inherit; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          .fade-up { animation: fadeUp 0.4s ease forwards; }
        `}</style>

        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:T.panel }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <TrendingUp size={16} color={pass ? T.green : T.red} />
            <span style={{ fontSize:14, fontWeight:600 }}>Session Complete</span>
          </div>
          <span style={{ fontSize:12, color:T.sub }}>Total time: {fmt(sSec)}</span>
        </div>

        <div style={{ maxWidth:760, margin:"0 auto", width:"100%", padding:"24px 20px", display:"flex", flexDirection:"column", gap:16 }}>

          {/* Score hero */}
          <div className="fade-up" style={{ padding:"36px 28px", borderRadius:16, textAlign:"center", background:T.card, border:`1px solid ${pass ? T.green+"30" : T.red+"30"}`, boxShadow:`0 0 40px ${pass ? T.green : T.red}08` }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <div style={{ position:"relative" }}>
                <ProgressRing pct={finalPct} size={100} stroke={6} color={pass ? T.green : T.red} />
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div>
                    <div style={{ fontSize:26, fontWeight:800, color: pass ? T.green : T.red, textAlign:"center", lineHeight:1 }}>{finalPct}%</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>
              {pass ? "Above passing threshold" : "Below passing threshold"}
            </div>
            <div style={{ fontSize:13, color:T.sub }}>
              {pass ? "Well done — you cleared the 75% minimum." : "Keep practicing. Target: 75%+"}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[
              { label:"Correct",  value:score.correct,  color:T.green, bg:"#0A2010", icon:<CheckCircle size={16}/> },
              { label:"Wrong",    value:score.wrong,    color:T.red,   bg:"#200A0A", icon:<XCircle    size={16}/> },
              { label:"Skipped",  value:score.skipped,  color:T.sub,   bg:T.card,    icon:<SkipForward size={16}/> },
            ].map(s => (
              <div key={s.label} style={{ padding:"18px", borderRadius:12, background:s.bg, border:`1px solid ${s.color}20`, textAlign:"center" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:8, color:s.color }}>{s.icon}</div>
                <div style={{ fontSize:30, fontWeight:800, color:s.color, letterSpacing:"-1px" }}>{s.value}</div>
                <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Time stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {[
              { label:"Total Time",        value:fmt(sSec)    },
              { label:"Avg per Question",  value:fmt(avgTime) },
            ].map(s => (
              <div key={s.label} style={{ padding:"16px", borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Question log */}
          <div style={{ padding:"18px", borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:14 }}>Question Log</div>
            <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
              {queue.map((_,i) => {
                let bg = T.sub;
                if (answers[i]?.correct) bg = T.green;
                else if (answers[i]?.selected) bg = T.red;
                return (
                  <div key={i} title={`Q${i+1}`}
                    style={{ width:20, height:20, borderRadius:4, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#000", fontWeight:700, opacity:0.85 }}>
                    {i+1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => startSession(false)} style={{
              flex:2, padding:"15px", borderRadius:12,
              border:`1px solid ${T.blue}50`, background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",
              color:T.white, fontSize:14, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow:"0 4px 16px rgba(59,158,255,0.15)",
            }}>
              <RotateCcw size={15} />New Session
            </button>
            <button onClick={() => setScreen("home")} style={{
              flex:1, padding:"15px", borderRadius:12,
              border:`1px solid ${T.border}`, background:"transparent",
              color:T.sub, fontSize:13, fontWeight:600, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <Home size={14} />Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ color:T.sub }}>Loading...</div>
    </div>
  );
}
