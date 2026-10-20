const CACHE = "more-news-v3";

function basePath() {
  return self.location.pathname.replace(/\/sw\.js$/, "") || "";
}

function asset(pathname) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath()}${path}`;
}

const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/data/headlines.json",
];

self.addEventListener("install", (event) => {
  // Cada recurso por separado: si uno falla (p. ej. tras el login), el SW debe instalarse igual
  // o el navegador no ofrecerá instalar la app.
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((path) =>
          fetch(asset(path), { cache: "no-store" })
            .then((res) => (res.ok && !res.redirected ? cache.put(asset(path), res) : undefined))
            .catch(() => undefined),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  if (path.endsWith("/data/headlines.json") || path.endsWith("/api/headlines")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    path.endsWith("/manifest.webmanifest") ||
    path.includes("/icons/icon-") ||
    path.endsWith("/icons/icon.svg")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected && path === asset("/")) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(asset("/"), copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(asset("/"))) ?? Response.error()),
    );
  }
});
