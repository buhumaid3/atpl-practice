import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Plane, AlertCircle, CheckCircle } from "lucide-react";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const T = {
  bg:"#09090B", panel:"#0F1014", card:"#131318", border:"#1C1C22",
  text:"#F0F0F5", sub:"#8888A0", dim:"#444455",
  blue:"#3B9EFF", green:"#22C55E", red:"#EF4444", white:"#FFFFFF",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  button{font-family:inherit;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  .fade-up{animation:fadeUp 0.35s ease forwards;}
  input::placeholder{color:#444455;}
  input:focus{outline:none;border-color:#3B9EFF!important;}
`;

async function supabaseAuth(endpoint, body) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

export default function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState("login"); // login | signup | forgot
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);

  async function handleSubmit() {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError(null); setSuccess(null);

    if (mode === "login") {
      const data = await supabaseAuth("token?grant_type=password", { email, password });
      if (data.error) { setError(data.error_description || data.error); }
      else { onAuth(data); }

    } else if (mode === "signup") {
      const data = await supabaseAuth("signup", { email, password });
      if (data.error) { setError(data.error_description || data.error); }
      else if (data.id) {
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else { setError("Something went wrong. Please try again."); }
    }

    setLoading(false);
  }

  async function handleForgot() {
    if (!email) { setError("Enter your email address first."); return; }
    setLoading(true); setError(null);
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSuccess("Password reset email sent. Check your inbox.");
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"Inter,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <style>{CSS}</style>

      <div className="fade-up" style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#1A3A6B,#2E5FA3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", border:`1px solid ${T.blue}40` }}>
            <Plane size={24} color={T.blue} strokeWidth={2}/>
          </div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>ATPL Practice</div>
          <div style={{ fontSize:13, color:T.sub }}>
            {mode==="login" ? "Sign in to sync your progress" : mode==="signup" ? "Create an account to get started" : "Reset your password"}
          </div>
        </div>

        {/* Card */}
        <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, padding:"28px", marginBottom:14 }}>

          {/* Error / Success */}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", borderRadius:10, background:`${T.red}15`, border:`1px solid ${T.red}30`, marginBottom:18, fontSize:13, color:T.red }}>
              <AlertCircle size={14} style={{ flexShrink:0 }}/>{error}
            </div>
          )}
          {success && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", borderRadius:10, background:`${T.green}15`, border:`1px solid ${T.green}30`, marginBottom:18, fontSize:13, color:T.green }}>
              <CheckCircle size={14} style={{ flexShrink:0 }}/>{success}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.5px" }}>Email</div>
            <div style={{ position:"relative" }}>
              <Mail size={15} color={T.dim} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }}/>
              <input
                type="email" value={email} onChange={e=>{setEmail(e.target.value);setError(null);}}
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                placeholder="your@email.com"
                style={{ width:"100%", padding:"11px 12px 11px 38px", borderRadius:10, border:`1px solid ${T.border}`, background:T.panel, color:T.text, fontSize:14 }}
              />
            </div>
          </div>

          {/* Password */}
          {mode !== "forgot" && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.5px" }}>Password</div>
              <div style={{ position:"relative" }}>
                <Lock size={15} color={T.dim} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }}/>
                <input
                  type={showPass?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError(null);}}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  placeholder="••••••••"
                  style={{ width:"100%", padding:"11px 40px 11px 38px", borderRadius:10, border:`1px solid ${T.border}`, background:T.panel, color:T.text, fontSize:14 }}
                />
                <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", color:T.dim, padding:0 }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {mode==="login" && (
                <button onClick={()=>{setMode("forgot");setError(null);setSuccess(null);}} style={{ background:"transparent", border:"none", color:T.sub, fontSize:12, cursor:"pointer", marginTop:6, padding:0 }}>
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {/* Submit */}
          <button onClick={mode==="forgot"?handleForgot:handleSubmit} disabled={loading}
            style={{ width:"100%", padding:"13px", borderRadius:11, border:`1px solid ${T.blue}50`, background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)", color:T.white, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:14, opacity:loading?0.7:1 }}>
            {loading ? "Please wait..." : mode==="login" ? "Sign In" : mode==="signup" ? "Create Account" : "Send Reset Email"}
          </button>

          {/* Mode switch */}
          <div style={{ textAlign:"center", fontSize:13, color:T.sub }}>
            {mode==="login" && <>Don't have an account? <button onClick={()=>{setMode("signup");setError(null);setSuccess(null);}} style={{ background:"transparent", border:"none", color:T.blue, fontWeight:600, cursor:"pointer", fontSize:13 }}>Sign up</button></>}
            {mode==="signup" && <>Already have an account? <button onClick={()=>{setMode("login");setError(null);setSuccess(null);}} style={{ background:"transparent", border:"none", color:T.blue, fontWeight:600, cursor:"pointer", fontSize:13 }}>Sign in</button></>}
            {mode==="forgot" && <button onClick={()=>{setMode("login");setError(null);setSuccess(null);}} style={{ background:"transparent", border:"none", color:T.blue, fontWeight:600, cursor:"pointer", fontSize:13 }}>Back to sign in</button>}
          </div>
        </div>


      </div>
    </div>
  );
}
