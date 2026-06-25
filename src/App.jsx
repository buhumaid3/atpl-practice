import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const SUBJECTS = [
  { code: "ALL", name: "All Subjects", color: "#4A90D9", count: "2,380 questions" },
  { code: "010", name: "Air Law", color: "#E74C3C", count: "1,274 questions" },
  { code: "031", name: "Mass & Balance", color: "#2ECC71", count: "400 questions" },
  { code: "032", name: "Performance", color: "#F39C12", count: "706 questions" },
];

function cleanQuestion(text) {
  if (!text) return "";
  return text
    .replace(/^(N[°v"'`]+\s*\d+\s*[@©]?\s*\d*:\d*\s*)/i, "")
    .replace(/^(Q\s+\d+\/\d+\s+N[°v"'`]+\s*\d+\s*[@©]?\s*\d*:\d*\s*)/i, "")
    .replace(/^(—\s*QUESTIGN?.*?Q\s+\d+\/\d+\s+N[^\s]+\s+[@©]\s+[\d:]+\s*)/i, "")
    .trim();
}

async function fetchQuestions(subjectCode, limit = 2500) {
  let url = `${SUPABASE_URL}/rest/v1/questions?select=*&limit=${limit}&order=id`;
  if (subjectCode !== "ALL") url += `&subject_code=eq.${subjectCode}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ATPLApp() {
  const [screen, setScreen] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [sessionSize, setSessionSize] = useState(20);
  const [mode, setMode] = useState("practice"); // practice | review_flagged
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [activeTab, setActiveTab] = useState("question"); // question | explanation
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [answers, setAnswers] = useState({}); // {index: {selected, correct}}
  const [flagged, setFlagged] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [questionTimes, setQuestionTimes] = useState({});
  const [showJump, setShowJump] = useState(false);
  const [jumpInput, setJumpInput] = useState("");
  const [allQuestions, setAllQuestions] = useState([]);
  const sessionInterval = useRef(null);
  const questionInterval = useRef(null);

  // Timers
  useEffect(() => {
    if (screen === "practice") {
      sessionInterval.current = setInterval(() => setSessionTimer(t => t + 1), 1000);
      return () => clearInterval(sessionInterval.current);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "practice") {
      setQuestionTimer(0);
      clearInterval(questionInterval.current);
      questionInterval.current = setInterval(() => setQuestionTimer(t => t + 1), 1000);
      return () => clearInterval(questionInterval.current);
    }
  }, [current, screen]);

  const startSession = useCallback(async (reviewFlagged = false) => {
    setLoading(true);
    const data = await fetchQuestions(selectedSubject);
    const valid = data.filter(q => q.correct_answer && q.option_a);
    setAllQuestions(valid);
    let pool = reviewFlagged
      ? valid.filter(q => flagged.has(q.id))
      : shuffle(valid).slice(0, sessionSize);
    if (pool.length === 0) pool = shuffle(valid).slice(0, sessionSize);
    setQueue(pool);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setActiveTab("question");
    setScore({ correct: 0, wrong: 0, skipped: 0 });
    setAnswers({});
    setSessionTimer(0);
    setQuestionTimer(0);
    setQuestionTimes({});
    setLoading(false);
    setMode(reviewFlagged ? "review_flagged" : "practice");
    setScreen("practice");
  }, [selectedSubject, sessionSize, flagged]);

  const q = queue[current];
  const options = q ? [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean) : [];
  const correctOption = q?.correct_answer;
  const subjectColor = SUBJECTS.find(s => s.code === (q?.subject_code || selectedSubject))?.color || "#4A90D9";

  function handleSelect(opt) {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    setActiveTab("question");
    const isCorrect = opt === correctOption;
    if (isCorrect) setScore(s => ({ ...s, correct: s.correct + 1 }));
    else setScore(s => ({ ...s, wrong: s.wrong + 1 }));
    setAnswers(a => ({ ...a, [current]: { selected: opt, correct: isCorrect } }));
    setQuestionTimes(t => ({ ...t, [current]: questionTimer }));
    clearInterval(questionInterval.current);
  }

  function handleSkip() {
    if (revealed) return;
    setScore(s => ({ ...s, skipped: s.skipped + 1 }));
    setAnswers(a => ({ ...a, [current]: { selected: null, correct: false } }));
    setQuestionTimes(t => ({ ...t, [current]: questionTimer }));
    next();
  }

  function toggleFlag() {
    if (!q) return;
    setFlagged(f => {
      const nf = new Set(f);
      if (nf.has(q.id)) nf.delete(q.id); else nf.add(q.id);
      return nf;
    });
  }

  function next() {
    if (current + 1 >= queue.length) {
      clearInterval(sessionInterval.current);
      clearInterval(questionInterval.current);
      setScreen("result");
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
      setActiveTab("question");
    }
  }

  function jumpTo(idx) {
    if (idx >= 0 && idx < queue.length) {
      setCurrent(idx);
      setSelected(answers[idx]?.selected || null);
      setRevealed(answers[idx] !== undefined);
      setActiveTab("question");
    }
    setShowJump(false);
    setJumpInput("");
  }

  const progress = queue.length ? ((current) / queue.length) * 100 : 0;
  const isFlagged = q && flagged.has(q.id);
  const avgTime = Object.values(questionTimes).length > 0
    ? Math.round(Object.values(questionTimes).reduce((a, b) => a + b, 0) / Object.values(questionTimes).length)
    : 0;

  // ── STYLES ─────────────────────────────────────────
  const c = {
    bg: "#080C18",
    surface: "#0D1220",
    border: "#1A2235",
    text: "#E8EDF5",
    muted: "#5A6A82",
    blue: "#4A90D9",
    green: "#2ECC71",
    red: "#E74C3C",
    orange: "#F39C12",
  };

  const s = {
    app: { minHeight: "100vh", background: c.bg, color: c.text, fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" },
    header: { padding: "14px 20px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: c.surface, position: "sticky", top: 0, zIndex: 10 },
    logo: { display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "700" },
    logoIcon: { width: "30px", height: "30px", background: `linear-gradient(135deg, ${c.blue}, ${c.green})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" },
    main: { flex: 1, maxWidth: "740px", margin: "0 auto", width: "100%", padding: "28px 20px" },
    btn: (bg, color = "#fff", border = "none") => ({ padding: "12px 24px", borderRadius: "10px", background: bg, border, color, fontSize: "14px", fontWeight: "600", cursor: "pointer" }),
    iconBtn: (active = false) => ({ background: "transparent", border: `1px solid ${active ? c.blue : c.border}`, borderRadius: "8px", color: active ? c.blue : c.muted, cursor: "pointer", padding: "7px 10px", fontSize: "13px", fontWeight: "600" }),
  };

  // ── HOME ────────────────────────────────────────────
  if (screen === "home") return (
    <div style={s.app}>
      <header style={s.header}>
        <div style={s.logo}><div style={s.logoIcon}>✈</div>ATPL Practice</div>
        <div style={{ fontSize: "12px", color: c.muted, background: c.border, padding: "4px 10px", borderRadius: "20px" }}>
          {flagged.size > 0 && `🔖 ${flagged.size} flagged · `}Beta v1.0
        </div>
      </header>
      <main style={s.main}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: "800", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: "8px" }}>
            Prepare for<br />your ATPL exam.
          </h1>
          <p style={{ color: c.muted, fontSize: "15px" }}>Real exam questions. Instant feedback. Track your progress.</p>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "32px", flexWrap: "wrap" }}>
          {[
            { label: "Questions", value: "2,380", color: c.blue },
            { label: "Subjects", value: "3", color: c.orange },
            { label: "Flagged", value: flagged.size, color: c.red },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, minWidth: "80px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: c.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Subject select */}
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", color: c.blue, marginBottom: "10px" }}>Select Subject</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "24px" }}>
          {SUBJECTS.map(sub => {
            const active = selectedSubject === sub.code;
            return (
              <div key={sub.code} onClick={() => setSelectedSubject(sub.code)}
                style={{ padding: "14px", borderRadius: "12px", border: `2px solid ${active ? sub.color : c.border}`, background: active ? `${sub.color}12` : c.surface, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: active ? sub.color : c.text, marginBottom: "3px" }}>{sub.name}</div>
                <div style={{ fontSize: "12px", color: c.muted }}>{sub.count}</div>
              </div>
            );
          })}
        </div>

        {/* Session length */}
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", color: c.blue, marginBottom: "10px" }}>Session Length</div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[10, 20, 40, 60].map(n => (
            <button key={n} onClick={() => setSessionSize(n)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: `2px solid ${sessionSize === n ? c.blue : c.border}`, background: sessionSize === n ? `${c.blue}15` : "transparent", color: sessionSize === n ? c.blue : c.muted, cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
              {n} Q
            </button>
          ))}
        </div>

        {/* Start buttons */}
        <button onClick={() => startSession(false)} disabled={loading}
          style={{ width: "100%", padding: "16px", borderRadius: "12px", background: `linear-gradient(135deg, ${c.blue}, #2E86C1)`, border: "none", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" }}>
          {loading ? "Loading..." : "Start Practice →"}
        </button>
        {flagged.size > 0 && (
          <button onClick={() => startSession(true)}
            style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "transparent", border: `2px solid ${c.orange}`, color: c.orange, fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
            🔖 Review {flagged.size} Flagged Questions
          </button>
        )}
      </main>
    </div>
  );

  // ── PRACTICE ────────────────────────────────────────
  if (screen === "practice" && q) {
    const labels = ["A", "B", "C", "D"];
    const cleanQ = cleanQuestion(q.question);
    return (
      <div style={s.app}>
        {/* Header */}
        <header style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => { clearInterval(sessionInterval.current); clearInterval(questionInterval.current); setScreen("home"); }}
              style={s.iconBtn()}>← Exit</button>
            <div style={s.logo}><div style={s.logoIcon}>✈</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: c.muted, fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>⏱ {formatTime(sessionTimer)}</span>
            <span style={{ padding: "4px 10px", borderRadius: "20px", background: `${c.green}20`, color: c.green, fontSize: "12px", fontWeight: "700" }}>✓ {score.correct}</span>
            <span style={{ padding: "4px 10px", borderRadius: "20px", background: `${c.red}20`, color: c.red, fontSize: "12px", fontWeight: "700" }}>✗ {score.wrong}</span>
            <span style={{ padding: "4px 10px", borderRadius: "20px", background: `${c.muted}20`, color: c.muted, fontSize: "12px", fontWeight: "700" }}>— {score.skipped}</span>
          </div>
        </header>

        {/* Progress bar */}
        <div style={{ height: "3px", background: c.border }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${c.blue}, ${c.green})`, transition: "width 0.4s ease" }} />
        </div>

        <main style={s.main}>
          {/* Question meta row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button onClick={() => setShowJump(!showJump)}
                style={{ ...s.iconBtn(), fontSize: "12px" }}>
                Q {current + 1}/{queue.length}
              </button>
              {showJump && (
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    type="number" min="1" max={queue.length}
                    value={jumpInput}
                    onChange={e => setJumpInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && jumpTo(parseInt(jumpInput) - 1)}
                    placeholder="Go to..."
                    autoFocus
                    style={{ width: "80px", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontSize: "13px" }}
                  />
                  <button onClick={() => jumpTo(parseInt(jumpInput) - 1)} style={{ ...s.btn(c.blue), padding: "6px 10px", fontSize: "12px" }}>Go</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: c.muted, fontVariantNumeric: "tabular-nums" }}>
                {!revealed ? `⏱ ${formatTime(questionTimer)}` : `⏱ ${formatTime(questionTimes[current] || 0)}`}
              </span>
              <button onClick={toggleFlag}
                style={{ ...s.iconBtn(isFlagged), fontSize: "14px" }}>
                {isFlagged ? "🔖" : "🏳"}
              </button>
              <span style={{ padding: "4px 10px", borderRadius: "20px", background: `${subjectColor}20`, color: subjectColor, fontSize: "11px", fontWeight: "700" }}>
                {SUBJECTS.find(sub => sub.code === q.subject_code)?.name || q.subject_code}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: c.surface, padding: "4px", borderRadius: "10px", border: `1px solid ${c.border}` }}>
            {["question", "explanation"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: "8px", borderRadius: "7px", border: "none", background: activeTab === tab ? c.border : "transparent", color: activeTab === tab ? c.text : c.muted, fontSize: "13px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize" }}>
                {tab === "question" ? "Question" : "Explanation"}
              </button>
            ))}
          </div>

          {activeTab === "question" ? (
            <>
              <div style={{ fontSize: "16px", fontWeight: "500", lineHeight: "1.65", marginBottom: "24px", color: c.text }}>
                {cleanQ}
              </div>

              {options.map((opt, i) => {
                let bg = c.surface, border = c.border, color = c.text;
                if (revealed) {
                  if (opt === correctOption) { bg = `${c.green}12`; border = c.green; color = c.green; }
                  else if (opt === selected && opt !== correctOption) { bg = `${c.red}12`; border = c.red; color = c.red; }
                }
                return (
                  <button key={i} onClick={() => handleSelect(opt)}
                    style={{ width: "100%", padding: "15px 18px", borderRadius: "12px", border: `2px solid ${border}`, background: bg, color, fontSize: "14px", fontWeight: "500", lineHeight: "1.5", textAlign: "left", cursor: revealed ? "default" : "pointer", marginBottom: "8px", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: revealed && opt === correctOption ? `${c.green}30` : revealed && opt === selected ? `${c.red}30` : c.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0, color: revealed && opt === correctOption ? c.green : revealed && opt === selected ? c.red : c.muted }}>
                      {labels[i]}
                    </span>
                    {opt}
                    {revealed && opt === correctOption && <span style={{ marginLeft: "auto", fontSize: "16px" }}>✓</span>}
                    {revealed && opt === selected && opt !== correctOption && <span style={{ marginLeft: "auto", fontSize: "16px" }}>✗</span>}
                  </button>
                );
              })}

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {!revealed && <button onClick={handleSkip} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: `2px solid ${c.border}`, background: "transparent", color: c.muted, fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Skip</button>}
                {revealed && (
                  <button onClick={next} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${c.blue}, #2E86C1)`, color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                    {current + 1 >= queue.length ? "See Results →" : "Next Question →"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: c.surface, borderRadius: "14px", border: `1px solid ${c.border}`, padding: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: c.blue, marginBottom: "12px" }}>Explanation</div>
              {revealed ? (
                <>
                  <div style={{ padding: "14px", borderRadius: "10px", background: `${c.green}10`, border: `1px solid ${c.green}30`, marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: c.muted, marginBottom: "4px", fontWeight: "600" }}>CORRECT ANSWER</div>
                    <div style={{ color: c.green, fontWeight: "600", fontSize: "14px" }}>{correctOption}</div>
                  </div>
                  <p style={{ color: c.muted, fontSize: "14px", lineHeight: "1.7" }}>
                    Detailed explanations coming soon. This question is from the {SUBJECTS.find(sub => sub.code === q.subject_code)?.name} subject bank.
                  </p>
                  <div style={{ marginTop: "16px", fontSize: "12px", color: c.muted }}>
                    Question ID: {q.filename?.replace("q_", "").replace(".png", "") || "—"}
                    {" · "}Time taken: {formatTime(questionTimes[current] || 0)}
                  </div>
                </>
              ) : (
                <p style={{ color: c.muted, fontSize: "14px" }}>Answer the question first to see the explanation.</p>
              )}
              {revealed && (
                <button onClick={next} style={{ marginTop: "20px", width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${c.blue}, #2E86C1)`, color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                  {current + 1 >= queue.length ? "See Results →" : "Next Question →"}
                </button>
              )}
            </div>
          )}

          {/* Question strip */}
          <div style={{ marginTop: "20px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {queue.map((_, i) => {
              let bg = c.border;
              if (answers[i]?.correct) bg = c.green;
              else if (answers[i] && !answers[i].correct) bg = answers[i].selected ? c.red : c.muted;
              if (i === current) bg = c.blue;
              return (
                <button key={i} onClick={() => jumpTo(i)}
                  style={{ width: "22px", height: "8px", borderRadius: "4px", background: bg, border: "none", cursor: "pointer", transition: "all 0.15s", opacity: i === current ? 1 : 0.7 }} />
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ── RESULT ──────────────────────────────────────────
  if (screen === "result") {
    const total = score.correct + score.wrong + score.skipped;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    const pass = pct >= 75;
    return (
      <div style={s.app}>
        <header style={s.header}>
          <div style={s.logo}><div style={s.logoIcon}>✈</div>ATPL Practice</div>
          <span style={{ fontSize: "12px", color: c.muted }}>Session complete</span>
        </header>
        <main style={s.main}>
          {/* Score card */}
          <div style={{ background: c.surface, borderRadius: "20px", padding: "36px", textAlign: "center", border: `1px solid ${c.border}`, marginBottom: "16px" }}>
            <div style={{ fontSize: "80px", fontWeight: "800", letterSpacing: "-4px", lineHeight: 1, color: pass ? c.green : c.red, marginBottom: "8px" }}>{pct}%</div>
            <div style={{ fontSize: "15px", color: c.muted, marginBottom: "28px" }}>{pass ? "🎉 Above passing threshold (75%)" : "Keep practicing — aim for 75%+"}</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Correct", value: score.correct, color: c.green },
                { label: "Wrong", value: score.wrong, color: c.red },
                { label: "Skipped", value: score.skipped, color: c.muted },
              ].map(stat => (
                <div key={stat.label} style={{ padding: "16px", borderRadius: "12px", background: `${stat.color}10`, border: `1px solid ${stat.color}30` }}>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: stat.color, letterSpacing: "-1px" }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: c.muted, fontWeight: "600", textTransform: "uppercase" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "24px", fontSize: "13px" }}>
              <div style={{ background: c.border, borderRadius: "10px", padding: "12px" }}>
                <div style={{ color: c.muted, marginBottom: "2px" }}>Total Time</div>
                <div style={{ fontWeight: "700", fontSize: "16px" }}>{formatTime(sessionTimer)}</div>
              </div>
              <div style={{ background: c.border, borderRadius: "10px", padding: "12px" }}>
                <div style={{ color: c.muted, marginBottom: "2px" }}>Avg per Question</div>
                <div style={{ fontWeight: "700", fontSize: "16px" }}>{formatTime(avgTime)}</div>
              </div>
            </div>
          </div>

          {/* Question review strip */}
          <div style={{ background: c.surface, borderRadius: "14px", padding: "20px", border: `1px solid ${c.border}`, marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: c.blue, marginBottom: "12px" }}>Question Breakdown</div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {queue.map((_, i) => {
                let bg = c.muted;
                if (answers[i]?.correct) bg = c.green;
                else if (answers[i]?.selected) bg = c.red;
                return <div key={i} style={{ width: "18px", height: "18px", borderRadius: "4px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#fff", fontWeight: "700" }}>{i + 1}</div>;
              })}
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "12px", color: c.muted }}>
              <span><span style={{ color: c.green }}>■</span> Correct</span>
              <span><span style={{ color: c.red }}>■</span> Wrong</span>
              <span><span style={{ color: c.muted }}>■</span> Skipped</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => startSession(false)} style={{ flex: 2, padding: "14px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${c.blue}, #2E86C1)`, color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
              Practice Again
            </button>
            <button onClick={() => setScreen("home")} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: `2px solid ${c.border}`, background: "transparent", color: c.muted, fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return <div style={{ ...s.app, alignItems: "center", justifyContent: "center" }}><div style={{ color: c.muted }}>Loading...</div></div>;
}
