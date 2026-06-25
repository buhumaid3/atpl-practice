import { useState, useCallback, useRef, useEffect } from "react";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const SUBJECTS = [
  { code: "ALL",  name: "All Subjects",   short: "ALL", color: "#00D4AA", count: 2380 },
  { code: "010",  name: "Air Law",         short: "010", color: "#00D4AA", count: 1274 },
  { code: "031",  name: "Mass & Balance",  short: "031", color: "#F5A623", count: 400  },
  { code: "032",  name: "Performance",     short: "032", color: "#7EB8FF", count: 706  },
];

const C = {
  bg:       "#060A10",
  panel:    "#0B1018",
  surface:  "#0F1620",
  border:   "#1E2D3D",
  borderBright: "#2A3D52",
  cyan:     "#00D4AA",
  amber:    "#F5A623",
  red:      "#FF4D4D",
  blue:     "#7EB8FF",
  text:     "#D8E8F0",
  muted:    "#4A6070",
  dim:      "#2A3A48",
  green:    "#00D4AA",
  white:    "#EAF4FF",
};

async function fetchQuestions(code, limit = 2500) {
  let url = `${SUPABASE_URL}/rest/v1/questions?select=*&limit=${limit}&order=id`;
  if (code !== "ALL") url += `&subject_code=eq.${code}`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  return r.json();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function fmt(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

function cleanQ(t) {
  if (!t) return "";
  return t.replace(/^(N[°v"'`]+\s*\d+\s*[@©]?\s*[\d:]*\s*)/i,"")
          .replace(/^(Q\s+\d+\/\d+\s+N[°v"'`]+\s*\d+\s*[@©]?\s*[\d:]*\s*)/i,"")
          .replace(/^(—\s*QUESTIGN?.*?[\d:]+\s*)/i,"")
          .trim();
}

// ── REUSABLE COMPONENTS ──────────────────────────────

function DataReadout({ label, value, color = C.cyan, mono = true }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: C.muted, marginBottom: "2px", fontFamily: "Inter, sans-serif" }}>{label}</div>
      <div style={{ fontSize: "15px", fontWeight: "700", color, fontFamily: mono ? "'B612 Mono', 'Courier New', monospace" : "Inter, sans-serif", letterSpacing: mono ? "1px" : "0" }}>{value}</div>
    </div>
  );
}

function ScanLine() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,170,0.012) 2px, rgba(0,212,170,0.012) 4px)",
    }} />
  );
}

function GlowBorder({ color = C.cyan, children, style = {} }) {
  return (
    <div style={{
      border: `1px solid ${color}40`,
      borderRadius: "4px",
      boxShadow: `0 0 12px ${color}10, inset 0 0 12px ${color}05`,
      ...style,
    }}>{children}</div>
  );
}

// ── MAIN APP ─────────────────────────────────────────

export default function App() {
  const [screen, setScreen]         = useState("home");
  const [subject, setSubject]       = useState("ALL");
  const [sessionSize, setSession]   = useState(20);
  const [queue, setQueue]           = useState([]);
  const [current, setCurrent]       = useState(0);
  const [selected, setSelected]     = useState(null);
  const [revealed, setRevealed]     = useState(false);
  const [tab, setTab]               = useState("question");
  const [score, setScore]           = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [answers, setAnswers]       = useState({});
  const [flagged, setFlagged]       = useState(new Set());
  const [loading, setLoading]       = useState(false);
  const [sessionSec, setSessionSec] = useState(0);
  const [qSec, setQSec]             = useState(0);
  const [qTimes, setQTimes]         = useState({});
  const [showJump, setShowJump]     = useState(false);
  const [jumpVal, setJumpVal]       = useState("");
  const sInt = useRef(null);
  const qInt = useRef(null);

  useEffect(() => {
    if (screen === "practice") {
      sInt.current = setInterval(() => setSessionSec(t => t + 1), 1000);
      return () => clearInterval(sInt.current);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "practice") {
      setQSec(0);
      clearInterval(qInt.current);
      qInt.current = setInterval(() => setQSec(t => t + 1), 1000);
      return () => clearInterval(qInt.current);
    }
  }, [current, screen]);

  const startSession = useCallback(async (reviewFlagged = false) => {
    setLoading(true);
    const data = await fetchQuestions(subject);
    const valid = data.filter(q => q.correct_answer && q.option_a);
    let pool = reviewFlagged ? valid.filter(q => flagged.has(q.id)) : shuffle(valid).slice(0, sessionSize);
    if (!pool.length) pool = shuffle(valid).slice(0, sessionSize);
    setQueue(pool); setCurrent(0); setSelected(null); setRevealed(false); setTab("question");
    setScore({ correct: 0, wrong: 0, skipped: 0 }); setAnswers({});
    setSessionSec(0); setQSec(0); setQTimes({});
    setLoading(false); setScreen("practice");
  }, [subject, sessionSize, flagged]);

  const q           = queue[current];
  const opts        = q ? [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean) : [];
  const correct     = q?.correct_answer;
  const subColor    = SUBJECTS.find(s => s.code === (q?.subject_code || subject))?.color || C.cyan;
  const isFlagged   = q && flagged.has(q.id);
  const progress    = queue.length ? (current / queue.length) * 100 : 0;

  function pick(opt) {
    if (revealed) return;
    setSelected(opt); setRevealed(true);
    const ok = opt === correct;
    setScore(s => ({ ...s, [ok ? "correct" : "wrong"]: s[ok ? "correct" : "wrong"] + 1 }));
    setAnswers(a => ({ ...a, [current]: { selected: opt, correct: ok } }));
    setQTimes(t => ({ ...t, [current]: qSec }));
    clearInterval(qInt.current);
  }

  function skip() {
    if (revealed) return;
    setScore(s => ({ ...s, skipped: s.skipped + 1 }));
    setAnswers(a => ({ ...a, [current]: { selected: null, correct: false } }));
    setQTimes(t => ({ ...t, [current]: qSec }));
    next();
  }

  function next() {
    if (current + 1 >= queue.length) {
      clearInterval(sInt.current); clearInterval(qInt.current);
      setScreen("result");
    } else {
      setCurrent(c => c + 1); setSelected(null); setRevealed(false); setTab("question");
    }
  }

  function jumpTo(i) {
    if (i >= 0 && i < queue.length) {
      setCurrent(i);
      setSelected(answers[i]?.selected || null);
      setRevealed(!!answers[i]);
      setTab("question");
    }
    setShowJump(false); setJumpVal("");
  }

  function toggleFlag() {
    if (!q) return;
    setFlagged(f => { const n = new Set(f); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; });
  }

  const labels = ["A", "B", "C", "D"];
  const avgTime = Object.values(qTimes).length ? Math.round(Object.values(qTimes).reduce((a,b)=>a+b,0)/Object.values(qTimes).length) : 0;

  // ── BASE STYLES ──────────────────────────────────────
  const base = {
    app: {
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    },
    header: {
      padding: "10px 20px", borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: C.panel, position: "sticky", top: 0, zIndex: 20,
      backdropFilter: "blur(8px)",
    },
    main: { flex: 1, maxWidth: "760px", margin: "0 auto", width: "100%", padding: "24px 20px" },
  };

  // ── HOME ─────────────────────────────────────────────
  if (screen === "home") return (
    <div style={base.app}>
      <ScanLine />

      {/* Header */}
      <header style={base.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "4px",
            border: `1px solid ${C.cyan}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", color: C.cyan,
            boxShadow: `0 0 8px ${C.cyan}30`,
          }}>✈</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", color: C.cyan, fontFamily: "'B612 Mono', monospace" }}>ATPL·SYS</div>
            <div style={{ fontSize: "9px", letterSpacing: "2px", color: C.muted, textTransform: "uppercase" }}>Practice Platform</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <DataReadout label="Questions" value="2,380" />
          <DataReadout label="Flagged" value={String(flagged.size).padStart(3,"0")} color={flagged.size > 0 ? C.amber : C.muted} />
        </div>
      </header>

      <main style={base.main}>

        {/* Hero */}
        <div style={{ marginBottom: "32px", paddingBottom: "28px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: C.cyan, marginBottom: "10px", fontFamily: "'B612 Mono', monospace" }}>// PREFLIGHT CHECK</div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: "10px", color: C.white }}>
            Prepare for<br />your ATPL exam.
          </h1>
          <p style={{ color: C.muted, fontSize: "14px", lineHeight: 1.6 }}>
            Real exam questions from the Aviation Exam database.<br />
            Instant feedback. Track every session.
          </p>
        </div>

        {/* Subject select */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: C.muted, marginBottom: "12px", fontFamily: "'B612 Mono', monospace" }}>SELECT SUBJECT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {SUBJECTS.map(sub => {
              const active = subject === sub.code;
              return (
                <div key={sub.code} onClick={() => setSubject(sub.code)} style={{
                  padding: "14px 16px", borderRadius: "4px", cursor: "pointer",
                  border: `1px solid ${active ? sub.color + "80" : C.border}`,
                  background: active ? `${sub.color}08` : C.surface,
                  transition: "all 0.15s",
                  boxShadow: active ? `0 0 16px ${sub.color}15` : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "9px", fontFamily: "'B612 Mono', monospace", letterSpacing: "2px", color: active ? sub.color : C.muted }}>{sub.short}</span>
                    <span style={{ fontSize: "9px", color: C.muted }}>{sub.count.toLocaleString()} Q</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: active ? sub.color : C.text }}>{sub.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session length */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: C.muted, marginBottom: "12px", fontFamily: "'B612 Mono', monospace" }}>SESSION LENGTH</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[10, 20, 40, 60].map(n => (
              <button key={n} onClick={() => setSession(n)} style={{
                flex: 1, padding: "10px 0", borderRadius: "4px", cursor: "pointer",
                border: `1px solid ${sessionSize === n ? C.cyan + "80" : C.border}`,
                background: sessionSize === n ? `${C.cyan}10` : C.surface,
                color: sessionSize === n ? C.cyan : C.muted,
                fontSize: "13px", fontWeight: "700",
                fontFamily: "'B612 Mono', monospace",
                boxShadow: sessionSize === n ? `0 0 12px ${C.cyan}15` : "none",
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Start */}
        <button onClick={() => startSession(false)} disabled={loading} style={{
          width: "100%", padding: "16px", borderRadius: "4px", cursor: "pointer",
          background: `linear-gradient(135deg, ${C.cyan}20, ${C.cyan}10)`,
          border: `1px solid ${C.cyan}60`,
          color: C.cyan, fontSize: "14px", fontWeight: "700",
          letterSpacing: "3px", textTransform: "uppercase",
          fontFamily: "'B612 Mono', monospace",
          boxShadow: `0 0 20px ${C.cyan}20`,
          marginBottom: "10px",
          transition: "all 0.2s",
        }}>{loading ? "LOADING..." : "▶  INITIATE SESSION"}</button>

        {flagged.size > 0 && (
          <button onClick={() => startSession(true)} style={{
            width: "100%", padding: "13px", borderRadius: "4px", cursor: "pointer",
            background: "transparent",
            border: `1px solid ${C.amber}50`,
            color: C.amber, fontSize: "13px", fontWeight: "700",
            letterSpacing: "2px", textTransform: "uppercase",
            fontFamily: "'B612 Mono', monospace",
          }}>◈  REVIEW {flagged.size} FLAGGED</button>
        )}
      </main>
    </div>
  );

  // ── PRACTICE ─────────────────────────────────────────
  if (screen === "practice" && q) {
    const cleanQuestion = cleanQ(q.question);
    return (
      <div style={base.app}>
        <ScanLine />

        {/* Header */}
        <header style={base.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => { clearInterval(sInt.current); clearInterval(qInt.current); setScreen("home"); }} style={{
              background: "transparent", border: `1px solid ${C.border}`, borderRadius: "4px",
              color: C.muted, cursor: "pointer", padding: "5px 10px",
              fontSize: "11px", letterSpacing: "1px", fontFamily: "'B612 Mono', monospace",
            }}>◄ EXIT</button>
            <div style={{ width: "1px", height: "20px", background: C.border }} />
            <DataReadout label="Time" value={fmt(sessionSec)} color={C.cyan} />
          </div>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <DataReadout label="Correct" value={String(score.correct).padStart(2,"0")} color={C.green} />
            <DataReadout label="Wrong" value={String(score.wrong).padStart(2,"0")} color={C.red} />
            <DataReadout label="Skip" value={String(score.skipped).padStart(2,"0")} color={C.muted} />
          </div>
        </header>

        {/* Progress bar - EFIS style */}
        <div style={{ height: "2px", background: C.border, position: "relative" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: C.cyan, transition: "width 0.4s", boxShadow: `0 0 8px ${C.cyan}` }} />
        </div>

        <main style={base.main}>
          {/* Question meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => setShowJump(!showJump)} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px",
                color: C.cyan, cursor: "pointer", padding: "5px 10px",
                fontSize: "12px", fontFamily: "'B612 Mono', monospace", letterSpacing: "1px",
              }}>Q {String(current+1).padStart(3,"0")}/{String(queue.length).padStart(3,"0")}</button>
              {showJump && (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input type="number" min="1" max={queue.length} value={jumpVal}
                    onChange={e => setJumpVal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && jumpTo(parseInt(jumpVal)-1)}
                    autoFocus placeholder="###"
                    style={{ width: "60px", padding: "5px 8px", borderRadius: "4px", border: `1px solid ${C.border}`, background: C.surface, color: C.cyan, fontSize: "12px", fontFamily: "'B612 Mono', monospace", textAlign: "center" }} />
                  <button onClick={() => jumpTo(parseInt(jumpVal)-1)} style={{ padding: "5px 10px", borderRadius: "4px", border: `1px solid ${C.cyan}50`, background: `${C.cyan}10`, color: C.cyan, cursor: "pointer", fontSize: "11px", fontFamily: "'B612 Mono', monospace" }}>GO</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'B612 Mono', monospace" }}>
                {!revealed ? fmt(qSec) : fmt(qTimes[current]||0)}
              </span>
              <button onClick={toggleFlag} style={{
                background: isFlagged ? `${C.amber}15` : C.surface,
                border: `1px solid ${isFlagged ? C.amber+"60" : C.border}`,
                borderRadius: "4px", color: isFlagged ? C.amber : C.muted,
                cursor: "pointer", padding: "5px 10px", fontSize: "11px",
                letterSpacing: "1px", fontFamily: "'B612 Mono', monospace",
              }}>{isFlagged ? "◈ FLG" : "◇ FLG"}</button>
              <div style={{
                padding: "4px 10px", borderRadius: "4px", fontSize: "10px",
                fontFamily: "'B612 Mono', monospace", letterSpacing: "2px",
                border: `1px solid ${subColor}50`,
                background: `${subColor}10`, color: subColor,
              }}>{SUBJECTS.find(s => s.code === q.subject_code)?.short || q.subject_code}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", marginBottom: "20px", border: `1px solid ${C.border}`, borderRadius: "4px", overflow: "hidden" }}>
            {["QUESTION", "EXPLANATION"].map(t => (
              <button key={t} onClick={() => setTab(t.toLowerCase())} style={{
                flex: 1, padding: "9px", border: "none",
                background: tab === t.toLowerCase() ? C.surface : "transparent",
                color: tab === t.toLowerCase() ? C.cyan : C.muted,
                fontSize: "10px", fontWeight: "700", letterSpacing: "2px", cursor: "pointer",
                fontFamily: "'B612 Mono', monospace",
                borderRight: t === "QUESTION" ? `1px solid ${C.border}` : "none",
              }}>{t}</button>
            ))}
          </div>

          {tab === "question" ? (
            <>
              {/* Question text */}
              <div style={{
                padding: "20px", borderRadius: "4px", marginBottom: "20px",
                background: C.surface, border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${subColor}`,
              }}>
                <div style={{ fontSize: "15px", lineHeight: "1.7", color: C.white }}>{cleanQuestion}</div>
              </div>

              {/* Options */}
              {opts.map((opt, i) => {
                const isCorrect  = revealed && opt === correct;
                const isWrong    = revealed && opt === selected && opt !== correct;
                const isNeutral  = !isCorrect && !isWrong;
                let borderColor  = C.border;
                let bgColor      = C.surface;
                let textColor    = C.text;
                let leftBorder   = C.border;
                if (isCorrect) { borderColor = C.cyan + "80"; bgColor = `${C.cyan}08`; textColor = C.cyan; leftBorder = C.cyan; }
                if (isWrong)   { borderColor = C.red  + "80"; bgColor = `${C.red}08`;  textColor = C.red;  leftBorder = C.red;  }
                return (
                  <button key={i} onClick={() => pick(opt)} style={{
                    width: "100%", padding: "14px 16px", borderRadius: "4px",
                    border: `1px solid ${borderColor}`,
                    borderLeft: `3px solid ${leftBorder}`,
                    background: bgColor, color: textColor,
                    fontSize: "14px", lineHeight: "1.5", textAlign: "left",
                    cursor: revealed ? "default" : "pointer", marginBottom: "8px",
                    transition: "all 0.15s", display: "flex", alignItems: "center", gap: "12px",
                    boxShadow: isCorrect ? `0 0 12px ${C.cyan}15` : isWrong ? `0 0 12px ${C.red}15` : "none",
                  }}>
                    <span style={{
                      width: "24px", height: "24px", borderRadius: "3px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: "700", fontFamily: "'B612 Mono', monospace",
                      background: isCorrect ? `${C.cyan}20` : isWrong ? `${C.red}20` : C.dim,
                      color: isCorrect ? C.cyan : isWrong ? C.red : C.muted,
                      border: `1px solid ${isCorrect ? C.cyan+"40" : isWrong ? C.red+"40" : C.border}`,
                    }}>{labels[i]}</span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {isCorrect && <span style={{ color: C.cyan, fontSize: "14px" }}>✓</span>}
                    {isWrong   && <span style={{ color: C.red,  fontSize: "14px" }}>✗</span>}
                  </button>
                );
              })}

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {!revealed && (
                  <button onClick={skip} style={{
                    flex: 1, padding: "13px", borderRadius: "4px",
                    border: `1px solid ${C.border}`, background: "transparent",
                    color: C.muted, fontSize: "11px", fontWeight: "700",
                    letterSpacing: "2px", cursor: "pointer", fontFamily: "'B612 Mono', monospace",
                  }}>SKIP ▷</button>
                )}
                {revealed && (
                  <button onClick={next} style={{
                    flex: 1, padding: "13px", borderRadius: "4px",
                    border: `1px solid ${C.cyan}60`,
                    background: `linear-gradient(135deg, ${C.cyan}15, ${C.cyan}08)`,
                    color: C.cyan, fontSize: "12px", fontWeight: "700",
                    letterSpacing: "2px", cursor: "pointer", fontFamily: "'B612 Mono', monospace",
                    boxShadow: `0 0 16px ${C.cyan}15`,
                  }}>{current+1 >= queue.length ? "RESULTS ▶" : "NEXT ▶"}</button>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: "20px", borderRadius: "4px", background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: C.muted, marginBottom: "14px", fontFamily: "'B612 Mono', monospace" }}>EXPLANATION</div>
              {revealed ? (
                <>
                  <div style={{ padding: "14px", borderRadius: "4px", border: `1px solid ${C.cyan}30`, background: `${C.cyan}08`, marginBottom: "16px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "2px", color: C.muted, marginBottom: "6px", fontFamily: "'B612 Mono', monospace" }}>CORRECT ANSWER</div>
                    <div style={{ color: C.cyan, fontWeight: "600", fontSize: "14px" }}>{correct}</div>
                  </div>
                  <p style={{ color: C.muted, fontSize: "13px", lineHeight: "1.7", marginBottom: "16px" }}>
                    Detailed explanations coming in the next update. This question is from the <span style={{ color: C.text }}>{SUBJECTS.find(s => s.code === q.subject_code)?.name}</span> subject.
                  </p>
                  <div style={{ display: "flex", gap: "20px", fontSize: "11px", color: C.muted, fontFamily: "'B612 Mono', monospace", borderTop: `1px solid ${C.border}`, paddingTop: "14px" }}>
                    <span>ID: {q.filename?.replace("q_","").replace(".png","") || "—"}</span>
                    <span>TIME: {fmt(qTimes[current]||0)}</span>
                    <span>SUBJ: {q.subject_code}</span>
                  </div>
                  <button onClick={next} style={{
                    marginTop: "16px", width: "100%", padding: "12px", borderRadius: "4px",
                    border: `1px solid ${C.cyan}60`, background: `${C.cyan}10`,
                    color: C.cyan, fontSize: "11px", fontWeight: "700",
                    letterSpacing: "2px", cursor: "pointer", fontFamily: "'B612 Mono', monospace",
                  }}>{current+1 >= queue.length ? "RESULTS ▶" : "NEXT ▶"}</button>
                </>
              ) : (
                <p style={{ color: C.muted, fontSize: "13px", fontFamily: "'B612 Mono', monospace" }}>// Answer the question first</p>
              )}
            </div>
          )}

          {/* Question strip */}
          <div style={{ marginTop: "20px", display: "flex", gap: "3px", flexWrap: "wrap" }}>
            {queue.map((_, i) => {
              let bg = C.dim;
              if (answers[i]?.correct) bg = C.cyan;
              else if (answers[i]?.selected) bg = C.red;
              else if (answers[i]) bg = C.muted;
              if (i === current) bg = C.amber;
              return (
                <button key={i} onClick={() => jumpTo(i)} title={`Q${i+1}`} style={{
                  width: "20px", height: "6px", borderRadius: "2px",
                  background: bg, border: "none", cursor: "pointer",
                  transition: "all 0.15s", opacity: i === current ? 1 : 0.6,
                  boxShadow: i === current ? `0 0 6px ${C.amber}` : "none",
                }} />
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ── RESULT ───────────────────────────────────────────
  if (screen === "result") {
    const total = score.correct + score.wrong + score.skipped;
    const pct   = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    const pass  = pct >= 75;
    return (
      <div style={base.app}>
        <ScanLine />
        <header style={base.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: C.cyan, fontFamily: "'B612 Mono', monospace" }}>SESSION DEBRIEF</div>
          </div>
          <span style={{ fontSize: "11px", color: C.muted, fontFamily: "'B612 Mono', monospace" }}>TOTAL TIME: {fmt(sessionSec)}</span>
        </header>

        <main style={base.main}>
          {/* Score */}
          <div style={{
            padding: "36px", borderRadius: "4px", textAlign: "center", marginBottom: "16px",
            background: C.panel, border: `1px solid ${pass ? C.cyan+"40" : C.red+"40"}`,
            boxShadow: `0 0 30px ${pass ? C.cyan : C.red}10`,
          }}>
            <div style={{ fontSize: "9px", letterSpacing: "4px", textTransform: "uppercase", color: C.muted, marginBottom: "12px", fontFamily: "'B612 Mono', monospace" }}>
              {pass ? "// PASS — ABOVE THRESHOLD" : "// FAIL — BELOW THRESHOLD"}
            </div>
            <div style={{ fontSize: "88px", fontWeight: "800", letterSpacing: "-4px", lineHeight: 1, color: pass ? C.cyan : C.red, fontFamily: "'B612 Mono', monospace", marginBottom: "4px", textShadow: `0 0 30px ${pass ? C.cyan : C.red}40` }}>
              {pct}%
            </div>
            <div style={{ fontSize: "12px", color: C.muted, marginBottom: "28px" }}>
              {pass ? "Threshold: 75% — CLEARED" : "Threshold: 75% — BELOW MINIMUMS"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px" }}>
              {[
                { label: "CORRECT", value: score.correct, color: C.cyan },
                { label: "WRONG",   value: score.wrong,   color: C.red  },
                { label: "SKIPPED", value: score.skipped, color: C.muted},
              ].map(st => (
                <div key={st.label} style={{
                  padding: "16px", borderRadius: "4px",
                  background: `${st.color}08`, border: `1px solid ${st.color}30`,
                }}>
                  <div style={{ fontSize: "32px", fontWeight: "800", color: st.color, fontFamily: "'B612 Mono', monospace", letterSpacing: "-1px" }}>{String(st.value).padStart(2,"0")}</div>
                  <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'B612 Mono', monospace" }}>{st.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "24px" }}>
              <div style={{ padding: "14px", borderRadius: "4px", background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'B612 Mono', monospace", marginBottom: "4px" }}>Total Time</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: C.text, fontFamily: "'B612 Mono', monospace" }}>{fmt(sessionSec)}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "4px", background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'B612 Mono', monospace", marginBottom: "4px" }}>Avg / Question</div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: C.text, fontFamily: "'B612 Mono', monospace" }}>{fmt(avgTime)}</div>
              </div>
            </div>
          </div>

          {/* Question strip */}
          <div style={{ padding: "16px", borderRadius: "4px", background: C.panel, border: `1px solid ${C.border}`, marginBottom: "16px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", color: C.muted, marginBottom: "12px", fontFamily: "'B612 Mono', monospace" }}>QUESTION LOG</div>
            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
              {queue.map((_, i) => {
                let bg = C.muted;
                if (answers[i]?.correct) bg = C.cyan;
                else if (answers[i]?.selected) bg = C.red;
                return (
                  <div key={i} title={`Q${i+1}`} style={{
                    width: "22px", height: "22px", borderRadius: "3px", background: bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", color: "#000", fontWeight: "700", fontFamily: "'B612 Mono', monospace",
                    opacity: 0.85,
                  }}>{i+1}</div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => startSession(false)} style={{
              flex: 2, padding: "14px", borderRadius: "4px",
              border: `1px solid ${C.cyan}60`,
              background: `linear-gradient(135deg, ${C.cyan}15, ${C.cyan}08)`,
              color: C.cyan, fontSize: "11px", fontWeight: "700",
              letterSpacing: "3px", cursor: "pointer", fontFamily: "'B612 Mono', monospace",
              boxShadow: `0 0 16px ${C.cyan}15`,
            }}>▶ NEW SESSION</button>
            <button onClick={() => setScreen("home")} style={{
              flex: 1, padding: "14px", borderRadius: "4px",
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.muted, fontSize: "11px", fontWeight: "700",
              letterSpacing: "2px", cursor: "pointer", fontFamily: "'B612 Mono', monospace",
            }}>◄ HOME</button>
          </div>
        </main>
      </div>
    );
  }

  return <div style={{ ...base.app, alignItems: "center", justifyContent: "center" }}>
    <div style={{ color: C.cyan, fontFamily: "'B612 Mono', monospace", letterSpacing: "3px" }}>LOADING...</div>
  </div>;
}
