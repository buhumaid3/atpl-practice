import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, LogIn, Copy, Check, Trophy, TrendingUp,
  ChevronRight, X, Crown, Medal, Award, BarChart3,
  Clock, Target, Zap, ArrowLeft, RefreshCw, Share2
} from "lucide-react";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const T = {
  bg:"#09090B", panel:"#0F1014", card:"#131318", border:"#1C1C22",
  borderHi:"#2A2A35", text:"#F0F0F5", sub:"#8888A0", dim:"#444455",
  blue:"#3B9EFF", green:"#22C55E", red:"#EF4444", amber:"#F59E0B",
  white:"#FFFFFF", purple:"#A78BFA", gold:"#F59E0B",
};

const SUBJECTS = [
  { code:"010", name:"Air Law",        color:"#FF6B6B" },
  { code:"031", name:"Mass & Balance", color:"#4ECDC4" },
  { code:"032", name:"Performance",    color:"#FFD93D" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  button{font-family:inherit;}
  input{font-family:inherit;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#2A2A35;border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pop{0%{transform:scale(0.92);}60%{transform:scale(1.03);}100%{transform:scale(1);}}
  .fade-up{animation:fadeUp 0.3s ease forwards;}
  .pop{animation:pop 0.25s ease forwards;}
  input:focus{outline:none;border-color:#3B9EFF!important;}
`;

// ── API ────────────────────────────────────────────────────────────────────
function headers(token) {
  return { "Content-Type":"application/json", apikey:SUPABASE_KEY, Authorization:`Bearer ${token}` };
}

async function api(token, method, path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers: { ...headers(token), Prefer:"return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return null; }
}

async function createGroup(token, userId, name, displayName) {
  const group = await api(token, "POST", "groups", { name, created_by: userId });
  if (!group?.[0]?.id) return { error:"Failed to create group" };
  const gid = group[0].id;
  await api(token, "POST", "group_members", { group_id:gid, user_id:userId, display_name:displayName });
  return group[0];
}

async function joinGroup(token, userId, code, displayName) {
  const groups = await api(token, "GET", `groups?code=eq.${code.toUpperCase()}&select=*`, null);
  if (!Array.isArray(groups) || !groups.length) return { error:"Group not found. Check the invite code." };
  const group = groups[0];
  // Check already member
  const existing = await api(token, "GET", `group_members?group_id=eq.${group.id}&user_id=eq.${userId}&select=id`, null);
  if (Array.isArray(existing) && existing.length) return { error:"You are already a member of this group." };
  await api(token, "POST", "group_members", { group_id:group.id, user_id:userId, display_name:displayName });
  return group;
}

async function getMyGroups(token, userId) {
  const memberships = await api(token, "GET", `group_members?user_id=eq.${userId}&select=group_id`, null);
  if (!Array.isArray(memberships) || !memberships.length) return [];
  const ids = memberships.map(m=>`"${m.group_id}"`).join(",");
  return await api(token, "GET", `groups?id=in.(${ids})&select=*&order=created_at.desc`, null) || [];
}

async function getGroupMembers(token, groupId) {
  return await api(token, "GET", `group_members?group_id=eq.${groupId}&select=*&order=joined_at.asc`, null) || [];
}

async function getGroupSessions(token, groupId, subjectCode) {
  let path = `group_sessions?group_id=eq.${groupId}&select=*&order=created_at.desc&limit=200`;
  if (subjectCode) path += `&subject_code=eq.${subjectCode}`;
  return await api(token, "GET", path, null) || [];
}

async function postSession(token, userId, groupId, displayName, sessionData) {
  return await api(token, "POST", "group_sessions", {
    group_id: groupId,
    user_id: userId,
    display_name: displayName,
    ...sessionData,
  });
}

async function leaveGroup(token, userId, groupId) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/group_members?group_id=eq.${groupId}&user_id=eq.${userId}`, {
    method:"DELETE", headers: headers(token),
  });
  return r.ok;
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function fmt(s) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

function getRankIcon(rank) {
  if (rank === 1) return <Crown size={14} color="#F59E0B"/>;
  if (rank === 2) return <Medal size={14} color="#94A3B8"/>;
  if (rank === 3) return <Award size={14} color="#CD7C3A"/>;
  return <span style={{fontSize:12,fontWeight:700,color:T.sub}}>#{rank}</span>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }
  return (
    <button onClick={copy} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:`1px solid ${copied?T.green+"50":T.border}`,background:copied?`${T.green}10`:T.panel,color:copied?T.green:T.sub,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all 0.2s"}}>
      {copied?<Check size={13}/>:<Copy size={13}/>}{copied?"Copied!":"Copy"}
    </button>
  );
}

// ── LEADERBOARD ────────────────────────────────────────────────────────────
function Leaderboard({ sessions, members, subjectFilter, onSubjectChange }) {
  // Aggregate per user per subject
  const userStats = {};
  sessions.forEach(s => {
    const key = `${s.user_id}_${s.subject_code||"all"}`;
    if (!userStats[key]) userStats[key] = { displayName:s.display_name, userId:s.user_id, subject:s.subject_code, correct:0, total:0, sessions:0, bestAcc:0, latestAcc:0, totalSec:0 };
    const u = userStats[key];
    u.correct += s.correct; u.total += (s.correct+s.wrong); u.sessions++;
    u.totalSec += s.duration_sec;
    u.latestAcc = s.accuracy; // sessions ordered desc, first = latest
    if (s.accuracy > u.bestAcc) u.bestAcc = s.accuracy;
  });

  // Group by user (merge subjects if no filter)
  const userTotals = {};
  Object.values(userStats).forEach(u => {
    if (subjectFilter && u.subject !== subjectFilter) return;
    if (!userTotals[u.userId]) userTotals[u.userId] = { displayName:u.displayName, correct:0, total:0, sessions:0, bestAcc:0, totalSec:0 };
    const t = userTotals[u.userId];
    t.correct += u.correct; t.total += u.total; t.sessions += u.sessions;
    t.totalSec += u.totalSec;
    if (u.bestAcc > t.bestAcc) t.bestAcc = u.bestAcc;
  });

  const ranked = Object.values(userTotals)
    .map(u=>({...u, acc: u.total>0?Math.round((u.correct/u.total)*100):0}))
    .sort((a,b)=>b.acc-a.acc||b.correct-a.correct);

  return (
    <div>
      {/* Subject filter tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>onSubjectChange(null)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${!subjectFilter?T.blue+"60":T.border}`,background:!subjectFilter?`${T.blue}15`:T.panel,color:!subjectFilter?T.blue:T.sub,fontSize:12,fontWeight:!subjectFilter?600:400,cursor:"pointer"}}>All</button>
        {SUBJECTS.map(s=>(
          <button key={s.code} onClick={()=>onSubjectChange(s.code)}
            style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${subjectFilter===s.code?s.color+"60":T.border}`,background:subjectFilter===s.code?`${s.color}15`:T.panel,color:subjectFilter===s.code?s.color:T.sub,fontSize:12,fontWeight:subjectFilter===s.code?600:400,cursor:"pointer"}}>
            {s.name}
          </button>
        ))}
      </div>

      {ranked.length === 0 ? (
        <div style={{textAlign:"center",padding:"32px",color:T.sub,fontSize:13}}>
          No sessions posted yet. Complete a study session and share it to appear here.
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {ranked.map((u,i)=>{
            const rank = i+1;
            const isTop = rank <= 3;
            return (
              <div key={u.displayName} className={i<3?"pop":""} style={{
                padding:"14px 16px", borderRadius:12,
                background: rank===1 ? `${T.gold}08` : rank===2 ? "#94A3B808" : rank===3 ? "#CD7C3A08" : T.card,
                border:`1px solid ${rank===1?T.gold+"40":rank===2?"#94A3B840":rank===3?"#CD7C3A40":T.border}`,
                display:"flex",alignItems:"center",gap:14,
                transition:"all 0.2s",
              }}>
                {/* Rank */}
                <div style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {getRankIcon(rank)}
                </div>
                {/* Avatar */}
                <div style={{width:36,height:36,borderRadius:"50%",background:`${isTop?T.gold:T.blue}20`,border:`2px solid ${isTop?T.gold:T.blue}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:14,fontWeight:800,color:isTop?T.gold:T.blue}}>{u.displayName[0].toUpperCase()}</span>
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.displayName}</div>
                  <div style={{fontSize:11,color:T.sub}}>{u.sessions} session{u.sessions!==1?"s":""} · {u.correct} correct · Best: {u.bestAcc}%</div>
                </div>
                {/* Score */}
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:22,fontWeight:800,color:u.acc>=75?T.green:u.acc>=50?T.amber:T.red,letterSpacing:"-0.5px"}}>{u.total>0?`${u.acc}%`:"—"}</div>
                  <div style={{fontSize:10,color:T.sub}}>{u.total} attempted</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── RECENT ACTIVITY ────────────────────────────────────────────────────────
function ActivityFeed({ sessions }) {
  const recent = sessions.slice(0, 20);
  if (!recent.length) return (
    <div style={{textAlign:"center",padding:"32px",color:T.sub,fontSize:13}}>No activity yet.</div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {recent.map(s=>{
        const subInfo = SUBJECTS.find(sub=>sub.code===s.subject_code);
        const timeAgo = (() => {
          const diff = Date.now() - new Date(s.created_at);
          const mins = Math.floor(diff/60000);
          if (mins < 60) return `${mins}m ago`;
          const hrs = Math.floor(mins/60);
          if (hrs < 24) return `${hrs}h ago`;
          return `${Math.floor(hrs/24)}d ago`;
        })();
        return (
          <div key={s.id} style={{padding:"12px 14px",borderRadius:10,background:T.card,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:`${T.blue}15`,border:`1px solid ${T.blue}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:13,fontWeight:800,color:T.blue}}>{s.display_name[0].toUpperCase()}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:2}}>
                <span style={{color:T.blue}}>{s.display_name}</span> completed a session
              </div>
              <div style={{fontSize:11,color:T.sub,display:"flex",gap:8,flexWrap:"wrap"}}>
                {subInfo&&<span style={{color:subInfo.color,fontWeight:600}}>{subInfo.name}</span>}
                <span>{s.correct}/{s.total} correct</span>
                {s.duration_sec>0&&<span>{fmt(s.duration_sec)}</span>}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:16,fontWeight:800,color:s.accuracy>=75?T.green:s.accuracy>=50?T.amber:T.red}}>{s.accuracy}%</div>
              <div style={{fontSize:10,color:T.dim}}>{timeAgo}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── GROUP DETAIL ────────────────────────────────────────────────────────────
function GroupDetail({ group, token, userId, displayName, onBack, onSessionPosted }) {
  const [tab,           setTab]           = useState("leaderboard");
  const [sessions,      setSessions]      = useState([]);
  const [members,       setMembers]       = useState([]);
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [copied,        setCopied]        = useState(false);
  const [showLeave,     setShowLeave]     = useState(false);

  const load = useCallback(async()=>{
    setLoading(true);
    const [s,m] = await Promise.all([
      getGroupSessions(token, group.id, subjectFilter),
      getGroupMembers(token, group.id),
    ]);
    setSessions(s); setMembers(m); setLoading(false);
  },[token, group.id, subjectFilter]);

  useEffect(()=>{ load(); },[load]);

  async function handleLeave() {
    await leaveGroup(token, userId, group.id);
    onBack();
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.panel,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:13}}>
            <ArrowLeft size={13}/>Back
          </button>
          <div>
            <div style={{fontSize:14,fontWeight:700}}>{group.name}</div>
            <div style={{fontSize:11,color:T.sub}}>{members.length} member{members.length!==1?"s":""}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* Invite code */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:T.card,border:`1px solid ${T.border}`}}>
            <span style={{fontSize:11,color:T.sub}}>Code:</span>
            <span style={{fontSize:13,fontWeight:800,color:T.blue,letterSpacing:"2px"}}>{group.code}</span>
            <CopyButton text={group.code}/>
          </div>
          <button onClick={load} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.sub,cursor:"pointer"}}>
            <RefreshCw size={13}/>
          </button>
        </div>
      </div>

      <div style={{flex:1,maxWidth:760,margin:"0 auto",width:"100%",padding:"20px"}}>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,marginBottom:20}}>
          {[
            {id:"leaderboard",label:"Leaderboard",icon:<Trophy size={13}/>},
            {id:"activity",   label:"Activity",   icon:<Zap size={13}/>},
            {id:"members",    label:"Members",    icon:<Users size={13}/>},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"9px 16px",background:"transparent",border:"none",color:tab===t.id?T.text:T.sub,fontSize:13,fontWeight:tab===t.id?600:400,cursor:"pointer",borderBottom:tab===t.id?`2px solid ${T.blue}`:"2px solid transparent",marginBottom:-1,transition:"all 0.2s"}}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"40px",color:T.sub}}>Loading...</div>
        ) : (
          <>
            {tab==="leaderboard"&&<Leaderboard sessions={sessions} members={members} subjectFilter={subjectFilter} onSubjectChange={setSubjectFilter}/>}
            {tab==="activity"&&<ActivityFeed sessions={sessions}/>}
            {tab==="members"&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {members.map((m,i)=>(
                  <div key={m.id} style={{padding:"12px 16px",borderRadius:10,background:T.card,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:`${T.blue}15`,border:`1px solid ${T.blue}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:14,fontWeight:800,color:T.blue}}>{m.display_name[0].toUpperCase()}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.text}}>{m.display_name}</div>
                      <div style={{fontSize:11,color:T.sub}}>Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                    </div>
                    {group.created_by===m.user_id&&<span style={{fontSize:10,fontWeight:700,color:T.gold,padding:"2px 8px",borderRadius:6,background:`${T.gold}15`,border:`1px solid ${T.gold}30`}}>Creator</span>}
                    {m.user_id===userId&&<span style={{fontSize:10,color:T.sub}}>You</span>}
                  </div>
                ))}
                {/* Leave group */}
                <div style={{marginTop:8,padding:"14px",borderRadius:10,background:T.card,border:`1px solid ${T.border}`}}>
                  {!showLeave ? (
                    <button onClick={()=>setShowLeave(true)} style={{background:"transparent",border:"none",color:T.red,fontSize:13,cursor:"pointer",fontWeight:500}}>Leave this group</button>
                  ) : (
                    <div>
                      <div style={{fontSize:13,color:T.text,marginBottom:10}}>Are you sure you want to leave <strong>{group.name}</strong>?</div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={handleLeave} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${T.red}50`,background:`${T.red}15`,color:T.red,cursor:"pointer",fontSize:13,fontWeight:600}}>Leave</button>
                        <button onClick={()=>setShowLeave(false)} style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:13}}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── MAIN GROUPS SCREEN ─────────────────────────────────────────────────────
export default function GroupsScreen({ token, userId, onClose, lastSession }) {
  const [view,        setView]        = useState("list"); // list | create | join | detail
  const [groups,      setGroups]      = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Form state
  const [groupName,    setGroupName]    = useState("");
  const [joinCode,     setJoinCode]     = useState("");
  const [displayName,  setDisplayName]  = useState(()=>localStorage.getItem("atpl_display_name")||"");
  const [submitting,   setSubmitting]   = useState(false);

  // Share session state
  const [shareGroupId, setShareGroupId] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(null);

  const loadGroups = useCallback(async()=>{
    setLoading(true);
    const g = await getMyGroups(token, userId);
    setGroups(Array.isArray(g)?g:[]);
    setLoading(false);
  },[token, userId]);

  useEffect(()=>{ loadGroups(); },[loadGroups]);

  function saveDisplayName(name) {
    setDisplayName(name);
    localStorage.setItem("atpl_display_name", name);
  }

  async function handleCreate() {
    if (!groupName.trim()) { setError("Enter a group name."); return; }
    if (!displayName.trim()) { setError("Enter your display name."); return; }
    setSubmitting(true); setError(null);
    const result = await createGroup(token, userId, groupName.trim(), displayName.trim());
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    saveDisplayName(displayName.trim());
    await loadGroups();
    setGroupName("");
    setView("list");
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setError("Enter an invite code."); return; }
    if (!displayName.trim()) { setError("Enter your display name."); return; }
    setSubmitting(true); setError(null);
    const result = await joinGroup(token, userId, joinCode.trim(), displayName.trim());
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    saveDisplayName(displayName.trim());
    await loadGroups();
    setJoinCode("");
    setView("list");
  }

  async function handleShareSession(groupId) {
    if (!lastSession) return;
    setShareGroupId(groupId);
    const dn = displayName || "Cadet";
    await postSession(token, userId, groupId, dn, {
      subject_code:  lastSession.subject,
      subject_name:  SUBJECTS.find(s=>s.code===lastSession.subject)?.name||lastSession.subject,
      correct:       lastSession.score?.correct||0,
      wrong:         lastSession.score?.wrong||0,
      skipped:       lastSession.score?.skipped||0,
      total:         lastSession.total||0,
      accuracy:      lastSession.total>0?Math.round(((lastSession.score?.correct||0)/lastSession.total)*100):0,
      duration_sec:  lastSession.durationSec||0,
    });
    setShareGroupId(null);
    setShareSuccess(groupId);
    setTimeout(()=>setShareSuccess(null), 3000);
  }

  // Group detail view
  if (view==="detail"&&activeGroup) return (
    <GroupDetail
      group={activeGroup} token={token} userId={userId}
      displayName={displayName}
      onBack={()=>{ setView("list"); loadGroups(); }}
      onSessionPosted={loadGroups}
    />
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.panel}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Users size={16} color={T.blue}/>
          <span style={{fontSize:14,fontWeight:700}}>Study Groups</span>
        </div>
        <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:13}}>
          <X size={13}/>Close
        </button>
      </div>

      <div style={{flex:1,maxWidth:720,margin:"0 auto",width:"100%",padding:"20px"}}>

        {/* Create / Join buttons */}
        {view==="list"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              <button onClick={()=>{setView("create");setError(null);}} style={{padding:"14px",borderRadius:12,border:`1px solid ${T.blue}50`,background:`${T.blue}10`,color:T.blue,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <Plus size={15}/>Create Group
              </button>
              <button onClick={()=>{setView("join");setError(null);}} style={{padding:"14px",borderRadius:12,border:`1px solid ${T.purple}50`,background:`${T.purple}10`,color:T.purple,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <LogIn size={15}/>Join with Code
              </button>
            </div>

            {/* Share last session banner */}
            {lastSession&&groups.length>0&&(
              <div style={{padding:"14px 16px",borderRadius:12,background:`${T.green}08`,border:`1px solid ${T.green}30`,marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <Share2 size={13}/>Share your last session result
                </div>
                <div style={{fontSize:12,color:T.sub,marginBottom:10}}>
                  {SUBJECTS.find(s=>s.code===lastSession.subject)?.name} · {lastSession.score?.correct||0}/{lastSession.total||0} correct · {lastSession.total>0?Math.round(((lastSession.score?.correct||0)/lastSession.total)*100):0}%
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {groups.map(g=>(
                    <button key={g.id} onClick={()=>handleShareSession(g.id)}
                      disabled={shareGroupId===g.id}
                      style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${shareSuccess===g.id?T.green+"60":T.green+"40"}`,background:shareSuccess===g.id?`${T.green}20`:`${T.green}10`,color:shareSuccess===g.id?T.green:T.green,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                      {shareGroupId===g.id?<RefreshCw size={11}/>:shareSuccess===g.id?<Check size={11}/>:<Share2 size={11}/>}
                      {shareSuccess===g.id?"Shared!":shareGroupId===g.id?"Sharing...":g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* My groups */}
            <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>Your Groups</div>
            {loading ? (
              <div style={{textAlign:"center",padding:"32px",color:T.sub}}>Loading...</div>
            ) : groups.length===0 ? (
              <div style={{padding:"32px",textAlign:"center",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
                <Users size={32} color={T.dim} style={{margin:"0 auto 12px"}}/>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No groups yet</div>
                <div style={{fontSize:13,color:T.sub}}>Create a group or join one with an invite code.</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {groups.map(g=>(
                  <div key={g.id} onClick={()=>{setActiveGroup(g);setView("detail");}}
                    style={{padding:"16px",borderRadius:12,background:T.card,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"border-color 0.2s"}}>
                    <div style={{width:44,height:44,borderRadius:12,background:`${T.blue}15`,border:`1px solid ${T.blue}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:18,fontWeight:800,color:T.blue}}>{g.name[0].toUpperCase()}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{g.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,fontWeight:700,color:T.blue,letterSpacing:"2px",padding:"2px 8px",borderRadius:6,background:`${T.blue}15`,border:`1px solid ${T.blue}30`}}>{g.code}</span>
                        <span style={{fontSize:11,color:T.sub}}>Tap to enter</span>
                      </div>
                    </div>
                    <ChevronRight size={16} color={T.dim}/>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create form */}
        {view==="create"&&(
          <div className="fade-up">
            <button onClick={()=>{setView("list");setError(null);}} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 0",background:"transparent",border:"none",color:T.sub,cursor:"pointer",fontSize:13,marginBottom:20}}>
              <ArrowLeft size={13}/>Back
            </button>
            <div style={{fontSize:16,fontWeight:700,marginBottom:20}}>Create a Study Group</div>
            {error&&<div style={{padding:"11px 14px",borderRadius:10,background:`${T.red}15`,border:`1px solid ${T.red}30`,marginBottom:16,fontSize:13,color:T.red}}>{error}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.5px"}}>Group Name</div>
                <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="e.g. Etihad Batch 2025"
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.panel,color:T.text,fontSize:14}}/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.5px"}}>Your Display Name</div>
                <input value={displayName} onChange={e=>saveDisplayName(e.target.value)} placeholder="How others will see you"
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.panel,color:T.text,fontSize:14}}/>
                <div style={{fontSize:11,color:T.dim,marginTop:5}}>This is how your name appears in the leaderboard.</div>
              </div>
              <button onClick={handleCreate} disabled={submitting}
                style={{padding:"13px",borderRadius:11,border:`1px solid ${T.blue}50`,background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)",color:T.white,fontSize:14,fontWeight:700,cursor:"pointer",opacity:submitting?0.7:1}}>
                {submitting?"Creating...":"Create Group"}
              </button>
            </div>
          </div>
        )}

        {/* Join form */}
        {view==="join"&&(
          <div className="fade-up">
            <button onClick={()=>{setView("list");setError(null);}} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 0",background:"transparent",border:"none",color:T.sub,cursor:"pointer",fontSize:13,marginBottom:20}}>
              <ArrowLeft size={13}/>Back
            </button>
            <div style={{fontSize:16,fontWeight:700,marginBottom:20}}>Join a Study Group</div>
            {error&&<div style={{padding:"11px 14px",borderRadius:10,background:`${T.red}15`,border:`1px solid ${T.red}30`,marginBottom:16,fontSize:13,color:T.red}}>{error}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.5px"}}>Invite Code</div>
                <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3" maxLength={6}
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.panel,color:T.blue,fontSize:18,fontWeight:800,letterSpacing:"4px",textAlign:"center"}}/>
                <div style={{fontSize:11,color:T.dim,marginTop:5,textAlign:"center"}}>Ask your group creator for the 6-character code.</div>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.5px"}}>Your Display Name</div>
                <input value={displayName} onChange={e=>saveDisplayName(e.target.value)} placeholder="How others will see you"
                  style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.panel,color:T.text,fontSize:14}}/>
              </div>
              <button onClick={handleJoin} disabled={submitting}
                style={{padding:"13px",borderRadius:11,border:`1px solid ${T.purple}50`,background:`linear-gradient(135deg,#4C1D95,#5B21B6)`,color:T.white,fontSize:14,fontWeight:700,cursor:"pointer",opacity:submitting?0.7:1}}>
                {submitting?"Joining...":"Join Group"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
