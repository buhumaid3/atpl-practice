// Offline / PWA management hook

const SUPABASE_URL = "https://nvuvjqojwunkivlpvrqj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dXZqcW9qd3Vua2l2bHB2cnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4NjYsImV4cCI6MjA5Nzk3OTg2Nn0.NX12oaZU8q6VVEranzs9WRB59kI1_UVIWfJzujQjtEQ";

const SUBJECTS = ["010", "031", "032"];
const PAGE = 1000;

// Register service worker
export async function registerSW() {
  if (!("serviceWorker" in navigator)) return { supported: false };
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return { supported: true, registration: reg };
  } catch (err) {
    console.warn("SW registration failed:", err);
    return { supported: false, error: err };
  }
}

// Cache all questions for a subject via service worker message
async function cacheSubjectQuestions(token, subjectCode, onProgress) {
  let offset = 0, done = false;
  while (!done) {
    const url = `${SUPABASE_URL}/rest/v1/questions?select=*&limit=${PAGE}&offset=${offset}&order=id&subject_code=eq.${subjectCode}`;
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_QUESTIONS",
        url,
        token,
        apiKey: SUPABASE_KEY,
      });
    }
    // Also fetch directly to get count
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length < PAGE) done = true;
    offset += PAGE;
    if (onProgress) onProgress(subjectCode, offset);
  }
}

// Cache all questions for all subjects
export async function cacheAllQuestions(token, onProgress) {
  for (const code of SUBJECTS) {
    await cacheSubjectQuestions(token, code, onProgress);
  }
}

// Check if questions are cached
export async function getQuestionCacheStatus() {
  if (!("caches" in window)) return { cached: false, count: 0 };
  try {
    const cache = await caches.open("atpl-questions-v1");
    const keys = await cache.keys();
    return { cached: keys.length > 0, count: keys.length };
  } catch {
    return { cached: false, count: 0 };
  }
}

// Clear question cache
export async function clearQuestionCache() {
  if (!("caches" in window)) return;
  await caches.delete("atpl-questions-v1");
}

// Check online status
export function isOnline() {
  return navigator.onLine;
}
