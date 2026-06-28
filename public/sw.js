// ATPL Practice — Service Worker
// Caches questions and app shell for offline use

const CACHE_NAME = "atpl-v1";
const QUESTION_CACHE = "atpl-questions-v1";

// App shell — files that make the UI work
const SHELL = [
  "/",
  "/index.html",
];

// Install — cache app shell
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== QUESTION_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Supabase API questions → cache first, fall back to network
// - Supabase auth → network only (never cache credentials)
// - Everything else → network first, fall back to cache
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Never cache auth endpoints
  if (url.pathname.includes("/auth/")) {
    return; // let browser handle normally
  }

  // Questions API — cache first
  if (url.hostname.includes("supabase") && url.pathname.includes("/rest/v1/questions")) {
    e.respondWith(
      caches.open(QUESTION_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        } catch {
          return new Response(JSON.stringify([]), {
            headers: { "Content-Type": "application/json" }
          });
        }
      })
    );
    return;
  }

  // App shell and static assets — network first, cache fallback
  e.respondWith(
    fetch(e.request).then(response => {
      // Cache successful GET responses for static assets
      if (e.request.method === "GET" && response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(e.request);
      if (cached) return cached;
      // Return index.html for navigation requests (SPA fallback)
      if (e.request.mode === "navigate") {
        return caches.match("/index.html");
      }
      return new Response("Offline", { status: 503 });
    })
  );
});

// Message handler — cache questions on demand
self.addEventListener("message", e => {
  if (e.data?.type === "CACHE_QUESTIONS") {
    const { url, token, apiKey } = e.data;
    caches.open(QUESTION_CACHE).then(async cache => {
      try {
        const r = await fetch(url, {
          headers: { apikey: apiKey, Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          await cache.put(url, r);
          e.source.postMessage({ type: "CACHE_DONE", url });
        }
      } catch {}
    });
  }

  if (e.data?.type === "CLEAR_QUESTION_CACHE") {
    caches.delete(QUESTION_CACHE).then(() => {
      e.source.postMessage({ type: "CACHE_CLEARED" });
    });
  }
});
