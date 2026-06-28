import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Target, Eye, EyeOff,
  CheckCircle, XCircle, SkipForward, BarChart3,
  Layers, Award, Flame, ChevronRight, RotateCcw,
  BookOpen, Clock, Zap
} from "lucide-react";

const T = {
  bg:"#09090B", panel:"#0F1014", card:"#131318", border:"#1C1C22",
  borderHi:"#2A2A35", text:"#F0F0F5", sub:"#8888A0", dim:"#444455",
  blue:"#3B9EFF", green:"#22C55E", red:"#EF4444", amber:"#F59E0B",
  white:"#FFFFFF", purple:"#A78BFA", cyan:"#06B6D4",
};

const SUBJECTS = [
  { code:"010", name:"Air Law",        color:"#FF6B6B", total:1274 },
  { code:"031", name:"Mass & Balance", color:"#4ECDC4", total:400  },
  { code:"032", name:"Performance",    color:"#FFD93D", total:706  },
];

const SUBTOPICS = {
  "010": [
    { code:"010-01", name:"International Law" },
    { code:"010-02", name:"Airworthiness of Aircraft" },
    { code:"010-03", name:"Nationality & Registration" },
    { code:"010-04", name:"Personnel Licensing" },
    { code:"010-05", name:"Rules of the Air" },
    { code:"010-06", name:"Procedures for Air Navigation" },
    { code:"010-07", name:"Air Traffic Services" },
    { code:"010-08", name:"Aerodromes" },
    { code:"010-09", name:"Facilitation" },
    { code:"010-10", name:"Search and Rescue" },
    { code:"010-11", name:"Security" },
    { code:"010-12", name:"Accident Investigation" },
  ],
  "031": [
    { code:"031-01", name:"Basics of Mass & Balance" },
    { code:"031-02", name:"Loading" },
    { code:"031-03", name:"Mass Calculations" },
    { code:"031-04", name:"CG & Trim Calculations" },
  ],
  "032": [
    { code:"032-01", name:"General & Definitions" },
    { code:"032-02", name:"Aerodrome Data" },
    { code:"032-03", name:"Take-Off" },
    { code:"032-04", name:"Climb" },
    { code:"032-05", name:"En-Route & Landing" },
    { code:"032-06", name:"Performance Class" },
  ],
};

function loadHistory() {
  try { const h = localStorage.getItem("atpl_history"); return h ? JSON.parse(h) : { seen:{}, incorrect:{}, sessions:[] }; }
  catch { return { seen:{}, incorrect:{}, sessions:[] }; }
}

function loadFlagged() {
  try { const f = localStorage.getItem("atpl_flagged"); return f ? new Set(JSON.parse(f)) : new Set(); }
  catch { return new Set(); }
}

function loadSessions() {
  try { const s = localStorage.getItem("atpl_sessions"); return s ? JSON.parse(s) : []; }
  catch { return []; }
}

function fmt(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

// ── COMPONENTS ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color=T.blue, icon, big=false }) {
  return (
    <div style={{ padding:"16px", borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontSize:10, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>{label}</div>
        {icon && <div style={{ color }}>{icon}</div>}
      </div>
      <div style={{ fontSize: big?36:28, fontWeight:800, color, letterSpacing:"-1px", lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.sub }}>{sub}</div>}
    </div>
  );
}

function AccuracyBar({ label, correct, total, color }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const pass = pct >= 75;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ fontSize:13, fontWeight:500, color:T.text }}>{label}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:T.sub }}>{correct}/{total} attempted</span>
          <span style={{
            fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:8,
            background: total===0 ? T.border : pass ? `${T.green}20` : `${T.red}20`,
            color: total===0 ? T.dim : pass ? T.green : T.red,
          }}>{total===0 ? "—" : `${pct}%`}</span>
        </div>
      </div>
      <div style={{ height:6, background:T.border, borderRadius:3, overflow:"hidden" }}>
        {total > 0 && (
          <div style={{
            height:"100%",
            width:`${pct}%`,
            background: pass ? T.green : pct > 50 ? T.amber : T.red,
            borderRadius:3,
            transition:"width 0.8s ease",
            boxShadow: pass ? `0 0 6px ${T.green}60` : "none",
          }}/>
        )}
      </div>
    </div>
  );
}

function DonutChart({ pct, size=120, color=T.blue, label, sublabel }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={10}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1s ease" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:22, fontWeight:800, color, letterSpacing:"-1px" }}>{pct}%</div>
        {label && <div style={{ fontSize:10, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>}
      </div>
    </div>
  );
}

// Horizontal bar for subtopic breakdown
function SubtopicBar({ topic, correct, attempted, color }) {
  const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const barWidth = attempted > 0 ? pct : 0;
  const pass = pct >= 75;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, color, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{topic.code}</span>
          <span style={{ fontSize:12, color:T.text }}>{topic.name}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:11, color:T.sub }}>{attempted > 0 ? `${correct}/${attempted}` : "—"}</span>
          {attempted > 0 && (
            <span style={{ fontSize:11, fontWeight:700, color: pass ? T.green : T.red, minWidth:32, textAlign:"right" }}>{pct}%</span>
          )}
        </div>
      </div>
      <div style={{ height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${barWidth}%`, background: attempted===0 ? "transparent" : pass ? T.green : pct > 50 ? T.amber : T.red, borderRadius:2, transition:"width 0.8s ease" }}/>
      </div>
    </div>
  );
}


// ── PERFORMANCE CHART ───────────────────────────────────────────────────────
function PerformanceChart({ sessions, subjectCode, color }) {
  if (!sessions || sessions.length === 0) return (
    <div style={{ padding:"20px", textAlign:"center", color:"#8888A0", fontSize:13 }}>
      No session data yet. Complete study sessions to see your trend.
    </div>
  );

  // Filter and sort by date, group by subject if specified
  const filtered = sessions
    .filter(s => !subjectCode || s.subject === subjectCode || subjectCode === "ALL")
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(-20); // last 20 sessions

  if (filtered.length < 2) return (
    <div style={{ padding:"20px", textAlign:"center", color:"#8888A0", fontSize:13 }}>
      Complete at least 2 sessions to see your accuracy trend.
    </div>
  );

  const data = filtered.map(s => ({
    date: new Date(s.date).toLocaleDateString("en-GB", { day:"numeric", month:"short" }),
    acc: s.score && s.score.correct + s.score.wrong > 0
      ? Math.round((s.score.correct / (s.score.correct + s.score.wrong)) * 100)
      : 0,
    total: s.score ? s.score.correct + s.score.wrong + s.score.skipped : 0,
  }));

  const W = 600, H = 160, PAD = { top:16, right:16, bottom:32, left:36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const minY = 0, maxY = 100;
  const xStep = innerW / (data.length - 1);

  function xPos(i) { return PAD.left + i * xStep; }
  function yPos(v) { return PAD.top + innerH - ((v - minY) / (maxY - minY)) * innerH; }

  // Build SVG path
  const points = data.map((d,i) => `${xPos(i)},${yPos(d.acc)}`).join(" ");
  const linePath = `M ${data.map((d,i) => `${xPos(i)} ${yPos(d.acc)}`).join(" L ")}`;
  const areaPath = `M ${xPos(0)} ${yPos(data[0].acc)} ${data.map((d,i) => `L ${xPos(i)} ${yPos(d.acc)}`).join(" ")} L ${xPos(data.length-1)} ${PAD.top+innerH} L ${xPos(0)} ${PAD.top+innerH} Z`;

  const latestAcc = data[data.length-1].acc;
  const firstAcc = data[0].acc;
  const trend = latestAcc - firstAcc;

  return (
    <div>
      {/* Trend summary */}
      <div style={{ display:"flex", gap:16, marginBottom:12 }}>
        <div style={{ fontSize:24, fontWeight:800, color:latestAcc>=75?"#22C55E":latestAcc>=50?"#F59E0B":"#EF4444", letterSpacing:"-1px" }}>{latestAcc}%</div>
        <div style={{ fontSize:12, color:"#8888A0", alignSelf:"center" }}>
          Latest accuracy
          {trend !== 0 && <span style={{ color:trend>0?"#22C55E":"#EF4444", marginLeft:6, fontWeight:600 }}>
            {trend>0?"▲":"▼"} {Math.abs(trend)}% vs first session
          </span>}
        </div>
      </div>

      {/* SVG chart */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
        {/* Grid lines */}
        {[0,25,50,75,100].map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={PAD.left+innerW} y2={yPos(v)}
              stroke="#1C1C22" strokeWidth="1" strokeDasharray={v===75?"4,4":"2,4"}/>
            <text x={PAD.left-6} y={yPos(v)+4} fontSize="10" fill="#444455" textAnchor="end">{v}</text>
            {v===75&&<text x={PAD.left+innerW+4} y={yPos(v)+4} fontSize="9" fill="#22C55E" textAnchor="start">pass</text>}
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`${color||"#3B9EFF"}20`}/>

        {/* Line */}
        <path d={linePath} fill="none" stroke={color||"#3B9EFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

        {/* Data points */}
        {data.map((d,i) => (
          <g key={i}>
            <circle cx={xPos(i)} cy={yPos(d.acc)} r="4" fill={color||"#3B9EFF"} stroke="#09090B" strokeWidth="2"/>
            {/* X axis labels — only show every Nth */}
            {(i === 0 || i === data.length-1 || (data.length <= 10) || i % Math.ceil(data.length/6) === 0) && (
              <text x={xPos(i)} y={H-6} fontSize="9" fill="#444455" textAnchor="middle">{d.date}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── MAIN STATS SCREEN ───────────────────────────────────────────────────────
export default function StatsScreen({ onClose, questionBank }) {
  const history  = loadHistory();
  const flagged  = loadFlagged();
  const sessions = loadSessions();
  const [chartSubject, setChartSubject] = useState("ALL");
  const [activeSubject, setActiveSubject] = useState(null);

  const totalSeen      = Object.keys(history.seen).length;
  const totalIncorrect = Object.keys(history.incorrect).length;
  const totalBank      = 2380;
  const totalUnseen    = totalBank - totalSeen;
  const totalCorrect   = totalSeen - totalIncorrect;
  const overallAcc     = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;

  // Per-subject stats derived from questionBank prop
  const subjectStats = SUBJECTS.map(sub => {
    const subQuestions = (questionBank || []).filter(q => q.subject_code === sub.code);
    const seenInSub    = subQuestions.filter(q => history.seen[q.id]);
    const incorrectInSub = subQuestions.filter(q => history.incorrect[q.id]);
    const correctInSub = seenInSub.length - incorrectInSub.length;
    const acc = seenInSub.length > 0 ? Math.round((correctInSub / seenInSub.length) * 100) : 0;
    return {
      ...sub,
      seen: seenInSub.length,
      correct: correctInSub,
      incorrect: incorrectInSub.length,
      unseen: sub.total - seenInSub.length,
      accuracy: acc,
    };
  });

  // Per-subtopic stats
  const subtopicStats = activeSubject ? SUBTOPICS[activeSubject]?.map(topic => {
    // Find questions that match this subtopic via classification
    const subQuestions = (questionBank || []).filter(q => {
      if (q.subject_code !== activeSubject) return false;
      return q._subtopic === topic.code; // pre-classified
    });
    const seen = subQuestions.filter(q => history.seen[q.id]);
    const incorrect = subQuestions.filter(q => history.incorrect[q.id]);
    const correct = seen.length - incorrect.length;
    return { topic, correct, attempted: seen.length };
  }) : [];

  const subInfo = activeSubject ? SUBJECTS.find(s => s.code === activeSubject) : null;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    button{font-family:inherit;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-thumb{background:#2A2A35;border-radius:2px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
    .fade-up{animation:fadeUp 0.35s ease forwards;}
  `;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"Inter,sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:"13px 22px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:T.panel, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <BarChart3 size={16} color={T.blue}/>
          <span style={{ fontSize:14, fontWeight:700 }}>Statistics</span>
        </div>
        <button onClick={onClose} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.sub, cursor:"pointer", fontSize:13 }}>
          Back
        </button>
      </div>

      <div style={{ maxWidth:780, margin:"0 auto", padding:"22px" }}>

        {/* ── OVERALL OVERVIEW ── */}
        <div className="fade-up" style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>
            <Target size={12} color={T.sub}/>Overall Performance
          </div>

          <div style={{ display:"flex", gap:16, marginBottom:16, alignItems:"center", padding:"24px", borderRadius:16, background:T.card, border:`1px solid ${T.border}` }}>
            <DonutChart
              pct={overallAcc}
              size={130}
              color={overallAcc >= 75 ? T.green : overallAcc >= 50 ? T.amber : T.red}
              label="Accuracy"
            />
            <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ padding:"14px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Questions Seen</div>
                <div style={{ fontSize:26, fontWeight:800, color:T.blue, letterSpacing:"-1px" }}>{totalSeen.toLocaleString()}</div>
                <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>of {totalBank.toLocaleString()} total</div>
              </div>
              <div style={{ padding:"14px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Unseen</div>
                <div style={{ fontSize:26, fontWeight:800, color:T.amber, letterSpacing:"-1px" }}>{totalUnseen.toLocaleString()}</div>
                <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>questions remaining</div>
              </div>
              <div style={{ padding:"14px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Correct</div>
                <div style={{ fontSize:26, fontWeight:800, color:T.green, letterSpacing:"-1px" }}>{totalCorrect.toLocaleString()}</div>
                <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>of questions seen</div>
              </div>
              <div style={{ padding:"14px", borderRadius:10, background:T.panel, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Need Review</div>
                <div style={{ fontSize:26, fontWeight:800, color:T.red, letterSpacing:"-1px" }}>{totalIncorrect.toLocaleString()}</div>
                <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>marked incorrect</div>
              </div>
            </div>
          </div>

          {/* Progress towards full bank */}
          <div style={{ padding:"16px", borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text }}>Question Bank Progress</div>
              <span style={{ fontSize:12, color:T.sub }}>{Math.round((totalSeen/totalBank)*100)}% of bank covered</span>
            </div>
            <div style={{ height:8, background:T.border, borderRadius:4, overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", display:"flex" }}>
                <div style={{ width:`${Math.round((totalCorrect/totalBank)*100)}%`, background:T.green, transition:"width 1s ease" }}/>
                <div style={{ width:`${Math.round((totalIncorrect/totalBank)*100)}%`, background:T.red, transition:"width 1s ease" }}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:16, fontSize:11, color:T.sub }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:T.green, display:"inline-block" }}/> Correct</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:T.red, display:"inline-block" }}/> Incorrect</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:T.border, display:"inline-block" }}/> Unseen</span>
            </div>
          </div>
        </div>

        {/* ── PER-SUBJECT BREAKDOWN ── */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>
            <BookOpen size={12} color={T.sub}/>Per-Subject Performance
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {subjectStats.map(sub => (
              <div key={sub.code}
                onClick={() => setActiveSubject(activeSubject === sub.code ? null : sub.code)}
                style={{ padding:"16px 18px", borderRadius:12, background:T.card, border:`1px solid ${activeSubject===sub.code ? sub.color+"50" : T.border}`, cursor:"pointer", transition:"all 0.2s" }}>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:sub.color }}/>
                    <span style={{ fontSize:14, fontWeight:600, color:T.text }}>{sub.name}</span>
                    <span style={{ fontSize:10, color:sub.color, fontWeight:700, padding:"2px 7px", borderRadius:6, background:`${sub.color}15`, border:`1px solid ${sub.color}30` }}>{sub.code}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:20, fontWeight:800, color: sub.seen===0 ? T.dim : sub.accuracy>=75 ? T.green : sub.accuracy>=50 ? T.amber : T.red, letterSpacing:"-0.5px" }}>
                        {sub.seen===0 ? "—" : `${sub.accuracy}%`}
                      </div>
                      <div style={{ fontSize:10, color:T.sub }}>{sub.seen} seen of {sub.total}</div>
                    </div>
                    <ChevronRight size={14} color={T.sub} style={{ transform: activeSubject===sub.code ? "rotate(90deg)" : "rotate(0)", transition:"transform 0.2s" }}/>
                  </div>
                </div>

                <AccuracyBar label="" correct={sub.correct} total={sub.seen} color={sub.color}/>

                <div style={{ display:"flex", gap:16, fontSize:11, color:T.sub, marginTop:8 }}>
                  <span style={{ color:T.green }}>✓ {sub.correct} correct</span>
                  <span style={{ color:T.red }}>✗ {sub.incorrect} incorrect</span>
                  <span style={{ color:T.amber }}>{sub.unseen} unseen</span>
                  {flagged.size>0 && <span style={{ color:T.amber }}>🔖 {sub.code}</span>}
                </div>

                {/* Sub-topic breakdown (expanded) */}
                {activeSubject===sub.code && SUBTOPICS[sub.code] && (
                  <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:10, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>
                      <Layers size={11} color={T.sub}/>Sub-topic Breakdown
                    </div>
                    {SUBTOPICS[sub.code].map(topic => {
                      // Count from history using the question bank
                      const topicQs = (questionBank||[]).filter(q => q.subject_code === sub.code && q._subtopic === topic.code);
                      const attempted = topicQs.filter(q => history.seen[q.id]).length;
                      const incorrect = topicQs.filter(q => history.incorrect[q.id]).length;
                      const correct = attempted - incorrect;
                      return <SubtopicBar key={topic.code} topic={topic} correct={correct} attempted={attempted} color={sub.color}/>;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>
            <Zap size={12} color={T.sub}/>Quick Stats
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            <StatCard label="Accuracy" value={`${overallAcc}%`} sub="across all subjects" color={overallAcc>=75?T.green:overallAcc>=50?T.amber:T.red} icon={<TrendingUp size={14}/>}/>
            <StatCard label="Flagged" value={flagged.size} sub="marked for review" color={T.amber} icon={<Award size={14}/>}/>
            <StatCard label="Coverage" value={`${Math.round((totalSeen/totalBank)*100)}%`} sub={`${totalUnseen} unseen`} color={T.blue} icon={<Eye size={14}/>}/>
          </div>
        </div>

        {/* ── WEAK AREAS ── */}
        {totalSeen > 0 && (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>
              <Target size={12} color={T.sub}/>Focus Areas
            </div>
            <div style={{ padding:"16px", borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
              {subjectStats.filter(s=>s.seen>0).length === 0 ? (
                <p style={{ color:T.sub, fontSize:13 }}>No data yet. Start studying to see focus areas.</p>
              ) : (
                subjectStats.filter(s=>s.seen>0).sort((a,b)=>a.accuracy-b.accuracy).map(sub => (
                  <div key={sub.code} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, padding:"12px", borderRadius:10, background:T.panel, border:`1px solid ${sub.accuracy<75?T.red+"30":T.border}` }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background: sub.accuracy>=75?`${T.green}15`:`${T.red}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {sub.accuracy >= 75 ? <CheckCircle size={16} color={T.green}/> : <XCircle size={16} color={T.red}/>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{sub.name}</div>
                      <div style={{ fontSize:11, color:T.sub }}>
                        {sub.accuracy >= 75
                          ? `On track — ${sub.accuracy}% accuracy`
                          : `Needs work — ${sub.accuracy}% accuracy (${Math.ceil(sub.seen*0.75)-sub.correct} more correct needed)`}
                      </div>
                    </div>
                    <span style={{ fontSize:16, fontWeight:800, color: sub.accuracy>=75?T.green:sub.accuracy>=50?T.amber:T.red }}>{sub.seen===0?"—":`${sub.accuracy}%`}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── PERFORMANCE CHARTS ── */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>
            <TrendingUp size={12} color={T.sub}/>Performance Over Time
          </div>
          <div style={{ padding:"20px", borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
            {/* Subject filter for chart */}
            <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {[{code:"ALL",name:"All",color:T.blue},...SUBJECTS].map(s=>(
                <button key={s.code} onClick={()=>setChartSubject(s.code)}
                  style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${chartSubject===s.code?s.color+"60":T.border}`, background:chartSubject===s.code?`${s.color}15`:T.panel, color:chartSubject===s.code?s.color:T.sub, fontSize:12, fontWeight:chartSubject===s.code?600:400, cursor:"pointer" }}>
                  {s.name}
                </button>
              ))}
            </div>
            <PerformanceChart
              sessions={sessions}
              subjectCode={chartSubject}
              color={SUBJECTS.find(s=>s.code===chartSubject)?.color||T.blue}
            />
          </div>
        </div>

        {/* ── RESET ── */}
        <div style={{ padding:"16px", borderRadius:12, background:T.card, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Reset Statistics</div>
            <div style={{ fontSize:12, color:T.sub }}>Clears all seen/incorrect history. Flagged questions are kept.</div>
          </div>
          <button onClick={() => {
            if(window.confirm("Reset all statistics? This cannot be undone.")) {
              localStorage.setItem("atpl_history", JSON.stringify({seen:{},incorrect:{}}));
              window.location.reload();
            }
          }} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.red}40`, background:"transparent", color:T.red, cursor:"pointer", fontSize:13, fontWeight:600, flexShrink:0 }}>
            <RotateCcw size={13} style={{ marginRight:5, verticalAlign:"middle" }}/>Reset
          </button>
        </div>
      </div>
    </div>
  );
}
