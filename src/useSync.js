// Cloud sync hook — reads/writes user progress to Supabase user_progress table

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${token}`,
  };
}

export async function pullProgress(token) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/user_progress?select=*&limit=1`,
    { headers: authHeaders(token) }
  );
  const data = await r.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0]; // { seen, incorrect, flagged, sessions }
}

export async function pushProgress(token, userId, progress) {
  // Upsert — insert or update
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/user_progress`,
    {
      method: "POST",
      headers: {
        ...authHeaders(token),
        "Prefer": "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        seen:      progress.seen      || {},
        incorrect: progress.incorrect || {},
        flagged:   Array.isArray(progress.flagged) ? progress.flagged : [...(progress.flagged || [])],
        sessions:  progress.sessions  || [],
        updated_at: new Date().toISOString(),
      }),
    }
  );
  return r.ok;
}

export async function getUser(token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` },
  });
  return r.json();
}

export async function signOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` },
  });
}
