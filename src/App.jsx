import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const SUBJECTS = [
  { code: "ALL", name: "All Subjects", color: "#4A90D9" },
  { code: "010", name: "Air Law", color: "#E74C3C" },
  { code: "031", name: "Mass & Balance", color: "#2ECC71" },
  { code: "032", name: "Performance", color: "#F39C12" },
];

async function fetchQuestions(subjectCode, limit = 2000) {
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

export default function ATPLApp() {
  const [screen, setScreen] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [questions, setQuestions] = useState([]);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [loading, setLoading] = useState(false);
  const [sessionSize, setSessionSize] = useState(20);

  const startSession = useCallback(async () => {
    setLoading(true);
    const data = await fetchQuestions(selectedSubject);
    const valid = data.filter(q => q.correct_answer && q.option_a);
    const shuffled = shuffle(valid).slice(0, sessionSize);
    setQuestions(data);
    setQueue(shuffled);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore({ correct: 0, wrong: 0, skipped: 0 });
    setLoading(false);
    setScreen("practice");
  }, [selectedSubject, sessionSize]);

  const q = queue[current];
  const options = q ? [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean) : [];
  const correctOption = q?.correct_answer;

  function handleSelect(opt) {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    if (opt === correctOption) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
    } else {
      setScore(s => ({ ...s, wrong: s.wrong + 1 }));
    }
  }

  function handleSkip() {
    if (revealed) return;
    setScore(s => ({ ...s, skipped: s.skipped + 1 }));
    next();
  }

  function next() {
    if (current + 1 >= queue.length) {
      setScreen("result");
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  const progress = queue.length ? ((current + (revealed ? 1 : 0)) / queue.length) * 100 : 0;
  const subjectInfo = SUBJECTS.find(s => s.code === selectedSubject);

  const styles = {
    app: { minHeight: "100vh", background: "#0A0E1A", color: "#E8EDF5", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" },
    header: { padding: "16px 24px", borderBottom: "1px solid #1E2535", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0D1120" },
    logo: { display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", fontWeight: "700", letterSpacing: "-0.3px" },
    logoIcon: { width: "32px", height: "32px", background: "linear-gradient(135deg, #4A90D9, #2ECC71)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" },
    main: { flex: 1, maxWidth: "720px", margin: "0 auto", width: "100%", padding: "32px 20px" },
    homeTitle: { fontSize: "36px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "8px", lineHeight: 1.1 },
    homeSubtitle: { color: "#7A8BA3", fontSize: "16px", marginBottom: "40px" },
    sectionLabel: { fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", color: "#4A90D9", marginBottom: "12px" },
    subjectGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "32px" },
    subjectCard: (code, sel) => ({ padding: "16px", borderRadius: "12px", border: `2px solid ${sel ? SUBJECTS.find(s => s.code === code)?.color || "#4A90D9" : "#1E2535"}`, background: sel ? `${SUBJECTS.find(s => s.code === code)?.color || "#4A90D9"}15` : "#0D1120", cursor: "pointer", transition: "all 0.15s" }),
    subjectCardName: { fontSize: "14px", fontWeight: "600", marginBottom: "4px" },
    subjectCardCount: { fontSize: "12px", color: "#7A8BA3" },
    sessionRow: { display: "flex", gap: "10px", marginBottom: "32px", flexWrap: "wrap" },
    sessionBtn: (active) => ({ padding: "8px 18px", borderRadius: "8px", border: `2px solid ${active ? "#4A90D9" : "#1E2535"}`, background: active ? "#4A90D915" : "transparent", color: active ? "#4A90D9" : "#7A8BA3", cursor: "pointer", fontSize: "14px", fontWeight: "600" }),
    startBtn: { width: "100%", padding: "16px", borderRadius: "12px", background: "linear-gradient(135deg, #4A90D9, #2E86C1)", border: "none", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer" },
    progressBar: { height: "3px", background: "#1E2535", borderRadius: "2px", marginBottom: "24px", overflow: "hidden" },
    progressFill: { height: "100%", background: "linear-gradient(90deg, #4A90D9, #2ECC71)", borderRadius: "2px", transition: "width 0.3s ease" },
    questionMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
    questionNum: { fontSize: "13px", color: "#7A8BA3", fontWeight: "600" },
    subjectBadge: (color) => ({ padding: "4px 10px", borderRadius: "20px", background: `${color}20`, color: color, fontSize: "12px", fontWeight: "600" }),
    questionText: { fontSize: "17px", fontWeight: "500", lineHeight: "1.6", marginBottom: "28px", color: "#E8EDF5" },
    optionBtn: (opt, rev, correct, sel) => {
      let bg = "#0D1120", border = "#1E2535", color = "#E8EDF5";
      if (rev) {
        if (opt === correct) { bg = "#2ECC7115"; border = "#2ECC71"; color = "#2ECC71"; }
        else if (opt === sel) { bg = "#E74C3C15"; border = "#E74C3C"; color = "#E74C3C"; }
      }
      return { width: "100%", padding: "16px 20px", borderRadius: "12px", border: `2px solid ${border}`, background: bg, color, fontSize: "15px", fontWeight: "500", lineHeight: "1.5", textAlign: "left", cursor: rev ? "default" : "pointer", marginBottom: "10px", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "12px" };
    },
    optionLabel: { width: "28px", height: "28px", borderRadius: "50%", background: "#1E2535", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0 },
    actionRow: { display: "flex", gap: "12px", marginTop: "8px" },
    skipBtn: { flex: 1, padding: "14px", borderRadius: "12px", border: "2px solid #1E2535", background: "transparent", color: "#7A8BA3", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
    nextBtn: { flex: 2, padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #4A90D9, #2E86C1)", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
    scoreRow: { display: "flex", gap: "8px", fontSize: "13px" },
    scoreItem: (color) => ({ padding: "4px 12px", borderRadius: "20px", background: `${color}20`, color, fontWeight: "600" }),
    resultCard: { background: "#0D1120", borderRadius: "20px", padding: "40px", textAlign: "center", border: "1px solid #1E2535" },
    resultScore: { fontSize: "72px", fontWeight: "800", letterSpacing: "-3px", lineHeight: 1, marginBottom: "8px" },
    resultLabel: { fontSize: "16px", color: "#7A8BA3", marginBottom: "32px" },
    resultGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" },
    resultStat: (color) => ({ padding: "20px", borderRadius: "12px", background: `${color}10`, border: `1px solid ${color}30` }),
    resultStatNum: (color) => ({ fontSize: "32px", fontWeight: "800", color, letterSpacing: "-1px" }),
    resultStatLabel: { fontSize: "12px", color: "#7A8BA3", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
    retryBtn: { padding: "14px 40px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #4A90D9, #2E86C1)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginRight: "12px" },
    homeBtn: { padding: "14px 40px", borderRadius: "12px", border: "2px solid #1E2535", background: "transparent", color: "#7A8BA3", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
  };

  if (screen === "home") return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.logo}><div style={styles.logoIcon}>✈</div>ATPL Practice</div>
        <div style={{ fontSize: "13px", color: "#7A8BA3" }}>2,380 questions</div>
      </header>
      <main style={styles.main}>
        <h1 style={styles.homeTitle}>Prepare for<br />your ATPL exam.</h1>
        <p style={styles.homeSubtitle}>Practice with real exam questions. Instant feedback.</p>
        <div style={styles.sectionLabel}>Select Subject</div>
        <div style={styles.subjectGrid}>
          {SUBJECTS.map(s => (
            <div key={s.code} style={styles.subjectCard(s.code, selectedSubject === s.code)} onClick={() => setSelectedSubject(s.code)}>
              <div style={{ ...styles.subjectCardName, color: selectedSubject === s.code ? s.color : "#E8EDF5" }}>{s.name}</div>
              <div style={styles.subjectCardCount}>{s.code === "ALL" ? "All 3 subjects" : s.code === "010" ? "1,274 questions" : s.code === "031" ? "400 questions" : "706 questions"}</div>
            </div>
          ))}
        </div>
        <div style={styles.sectionLabel}>Session Length</div>
        <div style={styles.sessionRow}>
          {[10, 20, 40, 60].map(n => <button key={n} style={styles.sessionBtn(sessionSize === n)} onClick={() => setSessionSize(n)}>{n} questions</button>)}
        </div>
        <button style={styles.startBtn} onClick={startSession} disabled={loading}>{loading ? "Loading..." : "Start Practice →"}</button>
      </main>
    </div>
  );

  if (screen === "practice" && q) {
    const labels = ["A", "B", "C", "D"];
    return (
      <div style={styles.app}>
        <header style={styles.header}>
  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    <button
      onClick={() => setScreen("home")}
      style={{ background: "transparent", border: "none", color: "#7A8BA3", cursor: "pointer", fontSize: "13px", fontWeight: "600", padding: "6px 12px", borderRadius: "8px", border: "1px solid #1E2535" }}
    >
      ← Exit
    </button>
    <div style={styles.logo}><div style={styles.logoIcon}>✈</div>ATPL Practice</div>
  </div>
  <div style={styles.scoreRow}>
    <span style={styles.scoreItem("#2ECC71")}>✓ {score.correct}</span>
    <span style={styles.scoreItem("#E74C3C")}>✗ {score.wrong}</span>
    <span style={styles.scoreItem("#7A8BA3")}>— {score.skipped}</span>
  </div>
</header>
        <main style={styles.main}>
          <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: `${progress}%` }} /></div>
          <div style={styles.questionMeta}>
            <span style={styles.questionNum}>Question {current + 1} of {queue.length}</span>
            <span style={styles.subjectBadge(subjectInfo?.color || "#4A90D9")}>{SUBJECTS.find(s => s.code === q.subject_code)?.name || q.subject_code}</span>
          </div>
          <div style={styles.questionText}>{q.question}</div>
          {options.map((opt, i) => (
            <button key={i} style={styles.optionBtn(opt, revealed, correctOption, selected)} onClick={() => handleSelect(opt)}>
              <span style={styles.optionLabel}>{labels[i]}</span>{opt}
            </button>
          ))}
          <div style={styles.actionRow}>
            {!revealed && <button style={styles.skipBtn} onClick={handleSkip}>Skip</button>}
            {revealed && <button style={styles.nextBtn} onClick={next}>{current + 1 >= queue.length ? "See Results →" : "Next Question →"}</button>}
          </div>
        </main>
      </div>
    );
  }

  if (screen === "result") {
    const total = score.correct + score.wrong + score.skipped;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    const pass = pct >= 75;
    return (
      <div style={styles.app}>
        <header style={styles.header}><div style={styles.logo}><div style={styles.logoIcon}>✈</div>ATPL Practice</div></header>
        <main style={styles.main}>
          <div style={styles.resultCard}>
            <div style={{ ...styles.resultScore, color: pass ? "#2ECC71" : "#E74C3C" }}>{pct}%</div>
            <div style={styles.resultLabel}>{pass ? "🎉 Well done! Above passing threshold." : "Keep practicing. Aim for 75%+"}</div>
            <div style={styles.resultGrid}>
              <div style={styles.resultStat("#2ECC71")}><div style={styles.resultStatNum("#2ECC71")}>{score.correct}</div><div style={styles.resultStatLabel}>Correct</div></div>
              <div style={styles.resultStat("#E74C3C")}><div style={styles.resultStatNum("#E74C3C")}>{score.wrong}</div><div style={styles.resultStatLabel}>Wrong</div></div>
              <div style={styles.resultStat("#7A8BA3")}><div style={styles.resultStatNum("#7A8BA3")}>{score.skipped}</div><div style={styles.resultStatLabel}>Skipped</div></div>
            </div>
            <button style={styles.retryBtn} onClick={startSession}>Practice Again</button>
            <button style={styles.homeBtn} onClick={() => setScreen("home")}>Home</button>
          </div>
        </main>
      </div>
    );
  }

  return <div style={{ ...styles.app, alignItems: "center", justifyContent: "center" }}><div style={{ color: "#7A8BA3" }}>Loading...</div></div>;
}