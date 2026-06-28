import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Plane, AlertCircle, CheckCircle } from "lucide-react";

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const T = {
  bg:"#09090B", panel:"#0F1014", card:"#131318", border:"#1C1C22",
  borderHi:"#2A2A35", text:"#F0F0F5", sub:"#8888A0", dim:"#444455",
  blue:"#3B9EFF", green:"#22C55E", red:"#EF4444", amber:"#F59E0B", white:"#FFFFFF",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  button{font-family:inherit;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  .fade-up{animation:fadeUp 0.35s ease forwards;}
  input::placeholder{color:#444455;}
  input:focus{outline:none;border-color:#3B9EFF!important;box-shadow:0 0 0 3px #3B9EFF15;}
`;

async function supabaseAuth(endpoint, body) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
    body: JSON.stringify(body),
  });
  return r.json();
}

function Field({ label, type, value, onChange, placeholder, right }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
      <div style={{ position:"relative" }}>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder}
          style={{ width:"100%", padding:"11px 40px 11px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:T.panel, color:T.text, fontSize:14, transition:"border-color 0.2s, box-shadow 0.2s" }}
        />
        {right && <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>{right}</div>}
      </div>
    </div>
  );
}

// Password strength indicator
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label:"8+ characters", ok: password.length >= 8 },
    { label:"Uppercase letter", ok: /[A-Z]/.test(password) },
    { label:"Number", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c=>c.ok).length;
  const color = score === 3 ? T.green : score === 2 ? T.amber : T.red;
  const label = score === 3 ? "Strong" : score === 2 ? "Moderate" : "Weak";
  return (
    <div style={{ marginTop:8, marginBottom:4 }}>
      <div style={{ display:"flex", gap:4, marginBottom:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < score ? color : T.border, transition:"background 0.3s" }}/>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:10 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize:10, color: c.ok ? T.green : T.dim, display:"flex", alignItems:"center", gap:3 }}>
              {c.ok ? "✓" : "·"} {c.label}
            </span>
          ))}
        </div>
        <span style={{ fontSize:10, fontWeight:700, color }}>{label}</span>
      </div>
    </div>
  );
}

export default function AuthScreen({ onAuth }) {
  const [mode,        setMode]        = useState("login"); // login | signup | forgot | verify
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);

  function resetForm() { setError(null); setSuccess(null); setPassword(""); setConfirmPass(""); }

  function validate() {
    if (!email) { setError("Please enter your email address."); return false; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return false; }
    if (mode === "signup") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return false; }
      if (!/[A-Z]/.test(password)) { setError("Password must contain at least one uppercase letter."); return false; }
      if (!/[0-9]/.test(password)) { setError("Password must contain at least one number."); return false; }
      if (password !== confirmPass) { setError("Passwords do not match."); return false; }
    }
    if (mode === "login" && !password) { setError("Please enter your password."); return false; }
    return true;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true); setError(null);
    const data = await supabaseAuth("token?grant_type=password", { email, password });
    setLoading(false);
    if (data.error) {
      if (data.error === "invalid_grant") setError("Incorrect email or password. Please try again.");
      else if (data.error_description?.includes("Email not confirmed")) setError("Please confirm your email address first. Check your inbox.");
      else setError(data.error_description || data.error);
    } else {
      onAuth(data);
    }
  }

  async function handleSignup() {
    if (!validate()) return;
    setLoading(true); setError(null);
    const data = await supabaseAuth("signup", { email, password });
    setLoading(false);
    if (data.error) {
      if (data.error_description?.includes("already registered")) setError("An account with this email already exists. Please sign in.");
      else setError(data.error_description || data.error);
    } else if (data.id) {
      setMode("verify");
      setSuccess(null);
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  async function handleForgot() {
    if (!email) { setError("Enter your email address first."); return; }
    setLoading(true); setError(null);
    await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSuccess("Password reset email sent. Check your inbox.");
  }

  function handleSubmit() {
    if (mode === "login") handleLogin();
    else if (mode === "signup") handleSignup();
    else if (mode === "forgot") handleForgot();
  }

  // ── EMAIL VERIFICATION SCREEN ───────────────────────────────────────────
  if (mode === "verify") return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"Inter,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <style>{CSS}</style>
      <div className="fade-up" style={{ width:"100%", maxWidth:420, textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`${T.green}15`, border:`2px solid ${T.green}40`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <Mail size={32} color={T.green}/>
        </div>
        <h1 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>Check your email</h1>
        <p style={{ fontSize:14, color:T.sub, lineHeight:1.7, marginBottom:8 }}>
          We sent a confirmation link to
        </p>
        <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:16, padding:"10px 20px", borderRadius:10, background:T.card, border:`1px solid ${T.border}`, display:"inline-block" }}>
          {email}
        </div>
        <p style={{ fontSize:13, color:T.sub, lineHeight:1.7, marginBottom:28 }}>
          Click the link in the email to activate your account. After confirming, come back here to sign in.
        </p>
        <div style={{ padding:"16px", borderRadius:12, background:T.card, border:`1px solid ${T.border}`, marginBottom:16, textAlign:"left" }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Next steps</div>
          {[
            "Open the email from ATPL Practice",
            "Click the confirmation link",
            "Return here and sign in",
          ].map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:i<2?10:0 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:`${T.blue}20`, border:`1px solid ${T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:700, color:T.blue }}>{i+1}</span>
              </div>
              <span style={{ fontSize:13, color:T.text }}>{step}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>{ setMode("login"); resetForm(); }}
          style={{ width:"100%", padding:"13px", borderRadius:11, border:`1px solid ${T.blue}50`, background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)", color:T.white, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10 }}>
          Go to Sign In
        </button>
        <button onClick={handleSignup} disabled={loading}
          style={{ width:"100%", padding:"11px", borderRadius:11, border:`1px solid ${T.border}`, background:"transparent", color:T.sub, fontSize:13, cursor:"pointer" }}>
          {loading ? "Resending..." : "Resend confirmation email"}
        </button>
      </div>
    </div>
  );

  // ── MAIN AUTH SCREEN ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"Inter,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <style>{CSS}</style>

      <div className="fade-up" style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#1A3A6B,#2E5FA3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", border:`1px solid ${T.blue}40` }}>
            <Plane size={24} color={T.blue} strokeWidth={2}/>
          </div>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>ATPL Practice</div>
          <div style={{ fontSize:13, color:T.sub }}>
            {mode==="login" ? "Sign in to continue" : mode==="signup" ? "Create your account" : "Reset your password"}
          </div>
        </div>

        {/* Mode tabs */}
        {mode !== "forgot" && (
          <div style={{ display:"flex", background:T.card, borderRadius:12, padding:4, marginBottom:24, border:`1px solid ${T.border}` }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={()=>{ setMode(m); resetForm(); }}
                style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:mode===m?T.borderHi:"transparent", color:mode===m?T.text:T.sub, fontSize:13, fontWeight:mode===m?700:400, cursor:"pointer", transition:"all 0.15s" }}>
                {m==="login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, padding:"24px", marginBottom:14 }}>

          {error && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"11px 14px", borderRadius:10, background:`${T.red}15`, border:`1px solid ${T.red}30`, marginBottom:18, fontSize:13, color:T.red }}>
              <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/>{error}
            </div>
          )}
          {success && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"11px 14px", borderRadius:10, background:`${T.green}15`, border:`1px solid ${T.green}30`, marginBottom:18, fontSize:13, color:T.green }}>
              <CheckCircle size={14} style={{ flexShrink:0, marginTop:1 }}/>{success}
            </div>
          )}

          {/* Email */}
          <Field
            label="Email Address"
            type="email"
            value={email}
            onChange={e=>{ setEmail(e.target.value); setError(null); }}
            placeholder="your@email.com"
          />

          {/* Password */}
          {mode !== "forgot" && (
            <div style={{ marginBottom:mode==="signup"?4:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.5px" }}>Password</div>
              <div style={{ position:"relative" }}>
                <input
                  type={showPass?"text":"password"} value={password}
                  onChange={e=>{ setPassword(e.target.value); setError(null); }}
                  onKeyDown={e=>e.key==="Enter"&&mode==="login"&&handleSubmit()}
                  placeholder={mode==="signup" ? "Min 8 chars, 1 uppercase, 1 number" : "••••••••"}
                  style={{ width:"100%", padding:"11px 40px 11px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:T.panel, color:T.text, fontSize:14, transition:"border-color 0.2s" }}
                />
                <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", color:T.dim, padding:0 }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {/* Strength indicator for signup */}
              {mode==="signup" && <PasswordStrength password={password}/>}
            </div>
          )}

          {/* Confirm password — signup only */}
          {mode==="signup" && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.sub, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.5px" }}>Confirm Password</div>
              <div style={{ position:"relative" }}>
                <input
                  type={showConfirm?"text":"password"} value={confirmPass}
                  onChange={e=>{ setConfirmPass(e.target.value); setError(null); }}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  placeholder="Re-enter your password"
                  style={{ width:"100%", padding:"11px 40px 11px 14px", borderRadius:10, border:`1px solid ${confirmPass&&confirmPass!==password?T.red:confirmPass&&confirmPass===password?T.green:T.border}`, background:T.panel, color:T.text, fontSize:14, transition:"border-color 0.2s" }}
                />
                <button onClick={()=>setShowConfirm(!showConfirm)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", color:T.dim, padding:0 }}>
                  {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {confirmPass && (
                <div style={{ fontSize:11, marginTop:6, color: confirmPass===password ? T.green : T.red, display:"flex", alignItems:"center", gap:4 }}>
                  {confirmPass===password ? <><CheckCircle size={11}/>Passwords match</> : <><AlertCircle size={11}/>Passwords do not match</>}
                </div>
              )}
            </div>
          )}

          {/* Forgot password link — login only */}
          {mode==="login" && (
            <div style={{ textAlign:"right", marginTop:-12, marginBottom:20 }}>
              <button onClick={()=>{ setMode("forgot"); resetForm(); }} style={{ background:"transparent", border:"none", color:T.sub, fontSize:12, cursor:"pointer", padding:0 }}>
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width:"100%", padding:"13px", borderRadius:11, border:`1px solid ${T.blue}50`, background:"linear-gradient(135deg,#1A4BA3,#1E5FC4)", color:T.white, fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading?0.7:1, transition:"opacity 0.2s" }}>
            {loading ? "Please wait..." : mode==="login" ? "Sign In →" : mode==="signup" ? "Create Account →" : "Send Reset Email"}
          </button>

          {/* Back from forgot */}
          {mode==="forgot" && (
            <button onClick={()=>{ setMode("login"); resetForm(); }}
              style={{ width:"100%", padding:"11px", borderRadius:11, border:`1px solid ${T.border}`, background:"transparent", color:T.sub, fontSize:13, cursor:"pointer", marginTop:10 }}>
              Back to Sign In
            </button>
          )}
        </div>

        {/* Bottom note */}
        <div style={{ textAlign:"center", fontSize:12, color:T.dim }}>
          {mode==="login" && "Don't have an account? Switch to Sign Up above."}
          {mode==="signup" && "Already have an account? Switch to Sign In above."}
          {mode==="forgot" && "Remember your password? Switch back to Sign In."}
        </div>
      </div>
    </div>
  );
}
