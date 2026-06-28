import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plane, BookOpen, MessageSquare, ChevronRight, ChevronLeft,
  Clock, CheckCircle, XCircle, SkipForward, Home,
  BarChart3, Bookmark, BookmarkCheck, Pin, PinOff,
  TrendingUp, RotateCcw, X, Send, User, ThumbsUp,
  GraduationCap, Timer, AlertTriangle, Flag, Eye,
  Circle, Zap, Filter, Image, ImageOff, EyeOff,
  AlertCircle, ChevronDown, ChevronUp, Layers, Activity
} from "lucide-react";
import StatsScreen from "./Stats.jsx";
import AuthScreen from "./Auth.jsx";
import { pullProgress, pushProgress, signOut } from "./useSync.js";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

// ── EXAM SPECS ────────────────────────────────────────────────────────────
const EXAM_SPECS = {
  "010": { name:"Air Law",         questions:44, minutes:60,  color:"#FF6B6B", bg:"#2A1010" },
  "031": { name:"Mass & Balance",  questions:25, minutes:60,  color:"#4ECDC4", bg:"#0A2422" },
  "032": { name:"Performance",     questions:35, minutes:60,  color:"#FFD93D", bg:"#2A2000" },
};

// ── SUBJECTS ──────────────────────────────────────────────────────────────
const SUBJECTS = [
  { code:"ALL",  name:"All Subjects",   short:"ALL",  color:"#3B9EFF", bg:"#0F2040", count:2380 },
  { code:"010",  name:"Air Law",        short:"010",  color:"#FF6B6B", bg:"#2A1010", count:1274 },
  { code:"031",  name:"Mass & Balance", short:"031",  color:"#4ECDC4", bg:"#0A2422", count:400  },
  { code:"032",  name:"Performance",    short:"032",  color:"#FFD93D", bg:"#2A2000", count:706  },
];

// ── OFFICIAL EASA SUB-TOPICS ──────────────────────────────────────────────
const SUBTOPICS = {
  "010": [
    { code:"010-01", name:"International Law",             keywords:["chicago convention","icao annex","sovereignty","contracting state","bilateral agreement","international air law","article 83","article 12"] },
    { code:"010-02", name:"Airworthiness of Aircraft",     keywords:["certificate of airworthiness","airworthiness directive","airworthy","noise certificate","type certificate","maintenance release","airworthiness certificate"] },
    { code:"010-03", name:"Nationality & Registration",    keywords:["nationality mark","registration mark","aircraft registration","registered in","nationality and registration","common mark"] },
    { code:"010-04", name:"Personnel Licensing",           keywords:["atpl","type rating","class rating","instrument rating","flight instructor","flight examiner","medical certificate","class 1 medical","class 2 medical","licence privileges","revalidation","licence holder","pilot licence"] },
    { code:"010-05", name:"Rules of the Air",              keywords:["right of way","collision avoidance","vmc minima","vfr flight","ifr flight","cruising level","semicircular","minimum flight altitude","low flying","aerobatic","formation flight","wake turbulence category","separation minima","prohibited area","restricted area","danger area"] },
    { code:"010-06", name:"Procedures for Air Navigation", keywords:["flight plan","altimeter setting","qnh","qfe","transition altitude","transition level","speed limit","position report","ats flight plan","rfpl","repetitive flight"] },
    { code:"010-07", name:"Air Traffic Services",          keywords:["air traffic control","atc clearance","atc instruction","radar service","transponder","squawk","mode c","flight information service","alerting service","approach control","aerodrome control","control zone","ats route"] },
    { code:"010-08", name:"Aerodromes",                    keywords:["runway","taxiway","apron","papi","vasis","approach lighting","aerodrome lighting","aerodrome sign","aerodrome marking","threshold","declared distance","tora","toda","asda","rescue and fire","rffs","category for rescue","aerodrome category"] },
    { code:"010-09", name:"Facilitation",                  keywords:["facilitation","customs","immigration","passport","annex 9","unidentified baggage","crew member certificate"] },
    { code:"010-10", name:"Search and Rescue",             keywords:["search and rescue","sar","elt","epirb","distress signal","emergency signal","interception","ground-air signal","ground - air visual","visual signal code","mayday","survival"] },
    { code:"010-11", name:"Security",                      keywords:["security","hijack","unlawful interference","sabotage","threat assessment","aviation security"] },
    { code:"010-12", name:"Accident Investigation",        keywords:["accident investigation","annex 13","accident notification","occurrence report","serious incident"] },
  ],
  "031": [
    { code:"031-01", name:"Basics of Mass & Balance",     keywords:["centre of gravity","center of gravity","cg ","c.g.","basic empty mass","dry operating mass","dom ","zero fuel mass","zfm","maximum structural"] },
    { code:"031-02", name:"Loading",                      keywords:["load","payload","passenger","baggage","cargo","freight","compartment","loading","container","pallet"] },
    { code:"031-03", name:"Mass Calculations",            keywords:["take-off mass","landing mass","maximum take-off","mtom","mtow","mlm","mzfw","operating mass","actual mass","regulated mass","performance limited","structural limited"] },
    { code:"031-04", name:"CG & Trim Calculations",      keywords:["moment","datum","arm ","index","trim","mac","mean aerodynamic chord","lemac","forward cg","aft cg","cg limit","cg range","balance","station"] },
  ],
  "032": [
    { code:"032-01", name:"General & Definitions",       keywords:["definition","wet runway","dry runway","contaminated","braking","coefficient","screen height","obstacle clearance height"] },
    { code:"032-02", name:"Aerodrome Data",              keywords:["aerodrome elevation","runway slope","pressure altitude","density altitude","field elevation"] },
    { code:"032-03", name:"Take-Off",                    keywords:["take-off","takeoff","v1","vr ","v2 ","balanced field","accelerate stop","asdr","todr","vmcg","vmca","one engine","engine failure","decision speed"] },
    { code:"032-04", name:"Climb",                       keywords:["climb gradient","second segment","third segment","final segment","service ceiling","absolute ceiling","drift down","en route obstacle","net climb","gross climb"] },
    { code:"032-05", name:"En-Route & Landing",          keywords:["landing distance","approach speed","vat ","vref","ldr","ldm","go-around","missed approach","en-route","endurance","fuel consumption"] },
    { code:"032-06", name:"Performance Class",           keywords:["class a","class b","class c","performance class","single engine","multi engine","commuter"] },
  ],
};

function classifySubtopic(subjectCode, questionText) {
  const topics = SUBTOPICS[subjectCode];
  if (!topics || !questionText) return null;
  const lower = questionText.toLowerCase();
  for (const topic of topics) {
    for (const kw of topic.keywords) {
      if (lower.includes(kw)) return topic.code;
    }
  }
  return topics[0].code;
}

// ── FILTERS ───────────────────────────────────────────────────────────────
const FILTERS = [
  { id:"all",        label:"All Questions",       },
  { id:"figures",    label:"With Figures",        },
  { id:"no_figures", label:"Without Figures",     },
  { id:"unseen",     label:"Previously Unseen",   },
  { id:"incorrect",  label:"Incorrectly Answered",},
  { id:"flagged",    label:"Marked for Review",   },
];

const FIGURE_KEYWORDS = ["refer to figure","refer to fig","see figure","figure ","fig.","diagram","chart below","table below","illustration","refer to the figure","the figure shows"];
function hasFigure(q) { if(!q)return false; const l=q.toLowerCase(); return FIGURE_KEYWORDS.some(k=>l.includes(k)); }

// ── THEME ─────────────────────────────────────────────────────────────────
const T = {
  bg:"#09090B", panel:"#0F1014", card:"#131318", border:"#1C1C22",
  borderHi:"#2A2A35", text:"#F0F0F5", sub:"#8888A0", dim:"#444455",
  blue:"#3B9EFF", green:"#22C55E", red:"#EF4444", amber:"#F59E0B",
  white:"#FFFFFF", purple:"#A78BFA", cyan:"#06B6D4",
};

// Dynamic theme colors
function getTheme(theme) {
  if (theme === "light") return {
    bg:"#F4F6FA", panel:"#FFFFFF", card:"#FFFFFF", border:"#E2E8F0",
    borderHi:"#CBD5E0", text:"#1A202C", sub:"#718096", dim:"#A0AEC0",
    blue:"#2B6CB0", green:"#276749", red:"#C53030", amber:"#B7791F",
    white:"#FFFFFF", purple:"#553C9A", cyan:"#086F83",
  };
  return {
    bg:"#09090B", panel:"#0F1014", card:"#131318", border:"#1C1C22",
    borderHi:"#2A2A35", text:"#F0F0F5", sub:"#8888A0", dim:"#444455",
    blue:"#3B9EFF", green:"#22C55E", red:"#EF4444", amber:"#F59E0B",
    white:"#FFFFFF", purple:"#A78BFA", cyan:"#06B6D4",
  };
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  button{font-family:inherit;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#2A2A35;border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  @keyframes slideIn{from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:translateX(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  .fade-up{animation:fadeUp 0.35s ease forwards;}
  .slide-in{animation:slideIn 0.25s ease forwards;}
  .hov:hover{opacity:0.8;}
  .opt-btn:not([disabled]):hover{border-color:#2A2A40!important;background:#131320!important;}
  .warn-pulse{animation:pulse 1.5s ease infinite;}
`;

// ── PERSISTENCE ───────────────────────────────────────────────────────────
function loadHistory(){try{const h=localStorage.getItem("atpl_history");return h?JSON.parse(h):{seen:{},incorrect:{}};}catch{return{seen:{},incorrect:{}};}}
function saveHistory(h){try{localStorage.setItem("atpl_history",JSON.stringify(h));}catch{}}
function loadFlagged(){try{const f=localStorage.getItem("atpl_flagged");return f?new Set(JSON.parse(f)):new Set();}catch{return new Set();}}
function saveFlagged(f){try{localStorage.setItem("atpl_flagged",JSON.stringify([...f]));}catch{}}

// ── HELPERS ───────────────────────────────────────────────────────────────
async function fetchQ(code){
  // Paginate to get all rows — Supabase free tier caps at 1000 per request
  const PAGE = 1000;
  let all = [], offset = 0, done = false;
  while(!done){
    let url=`${SUPABASE_URL}/rest/v1/questions?select=*&limit=${PAGE}&offset=${offset}&order=id`;
    if(code!=="ALL")url+=`&subject_code=eq.${code}`;
    const r=await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Range-Unit":"items"}});
    const batch=await r.json();
    if(!Array.isArray(batch)||batch.length===0){done=true;}
    else{all=[...all,...batch];offset+=batch.length;if(batch.length<PAGE)done=true;}
  }
  return all;
}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function fmt(s){return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function clean(t){if(!t)return"";return t.replace(/^(N[°v"'`]+\s*\d+\s*[@©]?\s*[\d:]*\s*)/i,"").replace(/^(Q\s+\d+\/\d+\s+N[°v"'`]+\s*\d+\s*[@©]?\s*[\d:]*\s*)/i,"").replace(/^(—\s*QUESTIGN?.*?[\d:]+\s*)/i,"").trim();}
function extractID(f){if(!f)return null;return parseInt(f.replace("q_","").replace(".png",""),10)||null;}

// ── VISUAL COMPONENTS ─────────────────────────────────────────────────────

function Horizon({pitch=0,roll=0,size=100}){
  const cx=size/2,cy=size/2,r=size*0.46,pitchPx=(pitch/30)*r;
  return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block"}}>
    <defs>
      <clipPath id="hc"><circle cx={cx} cy={cy} r={r}/></clipPath>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A3A6B"/><stop offset="100%" stopColor="#2E5FA3"/></linearGradient>
      <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5C3A1E"/><stop offset="100%" stopColor="#3D2610"/></linearGradient>
    </defs>
    <rect x={cx-r*2} y={cy-r*2} width={r*4} height={r*4} fill="url(#sky)" clipPath="url(#hc)"/>
    <g clipPath="url(#hc)" transform={`rotate(${roll} ${cx} ${cy})`}>
      <rect x={cx-r*2} y={cy+pitchPx} width={r*4} height={r*4} fill="url(#gnd)"/>
      <line x1={cx-r*2} y1={cy+pitchPx} x2={cx+r*2} y2={cy+pitchPx} stroke="#4ECDC4" strokeWidth="1.5" opacity="0.8"/>
      {[-20,-10,10,20].map(p=><line key={p} x1={cx-12} y1={cy+pitchPx+(p/30)*r} x2={cx+12} y2={cy+pitchPx+(p/30)*r} stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>)}
    </g>
    <g transform={`translate(${cx},${cy})`}>
      <line x1="-18" y1="0" x2="-7" y2="0" stroke="#FFD93D" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="7" y1="0" x2="18" y2="0" stroke="#FFD93D" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="0" cy="0" r="3" fill="#FFD93D"/>
      <line x1="0" y1="-5" x2="0" y2="-11" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round"/>
    </g>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.borderHi} strokeWidth="1"/>
    <g transform={`rotate(${roll} ${cx} ${cy})`}><polygon points={`${cx},${cy-r+2} ${cx-5},${cy-r+10} ${cx+5},${cy-r+10}`} fill="#FFD93D" opacity="0.8"/></g>
  </svg>);
}

function PRing({pct,size=36,stroke=3,color=T.blue}){
  const r=(size-stroke)/2,circ=2*Math.PI*r,offset=circ-(pct/100)*circ;
  return(<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.5s ease"}}/>
  </svg>);
}

function TimerRing({remaining,total,size=52}){
  const r=(size-5)/2,circ=2*Math.PI*r,pct=remaining/total,offset=circ-(pct*circ);
  const color=pct>0.5?T.green:pct>0.25?T.amber:T.red;
  return(<div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.5s"}}/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <Clock size={10} color={color} style={{marginBottom:1}}/>
      <span style={{fontSize:10,fontWeight:700,color,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{fmt(remaining)}</span>
    </div>
  </div>);
}

function Slider({value,max,onChange}){
  const pct=max>1?((value-1)/(max-1))*100:0;
  return(<div>
    <style>{`.qs{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:3px;background:${T.border};outline:none;cursor:pointer;}.qs::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:${T.blue};cursor:pointer;box-shadow:0 0 8px ${T.blue}60;}.qs::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${T.blue};cursor:pointer;border:none;}.qs::-webkit-slider-runnable-track{background:linear-gradient(to right,${T.blue} 0%,${T.blue} ${pct}%,${T.border} ${pct}%,${T.border} 100%);border-radius:3px;height:5px;}`}</style>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div>
        <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px"}}>Number of Questions</div>
        <div style={{fontSize:10,color:T.dim,marginTop:2}}>{max.toLocaleString()} available</div>
      </div>
      <div style={{padding:"3px 12px",borderRadius:20,background:`${T.blue}15`,border:`1px solid ${T.blue}40`}}>
        <span style={{fontSize:15,fontWeight:800,color:T.blue}}>{value}</span>
        <span style={{fontSize:11,color:T.sub,marginLeft:3}}>/ {max}</span>
      </div>
    </div>
    <input type="range" min="1" max={max} value={Math.min(value,max)} onChange={e=>onChange(parseInt(e.target.value))} className="qs"/>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:10,color:T.dim}}>
      <span>1</span><span>{Math.round(max/2)}</span><span>{max}</span>
    </div>
  </div>);
}

// ── SUBTOPIC PICKER ────────────────────────────────────────────────────────
function SubtopicPicker({ subjectCode, pool, activeSubtopic, onSelect }) {
  const [open, setOpen] = useState(false);
  const topics = SUBTOPICS[subjectCode];
  if (!topics || subjectCode === "ALL") return null;

  // Count questions per subtopic
  const counts = {};
  pool.forEach(q => {
    const code = classifySubtopic(subjectCode, q.question);
    if (code) counts[code] = (counts[code]||0) + 1;
  });

  const activeName = activeSubtopic
    ? topics.find(t=>t.code===activeSubtopic)?.name
    : "All Sub-topics";

  return (
    <div style={{position:"relative"}}>
      <div style={{fontSize:10,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
        <Layers size={11} color={T.sub}/>Sub-topic Drill-down
      </div>
      <button onClick={()=>setOpen(!open)} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"9px 12px", borderRadius:9,
        border:`1px solid ${activeSubtopic ? T.purple+"60" : T.border}`,
        background: activeSubtopic ? `${T.purple}10` : T.panel,
        color: activeSubtopic ? T.purple : T.sub,
        cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.15s",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Layers size={12} color={activeSubtopic?T.purple:T.sub}/>
          <span>{activeName}</span>
        </div>
        {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"100%", left:0, right:0, zIndex:20,
          marginTop:4, background:T.card, border:`1px solid ${T.border}`,
          borderRadius:10, overflow:"hidden",
          boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {/* All sub-topics option */}
          <button onClick={()=>{onSelect(null);setOpen(false);}} style={{
            width:"100%", padding:"10px 14px", background: activeSubtopic===null?`${T.blue}10`:T.card,
            border:"none", borderBottom:`1px solid ${T.border}`,
            color:activeSubtopic===null?T.blue:T.sub, fontSize:12, fontWeight:600,
            textAlign:"left", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span>All Sub-topics</span>
            <span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10,background:T.border,color:T.sub}}>{pool.length}</span>
          </button>

          {topics.map(topic => {
            const count = counts[topic.code] || 0;
            const active = activeSubtopic === topic.code;
            return (
              <button key={topic.code} onClick={()=>{onSelect(topic.code);setOpen(false);}}
                style={{
                  width:"100%", padding:"10px 14px",
                  background:active?`${T.purple}10`:T.card,
                  border:"none", borderBottom:`1px solid ${T.border}`,
                  color:active?T.purple:T.text, fontSize:12,
                  textAlign:"left", cursor:"pointer", opacity:count===0?0.4:1,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  transition:"background 0.1s",
                }}>
                <div>
                  <span style={{fontSize:10,color:active?T.purple:T.dim,fontWeight:700,marginRight:8}}>{topic.code}</span>
                  <span style={{fontWeight:active?600:400}}>{topic.name}</span>
                </div>
                <span style={{
                  fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:10, flexShrink:0,
                  background:active?`${T.purple}20`:T.border,
                  color:active?T.purple:T.dim,
                }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentsTab(){
  const [text,setText]=useState("");
  const [comments,setComments]=useState([
    {id:1,user:"CadetA320",text:"Remember this from JAA docs Chapter 4.",time:"2h ago",likes:3},
    {id:2,user:"PilotStudy",text:"Think ICAO annex structure and the answer follows.",time:"5h ago",likes:7},
  ]);
  const [likes,setLikes]=useState({});
  function submit(){if(!text.trim())return;setComments(c=>[...c,{id:Date.now(),user:"You",text:text.trim(),time:"just now",likes:0}]);setText("");}
  return(<div>
    <div style={{fontSize:11,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",color:T.sub,marginBottom:12,display:"flex",alignItems:"center",gap:5}}><MessageSquare size={12} color={T.sub}/>Comments ({comments.length})</div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
      {comments.map(c=>(<div key={c.id} style={{padding:"11px 13px",borderRadius:10,background:T.card,border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:T.borderHi,display:"flex",alignItems:"center",justifyContent:"center"}}><User size={10} color={T.sub}/></div>
            <span style={{fontSize:12,fontWeight:600}}>{c.user}</span>
          </div>
          <span style={{fontSize:11,color:T.dim}}>{c.time}</span>
        </div>
        <div style={{fontSize:13,color:T.sub,lineHeight:1.6,marginBottom:6}}>{c.text}</div>
        <button onClick={()=>setLikes(l=>({...l,[c.id]:(l[c.id]||0)+1}))} style={{display:"flex",alignItems:"center",gap:4,background:"transparent",border:"none",color:T.dim,cursor:"pointer",fontSize:11}}>
          <ThumbsUp size={10}/>{c.likes+(likes[c.id]||0)}
        </button>
      </div>))}
    </div>
    <div style={{display:"flex",gap:8}}>
      <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Add a comment..."
        style={{flex:1,padding:"9px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:13,outline:"none"}}/>
      <button onClick={submit} style={{padding:"9px 12px",borderRadius:10,border:`1px solid ${T.blue}50`,background:`${T.blue}15`,color:T.blue,cursor:"pointer"}}><Send size={13}/></button>
    </div>
  </div>);
}

function ProgressStrip({queue,answers,current}){
  return(<div style={{display:"flex",gap:2,padding:"8px 20px",borderTop:`1px solid ${T.border}`,background:T.panel}}>
    {queue.map((_,i)=>{
      let bg=T.dim;
      if(answers[i]?.correct)bg=T.green;
      else if(answers[i]?.selected)bg=T.red;
      if(i===current)bg=T.blue;
      return <div key={i} style={{flex:1,height:4,borderRadius:2,background:bg,transition:"background 0.3s",boxShadow:i===current?`0 0 4px ${T.blue}`:"none"}}/>;
    })}
  </div>);
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
export default function App(){
  const [screen,        setScreen]       = useState("home");
  const [subject,       setSubject]      = useState("ALL");
  const [activeFilter,  setActiveFilter] = useState("all");
  const [activeSubtopic,setActiveSubtopic]=useState(null);
  const [sessLen,       setSessLen]      = useState(20);
  const [examSubject,   setExamSubject]  = useState("010");
  const [allPool,       setAllPool]      = useState([]);
  const [filteredPool,  setFilteredPool] = useState([]);
  const [maxQ,          setMaxQ]         = useState(2380);
  const [loading,       setLoading]      = useState(false);
  const [history,       setHistory]      = useState(()=>loadHistory());
  const [flagged,       setFlagged]      = useState(()=>loadFlagged());
  const [pinned,        setPinned]       = useState(new Set());

  // Study state
  const [queue,   setQueue]   = useState([]);
  const [idx,     setIdx]     = useState(0);
  const [sel,     setSel]     = useState(null);
  const [revealed,setRevealed]= useState(false);
  const [tab,     setTab]     = useState("question");
  const [score,   setScore]   = useState({correct:0,wrong:0,skipped:0});
  const [answers, setAnswers] = useState({});
  const [sSec,    setSSec]    = useState(0);
  const [qSec,    setQSec]    = useState(0);
  const [qTimes,  setQTimes]  = useState({});

  // Exam state
  const [examQ,         setExamQ]        = useState([]);
  const [examIdx,       setExamIdx]      = useState(0);
  const [examAns,       setExamAns]      = useState({});
  const [examFlagged,   setExamFlagged]  = useState(new Set());
  const [examRemaining, setExamRemaining]= useState(0);
  const [examSubmitted, setExamSubmitted]= useState(false);
  const [showExamGrid,  setShowExamGrid] = useState(false);
  const [showConfirm,   setShowConfirm]  = useState(false);
  const [reviewIdx,     setReviewIdx]    = useState(0);
  const [examTimeTaken, setExamTimeTaken]= useState(0);
  const [horizAnim,     setHorizAnim]    = useState({pitch:0,roll:0});

  // Theme
  const [theme, setTheme] = useState(()=>localStorage.getItem("atpl_theme")||"dark");

  // Streak
  const [streak, setStreak] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("atpl_streak")||'{"count":0,"lastDate":null}'); }
    catch { return {count:0,lastDate:null}; }
  });

  // Exam countdown
  const [examDate, setExamDate] = useState(()=>localStorage.getItem("atpl_examdate")||"");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Auth state
  const [authSession,   setAuthSession]  = useState(()=>{
    try { const s=localStorage.getItem("atpl_session"); return s?JSON.parse(s):null; } catch { return null; }
  });
  const [syncStatus,    setSyncStatus]   = useState(null); // null | "syncing" | "synced" | "error"

  const sRef=useRef(null),qRef=useRef(null),hRef=useRef(null),eTimerRef=useRef(null);

  // Dynamic theme — recalculated on every render when theme changes
  const TH = getTheme(theme);

  useEffect(()=>{saveHistory(history);},[history]);
  useEffect(()=>{localStorage.setItem("atpl_theme",theme);},[theme]);
  useEffect(()=>{localStorage.setItem("atpl_examdate",examDate);},[examDate]);
  useEffect(()=>{saveFlagged(flagged);},[flagged]);

  // ── AUTH HANDLERS ──────────────────────────────────────────────────────────
  async function handleAuth(session) {
    // Save session token
    localStorage.setItem("atpl_session", JSON.stringify(session));
    setAuthSession(session);
    setSyncStatus("syncing");
    try {
      // Pull cloud progress and merge with local
      const cloud = await pullProgress(session.access_token);
      if (cloud) {
        const local = loadHistory();
        const localFlagged = loadFlagged();
        // Merge: union of seen/incorrect, cloud wins on conflicts
        const merged = {
          seen:      { ...local.seen,      ...cloud.seen },
          incorrect: { ...local.incorrect, ...cloud.incorrect },
        };
        const mergedFlagged = new Set([...localFlagged, ...(cloud.flagged||[])]);
        saveHistory(merged);
        saveFlagged(mergedFlagged);
        setHistory(merged);
        setFlagged(mergedFlagged);
      }
      setSyncStatus("synced");
    } catch { setSyncStatus("error"); }
    setScreen("home");
  }

  async function handleSignOut() {
    if (authSession) {
      try { await signOut(authSession.access_token); } catch {}
    }
    localStorage.removeItem("atpl_session");
    setAuthSession(null);
    setSyncStatus(null);
  }

  async function syncToCloud() {
    if (!authSession) return;
    setSyncStatus("syncing");
    try {
      const h = loadHistory();
      const f = loadFlagged();
      const s = JSON.parse(localStorage.getItem("atpl_sessions")||"[]");
      const ok = await pushProgress(authSession.access_token, authSession.user?.id || authSession.user_id, {
        seen: h.seen, incorrect: h.incorrect, flagged: [...f], sessions: s,
      });
      setSyncStatus(ok ? "synced" : "error");
    } catch { setSyncStatus("error"); }
  }

  // Auto-sync every time history changes (debounced)
  useEffect(()=>{
    if(!authSession) return;
    const t = setTimeout(()=>syncToCloud(), 3000);
    return ()=>clearTimeout(t);
  },[history, flagged]);

  // Horizon animation
  useEffect(()=>{
    if(screen==="home"){let t=0;hRef.current=setInterval(()=>{t+=0.02;setHorizAnim({pitch:Math.sin(t*0.7)*6,roll:Math.sin(t*0.4)*8});},50);return()=>clearInterval(hRef.current);}
  },[screen]);

  // Study timers
  useEffect(()=>{if(screen==="study"){sRef.current=setInterval(()=>setSSec(s=>s+1),1000);return()=>clearInterval(sRef.current);};},[screen]);
  useEffect(()=>{if(screen==="study"){setQSec(0);clearInterval(qRef.current);qRef.current=setInterval(()=>setQSec(s=>s+1),1000);return()=>clearInterval(qRef.current);};},[idx,screen]);

  // Exam timer
  useEffect(()=>{
    if(screen==="exam"&&!examSubmitted&&examRemaining>0){
      eTimerRef.current=setInterval(()=>setExamRemaining(r=>{if(r<=1){clearInterval(eTimerRef.current);submitExam(true);return 0;}return r-1;}),1000);
      return()=>clearInterval(eTimerRef.current);
    }
  },[screen,examSubmitted]);

  // Fetch pool when subject changes
  useEffect(()=>{
    setLoading(true);
    fetchQ(subject).then(data=>{
      const valid=data.filter(q=>q.correct_answer&&q.option_a).map(q=>({
        ...q,
        _subtopic: classifySubtopic(q.subject_code, q.question)
      }));
      setAllPool(valid);
      setLoading(false);
    });
  },[subject]);

  // Apply filter + subtopic whenever pool/filter/subtopic/history/flagged change
  useEffect(()=>{
    let pool=[...allPool];

    // Apply subtopic filter first
    if(activeSubtopic&&subject!=="ALL"){
      pool=pool.filter(q=>classifySubtopic(q.subject_code||subject,q.question)===activeSubtopic);
    }

    // Apply question filter
    switch(activeFilter){
      case "figures":    pool=pool.filter(q=>hasFigure(q.question)); break;
      case "no_figures": pool=pool.filter(q=>!hasFigure(q.question)); break;
      case "unseen":     pool=pool.filter(q=>!history.seen[q.id]); break;
      case "incorrect":  pool=pool.filter(q=>history.incorrect[q.id]); break;
      case "flagged":    pool=pool.filter(q=>flagged.has(q.id)); break;
      default: break;
    }

    setFilteredPool(pool);
    const newMax=Math.max(1,pool.length);
    setMaxQ(newMax);
    setSessLen(s=>Math.min(s,newMax));
  },[allPool,activeFilter,activeSubtopic,history,flagged,subject]);

  // Filter counts (against subtopic-filtered pool)
  const subtopicPool = activeSubtopic&&subject!=="ALL"
    ? allPool.filter(q=>classifySubtopic(q.subject_code||subject,q.question)===activeSubtopic)
    : allPool;

  const filterCounts={
    all:        subtopicPool.length,
    figures:    subtopicPool.filter(q=>hasFigure(q.question)).length,
    no_figures: subtopicPool.filter(q=>!hasFigure(q.question)).length,
    unseen:     subtopicPool.filter(q=>!history.seen[q.id]).length,
    incorrect:  subtopicPool.filter(q=>history.incorrect[q.id]).length,
    flagged:    subtopicPool.filter(q=>flagged.has(q.id)).length,
  };

  const filterColors={all:T.blue,figures:T.purple,no_figures:T.sub,unseen:T.cyan,incorrect:T.red,flagged:T.amber};

  // ── STREAK ────────────────────────────────────────────────────────────────
  function updateStreak() {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now()-86400000).toISOString().split("T")[0];
    setStreak(s => {
      let newStreak;
      if (s.lastDate === today) return s; // already counted today
      else if (s.lastDate === yesterday) newStreak = { count: s.count + 1, lastDate: today };
      else newStreak = { count: 1, lastDate: today }; // streak broken
      localStorage.setItem("atpl_streak", JSON.stringify(newStreak));
      return newStreak;
    });
  }

  // ── SPACED REPETITION SHUFFLE ──────────────────────────────────────────
  function spacedShuffle(pool, count) {
    // Weight: wrong = 3x, unseen = 1x, correct (seen+not wrong) = 0.3x
    const weighted = [];
    pool.forEach(q => {
      const isWrong   = history.incorrect[q.id];
      const isSeen    = history.seen[q.id];
      const isCorrect = isSeen && !isWrong;
      const weight = isWrong ? 3 : isCorrect ? 0.3 : 1;
      const copies = Math.max(1, Math.round(weight * 10));
      for (let i = 0; i < copies; i++) weighted.push(q);
    });
    const shuffled = shuffle(weighted);
    // Deduplicate preserving spaced order
    const seen = new Set();
    const result = [];
    for (const q of shuffled) {
      if (!seen.has(q.id)) { seen.add(q.id); result.push(q); }
      if (result.length >= count) break;
    }
    return result;
  }

  // ── QUICK 10 ───────────────────────────────────────────────────────────
  function startQuick10() {
    if (!allPool.length) return;
    const pool = spacedShuffle(allPool, 10);
    setQueue(pool); setIdx(0); setSel(null); setRevealed(false);
    setTab("question"); setScore({correct:0,wrong:0,skipped:0});
    setAnswers({}); setSSec(0); setQSec(0); setQTimes({});
    updateStreak();
    setScreen("study");
  }

  // ── EXAM COUNTDOWN ─────────────────────────────────────────────────────
  function getDaysRemaining() {
    if (!examDate) return null;
    const diff = new Date(examDate) - new Date();
    return Math.ceil(diff / 86400000);
  }

  function getDailyTarget() {
    const days = getDaysRemaining();
    if (!days || days <= 0) return null;
    const unseen = 2380 - Object.keys(history.seen).length;
    return Math.ceil(unseen / days);
  }

  // ── WEAK AREA DETECTION ────────────────────────────────────────────────
  function getWeakestSubtopic() {
    const totalSeen = Object.keys(history.seen).length;
    if (totalSeen < 20) return null; // need enough data
    let worst = null, worstAcc = 100;
    ["010","031","032"].forEach(subCode => {
      const subQ = allPool.filter(q => q.subject_code === subCode);
      const subtopics = SUBTOPICS[subCode] || [];
      subtopics.forEach(topic => {
        const topicQ = subQ.filter(q => q._subtopic === topic.code);
        const seen = topicQ.filter(q => history.seen[q.id]);
        if (seen.length < 5) return; // need enough data per topic
        const incorrect = topicQ.filter(q => history.incorrect[q.id]).length;
        const acc = Math.round(((seen.length - incorrect) / seen.length) * 100);
        if (acc < worstAcc) { worst = { ...topic, subCode, acc, seen: seen.length }; worstAcc = acc; }
      });
    });
    return worst;
  }

  // Study helpers
  function startStudy(){
    if(!filteredPool.length)return;
    const pool=spacedShuffle(filteredPool,sessLen);
    updateStreak();
    setQueue(pool);setIdx(0);setSel(null);setRevealed(false);
    setTab("question");setScore({correct:0,wrong:0,skipped:0});
    setAnswers({});setSSec(0);setQSec(0);setQTimes({});
    setScreen("study");
  }

  const q=queue[idx],opts=q?[q.option_a,q.option_b,q.option_c,q.option_d].filter(Boolean):[],correct=q?.correct_answer;
  const subInfo=SUBJECTS.find(s=>s.code===(q?.subject_code||subject))||SUBJECTS[0];
  const isFlagged=q&&flagged.has(q.id),isPinned=q&&pinned.has(q.id);
  const pct=queue.length?Math.round((idx/queue.length)*100):0;
  const labels=["A","B","C","D"],qID=q?extractID(q.filename):null,qHasFig=q?hasFigure(q.question):false;
  const qSubtopicCode=q?classifySubtopic(q.subject_code||subject,q.question):null;
  const qSubtopicName=qSubtopicCode?SUBTOPICS[q?.subject_code]?.find(t=>t.code===qSubtopicCode)?.name:null;
  const avgStudyTime=Object.values(qTimes).length?Math.round(Object.values(qTimes).reduce((a,b)=>a+b,0)/Object.values(qTimes).length):0;

  function pick(opt){
    if(revealed)return;
    setSel(opt);setRevealed(true);
    const ok=opt===correct;
    setScore(s=>({...s,[ok?"correct":"wrong"]:s[ok?"correct":"wrong"]+1}));
    setAnswers(a=>({...a,[idx]:{selected:opt,correct:ok}}));
    setQTimes(t=>({...t,[idx]:qSec}));
    clearInterval(qRef.current);
    if(q){setHistory(h=>{const nh={...h,seen:{...h.seen,[q.id]:true}};if(!ok)nh.incorrect={...h.incorrect,[q.id]:true};else{const ni={...h.incorrect};delete ni[q.id];nh.incorrect=ni;}return nh;});}
  }
  function skip(){if(revealed)return;setScore(s=>({...s,skipped:s.skipped+1}));setAnswers(a=>({...a,[idx]:{selected:null,correct:false}}));setQTimes(t=>({...t,[idx]:qSec}));if(q)setHistory(h=>({...h,seen:{...h.seen,[q.id]:true}}));goNext();}
  function goPrev(){if(idx===0)return;const p=idx-1;setIdx(p);setSel(answers[p]?.selected||null);setRevealed(!!answers[p]);setTab("question");}
  function goNext(){if(idx+1>=queue.length){clearInterval(sRef.current);clearInterval(qRef.current);setScreen("result_study");}else{setIdx(i=>i+1);setSel(null);setRevealed(false);setTab("question");}}
  function toggleFlag(){if(!q)return;setFlagged(f=>{const n=new Set(f);n.has(q.id)?n.delete(q.id):n.add(q.id);return n;});}
  function togglePin(){if(!q)return;setPinned(p=>{const n=new Set(p);n.has(q.id)?n.delete(q.id):n.add(q.id);return n;});}
  function exitStudy(){clearInterval(sRef.current);clearInterval(qRef.current);setScreen("home");}

  // Exam helpers
  async function startExam(){
    setLoading(true);
    const spec=EXAM_SPECS[examSubject];
    const data=await fetchQ(examSubject);
    const valid=data.filter(q=>q.correct_answer&&q.option_a);
    const pool=shuffle(valid).slice(0,Math.min(spec.questions,valid.length));
    setExamQ(pool);setExamIdx(0);setExamAns({});setExamFlagged(new Set());
    setExamRemaining(spec.minutes*60);setExamSubmitted(false);
    setShowExamGrid(false);setShowConfirm(false);setExamTimeTaken(0);
    setLoading(false);setScreen("exam");
  }

  const eq=examQ[examIdx],eopts=eq?[eq.option_a,eq.option_b,eq.option_c,eq.option_d].filter(Boolean):[];
  const eSpec=EXAM_SPECS[examSubject]||EXAM_SPECS["010"],eTotalSec=eSpec.minutes*60;
  const eAnswered=Object.keys(examAns).length,eTimeWarning=examRemaining<=300;
  const eCorrect=examQ.filter((q,i)=>examAns[i]===q.correct_answer).length;
  const eWrong=examQ.filter((q,i)=>examAns[i]&&examAns[i]!==q.correct_answer).length;
  const eSkipped=examQ.length-eCorrect-eWrong;
  const eScorePct=examQ.length?Math.round((eCorrect/examQ.length)*100):0;
  const ePass=eScorePct>=75;

  function submitExam(auto=false){
    if(!auto&&!showConfirm){setShowConfirm(true);return;}
    clearInterval(eTimerRef.current);
    setExamTimeTaken(eTotalSec-examRemaining);
    examQ.forEach((q,i)=>{
      const ua=examAns[i];
      setHistory(h=>{const nh={...h,seen:{...h.seen,[q.id]:true}};if(ua&&ua!==q.correct_answer)nh.incorrect={...h.incorrect,[q.id]:true};else if(ua){const ni={...h.incorrect};delete ni[q.id];nh.incorrect=ni;}return nh;});
    });
    setExamSubmitted(true);setScreen("result_exam");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════
  if(screen==="auth") return(
    <AuthScreen
      onAuth={handleAuth}
    />
  );

  // ═══════════════════════════════════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════════════════════════════════
  if(screen==="home") {
    const daysLeft = getDaysRemaining();
    const dailyTarget = getDailyTarget();
    const weakSpot = getWeakestSubtopic();
    const isDark = theme === "dark";
    const TH = getTheme(theme);

    return(
    <div style={{minHeight:"100vh",background:TH.bg,color:TH.text,fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS + (theme==="light"?`body{background:#F4F6FA;}`:"")}</style>

      {/* HEADER */}
      <div style={{padding:"11px 20px",borderBottom:`1px solid ${TH.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:TH.panel}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#1A3A6B,#2E5FA3)",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${TH.blue}40`}}><Plane size={14} color={TH.blue} strokeWidth={2}/></div>
          <div><div style={{fontSize:14,fontWeight:700,color:TH.text}}>ATPL Practice</div></div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {/* Streak */}
          {streak.count>0&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,background:TH.card,border:`1px solid ${TH.border}`,fontSize:12,color:TH.amber,fontWeight:700}}>
            🔥 {streak.count}
          </div>}
          {/* Sync status */}
          {authSession&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,background:TH.card,border:`1px solid ${TH.border}`,fontSize:11}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:syncStatus==="synced"?TH.green:syncStatus==="syncing"?TH.amber:syncStatus==="error"?TH.red:TH.dim}}/>
            <span style={{color:TH.sub}}>{syncStatus==="synced"?"Synced":syncStatus==="syncing"?"Syncing...":"Offline"}</span>
          </div>}
          {/* Theme toggle */}
          <button onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} style={{padding:"5px 9px",borderRadius:8,border:`1px solid ${TH.border}`,background:TH.card,color:TH.sub,cursor:"pointer",fontSize:13}}>
            {isDark?"☀":"🌙"}
          </button>
          <button onClick={()=>setScreen("stats")} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,border:`1px solid ${TH.border}`,background:TH.card,color:TH.sub,cursor:"pointer",fontSize:12,fontWeight:600}}>
            <Activity size={13}/>Stats
          </button>
          {authSession
            ? <button onClick={handleSignOut} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${TH.border}`,background:TH.card,color:TH.sub,cursor:"pointer",fontSize:12,fontWeight:600}}>Sign out</button>
            : <button onClick={()=>setScreen("auth")} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,border:`1px solid ${TH.blue}50`,background:`${TH.blue}10`,color:TH.blue,cursor:"pointer",fontSize:12,fontWeight:600}}>Sign in</button>
          }
        </div>
      </div>

      <div style={{flex:1,maxWidth:820,margin:"0 auto",width:"100%",padding:"18px 20px"}}>

        {/* HERO + QUICK ACTIONS */}
        <div className="fade-up" style={{display:"flex",alignItems:"center",gap:18,marginBottom:16,padding:"18px",borderRadius:14,background:TH.card,border:`1px solid ${TH.border}`}}>
          <div style={{flexShrink:0}}><Horizon pitch={horizAnim.pitch} roll={horizAnim.roll} size={90}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"2px",textTransform:"uppercase",color:TH.blue,marginBottom:4}}>Preflight Check</div>
            <h1 style={{fontSize:22,fontWeight:800,lineHeight:1.15,letterSpacing:"-0.5px",marginBottom:6,color:TH.text}}>Ready for your ATPL exam?</h1>
            <p style={{fontSize:12,color:TH.sub,lineHeight:1.6,marginBottom:12}}>Real exam questions. Smart filters, sub-topic drill-down, EASA exam simulation.</p>
            {/* Quick 10 */}
            <button onClick={startQuick10} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:`1px solid ${TH.green}50`,background:`${TH.green}15`,color:TH.green,fontSize:13,fontWeight:700,cursor:"pointer"}}>
              <Zap size={13}/>Quick 10 — Random Questions
            </button>
          </div>
        </div>

        {/* STREAK + COUNTDOWN ROW */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {/* Streak card */}
          <div style={{padding:"14px",borderRadius:12,background:TH.card,border:`1px solid ${TH.border}`}}>
            <div style={{fontSize:10,color:TH.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Study Streak</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:32,fontWeight:800,color:streak.count>0?TH.amber:TH.dim,letterSpacing:"-1px"}}>🔥 {streak.count}</div>
              <div style={{fontSize:12,color:TH.sub}}>{streak.count===1?"day":"days"} in a row{streak.count===0?" — start today!":""}</div>
            </div>
            {streak.lastDate&&<div style={{fontSize:10,color:TH.dim,marginTop:4}}>Last studied: {streak.lastDate}</div>}
          </div>

          {/* Exam countdown */}
          <div style={{padding:"14px",borderRadius:12,background:TH.card,border:`1px solid ${TH.border}`}}>
            <div style={{fontSize:10,color:TH.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Exam Countdown</div>
            {examDate && daysLeft !== null ? (
              <div>
                <div style={{fontSize:28,fontWeight:800,color:daysLeft<=7?TH.red:daysLeft<=30?TH.amber:TH.blue,letterSpacing:"-1px",marginBottom:2}}>{daysLeft>0?daysLeft:"Today!"} <span style={{fontSize:14,fontWeight:500,color:TH.sub}}>{daysLeft>0?"days left":""}</span></div>
                {dailyTarget&&<div style={{fontSize:11,color:TH.sub}}>Target: <span style={{color:TH.text,fontWeight:600}}>{dailyTarget} questions/day</span> to cover all unseen</div>}
                <button onClick={()=>{setExamDate("");}} style={{fontSize:10,color:TH.dim,background:"transparent",border:"none",cursor:"pointer",marginTop:4,padding:0}}>Clear date</button>
              </div>
            ) : (
              <div>
                <div style={{fontSize:12,color:TH.sub,marginBottom:8}}>Set your exam date for a daily target.</div>
                <input type="date" value={examDate} onChange={e=>setExamDate(e.target.value)}
                  style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${TH.border}`,background:TH.panel,color:TH.text,fontSize:13,width:"100%",outline:"none"}}/>
              </div>
            )}
          </div>
        </div>

        {/* WEAK AREA ALERT */}
        {weakSpot&&(
          <div style={{padding:"12px 16px",borderRadius:12,background:`${TH.red}10`,border:`1px solid ${TH.red}30`,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:TH.red,marginBottom:2}}>Weak Area Detected</div>
              <div style={{fontSize:12,color:TH.sub}}>Your weakest sub-topic is <span style={{color:TH.text,fontWeight:600}}>{weakSpot.code} {weakSpot.name}</span> — {weakSpot.acc}% accuracy ({weakSpot.seen} questions seen)</div>
            </div>
            <button onClick={()=>{setSubject(weakSpot.subCode);setActiveSubtopic(weakSpot.code);setActiveFilter("all");setSessLen(20);startStudy();}}
              style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${TH.red}50`,background:`${TH.red}15`,color:TH.red,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,marginLeft:12}}>
              Drill it
            </button>
          </div>
        )}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* STUDY PANEL */}
          <div style={{padding:"18px",borderRadius:14,background:TH.card,border:`1px solid ${TH.border}`,display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:7,background:`${TH.blue}15`,border:`1px solid ${TH.blue}30`,display:"flex",alignItems:"center",justifyContent:"center"}}><BookOpen size={13} color={TH.blue}/></div>
              <div><div style={{fontSize:13,fontWeight:700}}>Study Mode</div><div style={{fontSize:11,color:TH.sub}}>Practice at your own pace</div></div>
            </div>

            {/* Subject */}
            <div>
              <div style={{fontSize:10,color:TH.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>Subject</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {SUBJECTS.map(s=>{const active=subject===s.code;return(
                  <div key={s.code} onClick={()=>{setSubject(s.code);setActiveSubtopic(null);setActiveFilter("all");}}
                    style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",border:`1px solid ${active?s.color+"50":TH.border}`,background:active?s.bg:TH.panel,transition:"all 0.15s"}}>
                    <div style={{fontSize:11,fontWeight:600,color:active?s.color:TH.sub}}>{s.name}</div>
                    <div style={{fontSize:10,color:TH.dim}}>{s.count.toLocaleString()} Q</div>
                  </div>
                );})}
              </div>
            </div>

            {/* Sub-topic drill-down */}
            <SubtopicPicker
              subjectCode={subject}
              pool={allPool}
              activeSubtopic={activeSubtopic}
              onSelect={(code)=>{setActiveSubtopic(code);setActiveFilter("all");}}
            />

            {/* Question filters */}
            <div>
              <div style={{fontSize:10,color:TH.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7,display:"flex",alignItems:"center",gap:4}}><Filter size={11} color={TH.sub}/>Question Filter</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {FILTERS.map(f=>{
                  const count=filterCounts[f.id];
                  const active=activeFilter===f.id;
                  const color=filterColors[f.id]||TH.blue;
                  const disabled=count===0;
                  return(
                    <button key={f.id} onClick={()=>!disabled&&setActiveFilter(f.id)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",border:`1px solid ${active?color+"50":TH.border}`,background:active?`${color}10`:TH.panel,transition:"all 0.15s",opacity:disabled?0.4:1}}>
                      <span style={{flex:1,fontSize:12,fontWeight:active?600:400,color:active?color:TH.sub,textAlign:"left"}}>{f.label}</span>
                      <span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10,background:active?`${color}20`:TH.border,color:active?color:TH.dim}}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider */}
            <div style={{padding:"12px",borderRadius:10,background:TH.panel,border:`1px solid ${TH.border}`}}>
              <Slider value={sessLen} max={maxQ} onChange={setSessLen}/>
            </div>

            <button onClick={startStudy} disabled={loading||filteredPool.length===0}
              style={{padding:"12px",borderRadius:10,border:`1px solid ${TH.blue}50`,background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:TH.white,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:filteredPool.length===0?0.5:1}}>
              <Zap size={13}/>{loading?"Loading...":filteredPool.length===0?"No questions match":"Start Studying"}
            </button>
          </div>

          {/* EXAM PANEL */}
          <div style={{padding:"18px",borderRadius:14,background:TH.card,border:`1px solid ${TH.border}`,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:7,background:`${TH.amber}15`,border:`1px solid ${TH.amber}30`,display:"flex",alignItems:"center",justifyContent:"center"}}><GraduationCap size={13} color={TH.amber}/></div>
              <div><div style={{fontSize:13,fontWeight:700}}>Exam Mode</div><div style={{fontSize:11,color:TH.sub}}>Official EASA format</div></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {Object.entries(EXAM_SPECS).map(([code,spec])=>{const active=examSubject===code;return(
                <div key={code} onClick={()=>setExamSubject(code)}
                  style={{padding:"10px 12px",borderRadius:9,cursor:"pointer",border:`1px solid ${active?spec.color+"50":TH.border}`,background:active?`${spec.color}08`:TH.panel,transition:"all 0.15s",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:active?spec.color:TH.text}}>{spec.name}</div>
                    <div style={{fontSize:10,color:TH.dim,marginTop:1}}><span style={{color:active?spec.color:TH.sub,fontWeight:600}}>{spec.questions}Q</span>{" · "}{spec.minutes} min</div>
                  </div>
                  {active&&<CheckCircle size={13} color={spec.color}/>}
                </div>
              );})}
            </div>
            <div style={{padding:"9px 12px",borderRadius:8,background:TH.panel,border:`1px solid ${TH.border}`}}>
              <div style={{display:"flex",gap:14,fontSize:12}}>
                <div><span style={{color:TH.sub}}>Questions: </span><span style={{fontWeight:700}}>{EXAM_SPECS[examSubject]?.questions}</span></div>
                <div><span style={{color:TH.sub}}>Time: </span><span style={{fontWeight:700}}>{EXAM_SPECS[examSubject]?.minutes} min</span></div>
                <div><span style={{color:TH.sub}}>Pass: </span><span style={{fontWeight:700,color:TH.green}}>75%</span></div>
              </div>
            </div>
            <div style={{padding:"9px 12px",borderRadius:8,background:`${TH.amber}08`,border:`1px solid ${TH.amber}25`,fontSize:12,color:TH.sub}}>No answers shown during exam. Submit to see results and review all answers.</div>
            {Object.keys(history.seen).length>0&&(
              <div style={{padding:"9px 12px",borderRadius:8,background:TH.panel,border:`1px solid ${TH.border}`,fontSize:12}}>
                <div style={{color:TH.sub,marginBottom:4,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>Your History</div>
                <div style={{display:"flex",gap:14}}>
                  <div><span style={{color:TH.blue,fontWeight:700}}>{Object.keys(history.seen).length}</span><span style={{color:TH.sub}}> seen</span></div>
                  <div><span style={{color:TH.red,fontWeight:700}}>{Object.keys(history.incorrect).length}</span><span style={{color:TH.sub}}> incorrect</span></div>
                  <div><span style={{color:TH.amber,fontWeight:700}}>{flagged.size}</span><span style={{color:TH.sub}}> flagged</span></div>
                </div>
              </div>
            )}
            <button onClick={startExam} disabled={loading}
              style={{padding:"12px",borderRadius:10,border:`1px solid ${TH.amber}50`,background:"linear-gradient(135deg,#92400E,#B45309)",color:TH.white,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:"auto"}}>
              <Timer size={13}/>{loading?"Loading...":"Begin Exam"}
            </button>
            <button onClick={()=>setHistory({seen:{},incorrect:{}})} style={{padding:"7px",borderRadius:8,border:`1px solid ${TH.border}`,background:"transparent",color:TH.dim,fontSize:11,cursor:"pointer",fontWeight:500}}>Reset study history</button>
          </div>
        </div>
      </div>
    </div>
  ); }

  // ═══════════════════════════════════════════════════════════════════════
  // STUDY
  // ═══════════════════════════════════════════════════════════════════════
  if(screen==="study"&&q) return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.panel,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={exitStudy} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:13,fontWeight:500}}><X size={13}/>Exit</button>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,background:T.card,border:`1px solid ${T.border}`}}><Clock size={12} color={T.sub}/><span style={{fontSize:12,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt(sSec)}</span></div>
          {activeSubtopic&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:6,background:`${T.purple}15`,border:`1px solid ${T.purple}40`,fontSize:11,color:T.purple,fontWeight:600}}><Layers size={11}/>{activeSubtopic}</div>}
          {activeFilter!=="all"&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:6,background:`${filterColors[activeFilter]}15`,border:`1px solid ${filterColors[activeFilter]}40`,fontSize:11,color:filterColors[activeFilter],fontWeight:600}}><Filter size={11}/>{FILTERS.find(f=>f.id===activeFilter)?.label}</div>}
        </div>
        <div style={{display:"flex",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,background:"#0A2010",border:`1px solid ${T.green}30`}}><CheckCircle size={12} color={T.green}/><span style={{fontSize:12,fontWeight:700,color:T.green}}>{score.correct}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,background:"#200A0A",border:`1px solid ${T.red}30`}}><XCircle size={12} color={T.red}/><span style={{fontSize:12,fontWeight:700,color:T.red}}>{score.wrong}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,background:T.card,border:`1px solid ${T.border}`}}><SkipForward size={12} color={T.sub}/><span style={{fontSize:12,fontWeight:600,color:T.sub}}>{score.skipped}</span></div>
        </div>
      </div>
      <div style={{height:2,background:T.border}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${T.blue},${T.green})`,transition:"width 0.5s",boxShadow:`0 0 6px ${T.blue}60`}}/></div>

      <div style={{flex:1,maxWidth:760,margin:"0 auto",width:"100%",padding:"20px 20px 0"}}>
        {/* Meta row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <PRing pct={pct} size={34} stroke={3} color={T.blue}/>
              <div><div style={{fontSize:12,fontWeight:700}}>{idx+1}<span style={{color:T.sub,fontWeight:400}}> / {queue.length}</span></div><div style={{fontSize:10,color:T.sub}}>question</div></div>
            </div>
            {qID&&<div style={{padding:"3px 7px",borderRadius:6,background:T.card,border:`1px solid ${T.border}`,fontSize:11,color:T.dim}}>N° {qID}</div>}
            {/* Sub-topic badge */}
            {qSubtopicCode&&<div style={{padding:"3px 7px",borderRadius:6,background:`${T.purple}12`,border:`1px solid ${T.purple}30`,fontSize:10,color:T.purple,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Layers size={10}/>{qSubtopicCode}</div>}
            {qHasFig&&<div style={{padding:"3px 7px",borderRadius:6,background:`${T.purple}12`,border:`1px solid ${T.purple}30`,fontSize:10,color:T.purple,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><Image size={10}/>Fig</div>}
            <div style={{display:"flex",alignItems:"center",gap:4}}><Clock size={11} color={T.dim}/><span style={{fontSize:11,color:T.dim,fontVariantNumeric:"tabular-nums"}}>{revealed?fmt(qTimes[idx]||0):fmt(qSec)}</span></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={togglePin} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 9px",borderRadius:8,border:`1px solid ${isPinned?T.blue+"50":T.border}`,background:isPinned?"#0F2040":"transparent",color:isPinned?T.blue:T.sub,cursor:"pointer",fontSize:11,fontWeight:500,transition:"all 0.2s"}}>
              {isPinned?<Pin size={12}/>:<PinOff size={12}/>}{isPinned?"Pinned":"Pin"}
            </button>
            <button onClick={toggleFlag} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 9px",borderRadius:8,border:`1px solid ${isFlagged?T.amber+"50":T.border}`,background:isFlagged?"#201800":"transparent",color:isFlagged?T.amber:T.sub,cursor:"pointer",fontSize:11,fontWeight:500,transition:"all 0.2s"}}>
              {isFlagged?<BookmarkCheck size={12}/>:<Bookmark size={12}/>}{isFlagged?"Flagged":"Flag"}
            </button>
            <div style={{padding:"4px 9px",borderRadius:20,background:subInfo.bg,border:`1px solid ${subInfo.color}40`,fontSize:11,fontWeight:600,color:subInfo.color}}>{subInfo.name}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,marginBottom:18}}>
          {[{id:"question",label:"Question",icon:<BookOpen size={12}/>},{id:"explanation",label:"Explanation",icon:<BarChart3 size={12}/>},{id:"comments",label:"Comments",icon:<MessageSquare size={12}/>}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",background:"transparent",border:"none",color:tab===t.id?T.text:T.sub,fontSize:12,fontWeight:tab===t.id?600:400,cursor:"pointer",borderBottom:tab===t.id?`2px solid ${T.blue}`:"2px solid transparent",marginBottom:-1,transition:"all 0.2s"}}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab==="question"&&(
          <div className="slide-in" key={idx}>
            <div style={{fontSize:15,fontWeight:500,lineHeight:1.75,color:T.text,marginBottom:20,padding:"18px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,borderLeft:`3px solid ${subInfo.color}`}}>{clean(q.question)}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {opts.map((opt,i)=>{
                const isC=revealed&&opt===correct,isW=revealed&&opt===sel&&opt!==correct;
                let bc=T.border,bg=T.card,tc=T.text;
                if(isC){bc=T.green+"70";bg="#0A2010";tc=T.green;}
                if(isW){bc=T.red+"70";bg="#200A0A";tc=T.red;}
                return(
                  <button key={i} onClick={()=>pick(opt)} className="opt-btn"
                    style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`1px solid ${bc}`,background:bg,color:tc,fontSize:14,fontWeight:500,lineHeight:1.5,textAlign:"left",cursor:revealed?"default":"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.2s",boxShadow:isC?`0 0 12px ${T.green}15`:isW?`0 0 12px ${T.red}15`:"none"}}>
                    <span style={{width:24,height:24,borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:isC?`${T.green}20`:isW?`${T.red}20`:T.border,color:isC?T.green:isW?T.red:T.sub,border:`1px solid ${isC?T.green+"40":isW?T.red+"40":T.borderHi}`,transition:"all 0.2s"}}>{labels[i]}</span>
                    <span style={{flex:1}}>{opt}</span>
                    {isC&&<CheckCircle size={14} color={T.green} style={{flexShrink:0}}/>}
                    {isW&&<XCircle size={14} color={T.red} style={{flexShrink:0}}/>}
                  </button>
                );
              })}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={goPrev} disabled={idx===0} style={{padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:idx===0?T.dim:T.sub,cursor:idx===0?"default":"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:500}}><ChevronLeft size={14}/>Prev</button>
              {!revealed
                ?<button onClick={skip} style={{flex:1,padding:"11px",borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><SkipForward size={13}/>Skip</button>
                :<button onClick={goNext} style={{flex:1,padding:"12px",borderRadius:12,border:`1px solid ${T.blue}50`,background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:T.white,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:"0 4px 12px rgba(59,158,255,0.2)"}}>
                  {idx+1>=queue.length?"See Results":"Next"}<ChevronRight size={14}/>
                </button>}
            </div>
          </div>
        )}
        {tab==="explanation"&&(
          <div style={{padding:"20px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",color:T.sub,marginBottom:12,display:"flex",alignItems:"center",gap:5}}><BarChart3 size={12} color={T.sub}/>Explanation</div>
            {revealed?<>
              <div style={{padding:"12px 14px",borderRadius:10,background:"#0A2010",border:`1px solid ${T.green}30`,marginBottom:12}}>
                <div style={{fontSize:10,color:T.sub,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Correct Answer</div>
                <div style={{color:T.green,fontWeight:600,fontSize:14,lineHeight:1.5}}>{correct}</div>
              </div>
              <p style={{color:T.sub,fontSize:13,lineHeight:1.75,marginBottom:12}}>Detailed explanations coming soon. Subject: <span style={{color:T.text,fontWeight:500}}>{subInfo.name}</span>{qSubtopicName&&<> · Sub-topic: <span style={{color:T.purple,fontWeight:500}}>{qSubtopicName}</span></>}</p>
              <div style={{display:"flex",gap:12,padding:"9px 12px",borderRadius:8,background:T.border,fontSize:11,color:T.sub,marginBottom:12,flexWrap:"wrap"}}>
                {qID&&<span>N° {qID}</span>}
                {qSubtopicCode&&<span style={{color:T.purple}}>{qSubtopicCode}</span>}
                <span>Time: {fmt(qTimes[idx]||0)}</span>
                {qHasFig&&<span style={{color:T.purple}}>Contains figure</span>}
              </div>
              <button onClick={goNext} style={{width:"100%",padding:"11px",borderRadius:12,border:`1px solid ${T.blue}50`,background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:T.white,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {idx+1>=queue.length?"See Results":"Next"}<ChevronRight size={13}/>
              </button>
            </>:<p style={{color:T.sub,fontSize:13}}>Answer the question to see the explanation.</p>}
          </div>
        )}
        {tab==="comments"&&<div style={{padding:"20px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}><CommentsTab/></div>}
      </div>
      <div style={{marginTop:"auto"}}><ProgressStrip queue={queue} answers={answers} current={idx}/></div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // EXAM
  // ═══════════════════════════════════════════════════════════════════════
  if(screen==="exam"&&eq) return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>
      {showConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50}}>
          <div style={{background:T.card,borderRadius:16,padding:"28px",maxWidth:380,width:"90%",border:`1px solid ${T.border}`,textAlign:"center"}}>
            <AlertTriangle size={28} color={T.amber} style={{marginBottom:10}}/>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Submit Exam?</div>
            <div style={{fontSize:13,color:T.sub,marginBottom:4}}>Answered <span style={{color:T.text,fontWeight:600}}>{eAnswered}</span> of <span style={{color:T.text,fontWeight:600}}>{examQ.length}</span>.</div>
            {examQ.length-eAnswered>0&&<div style={{fontSize:13,color:T.amber,marginBottom:16}}>{examQ.length-eAnswered} unanswered.</div>}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setShowConfirm(false)} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:14,fontWeight:600}}>Keep Going</button>
              <button onClick={()=>submitExam(true)} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${T.green}50`,background:`${T.green}15`,color:T.green,cursor:"pointer",fontSize:14,fontWeight:700}}>Submit Now</button>
            </div>
          </div>
        </div>
      )}
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.panel,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <TimerRing remaining={examRemaining} total={eTotalSec} size={52}/>
          <div><div style={{fontSize:13,fontWeight:700}}>{eSpec.name}</div><div style={{fontSize:11,color:T.sub}}>EASA ATPL · {eSpec.questions} questions</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {eTimeWarning&&<div className="warn-pulse" style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,background:`${T.red}15`,border:`1px solid ${T.red}40`,fontSize:12,color:T.red,fontWeight:600}}><AlertTriangle size={12}/>Low time</div>}
          <button onClick={()=>setShowExamGrid(!showExamGrid)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:showExamGrid?`${T.blue}15`:"transparent",color:showExamGrid?T.blue:T.sub,cursor:"pointer",fontSize:12,fontWeight:600}}>{eAnswered}/{examQ.length}</button>
          <button onClick={()=>submitExam()} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${T.green}50`,background:`${T.green}15`,color:T.green,cursor:"pointer",fontSize:13,fontWeight:700}}>Submit</button>
        </div>
      </div>
      <div style={{height:2,background:T.border}}><div style={{height:"100%",width:`${Math.round((eAnswered/examQ.length)*100)}%`,background:T.blue,transition:"width 0.4s"}}/></div>
      <div style={{flex:1,maxWidth:760,margin:"0 auto",width:"100%",padding:"20px",display:"flex",gap:16}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:600,color:T.sub}}>Q{examIdx+1}<span style={{color:T.dim}}> / {examQ.length}</span></span>
            <button onClick={()=>setExamFlagged(f=>{const n=new Set(f);n.has(examIdx)?n.delete(examIdx):n.add(examIdx);return n;})} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,border:`1px solid ${examFlagged.has(examIdx)?T.amber+"50":T.border}`,background:examFlagged.has(examIdx)?`${T.amber}10`:"transparent",color:examFlagged.has(examIdx)?T.amber:T.sub,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.2s"}}>
              <Flag size={12}/>{examFlagged.has(examIdx)?"Flagged":"Flag"}
            </button>
          </div>
          <div style={{padding:"18px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,marginBottom:14,fontSize:15,lineHeight:1.75,fontWeight:500}}>{clean(eq?.question)}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {eopts.map((opt,i)=>{const isSel=examAns[examIdx]===opt;return(
              <button key={i} onClick={()=>setExamAns(a=>({...a,[examIdx]:opt}))} className="opt-btn"
                style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${isSel?T.blue+"80":T.border}`,background:isSel?`${T.blue}10`:T.card,color:isSel?T.blue:T.text,fontSize:14,fontWeight:isSel?600:400,lineHeight:1.5,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}>
                <span style={{width:24,height:24,borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:isSel?`${T.blue}25`:T.border,color:isSel?T.blue:T.sub,transition:"all 0.15s"}}>{labels[i]}</span>
                {opt}
              </button>
            );})}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setExamIdx(i=>Math.max(0,i-1))} disabled={examIdx===0} style={{padding:"11px 14px",borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:examIdx===0?T.dim:T.sub,cursor:examIdx===0?"default":"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:500}}><ChevronLeft size={14}/>Prev</button>
            <button onClick={()=>setExamIdx(i=>Math.min(examQ.length-1,i+1))} disabled={examIdx===examQ.length-1} style={{flex:1,padding:"12px",borderRadius:12,border:`1px solid ${examIdx===examQ.length-1?T.border:T.blue+"50"}`,background:examIdx===examQ.length-1?"transparent":"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:examIdx===examQ.length-1?T.dim:T.white,cursor:examIdx===examQ.length-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:13,fontWeight:600}}>Next<ChevronRight size={14}/></button>
          </div>
        </div>
        {showExamGrid&&(<div style={{width:185,flexShrink:0}}>
          <div style={{padding:"14px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,position:"sticky",top:70}}>
            <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Questions</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {examQ.map((_,i)=>{const answered=examAns[i]!==undefined,isCurrent=i===examIdx,isFl=examFlagged.has(i);let bg=T.border,color=T.sub,border=T.border;if(answered){bg=T.dim;color=T.text;}if(isCurrent){border=T.blue;bg=`${T.blue}20`;color=T.blue;}return(
                <button key={i} onClick={()=>setExamIdx(i)} style={{width:32,height:32,borderRadius:7,border:`2px solid ${border}`,background:bg,color,fontSize:11,fontWeight:700,cursor:"pointer",position:"relative",transition:"all 0.15s"}}>
                  {i+1}{isFl&&<span style={{position:"absolute",top:-3,right:-3,width:7,height:7,borderRadius:"50%",background:T.amber}}/>}
                </button>
              );})}
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // EXAM RESULT
  // ═══════════════════════════════════════════════════════════════════════
  if(screen==="result_exam") return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif"}}>
      <style>{CSS}</style>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.panel}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><TrendingUp size={16} color={ePass?T.green:T.red}/><span style={{fontSize:14,fontWeight:600}}>Exam Results — {eSpec.name}</span></div>
        <span style={{fontSize:12,color:T.sub}}>Time used: {fmt(examTimeTaken)}</span>
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px",display:"flex",flexDirection:"column",gap:14}}>
        <div className="fade-up" style={{padding:"32px",borderRadius:16,textAlign:"center",background:T.card,border:`2px solid ${ePass?T.green+"40":T.red+"40"}`,boxShadow:`0 0 40px ${ePass?T.green:T.red}10`}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:68,height:68,borderRadius:"50%",background:ePass?`${T.green}15`:`${T.red}15`,border:`2px solid ${ePass?T.green+"40":T.red+"40"}`,marginBottom:14}}>
            {ePass?<CheckCircle size={30} color={T.green}/>:<XCircle size={30} color={T.red}/>}
          </div>
          <div style={{fontSize:72,fontWeight:800,letterSpacing:"-4px",color:ePass?T.green:T.red,lineHeight:1,marginBottom:4}}>{eScorePct}%</div>
          <div style={{fontSize:20,fontWeight:700,color:ePass?T.green:T.red,marginBottom:6}}>{ePass?"PASS":"FAIL"}</div>
          <div style={{fontSize:13,color:T.sub}}>{ePass?"You cleared the 75% pass mark.":"You need "+Math.ceil(examQ.length*0.75)+" correct to pass."}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[{label:"Correct",value:eCorrect,color:T.green,icon:<CheckCircle size={14}/>},{label:"Wrong",value:eWrong,color:T.red,icon:<XCircle size={14}/>},{label:"Skipped",value:eSkipped,color:T.sub,icon:<Circle size={14}/>}].map(s=>(
            <div key={s.label} style={{padding:"16px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:6,color:s.color}}>{s.icon}</div>
              <div style={{fontSize:28,fontWeight:800,color:s.color,letterSpacing:"-0.5px"}}>{s.value}</div>
              <div style={{fontSize:10,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"16px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Question Summary</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {examQ.map((_,i)=>{let bg=T.dim;if(examAns[i]===examQ[i].correct_answer)bg=T.green;else if(examAns[i])bg=T.red;return(<div key={i} style={{width:22,height:22,borderRadius:4,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"rgba(0,0,0,0.8)",fontWeight:700,opacity:0.9}}>{i+1}</div>);})}
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setScreen("review_exam")} style={{flex:2,padding:"14px",borderRadius:12,border:`1px solid ${T.blue}50`,background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:T.white,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(59,158,255,0.15)"}}>
            <Eye size={14}/>Review All Answers
          </button>
          <button onClick={startExam} style={{flex:1,padding:"14px",borderRadius:12,border:`1px solid ${T.amber}40`,background:"transparent",color:T.amber,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><RotateCcw size={13}/>Retake</button>
          <button onClick={()=>setScreen("home")} style={{flex:1,padding:"14px",borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Home size={13}/>Home</button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // EXAM REVIEW
  // ═══════════════════════════════════════════════════════════════════════
  if(screen==="review_exam"){
    const rq=examQ[reviewIdx],ropts=rq?[rq.option_a,rq.option_b,rq.option_c,rq.option_d].filter(Boolean):[];
    const userAns=examAns[reviewIdx],rC=userAns===rq?.correct_answer,rW=userAns&&!rC;
    return(
      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column"}}>
        <style>{CSS}</style>
        <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.panel,position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setScreen("result_exam")} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:13}}><ChevronLeft size={13}/>Results</button>
            <span style={{fontSize:13,fontWeight:600,color:T.sub}}>Answer Review</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <span style={{padding:"4px 10px",borderRadius:20,background:`${T.green}15`,border:`1px solid ${T.green}30`,fontSize:12,color:T.green,fontWeight:600}}>{eCorrect} correct</span>
            <span style={{padding:"4px 10px",borderRadius:20,background:`${T.red}15`,border:`1px solid ${T.red}30`,fontSize:12,color:T.red,fontWeight:600}}>{eWrong} wrong</span>
          </div>
        </div>
        <div style={{flex:1,maxWidth:720,margin:"0 auto",width:"100%",padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:600,color:T.sub}}>Q{reviewIdx+1} / {examQ.length}</span>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,background:rC?`${T.green}15`:rW?`${T.red}15`:`${T.amber}15`,border:`1px solid ${rC?T.green+"30":rW?T.red+"30":T.amber+"30"}`,fontSize:12,fontWeight:600,color:rC?T.green:rW?T.red:T.amber}}>
              {rC?<><CheckCircle size={12}/>Correct</>:rW?<><XCircle size={12}/>Wrong</>:<><Circle size={12}/>Skipped</>}
            </div>
          </div>
          <div style={{padding:"18px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,borderLeft:`3px solid ${rC?T.green:rW?T.red:T.amber}`,marginBottom:14,fontSize:15,lineHeight:1.7,fontWeight:500}}>{clean(rq?.question)}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {ropts.map((opt,i)=>{const isC=opt===rq?.correct_answer,isU=opt===userAns&&!isC;let bg=T.card,border=T.border,color=T.text;if(isC){bg="#0A2010";border=T.green+"60";color=T.green;}else if(isU){bg="#200A0A";border=T.red+"60";color=T.red;}return(
              <div key={i} style={{padding:"13px 16px",borderRadius:12,border:`1px solid ${border}`,background:bg,color,fontSize:14,lineHeight:1.5,display:"flex",alignItems:"center",gap:12}}>
                <span style={{width:24,height:24,borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:isC?`${T.green}20`:isU?`${T.red}20`:T.border,color:isC?T.green:isU?T.red:T.sub}}>{labels[i]}</span>
                <span style={{flex:1}}>{opt}</span>
                {isC&&<CheckCircle size={14} color={T.green} style={{flexShrink:0}}/>}
                {isU&&<XCircle size={14} color={T.red} style={{flexShrink:0}}/>}
              </div>
            );})}
          </div>
          {!rC&&rq?.correct_answer&&(<div style={{padding:"12px 14px",borderRadius:10,background:"#0A2010",border:`1px solid ${T.green}30`,marginBottom:14}}><div style={{fontSize:10,color:T.sub,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Correct Answer</div><div style={{color:T.green,fontWeight:600,fontSize:14}}>{rq.correct_answer}</div></div>)}
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            <button onClick={()=>setReviewIdx(i=>Math.max(0,i-1))} disabled={reviewIdx===0} style={{flex:1,padding:"11px",borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:reviewIdx===0?T.dim:T.sub,cursor:reviewIdx===0?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,fontWeight:500}}><ChevronLeft size={13}/>Previous</button>
            <button onClick={()=>setReviewIdx(i=>Math.min(examQ.length-1,i+1))} disabled={reviewIdx===examQ.length-1} style={{flex:1,padding:"11px",borderRadius:12,border:`1px solid ${reviewIdx===examQ.length-1?T.border:T.blue+"50"}`,background:reviewIdx===examQ.length-1?"transparent":"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:reviewIdx===examQ.length-1?T.dim:T.white,cursor:reviewIdx===examQ.length-1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,fontWeight:600}}>Next<ChevronRight size={13}/></button>
          </div>
          <div style={{padding:"14px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Jump to Question</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {examQ.map((_,i)=>{const ua=examAns[i];let bg=T.dim,color=T.sub;if(ua===examQ[i].correct_answer){bg=T.green;color="#000";}else if(ua){bg=T.red;color="#000";}const isNow=i===reviewIdx;return(<button key={i} onClick={()=>setReviewIdx(i)} style={{width:28,height:28,borderRadius:6,border:`2px solid ${isNow?T.blue:"transparent"}`,background:isNow?T.blue:bg,color:isNow?"#000":color,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>{i+1}</button>);})}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STUDY RESULT
  // ═══════════════════════════════════════════════════════════════════════
  if(screen==="result_study"){
    const total=score.correct+score.wrong+score.skipped;
    const finalPct=total>0?Math.round((score.correct/total)*100):0;
    const pass=finalPct>=75;
    return(
      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif"}}>
        <style>{CSS}</style>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.panel}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><TrendingUp size={16} color={pass?T.green:T.red}/><span style={{fontSize:14,fontWeight:600}}>Study Session Complete</span></div>
          <span style={{fontSize:12,color:T.sub}}>Total: {fmt(sSec)}</span>
        </div>
        <div style={{maxWidth:720,margin:"0 auto",padding:"24px 20px",display:"flex",flexDirection:"column",gap:14}}>
          <div className="fade-up" style={{padding:"32px",borderRadius:16,textAlign:"center",background:T.card,border:`1px solid ${pass?T.green+"30":T.red+"30"}`}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
              <div style={{position:"relative"}}>
                <PRing pct={finalPct} size={90} stroke={6} color={pass?T.green:T.red}/>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:24,fontWeight:800,color:pass?T.green:T.red}}>{finalPct}%</span></div>
              </div>
            </div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:5}}>{pass?"Above passing threshold":"Below passing threshold"}</div>
            <div style={{fontSize:13,color:T.sub}}>{pass?"You cleared 75%.":"Keep practicing — aim for 75%+"}</div>
            {activeSubtopic&&<div style={{marginTop:10,fontSize:12,color:T.purple}}>Sub-topic: {SUBTOPICS[subject]?.find(t=>t.code===activeSubtopic)?.name}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[{label:"Correct",value:score.correct,color:T.green,icon:<CheckCircle size={14}/>},{label:"Wrong",value:score.wrong,color:T.red,icon:<XCircle size={14}/>},{label:"Skipped",value:score.skipped,color:T.sub,icon:<SkipForward size={14}/>}].map(s=>(
              <div key={s.label} style={{padding:"16px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:6,color:s.color}}>{s.icon}</div>
                <div style={{fontSize:28,fontWeight:800,color:s.color,letterSpacing:"-1px"}}>{s.value}</div>
                <div style={{fontSize:10,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{label:"Total Time",value:fmt(sSec)},{label:"Avg / Question",value:fmt(avgStudyTime)}].map(s=>(
              <div key={s.label} style={{padding:"14px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:10,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>{s.label}</div>
                <div style={{fontSize:20,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"14px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Question Log</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {queue.map((_,i)=>{let bg=T.sub;if(answers[i]?.correct)bg=T.green;else if(answers[i]?.selected)bg=T.red;return(<div key={i} style={{width:20,height:20,borderRadius:4,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"rgba(0,0,0,0.8)",fontWeight:700,opacity:0.85}}>{i+1}</div>);})}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={startStudy} style={{flex:2,padding:"14px",borderRadius:12,border:`1px solid ${T.blue}50`,background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:T.white,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(59,158,255,0.15)"}}>
              <RotateCcw size={14}/>New Session
            </button>
            <button onClick={()=>setScreen("home")} style={{flex:1,padding:"14px",borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Home size={13}/>Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STATS SCREEN ─────────────────────────────────────────────────────────
  if(screen==="stats") return(
    <StatsScreen
      onClose={()=>setScreen("home")}
      questionBank={allPool}
    />
  );

  return(<div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif"}}><div style={{color:T.sub}}>Loading...</div></div>);
}
